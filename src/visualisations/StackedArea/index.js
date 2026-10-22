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

// A stacked area chart: an area for each series, stacked one on another, in a grid of charts if a
// Grid Series field is chosen. Stroom makes it with `new visualisations.StackedArea()` and calls
// setData(context, settings, data) with data nested as grid cell, then series, then rows of [x, y].
//
// Each series' value at each X is a point on the top edge of its area: the mouse shows the point
// nearest to it, and each point is reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./StackedArea.css";
import { area, line, select } from "d3";
import { fieldScale, valueScale } from "../../shared/axis.js";
import { Chart } from "../../shared/chart.js";
import { curveFor } from "../../shared/curves.js";
import { DATE_TIME, distinct, hasValue, isOrdinal, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { NearestPoint } from "../../shared/nearest.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { seriesPointItem } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { extent, stackSeries } from "./areas.js";

// The curve when the settings don't say: straight between the points, as it was
const DEFAULT_CURVE = "linear";

class StackedArea extends Chart {

    constructor() {
        super((body, chart) => new AreaCell(body, chart), "lineSeries");
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

        // Each series has a colour (and is a legend entry), as the Series field's values are
        // coloured everywhere on the dashboard
        const legendKeys = distinct(gridCells.flatMap(cell => cell.values.map(keyOf)));
        const colours = this.colours.of(settings.lineSeries, legendKeys);
        this.legend.setItems(legendKeys.map(key => ({
            key,
            label: this.seriesLabel(key) || "Series",
            colour: colours(key)
        })));

        // Each cell's stack of the series the legend hasn't hidden. A row without an X value has
        // nowhere to go
        const stackedCells = gridCells.map(cell => {
            const series = cell.values
                .filter(one => !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key),
                    rows: (one.values || []).filter(row => hasValue(row[0], xType))
                }));
            const stacked = stackSeries(series, xType);
            return { cell, ...stacked, ...extent(stacked.layers) };
        });
        // With nothing to show, a chart that says so
        if (stackedCells.length === 0) {
            stackedCells.push({ cell: { key: null }, xs: [], layers: [], totals: new Map(), min: null, max: null });
        }

        // The axes' ranges, the same in every cell where the settings synchronise them
        const allXs = stackedCells.flatMap(stacked => stacked.xs);
        const continuousXs = isOrdinal(xType) ? [] : allXs;
        const mins = stackedCells.map(stacked => stacked.min).filter(min => min !== null);
        const maxs = stackedCells.map(stacked => stacked.max).filter(max => max !== null);
        const synchX = isTrue(settings.synchXAxis, true);
        const synchY = isTrue(settings.synchYAxis, true);

        this.grid.update(stackedCells.map(stacked => {
            const ownXs = isOrdinal(xType) ? [] : stacked.xs;
            const xsForRange = synchX ? continuousXs : ownXs;
            return {
                key: keyOf(stacked.cell),
                label: formatKey(stacked.cell.key, settings.gridSeriesDateFormat) || "Chart",
                layers: stacked.layers,
                xs: stacked.xs,
                totals: stacked.totals,
                xType,
                yType,
                categories: isOrdinal(xType) ? (synchX ? distinct(allXs) : stacked.xs) : [],
                xMin: xsForRange.length > 0 ? Math.min(...xsForRange) : null,
                xMax: xsForRange.length > 0 ? Math.max(...xsForRange) : null,
                yMin: synchY ? (mins.length > 0 ? Math.min(...mins) : null) : stacked.min,
                yMax: synchY ? (maxs.length > 0 ? Math.max(...maxs) : null) : stacked.max,
                colourOf: seriesKey => colours(seriesKey),
                gridCellCount: stackedCells.length
            };
        }));
    }
}

