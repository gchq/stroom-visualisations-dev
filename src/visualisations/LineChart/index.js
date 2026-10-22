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

// A line chart: a line for each series through its points, in a grid of charts if a Grid Series
// field is chosen. Stroom makes it with `new visualisations.LineChart()` and calls
// setData(context, settings, data) with data nested as grid cell, then series, then rows of [x, y].
//
// The points are too small to point at, so the mouse shows the point nearest to it, and each point
// is reachable from the keyboard (Stroom's stroom.points): a dot shows on the point shown.

import "../../shared/shared.css";
import "./LineChart.css";
import { line, select } from "d3";
import { fieldScale, valueScale } from "../../shared/axis.js";
import { AxisZoom } from "../../shared/axisZoom.js";
import { Chart } from "../../shared/chart.js";
import { DATE_TIME, NUMBER, aggregateRows, distinct, hasValue, isNumber, isOrdinal, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { NearestPoint } from "../../shared/nearest.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { seriesPointItem } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { lineCurve, lineDash, linePoints, orderedRows } from "../../shared/lines.js";
import { ZoomWindows, rowsAround, valueRangeIn } from "../../shared/window.js";
import { stateCounts } from "./lines.js";

// What state counting counts when the settings don't say (as the legacy chart did)
const DEFAULT_OPEN_TEXT = "IN";
const DEFAULT_CLOSE_TEXT = "OUT";

class LineChart extends Chart {

    constructor() {
        super((body, chart) => new LineCell(body, chart), "lineSeries");
        // The span of the X axis each cell is zoomed to (see shared/axisZoom.js)
        this.zoomWindows = new ZoomWindows();
    }

    // Whether the Y values are states to count (the Counting tab) rather than numbers
    isCounting() {
        return isTrue(this.settings.stateCounting, false);
    }

    // The name of the Y axis: the Y field's, or with state counting what is counted
    yName() {
        const yName = this.settings.y || "Y";
        return this.isCounting() ? "Count of " + yName : yName;
    }

    // A series' rows as its line goes through them: only those with an X value, as there is
    // nowhere else to put them, counted if state counting, and in order along a number or time axis.
    // Rows without a Y value are kept, as gaps in the line
    rowsOf(series, xType) {
        const settings = this.settings;
        const rows = (series.values || []).filter(row => hasValue(row[0], xType));
        if (this.isCounting()) {
            return stateCounts(rows, settings.openSessionText || DEFAULT_OPEN_TEXT,
                settings.closeSessionText || DEFAULT_CLOSE_TEXT);
        }
        return orderedRows(rows, xType);
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const data = this.data;
        const settings = this.settings;
        const xType = data.types[0];
        // State counting makes numbers of the states
        const yType = this.isCounting() ? NUMBER : data.types[1];
        const gridCells = data.values.filter(cell => Array.isArray(cell.values));

        // Each series has a colour (and is a legend entry), as the Line Series field's values are
        // coloured everywhere on the dashboard
        const legendKeys = distinct(gridCells.flatMap(cell => cell.values.map(keyOf)));
        const colours = this.colours.of(settings.lineSeries, legendKeys);
        // Each line also has dashes of its own, so that lines aren't told apart by colour alone
        this.legend.setItems(legendKeys.map((key, index) => ({
            key,
            label: this.seriesLabel(key) || "Series",
            colour: colours(key),
            dash: lineDash(index)
        })));

        // What is shown of each cell: the series the legend hasn't hidden
        const shownCells = gridCells.map(cell => {
            const series = cell.values
                .filter(one => !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key),
                    rows: this.rowsOf(one, xType)
                }));
            return { cell, series, rows: series.flatMap(one => one.rows).filter(row => isNumber(row[1])) };
        });
        // With nothing to show, a chart that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, series: [], rows: [] });
        }

        // The axes' ranges, the same in every cell where the settings synchronise them
        const allRows = shownCells.flatMap(shown => shown.rows);
        const all = aggregateRows(allRows, 2);
        const allCategories = isOrdinal(xType) ? distinct(allRows.map(row => row[0])) : [];
        const synchX = isTrue(settings.synchXAxis, true);
        const synchY = isTrue(settings.synchYAxis, true);

        this.grid.update(shownCells.map(({ cell, series, rows }) => {
            const own = aggregateRows(rows, 2);
            return {
                key: keyOf(cell),
                label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
                zoomKey: ZoomWindows.keyOf(keyOf(cell), synchX),
                series,
                rows,
                xType,
                yType,
                categories: isOrdinal(xType) ? (synchX ? allCategories : distinct(rows.map(row => row[0]))) : [],
                xMin: synchX ? all.min[0] : own.min[0],
                xMax: synchX ? all.max[0] : own.max[0],
                yMin: synchY ? all.min[1] : own.min[1],
                yMax: synchY ? all.max[1] : own.max[1],
                colourOf: seriesKey => colours(seriesKey),
            dashOf: seriesKey => lineDash(legendKeys.indexOf(seriesKey)),
                gridCellCount: shownCells.length
            };
        }));
    }
}

