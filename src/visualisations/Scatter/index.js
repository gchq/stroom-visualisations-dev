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

// A scatter chart: a point for each X and Y value, coloured by series, in a grid of charts if a
// Grid Series field is chosen. Stroom makes it with `new visualisations.Scatter()` and calls
// setData(context, settings, data) with data nested as grid cell, then series, then rows of [x, y].
//
// The mouse shows the point nearest to it (small points are hard to point at), and each point is
// reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./Scatter.css";
import { select } from "d3";
import { fieldScale, valueScale } from "../../shared/axis.js";
import { AxisZoom } from "../../shared/axisZoom.js";
import { Chart } from "../../shared/chart.js";
import { aggregateRows, distinct, hasValue, isNumber, isOrdinal, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { NearestPoint } from "../../shared/nearest.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { inCell, selectedValue } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { ZoomWindows, valueRangeIn } from "../../shared/window.js";
import { pointRadius, scatterPoints } from "./points.js";

// The share of a number or time axis's range left beyond its first and last points
const X_PADDING = 0.03;

class Scatter extends Chart {

    constructor() {
        super((body, chart) => new ScatterCell(body, chart), "pointSeries");
        // The span of the X axis each cell is zoomed to (see shared/axisZoom.js)
        this.zoomWindows = new ZoomWindows();
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
        const yType = data.types[1];
        const gridCells = data.values.filter(cell => Array.isArray(cell.values));

        // Each series has a colour (and is a legend entry), as the Point Series field's values are
        // coloured everywhere on the dashboard
        const legendKeys = distinct(gridCells.flatMap(cell => cell.values.map(keyOf)));
        const colours = this.colours.of(settings.pointSeries, legendKeys);
        this.legend.setItems(legendKeys.map(key => ({
            key,
            label: this.seriesLabel(key) || "Series",
            colour: colours(key)
        })));

        // What is shown of each cell: the series the legend hasn't hidden, and only rows with
        // both values, as there is nowhere else to put them
        const shownCells = gridCells.map(cell => {
            const series = cell.values
                .filter(one => !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key),
                    rows: (one.values || []).filter(row => hasValue(row[0], xType) && isNumber(row[1]))
                }));
            return { cell, series, rows: series.flatMap(one => one.rows) };
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
                gridCellCount: shownCells.length
            };
        }));
    }
}

// The chart in one cell of the grid
class ScatterCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-scatter");
        this.plot = this.svg.append("g");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.pointsGroup = this.plot.append("g").attr("class", "vis-scatter__points vis-glow");
        // Said where the points would be when there are none (the chart's description says it too)
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
                selector: ".vis-scatter__point",
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
        this.summary = "Scatter chart";
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

        // Without points there is nothing for the axes to measure. Along a number or time axis
        // there is a little room beyond the first and last points, so that they aren't cut in half
        const empty = cell.rows.length === 0;
        const xPad = cell.xMin === null || isOrdinal(cell.xType) ? 0 : (cell.xMax - cell.xMin) * X_PADDING;
        // A number or time axis zooms: all of it is its extent, and the window the part shown (null
        // for all of it), with only its points, and the Y axis fitted to them
        this.extent = cell.xMin === null || isOrdinal(cell.xType) ? null : [cell.xMin - xPad, cell.xMax + xPad];
        const window = this.chart.zoomWindows.get(cell.zoomKey, this.extent);
        const series = window === null ? cell.series : cell.series.map(one => ({
            ...one,
            rows: one.rows.filter(row => row[0] >= window[0] && row[0] <= window[1])
        }));
        const shownY = window === null ? { min: cell.yMin, max: cell.yMax } : valueRangeIn(series, window);
        const xDomain = window || this.extent || [null, null];
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

        const points = scatterPoints(series, cell.xType, xScale, yScale);
        const radius = pointRadius(settings.pointSize);
        const groups = this.pointsGroup.selectAll("g.vis-scatter__series")
            .data(series, one => one.key)
            .join("g")
            .attr("class", "vis-scatter__series");
        groups.selectAll("circle.vis-scatter__point")
            .data(one => points.get(one.key) || [], point => point.id)
            .join("circle")
            .attr("class", "vis-scatter__point")
            .attr("r", radius)
            .attr("cx", point => point.x)
            .attr("cy", point => point.y)
            .style("fill", point => cell.colourOf(point.seriesKey))
            .style("stroke", point => cell.colourOf(point.seriesKey));

        this.nearest.update(plotWidth, plotHeight, this.pointsGroup.selectAll("circle.vis-scatter__point").nodes());
        const xWords = value => formatValue(value, cell.xType, settings.seriesDateFormat);
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
                [settings.x || "X", formatValue(point.row[0], cell.xType, settings.seriesDateFormat)],
                [settings.y || "Y", formatValue(point.row[1], cell.yType)]
            ]
        };
    }

    // What Stroom is told of a selected point (as the legacy chart told it)
    selectionItem(point) {
        return inCell({
            key: point.seriesKey + "~#~" + point.row[0] + "," + point.row[1],
            series: point.seriesKey,
            x: selectedValue(point.row[0], this.cell.xType),
            y: point.row[1]
        }, this.cell);
    }

    // The chart for a screen reader, of the series shown, e.g. 'Scatter chart of Bytes by Duration:
    // 30 points in 3 series, highest Bytes 9,800 at 410 (web-02)', or when its X axis is zoomed to
    // a span (`zoomedTo`, e.g. '100 to 400'), 'Scatter chart of Bytes by Duration, zoomed to 100 to
    // 400: 12 points ...'
    describe(cell, series, zoomedTo) {
        const settings = this.chart.settings;
        const xName = settings.x || "X";
        const yName = settings.y || "Y";
        let text = "Scatter chart of " + yName + " by " + xName;
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (zoomedTo) {
            text += ", zoomed to " + zoomedTo;
        }
        const points = series.flatMap(one => one.rows.map(row => ({ row, label: one.label })));
        if (points.length === 0) {
            return text + ": no data";
        }
        const seriesCount = series.filter(one => one.rows.length > 0).length;
        text += ": " + points.length + (points.length === 1 ? " point" : " points");
        if (seriesCount > 1) {
            text += " in " + seriesCount + " series";
        }
        const at = point => formatValue(point.row[1], cell.yType) + " at "
                            + formatValue(point.row[0], cell.xType, settings.seriesDateFormat)
                            + (seriesCount > 1 && point.label ? " (" + point.label + ")" : "");
        const highest = points.reduce((best, point) => point.row[1] > best.row[1] ? point : best);
        const lowest = points.reduce((best, point) => point.row[1] < best.row[1] ? point : best);
        text += ", highest " + yName + " " + at(highest);
        if (lowest.row[1] < 0) {
            text += ", lowest " + yName + " " + at(lowest);
        }
        return text;
    }

    // Rings the point shown and those selected, and fades the other series while a point is shown
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.pointsGroup.selectAll("g.vis-scatter__series").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-scatter__series--faded",
                highlightedSeries !== null && one.key !== highlightedSeries);
        });
        this.pointsGroup.selectAll("circle.vis-scatter__point").each((point, index, nodes) => {
            const element = nodes[index];
            element.classList.toggle("vis-scatter__point--shown", element === highlighted);
            element.classList.toggle("vis-scatter__point--selected", selection.has(this.selectionItem(point).key));
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
window.visualisations.Scatter = Scatter;
