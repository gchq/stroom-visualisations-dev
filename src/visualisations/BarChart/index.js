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

// A bar chart: a bar for each X value of each series, rising from zero to its Y value, in a grid
// of charts if a Grid Series field is chosen. Stroom makes it with `new visualisations.BarChart()`
// and calls setData(context, settings, data) with data nested as grid cell, then series, then
// rows of [x, y].

import "../../shared/shared.css";
import "./BarChart.css";
import { scaleBand, select } from "d3";
import { fieldScale, valueScale } from "../../shared/axis.js";
import { Chart } from "../../shared/chart.js";
import { DATE_TIME, aggregateRows, distinct, hasValue, isNumber, isOrdinal, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { isOutlineStyle } from "../../shared/look.js";
import { transitionMillis } from "../../shared/motion.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { seriesPointItem } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { barLayout, bucketMillis, smallestStep } from "./bars.js";

const TRANSITION_MILLIS = 300;

class BarChart extends Chart {

    constructor() {
        super((body, chart) => new BarCell(body, chart), "series");
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

        // With one series and categories along X, each category has its own colour (and is a
        // legend entry); otherwise each series has
        const maxSeries = Math.max(0, ...gridCells.map(cell => cell.values.length));
        const byCategory = maxSeries <= 1 && isOrdinal(xType);
        const legendKeys = [];
        const seen = new Set();
        for (const cell of gridCells) {
            for (const series of cell.values) {
                const keys = byCategory
                    ? (series.values || []).map(row => row[0])
                    : [keyOf(series)];
                for (const key of keys) {
                    if (!seen.has(String(key))) {
                        seen.add(String(key));
                        legendKeys.push(key);
                    }
                }
            }
        }
        // Coloured as the field's values are everywhere on the dashboard: the X field's categories,
        // or the series field's series
        const colours = this.colours.of(byCategory ? settings.x : settings.series, legendKeys);
        this.legend.setItems(legendKeys.map(key => ({
            key: String(key),
            label: byCategory
                ? formatValue(key, xType, settings.seriesDateFormat)
                : this.seriesLabel(key) || "Series",
            colour: colours(key)
        })));

        // What is shown of each cell: the series and rows the legend hasn't hidden. A row without
        // a Y value has no height, and one without an X value nowhere to go, so neither has a bar
        const shownCells = gridCells.map(cell => {
            const series = cell.values
                .filter(one => byCategory || !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key),
                    rows: (one.values || []).filter(row => isNumber(row[1])
                        && hasValue(row[0], xType)
                        && (!byCategory || !this.legend.isHidden(String(row[0]))))
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
        const bucket = bucketMillis(settings.bucketSize);
        const allStep = xType === DATE_TIME && bucket ? bucket : smallestStep(allRows.map(row => row[0]));

        this.grid.update(shownCells.map(({ cell, series, rows }) => {
            const own = aggregateRows(rows, 2);
            const xRows = synchX ? allRows : rows;
            return {
                key: keyOf(cell),
                label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
                series,
                xType,
                yType,
                categories: isOrdinal(xType) ? (synchX ? allCategories : distinct(rows.map(row => row[0]))) : [],
                xMin: synchX ? all.min[0] : own.min[0],
                xMax: synchX ? all.max[0] : own.max[0],
                xStep: synchX ? allStep : (xType === DATE_TIME && bucket ? bucket : smallestStep(xRows.map(row => row[0]))),
                yMin: synchY ? all.min[1] : own.min[1],
                yMax: synchY ? all.max[1] : own.max[1],
                colourOf: (seriesKey, row) => colours(byCategory ? String(row[0]) : seriesKey),
                gridCellCount: shownCells.length
            };
        }));
    }
}

// The chart in one cell of the grid
class BarCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-bar-chart");
        this.plot = this.svg.append("g");
        this.barsGroup = this.plot.append("g").attr("class", "vis-bar-chart__bars vis-glow");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        // Said where the bars would be when there are none (the chart's description says it too)
        this.emptyText = this.plot.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-bar-chart__bar",
                group: bar => bar.__data__.seriesKey,
                tooltip: bar => this.tooltip(bar.__data__),
                highlight: bar => {
                    this.highlighted = bar;
                    this.showHighlight();
                },
                select: (bar, event) => chart.selection.choose(this.selectionItem(bar.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Bar chart";
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

        // Without bars there is nothing for the axes to measure. A bar along a number or time axis
        // starts at its value, so the last is a step past the largest
        const empty = cell.series.every(one => one.rows.length === 0);
        const xDomainMax = cell.xMax === null || isOrdinal(cell.xType) ? cell.xMax : cell.xMax + (cell.xStep || 0);
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width,
            height,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: range => fieldScale(cell.xType, cell.categories, cell.xMin, xDomainMax, range),
            yScaleFor: range => valueScale(cell.yMin, cell.yMax, range),
            x: { type: cell.xType, show: !empty && isTrue(settings.displayXAxis, true), datePattern: settings.seriesDateFormat },
            y: { type: cell.yType, show: !empty && isTrue(settings.displayYAxis, true) }
        });
        this.plot.attr("transform", "translate(" + left + "," + MARGIN.top + ")");
        this.emptyText
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight / 2)
            .text(empty ? "No data" : "");

        const layout = barLayout({
            series: cell.series,
            xType: cell.xType,
            xScale,
            yScale,
            step: cell.xStep,
            subBand: isOrdinal(cell.xType)
                ? scaleBand().domain(cell.series.map(one => one.key)).range([0, xScale.bandwidth()]).padding(0.05)
                : null
        });

        const outline = isOutlineStyle(settings);
        const look = this.chart.look;
        const groups = this.barsGroup.selectAll("g.vis-bar-chart__series")
            .data(cell.series, one => one.key)
            .join("g")
            .attr("class", "vis-bar-chart__series");
        groups.selectAll("rect.vis-bar-chart__bar")
            .data(one => layout.get(one.key) || [], bar => bar.id)
            .join(
                enter => enter.append("rect")
                    .attr("class", "vis-bar-chart__bar")
                    .attr("x", bar => bar.x)
                    .attr("width", bar => bar.width)
                    .attr("y", yScale(0))
                    .attr("height", 0),
                update => update,
                exit => exit.remove())
            .classed("vis-bar-chart__bar--outline", outline)
            .style("fill", bar => outline ? look.fadeFill(cell.colourOf(bar.seriesKey, bar.row)) : cell.colourOf(bar.seriesKey, bar.row))
            .style("stroke", bar => outline ? cell.colourOf(bar.seriesKey, bar.row) : null)
            .transition()
            .duration(transitionMillis(TRANSITION_MILLIS))
            .attr("x", bar => bar.x)
            .attr("width", bar => bar.width)
            .attr("y", bar => bar.y)
            .attr("height", bar => bar.height);

        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a bar
    tooltip(bar) {
        const settings = this.chart.settings;
        const cell = this.cell;
        const xName = settings.x || "X";
        const yName = settings.y || "Y";
        const title = cell.series.length > 1 || bar.seriesKey !== "" ? bar.seriesLabel : null;
        return {
            title,
            rows: [
                [xName, formatValue(bar.row[0], cell.xType)],
                [yName, formatValue(bar.row[1], cell.yType)]
            ]
        };
    }

    // What Stroom is told of a selected bar
    selectionItem(bar) {
        return seriesPointItem(bar.seriesKey, bar.row, this.cell);
    }

    // The chart for a screen reader, e.g. 'Bar chart of Count by Status: 6 bars, highest Count
    // 2,140 at 200'
    describe(cell) {
        const settings = this.chart.settings;
        const xName = settings.x || "X";
        const yName = settings.y || "Y";
        const rows = cell.series.flatMap(one => one.rows);
        let text = "Bar chart of " + yName + " by " + xName;
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (rows.length === 0) {
            return text + ": no data";
        }
        const highest = rows.reduce((best, row) => row[1] > best[1] ? row : best);
        const lowest = rows.reduce((best, row) => row[1] < best[1] ? row : best);
        text += ": " + rows.length + (rows.length === 1 ? " bar" : " bars");
        if (cell.series.length > 1) {
            text += " in " + cell.series.length + " series";
        }
        text += ", highest " + yName + " " + formatValue(highest[1], cell.yType) + " at "
                + formatValue(highest[0], cell.xType);
        // Bars below zero are as much a part of the picture as the highest
        if (lowest[1] < 0) {
            text += ", lowest " + yName + " " + formatValue(lowest[1], cell.yType) + " at "
                    + formatValue(lowest[0], cell.xType);
        }
        return text;
    }

    // Fades every bar but the highlighted one and those selected
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted;
        this.barsGroup.selectAll("rect.vis-bar-chart__bar").each((bar, index, nodes) => {
            const element = nodes[index];
            const selected = selection.has(this.selectionItem(bar).key);
            let faded;
            if (highlighted !== null && document.contains(highlighted)) {
                faded = element !== highlighted && !selected;
            } else {
                faded = !selection.isEmpty() && !selected;
            }
            element.classList.toggle("vis-bar-chart__bar--faded", faded);
            element.classList.toggle("vis-bar-chart__bar--selected", selected);
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
window.visualisations.BarChart = BarChart;
