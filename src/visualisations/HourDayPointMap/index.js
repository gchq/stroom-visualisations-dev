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

// An hour and day point map: each event a point on the row of its day, across at its time of day,
// each series in a lane of its own within the day and in its own colour, in a grid of maps if a
// Grid Series field is chosen. Days and times of day are the user's. Stroom makes it with
// `new visualisations.HourDayPointMap()` and calls setData(context, settings, data) with data
// nested as grid cell, then series, then rows of [time, value].
//
// Each point is reachable from the keyboard (Stroom's stroom.points), and the mouse finds the
// nearest point (shared/nearest.js).

import "../../shared/shared.css";
import "./HourDayPointMap.css";
import { scaleBand, scaleLinear, select } from "d3";
import { Chart } from "../../shared/chart.js";
import { NUMBER, TEXT, distinct, isNumber, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { daysOf } from "../../shared/heat.js";
import { NearestPoint } from "../../shared/nearest.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { inCell } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { currentZone, formatTime } from "../../shared/time.js";
import { dayPoints } from "./points.js";

// A day row's label is about this high, to space the labels so they don't overlap
const LABEL_HEIGHT = 14;

class HourDayPointMap extends Chart {

    constructor() {
        super((body, chart) => new PointMapCell(body, chart), "pointSeries");
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const data = this.data;
        const settings = this.settings;
        const gridCells = data.values.filter(cell => Array.isArray(cell.values));

        // Each series is coloured as the series field's values are everywhere on the dashboard
        const seriesKeys = distinct(gridCells.flatMap(cell => cell.values.map(keyOf)));
        const colours = this.colours.of(settings.pointSeries, seriesKeys);
        this.legend.setItems(seriesKeys.map(key => ({
            key,
            label: this.seriesLabel(key) || "Events",
            colour: colours(key)
        })));

        // What is shown of each cell: the series the legend hasn't hidden, and their events
        const shownCells = gridCells.map(cell => ({
            cell,
            series: cell.values
                .filter(one => !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key),
                    rows: (one.values || []).filter(row => Array.isArray(row) && isNumber(row[0]))
                }))
        }));
        // With nothing to show, a chart that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, series: [] });
        }
        // Every map has the same days, unless the settings say not, and a lane in each day for
        // each series shown anywhere
        // The days are the user's (their time zone, see time.js)
        const zone = currentZone();
        const timesOf = series => series.flatMap(one => one.rows.map(row => row[0]));
        const allDays = daysOf(shownCells.flatMap(shown => timesOf(shown.series)), zone);
        const synchDays = isTrue(settings.synchXAxis, true);
        const lanes = distinct(shownCells.flatMap(shown => shown.series.map(one => one.key)));

        this.grid.update(shownCells.map(({ cell, series }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Point map",
            series,
            days: synchDays ? allDays : daysOf(timesOf(series), zone),
            lanes,
            valueType: data.types[1],
            colourOf: seriesKey => colours(seriesKey),
            gridCellCount: shownCells.length
        })));
    }
}