// The chart in one cell of the grid
class AreaCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-stacked-area");
        this.plot = this.svg.append("g");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.areasGroup = this.plot.append("g").attr("class", "vis-stacked-area__areas vis-glow--line");
        this.pointsGroup = this.plot.append("g").attr("class", "vis-stacked-area__points");
        // Said where the areas would be when there are none (the chart's description says it too)
        this.emptyText = this.plot.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // Over the plot, to find the point nearest the mouse
        this.nearest = new NearestPoint(this.plot, () => this.points,
            (point, event) => chart.selection.choose(this.selectionItem(point.__data__), event));
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-stacked-area__point",
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
        this.summary = "Stacked area chart";
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

        // Without values there is nothing for the axes to measure
        const empty = !cell.layers.some(layer => layer.values.some(value => value.value !== null));
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width,
            height,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: range => fieldScale(cell.xType, cell.categories, cell.xMin, cell.xMax, range),
            yScaleFor: range => valueScale(cell.yMin, cell.yMax, range),
            x: { type: cell.xType, show: !empty && isTrue(settings.displayXAxis, true), datePattern: settings.seriesDateFormat },
            y: { type: cell.yType, show: !empty && isTrue(settings.displayYAxis, true) }
        });
        this.plot.attr("transform", "translate(" + left + "," + MARGIN.top + ")");
        this.emptyText
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight / 2)
            .text(empty ? "No data" : "");

        // Each series' band, faded from its colour, with a line of its colour along its outer edge
        const offset = isOrdinal(cell.xType) ? xScale.bandwidth() / 2 : 0;
        const curve = curveFor(settings.interpolationMode, DEFAULT_CURVE);
        const band = area()
            .x(value => xScale(value.x) + offset)
            .y0(value => yScale(value.y0))
            .y1(value => yScale(value.y1))
            .curve(curve);
        const edge = line()
            .x(value => xScale(value.x) + offset)
            .y(value => yScale(value.y1))
            .curve(curve);
        const look = this.chart.look;
        const groups = this.areasGroup.selectAll("g.vis-stacked-area__series")
            .data(cell.layers, layer => layer.key)
            .join(enter => {
                const group = enter.append("g").attr("class", "vis-stacked-area__series");
                group.append("path").attr("class", "vis-stacked-area__area");
                // Under the line, only shown with a high contrast theme (see StackedArea.css)
                group.append("path").attr("class", "vis-stacked-area__casing");
                group.append("path").attr("class", "vis-stacked-area__line");
                return group;
            })
            // Bottom first, so that each line is over the area below it
            .order();
        groups.select(".vis-stacked-area__area")
            .attr("d", layer => band(layer.values))
            // Strongest at its line: at the bottom for a series that is mostly below zero
            .style("fill", layer => look.fadeFill(cell.colourOf(layer.key),
                layer.values.reduce((sum, value) => sum + (value.value ?? 0), 0) < 0));
        groups.select(".vis-stacked-area__casing").attr("d", layer => edge(layer.values));
        groups.select(".vis-stacked-area__line")
            .attr("d", layer => edge(layer.values))
            .style("stroke", layer => cell.colourOf(layer.key));

        // A point for each value a series has, on its band's outer edge. The top series' points
        // come first, so that Up and Down move to the series above and below
        const pointGroups = this.pointsGroup.selectAll("g.vis-stacked-area__series-points")
            .data([...cell.layers].reverse(), layer => layer.key)
            .join("g")
            .attr("class", "vis-stacked-area__series-points")
            .order();
        pointGroups.selectAll("circle.vis-stacked-area__point")
            .data(layer => layer.values
                .filter(value => value.value !== null)
                .map(value => ({
                    id: layer.key + "~#~" + value.x,
                    seriesKey: layer.key,
                    seriesLabel: layer.label,
                    row: [value.x, value.value],
                    x: xScale(value.x) + offset,
                    y: yScale(value.y1)
                })), point => point.id)
            .join("circle")
            .attr("class", "vis-stacked-area__point")
            // With only one X the areas have no width, so the points are all there is to see
            .classed("vis-stacked-area__point--lone", cell.xs.length === 1)
            .attr("r", 4)
            .attr("cx", point => point.x)
            .attr("cy", point => point.y)
            .style("fill", point => cell.colourOf(point.seriesKey));

        this.nearest.update(plotWidth, plotHeight, this.pointsGroup.selectAll("circle.vis-stacked-area__point").nodes());
        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a point: its series' value, and with more than one series the total at its X
    tooltip(point) {
        const settings = this.chart.settings;
        const cell = this.cell;
        const yName = settings.y || "Y";
        const title = cell.layers.length > 1 || point.seriesKey !== "" ? point.seriesLabel : null;
        const rows = [
            [settings.x || "X", formatValue(point.row[0], cell.xType)],
            [yName, formatValue(point.row[1], cell.yType)]
        ];
        if (cell.layers.length > 1) {
            rows.push(["Total " + yName, formatValue(cell.totals.get(point.row[0]), cell.yType)]);
        }
        return { title, rows };
    }

    // What Stroom is told of a selected point
    selectionItem(point) {
        return seriesPointItem(point.seriesKey, point.row, this.cell);
    }

    // The chart for a screen reader, e.g. 'Stacked area chart of Requests by Hour: 3 series at 24
    // times, highest total Requests 1,240 at 2026-10-12T10:00:00.000Z'
    describe(cell) {
        const settings = this.chart.settings;
        const xName = settings.x || "X";
        const yName = settings.y || "Y";
        let text = "Stacked area chart of " + yName + " by " + xName;
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        const layers = cell.layers.filter(layer => layer.values.some(value => value.value !== null));
        if (layers.length === 0) {
            return text + ": no data";
        }
        const totals = [...cell.totals];
        const highest = totals.reduce((best, total) => total[1] > best[1] ? total : best);
        const lowest = totals.reduce((best, total) => total[1] < best[1] ? total : best);
        const at = total => formatValue(total[1], cell.yType) + " at " + formatValue(total[0], cell.xType);
        text += ": " + layers.length + " series at " + totals.length + " "
                + (totals.length === 1 ? xName : "values of " + xName)
                + ", highest total " + yName + " " + at(highest);
        if (lowest[1] < 0) {
            text += ", lowest total " + yName + " " + at(lowest);
        }
        return text;
    }

    // Shows the dot of the point shown and those selected, and fades the other series while a
    // point is shown
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.areasGroup.selectAll("g.vis-stacked-area__series").each((layer, index, nodes) => {
            nodes[index].classList.toggle("vis-stacked-area__series--faded",
                highlightedSeries !== null && layer.key !== highlightedSeries);
        });
        this.pointsGroup.selectAll("circle.vis-stacked-area__point").each((point, index, nodes) => {
            const element = nodes[index];
            element.classList.toggle("vis-stacked-area__point--shown", element === highlighted);
            element.classList.toggle("vis-stacked-area__point--selected", selection.has(this.selectionItem(point).key));
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
window.visualisations.StackedArea = StackedArea;