// The chart in one cell of the grid
class LineCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-line-chart");
        // The lines are cut at the plot's edges when the X axis is zoomed
        this.clipId = "vis-line-chart-clip-" + Math.random().toString(36).slice(2);
        this.clipRect = this.svg.append("defs").append("clipPath").attr("id", this.clipId).append("rect");
        this.plot = this.svg.append("g");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.linesGroup = this.plot.append("g").attr("class", "vis-line-chart__lines vis-glow--line");
        this.pointsGroup = this.plot.append("g").attr("class", "vis-line-chart__points");
        // Said where the lines would be when there are none (the chart's description says it too)
        this.emptyText = this.plot.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // Over the plot, to find the point nearest the mouse
        this.nearest = new NearestPoint(this.plot, () => this.points,
            (point, event) => chart.selection.choose(this.selectionItem(point.__data__), event));
        // Dragging along the X axis (or its keys) zooms in to part of it
        this.axisZoom = new AxisZoom(this.plot, window => {
            chart.zoomWindows.set(this.cell.zoomKey, window, this.extent);
            chart.redraw();
        });
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-line-chart__point",
                group: point => point.__data__.seriesKey,
                tooltip: point => this.tooltip(point.__data__),
                highlight: point => {
                    this.highlighted = point;
                    this.showHighlight();
                },
                select: (point, event) => chart.selection.choose(this.selectionItem(point.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Line chart";
    }

    draw(cell) {
        this.cell = cell;
        const settings = this.chart.settings;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        // Without points there is nothing for the axes to measure
        const empty = cell.rows.length === 0;
        // A number or time axis zooms: all of it is its extent, and the window the part shown (null
        // for all of it), with the lines through it and on to its edges, its points, and the Y axis
        // fitted to them
        this.extent = cell.xMin === null || isOrdinal(cell.xType) ? null : [cell.xMin, cell.xMax];
        const window = this.chart.zoomWindows.get(cell.zoomKey, this.extent);
        const lines = window === null
            ? cell.series
            : cell.series.map(one => ({ ...one, rows: rowsAround(one.rows, window) }));
        const series = window === null ? cell.series : cell.series.map(one => ({
            ...one,
            rows: one.rows.filter(row => row[0] >= window[0] && row[0] <= window[1])
        }));
        const shownY = window === null ? { min: cell.yMin, max: cell.yMax } : valueRangeIn(series, window);
        const xDomain = window || [cell.xMin, cell.xMax];
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width,
            height,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: range => fieldScale(cell.xType, cell.categories, xDomain[0], xDomain[1], range),
            yScaleFor: range => valueScale(shownY.min, shownY.max, range, settings.scaleYAxis),
            x: { type: cell.xType, show: !empty && isTrue(settings.displayXAxis, true), datePattern: settings.seriesDateFormat },
            y: { type: cell.yType, show: !empty && isTrue(settings.displayYAxis, true) }
        });
        this.plot.attr("transform", "translate(" + left + "," + MARGIN.top + ")");
        this.emptyText
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight / 2)
            .text(empty ? "No data" : "");

        // A line through each series' points, broken where a row has no Y value
        const offset = isOrdinal(cell.xType) ? xScale.bandwidth() / 2 : 0;
        const path = line()
            .defined(row => isNumber(row[1]))
            .x(row => xScale(row[0]) + offset)
            .y(row => yScale(row[1]))
            .curve(lineCurve(settings.interpolationMode));
        // Only cut when zoomed, so that a line's glow isn't clipped at the edges otherwise
        this.linesGroup.attr("clip-path", window === null ? null : "url(#" + this.clipId + ")");
        this.clipRect.attr("width", plotWidth).attr("height", plotHeight);
        const groups = this.linesGroup.selectAll("g.vis-line-chart__series")
            .data(lines, one => one.key)
            .join(enter => {
                const group = enter.append("g").attr("class", "vis-line-chart__series");
                // Under the line, only shown with a high contrast theme (see LineChart.css)
                group.append("path").attr("class", "vis-line-chart__casing");
                group.append("path").attr("class", "vis-line-chart__line");
                return group;
            });
        groups.select(".vis-line-chart__casing").attr("d", one => path(one.rows));
        groups.select(".vis-line-chart__line")
            .attr("d", one => path(one.rows))
            .style("stroke", one => cell.colourOf(one.key))
            .style("stroke-dasharray", one => cell.dashOf(one.key) || null);

        // A point for each row with a Y value, a dot only when it is shown (see LineChart.css)
        const points = linePoints(series, cell.xType, xScale, yScale);
        const pointGroups = this.pointsGroup.selectAll("g.vis-line-chart__series-points")
            .data(series, one => one.key)
            .join("g")
            .attr("class", "vis-line-chart__series-points");
        pointGroups.selectAll("circle.vis-line-chart__point")
            .data(one => points.get(one.key) || [], point => point.id)
            .join("circle")
            .attr("class", "vis-line-chart__point")
            .classed("vis-line-chart__point--lone", point => point.lone)
            .attr("r", 4)
            .attr("cx", point => point.x)
            .attr("cy", point => point.y)
            .style("fill", point => cell.colourOf(point.seriesKey));

        this.nearest.update(plotWidth, plotHeight, this.pointsGroup.selectAll("circle.vis-line-chart__point").nodes());

        const xWords = value => formatValue(value, cell.xType);
        this.axisZoom.update({
            extent: empty ? null : this.extent,
            window,
            scale: xScale,
            axisGroup: this.xAxisGroup,
            plotWidth,
            plotHeight,
            name: settings.x || "X",
            words: xWords
        });
        this.summary = this.describe(cell, series, window === null ? "" : xWords(window[0]) + " to " + xWords(window[1]));
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a point
    tooltip(point) {
        const settings = this.chart.settings;
        const cell = this.cell;
        const title = cell.series.length > 1 || point.seriesKey !== "" ? point.seriesLabel : null;
        return {
            title,
            rows: [
                [settings.x || "X", formatValue(point.row[0], cell.xType)],
                [this.chart.yName(), formatValue(point.row[1], cell.yType)]
            ]
        };
    }

    // What Stroom is told of a selected point
    selectionItem(point) {
        return seriesPointItem(point.seriesKey, point.row, this.cell);
    }

    // The chart for a screen reader, of the series shown, e.g. 'Line chart of Requests by Hour: 3
    // lines of 72 points, highest Requests 812 at 2026-10-12T10:00:00.000Z (web-02)', or when its X
    // axis is zoomed to a span (`zoomedTo`), 'Line chart of Requests by Hour, zoomed to ... to ...:
    // ...'
    describe(cell, series, zoomedTo) {
        const xName = this.chart.settings.x || "X";
        const yName = this.chart.yName();
        let text = "Line chart of " + yName + " by " + xName;
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (zoomedTo) {
            text += ", zoomed to " + zoomedTo;
        }
        const points = series.flatMap(one => one.rows
            .filter(row => isNumber(row[1]))
            .map(row => ({ row, label: one.label })));
        if (points.length === 0) {
            return text + ": no data";
        }
        const lineCount = series.filter(one => one.rows.some(row => isNumber(row[1]))).length;
        text += ": " + (lineCount === 1 ? "1 line" : lineCount + " lines") + " of " + points.length
                + (points.length === 1 ? " point" : " points");
        const at = point => formatValue(point.row[1], cell.yType) + " at " + formatValue(point.row[0], cell.xType)
                            + (lineCount > 1 && point.label ? " (" + point.label + ")" : "");
        const highest = points.reduce((best, point) => point.row[1] > best.row[1] ? point : best);
        const lowest = points.reduce((best, point) => point.row[1] < best.row[1] ? point : best);
        text += ", highest " + yName + " " + at(highest);
        // Points below zero are as much a part of the picture as the highest
        if (lowest.row[1] < 0) {
            text += ", lowest " + yName + " " + at(lowest);
        }
        return text;
    }

    // Shows the dot of the point shown and those selected, and fades the other lines while a
    // point is shown
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.linesGroup.selectAll("g.vis-line-chart__series").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-line-chart__series--faded",
                highlightedSeries !== null && one.key !== highlightedSeries);
        });
        this.pointsGroup.selectAll("circle.vis-line-chart__point").each((point, index, nodes) => {
            const element = nodes[index];
            element.classList.toggle("vis-line-chart__point--shown", element === highlighted);
            element.classList.toggle("vis-line-chart__point--selected", selection.has(this.selectionItem(point).key));
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
window.visualisations.LineChart = LineChart;