// The map in one cell of the grid
class PointMapCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-point-map");
        this.plot = this.svg.append("g");
        this.dayLinesGroup = this.plot.append("g").attr("class", "vis-point-map__day-lines").attr("aria-hidden", "true");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.pointsGroup = this.plot.append("g").attr("class", "vis-point-map__points vis-glow");
        // Said where the points would be when there are none (the chart's description says it too)
        this.emptyText = this.plot.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");
        // Over the plot, to find the point nearest the mouse
        this.nearest = new NearestPoint(this.plot, () => this.points,
            (point, event) => chart.selection.choose(this.selectionItem(point.__data__), event));
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-point-map__point",
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
        this.summary = "Point map";
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

        const empty = cell.series.every(one => one.rows.length === 0);
        const dayKeys = cell.days.map(String);
        // An hour label every three hours, or six where that is too close
        const hourStep = width / 8 >= 48 ? 3 : 6;
        const dayEvery = Math.max(1, Math.ceil(LABEL_HEIGHT / Math.max(1, height / Math.max(1, dayKeys.length))));
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width,
            height,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: range => scaleLinear().domain([0, 24]).range(range),
            // The first day at the top
            yScaleFor: range => scaleBand().domain(dayKeys).range([range[1], range[0]]).paddingInner(0.1),
            x: {
                type: NUMBER,
                show: !empty && isTrue(settings.displayXAxis, true),
                tickValues: Array.from({ length: 24 / hourStep + 1 }, (unused, index) => index * hourStep),
                tickFormat: hour => currentZone().hourLabel(hour)
            },
            y: {
                type: TEXT,
                show: !empty && isTrue(settings.displayYAxis, true),
                tickValues: dayKeys.filter((day, index) => index % dayEvery === 0),
                tickFormat: day => currentZone().label("%a %-d %b")(Number(day))
            }
        });
        this.plot.attr("transform", "translate(" + left + "," + MARGIN.top + ")");
        this.emptyText
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight / 2)
            .text(empty ? "No data" : "");

        // A line between each day and the next
        const step = yScale.step();
        this.dayLinesGroup.selectAll("line.vis-point-map__day-line")
            .data(empty ? [] : dayKeys.slice(1))
            .join("line")
            .attr("class", "vis-point-map__day-line")
            .attr("x1", 0)
            .attr("x2", plotWidth)
            .attr("y1", day => yScale(day) - (step - yScale.bandwidth()) / 2)
            .attr("y2", day => yScale(day) - (step - yScale.bandwidth()) / 2);

        // Each series in its lane of the day
        const lane = scaleBand().domain(cell.lanes).range([0, yScale.bandwidth()]).padding(0.1);
        const radius = Math.max(2, Math.min(5, lane.bandwidth() * 0.4));
        const points = dayPoints(cell.series, currentZone());
        // Each point's place in the plot, which the mouse finds the nearest point by (nearest.js)
        for (const seriesPoints of points.values()) {
            for (const point of seriesPoints) {
                point.x = xScale(point.hour);
                point.y = yScale(String(point.day)) + lane(point.seriesKey) + lane.bandwidth() / 2;
            }
        }
        const groups = this.pointsGroup.selectAll("g.vis-point-map__series")
            .data(cell.series, one => one.key)
            .join("g")
            .attr("class", "vis-point-map__series");
        groups.selectAll("circle.vis-point-map__point")
            .data(one => points.get(one.key) || [], point => point.id)
            .join("circle")
            .attr("class", "vis-point-map__point")
            .attr("r", radius)
            .attr("cx", point => point.x)
            .attr("cy", point => point.y)
            .style("fill", point => cell.colourOf(point.seriesKey))
            .style("stroke", point => cell.colourOf(point.seriesKey));

        this.nearest.update(plotWidth, plotHeight, this.pointsGroup.selectAll("circle.vis-point-map__point").nodes());
        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a point
    tooltip(point) {
        const settings = this.chart.settings;
        const rows = [[settings.eventTime || "Time", formatTime(point.row[0])]];
        if (point.row.length > 1 && point.row[1] !== null && point.row[1] !== undefined) {
            rows.push([settings.value || "Value", formatValue(point.row[1], this.cell.valueType)]);
        }
        return { title: point.seriesLabel || null, rows };
    }

    // What Stroom is told of a selected point
    selectionItem(point) {
        const time = new Date(point.row[0]).toISOString();
        const item = { key: point.seriesKey + "~#~" + time, series: point.seriesKey, x: time, value: point.row[1] };
        return inCell(item, this.cell);
    }

    // The map for a screen reader, e.g. 'Point map of Time by hour and day: 36 events in 3 series
    // over 3 days, first 2026-10-12T08:00:00.000Z' (the time as the user has Stroom show times)
    describe(cell) {
        const settings = this.chart.settings;
        let text = "Point map of " + (settings.eventTime || "Time") + " by hour and day";
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        const times = cell.series.flatMap(one => one.rows.map(row => row[0]));
        if (times.length === 0) {
            return text + ": no data";
        }
        const seriesCount = cell.series.filter(one => one.rows.length > 0).length;
        text += ": " + times.length + (times.length === 1 ? " event" : " events");
        if (seriesCount > 1) {
            text += " in " + seriesCount + " series";
        }
        text += " over " + cell.days.length + (cell.days.length === 1 ? " day" : " days")
                + ", first " + formatTime(Math.min(...times));
        return text;
    }

    // Rings the point shown and those selected, and fades the other series while a point is shown
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.pointsGroup.selectAll("g.vis-point-map__series").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-point-map__series--faded",
                highlightedSeries !== null && one.key !== highlightedSeries);
        });
        this.pointsGroup.selectAll("circle.vis-point-map__point").each((point, index, nodes) => {
            const element = nodes[index];
            element.classList.toggle("vis-point-map__point--shown", element === highlighted);
            element.classList.toggle("vis-point-map__point--selected", selection.has(this.selectionItem(point).key));
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
window.visualisations.HourDayPointMap = HourDayPointMap;
