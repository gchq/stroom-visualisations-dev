/*
 * Copyright 2026 Crown Copyright
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// A time series: a line for each series through its values over time, in a main chart showing a
// window of time, with an overview of all of it below in which the window is chosen, by dragging
// across it or from the keyboard (see shared/window.js). The main chart's value axis fits the values
// in the window. Each time the window is chosen, Stroom is told it as the selection, {minTime,
// maxTime}, so that other components of the dashboard can follow it. Stroom makes it with
// `new visualisations.TimeSeries()` and calls setData(context, settings, data) with data nested as
// series, then rows of [time, value].
//
// The points are too small to point at, so the mouse shows the point nearest to it, and each point
// in the window is reachable from the keyboard (Stroom's stroom.points): a dot shows on the point
// shown.

import "../../shared/shared.css";
import "./TimeSeries.css";
import { area, brushX, line, scaleLinear, select } from "d3";
import { drawAxis, fieldScale, valueScale } from "../../shared/axis.js";
import { Chart } from "../../shared/chart.js";
import { DATE_TIME, distinct, isNumber, keyOf } from "../../shared/data.js";
import { formatValue } from "../../shared/format.js";
import { lineCurve, lineDash, linePoints, orderedRows } from "../../shared/lines.js";
import { NearestPoint } from "../../shared/nearest.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { isTrue } from "../../shared/settings.js";
import { formatTime as timeWords } from "../../shared/time.js";
import { clampWindow, isWhole, rowsAround, valueRangeIn, windowForKey } from "../../shared/window.js";

// The room above the main chart for the words saying what it shows
const HEADER_HEIGHT = 18;
// The overview's height, and the room for its time axis under it
const OVERVIEW_HEIGHT = 36;
const OVERVIEW_AXIS_HEIGHT = 18;
// The gap between the main chart's time axis and the overview
const OVERVIEW_GAP = 10;

class TimeSeries extends Chart {

    constructor() {
        super((body, chart) => new TimeSeriesCell(body, chart), "lineSeries");
        // The window chosen, [start, end], or null for all of the time there is
        this.window = null;
        // The window Stroom was last told of, so that it is told again only when it changes
        this.toldWindow = null;
    }

    // Works out what the chart shows and draws it
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const data = this.data;
        const settings = this.settings;
        const seriesNodes = data.values.filter(one => Array.isArray(one.values));

        // Each series has a colour (and is a legend entry), as the Line Series field's values are
        // coloured everywhere on the dashboard
        const legendKeys = distinct(seriesNodes.map(keyOf));
        const colours = this.colours.of(settings.lineSeries, legendKeys);
        // Each line also has dashes of its own, so that lines aren't told apart by colour alone
        this.legend.setItems(legendKeys.map((key, index) => ({
            key,
            label: this.seriesLabel(key) || "Series",
            colour: colours(key),
            dash: lineDash(index)
        })));

        // The series the legend hasn't hidden, each in time order; a row without a time has nowhere
        // to go, and one without a value is a gap in the line
        const series = seriesNodes
            .filter(one => !this.legend.isHidden(keyOf(one)))
            .map(one => ({
                key: keyOf(one),
                label: this.seriesLabel(one.key),
                rows: orderedRows((one.values || []).filter(row => Array.isArray(row) && isNumber(row[0])), DATE_TIME)
            }));
        const times = series.flatMap(one => one.rows.map(row => row[0]));
        const extent = times.length === 0 ? null : [Math.min(...times), Math.max(...times)];

        this.grid.update([{
            key: "",
            label: "Time series",
            series,
            extent,
            yType: data.types[1],
            colourOf: seriesKey => colours(seriesKey),
            dashOf: seriesKey => lineDash(legendKeys.indexOf(seriesKey)),
            gridCellCount: 1
        }]);
        // Stroom is told the window shown from the first, and when new data changes it (as the
        // legacy chart told it on every draw), not only when a person chooses one
        if (extent !== null) {
            this.chooseWindow(this.windowOf(extent), extent);
        }
    }

    // The window shown: the one chosen, kept within the data's extent, or all of it
    windowOf(extent) {
        return extent === null ? null : clampWindow(this.window, extent);
    }

    // Chooses a window (all of the time there is if it is the whole extent), and tells Stroom of it
    chooseWindow(window, extent) {
        const chosen = clampWindow(window, extent);
        this.window = isWhole(chosen, extent) ? null : chosen;
        const told = new Date(chosen[0]).toISOString() + "/" + new Date(chosen[1]).toISOString();
        if (told !== this.toldWindow) {
            this.toldWindow = told;
            if (typeof stroom !== "undefined" && typeof stroom.select === "function") {
                stroom.select([{ minTime: new Date(chosen[0]).toISOString(), maxTime: new Date(chosen[1]).toISOString() }]);
            }
        }
    }
}

// The chart, in the grid's one cell
class TimeSeriesCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-time-series");
        // The words saying what time the main chart shows
        this.header = this.svg.append("text").attr("class", "vis-time-series__header").attr("aria-hidden", "true");
        const clipId = "vis-time-series-clip-" + Math.random().toString(36).slice(2);
        this.clipRect = this.svg.append("defs").append("clipPath").attr("id", clipId).append("rect");

        this.plot = this.svg.append("g");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.linesGroup = this.plot.append("g")
            .attr("class", "vis-time-series__lines vis-glow--line")
            .attr("clip-path", "url(#" + clipId + ")");
        this.pointsGroup = this.plot.append("g").attr("class", "vis-time-series__points");
        // Said where the lines would be when there are none (the chart's description says it too)
        this.emptyText = this.plot.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");

        // The overview: all of the time there is, the window chosen in it. It is a slider for the
        // keyboard, its window moved and resized with the arrow keys (see onOverviewKey)
        this.overview = this.svg.append("g")
            .attr("class", "vis-time-series__overview")
            .attr("role", "slider")
            .attr("aria-label", "Time window")
            .on("keydown", event => this.onOverviewKey(event));
        this.overviewFrame = this.overview.append("rect").attr("class", "vis-time-series__overview-frame");
        this.overviewLines = this.overview.append("g").attr("class", "vis-time-series__overview-lines").attr("aria-hidden", "true");
        this.overviewAxisGroup = this.overview.append("g");
        this.brush = brushX().on("brush end", event => this.onBrush(event));
        this.brushGroup = this.overview.append("g").attr("class", "vis-time-series__brush").attr("aria-hidden", "true");
        // Double-click the overview to show all of the time there is again
        this.brushGroup.on("dblclick", () => this.choose(null));

        // Over the plot, to find the point nearest the mouse
        this.nearest = new NearestPoint(this.plot, () => this.points, () => {});
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-time-series__point",
                group: point => point.__data__.seriesKey,
                tooltip: point => this.tooltip(point.__data__),
                highlight: point => {
                    this.highlighted = point;
                    this.showHighlight();
                },
                summary: () => this.summary
            })
            : null;
        this.summary = "Time series";
    }

    draw(cell) {
        this.cell = cell;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }
        this.size = { width, height };
        const window = this.chart.windowOf(cell.extent);
        this.drawMain(window);
        this.drawOverview(window);
    }

    // Draws the main chart, showing a window of time
    drawMain(window) {
        const cell = this.cell;
        const settings = this.chart.settings;
        const { width, height } = this.size;
        const empty = window === null;
        const range = empty ? { min: null, max: null } : valueRangeIn(cell.series, window);
        const mainHeight = Math.max(40, height - HEADER_HEIGHT - OVERVIEW_GAP - OVERVIEW_HEIGHT - OVERVIEW_AXIS_HEIGHT);
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width,
            height: mainHeight,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: span => fieldScale(DATE_TIME, [], empty ? null : window[0], empty ? null : window[1], span),
            yScaleFor: span => valueScale(range.min, range.max, span, settings.scaleYAxis),
            x: { type: DATE_TIME, show: !empty && isTrue(settings.displayXAxis, true) },
            y: { type: cell.yType, show: !empty && isTrue(settings.displayYAxis, true) }
        });
        const top = HEADER_HEIGHT + MARGIN.top;
        this.place = { left, plotWidth, top, mainHeight };
        this.plot.attr("transform", "translate(" + left + "," + top + ")");
        // The lines are cut at the plot's edges (the clip is in the plot's space, as the lines are)
        this.clipRect.attr("width", plotWidth).attr("height", plotHeight);
        this.emptyText.attr("x", plotWidth / 2).attr("y", plotHeight / 2).text(empty ? "No data" : "");
        this.header
            .attr("x", left)
            .attr("y", 13)
            .text(empty ? "" : "Showing " + timeWords(window[0]) + " to " + timeWords(window[1]));

        // A line through each series' rows around the window, broken where a row has no value; with
        // one series, a fade under it
        const shown = empty ? [] : cell.series.map(one => ({ ...one, rows: rowsAround(one.rows, window) }));
        const curve = lineCurve(settings.interpolationMode);
        const path = line()
            .defined(row => isNumber(row[1]))
            .x(row => xScale(row[0]))
            .y(row => yScale(row[1]))
            .curve(curve);
        const fill = area()
            .defined(row => isNumber(row[1]))
            .x(row => xScale(row[0]))
            .y0(yScale(Math.max(yScale.domain()[0], 0)))
            .y1(row => yScale(row[1]))
            .curve(curve);
        const single = shown.length === 1;
        const look = this.chart.look;
        const groups = this.linesGroup.selectAll("g.vis-time-series__series")
            .data(shown, one => one.key)
            .join(enter => {
                const group = enter.append("g").attr("class", "vis-time-series__series");
                group.append("path").attr("class", "vis-time-series__area");
                // Under the line, only shown with a high contrast theme (see TimeSeries.css)
                group.append("path").attr("class", "vis-time-series__casing");
                group.append("path").attr("class", "vis-time-series__line");
                return group;
            });
        groups.select(".vis-time-series__area")
            .attr("d", one => single ? fill(one.rows) : null)
            .style("fill", one => look.fadeFill(cell.colourOf(one.key), false));
        groups.select(".vis-time-series__casing").attr("d", one => path(one.rows));
        groups.select(".vis-time-series__line")
            .attr("d", one => path(one.rows))
            .style("stroke", one => cell.colourOf(one.key))
            .style("stroke-dasharray", one => cell.dashOf(one.key) || null);

        // A point for each row in the window with a value, a dot only when it is shown
        const inWindow = shown.map(one => ({ ...one, rows: one.rows.filter(row => row[0] >= window[0] && row[0] <= window[1]) }));
        const points = linePoints(inWindow, DATE_TIME, xScale, yScale);
        const pointGroups = this.pointsGroup.selectAll("g.vis-time-series__series-points")
            .data(inWindow, one => one.key)
            .join("g")
            .attr("class", "vis-time-series__series-points");
        pointGroups.selectAll("circle.vis-time-series__point")
            .data(one => points.get(one.key) || [], point => point.id)
            .join("circle")
            .attr("class", "vis-time-series__point")
            .classed("vis-time-series__point--lone", point => point.lone)
            .attr("r", 4)
            .attr("cx", point => point.x)
            .attr("cy", point => point.y)
            .style("fill", point => cell.colourOf(point.seriesKey));
        this.nearest.update(plotWidth, plotHeight, this.pointsGroup.selectAll("circle.vis-time-series__point").nodes());

        this.summary = this.describe(inWindow, window);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // Draws the overview of all of the time there is, with the window chosen in it
    drawOverview(window) {
        const cell = this.cell;
        const { height } = this.size;
        const { left, plotWidth } = this.place;
        const empty = window === null;
        this.overview
            .style("display", empty ? "none" : null)
            .attr("tabindex", empty ? null : 0)
            .attr("transform", "translate(" + left + "," + (height - OVERVIEW_HEIGHT - OVERVIEW_AXIS_HEIGHT) + ")");
        if (empty) {
            return;
        }
        const xScale = fieldScale(DATE_TIME, [], cell.extent[0], cell.extent[1], [0, plotWidth]);
        const values = cell.series.flatMap(one => one.rows.map(row => row[1]).filter(isNumber));
        const yScale = scaleLinear()
            .domain([Math.min(0, ...values), Math.max(1, ...values)])
            .range([OVERVIEW_HEIGHT - 2, 2]);
        this.overviewScale = xScale;
        this.overviewFrame.attr("width", plotWidth).attr("height", OVERVIEW_HEIGHT);
        const path = line()
            .defined(row => isNumber(row[1]))
            .x(row => xScale(row[0]))
            .y(row => yScale(row[1]))
            .curve(lineCurve(this.chart.settings.interpolationMode));
        this.overviewLines.selectAll("path.vis-time-series__overview-line")
            .data(cell.series, one => one.key)
            .join("path")
            .attr("class", "vis-time-series__overview-line")
            .attr("d", one => path(one.rows))
            .style("stroke", one => cell.colourOf(one.key))
            .style("stroke-dasharray", one => cell.dashOf(one.key) || null);
        this.overviewAxisGroup.attr("transform", "translate(0," + OVERVIEW_HEIGHT + ")");
        drawAxis(this.overviewAxisGroup, xScale, "bottom", { type: DATE_TIME, show: true });

        // The window in the overview, as the brush's selection, none when it is all of the time there
        // is (set here, not as though the person moved it)
        this.brush.extent([[0, 0], [plotWidth, OVERVIEW_HEIGHT]]);
        this.brushGroup.call(this.brush);
        this.settingBrush = true;
        this.brushGroup.call(this.brush.move, this.chart.window === null ? null : [xScale(window[0]), xScale(window[1])]);
        this.settingBrush = false;

        const words = "Showing " + timeWords(window[0]) + " to " + timeWords(window[1]);
        this.overview
            .attr("aria-valuemin", cell.extent[0])
            .attr("aria-valuemax", cell.extent[1])
            .attr("aria-valuenow", window[0])
            .attr("aria-valuetext", words + ". Arrow keys move it, Up and Down zoom in and out, Escape shows all");
    }

    // The brush moved, by the person: the main chart follows, and Stroom is told once it stops
    onBrush(event) {
        if (this.settingBrush || !event.sourceEvent) {
            return;
        }
        const extent = this.cell.extent;
        const window = event.selection === null
            ? extent
            : event.selection.map(x => this.overviewScale.invert(x).getTime());
        if (event.type === "end") {
            this.choose(window);
        } else {
            this.drawMain(clampWindow(window, extent));
        }
    }

    // A key on the overview moves or resizes the window (see windowForKey)
    onOverviewKey(event) {
        const extent = this.cell.extent;
        const next = windowForKey(event.key, this.chart.windowOf(extent), extent);
        if (next === null) {
            return;
        }
        event.preventDefault();
        this.choose(next);
    }

    // Chooses a window (null for all of the time there is) and draws the chart showing it
    choose(window) {
        const extent = this.cell.extent;
        this.chart.chooseWindow(window === null ? extent : window, extent);
        this.draw(this.cell);
    }

    // The tooltip of a point
    tooltip(point) {
        const settings = this.chart.settings;
        const cell = this.cell;
        const title = cell.series.length > 1 || point.seriesKey !== "" ? point.seriesLabel : null;
        return {
            title,
            rows: [
                [settings.x || "Time", timeWords(point.row[0])],
                [settings.y || "Value", formatValue(point.row[1], cell.yType)]
            ]
        };
    }

    // The chart for a screen reader, e.g. 'Time series of Count by Time: 2 lines of 96 points from
    // Mon 7 Sep 2026, 00:00:00 to Tue 8 Sep 2026, 23:00:00, highest Count 812 at Mon 7 Sep 2026,
    // 10:00:00 (web-02)'
    describe(series, window) {
        const settings = this.chart.settings;
        const yName = settings.y || "Value";
        const text = "Time series of " + yName + " by " + (settings.x || "Time");
        if (window === null) {
            return text + ": no data";
        }
        const points = series.flatMap(one => one.rows.filter(row => isNumber(row[1])).map(row => ({ row, label: one.label })));
        const lineCount = series.filter(one => one.rows.some(row => isNumber(row[1]))).length;
        let words = text + ": " + (lineCount === 1 ? "1 line" : lineCount + " lines") + " of " + points.length
                    + (points.length === 1 ? " point" : " points") + " from " + timeWords(window[0]) + " to "
                    + timeWords(window[1]);
        if (points.length > 0) {
            const highest = points.reduce((best, point) => point.row[1] > best.row[1] ? point : best);
            words += ", highest " + yName + " " + formatValue(highest.row[1], this.cell.yType) + " at "
                     + timeWords(highest.row[0]) + (lineCount > 1 && highest.label ? " (" + highest.label + ")" : "");
        }
        return words;
    }

    // Shows the dot of the point shown, and fades the other lines while a point is shown
    showHighlight() {
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.linesGroup.selectAll("g.vis-time-series__series").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-time-series__series--faded",
                highlightedSeries !== null && one.key !== highlightedSeries);
        });
        this.pointsGroup.selectAll("circle.vis-time-series__point").each((point, index, nodes) => {
            nodes[index].classList.toggle("vis-time-series__point--shown", nodes[index] === highlighted);
        });
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.TimeSeries = TimeSeries;
