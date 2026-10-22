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

// An hour and day session map: each series' events joined into sessions (shared/sessions.js), each
// a bar on the row of its day, across from its start to its end time of day, each series in a lane
// of its own within the day and in its own colour, in a grid of maps if a Grid Series field is
// chosen. A session over midnight is a bar on each day. Days and times of day are the user's. Stroom makes
// it with `new visualisations.HourDaySessionMap()` and calls setData(context, settings, data) with
// data nested as grid cell, then series, then rows of [time].
//
// Each session is reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./HourDaySessionMap.css";
import { scaleBand, scaleLinear, select } from "d3";
import { Chart } from "../../shared/chart.js";
import { NUMBER, TEXT, distinct, keyOf } from "../../shared/data.js";
import { formatKey } from "../../shared/format.js";
import { daysOf } from "../../shared/heat.js";
import { MARGIN, fitAxes } from "../../shared/plot.js";
import { inCell } from "../../shared/selection.js";
import { piecesByDay, sessionsOf, thresholdOf } from "../../shared/sessions.js";
import { isTrue } from "../../shared/settings.js";
import { currentZone } from "../../shared/time.js";
import { sessionTooltipRows, sessionWords, timeWords } from "../../shared/timeline.js";

const HOUR = 3600000;
// The narrowest a session's bar is drawn, so that a session of a moment can be seen
const MIN_BAR_WIDTH = 3;
// A day row's label is about this high, to space the labels so they don't overlap
const LABEL_HEIGHT = 14;

class HourDaySessionMap extends Chart {

    constructor() {
        super((body, chart) => new SessionMapCell(body, chart), "series");
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const threshold = thresholdOf(settings.thresholdMs);
        const gridCells = this.data.values.filter(cell => Array.isArray(cell.values));

        // Each series is coloured as the series field's values are everywhere on the dashboard
        const seriesKeys = distinct(gridCells.flatMap(cell => cell.values.map(keyOf)));
        const colours = this.colours.of(settings.series, seriesKeys);
        this.legend.setItems(seriesKeys.map(key => ({
            key,
            label: this.seriesLabel(key) || "Sessions",
            colour: colours(key)
        })));

        // What is shown of each cell: the series the legend hasn't hidden, each with its sessions
        const shownCells = gridCells.map(cell => ({
            cell,
            series: cell.values
                .filter(one => !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key) || "Sessions",
                    sessions: sessionsOf((one.values || []).filter(Array.isArray), { threshold })
                }))
                .filter(one => one.sessions.length > 0)
        }));
        // With nothing to show, a map that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, series: [] });
        }
        // Every map has the same days, unless the settings say not, and a lane in each day for
        // each series shown anywhere
        // The days are the user's (their time zone, see time.js)
        const zone = currentZone();
        const timesOf = series => series.flatMap(one => one.sessions.flatMap(session => [session.start, session.end]));
        const allDays = daysOf(shownCells.flatMap(shown => timesOf(shown.series)), zone);
        const synchDays = isTrue(settings.synchYAxis, true);
        const lanes = distinct(shownCells.flatMap(shown => shown.series.map(one => one.key)));

        this.grid.update(shownCells.map(({ cell, series }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Session map",
            series,
            days: synchDays ? allDays : daysOf(timesOf(series), zone),
            lanes,
            colourOf: seriesKey => colours(seriesKey),
            gridCellCount: shownCells.length
        })));
    }
}

// The map in one cell of the grid
class SessionMapCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-session-map");
        this.plot = this.svg.append("g");
        this.dayLinesGroup = this.plot.append("g").attr("class", "vis-session-map__day-lines").attr("aria-hidden", "true");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.barsGroup = this.plot.append("g").attr("class", "vis-session-map__bars");
        // Said where the bars would be when there are none (the map's description says it too)
        this.emptyText = this.plot.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-session-map__session",
                group: bar => bar.__data__.seriesKey,
                tooltip: bar => ({ title: bar.__data__.seriesLabel, rows: sessionTooltipRows(bar.__data__.session, true) }),
                label: bar => sessionWords(bar.__data__.session, true),
                highlight: bar => {
                    this.highlighted = bar;
                    this.showHighlight();
                },
                select: (bar, event) => chart.selection.choose(this.selectionItem(bar.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Session map";
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

        const empty = cell.series.length === 0;
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
        this.dayLinesGroup.selectAll("line.vis-session-map__day-line")
            .data(empty ? [] : dayKeys.slice(1))
            .join("line")
            .attr("class", "vis-session-map__day-line")
            .attr("x1", 0)
            .attr("x2", plotWidth)
            .attr("y1", day => yScale(day) - (step - yScale.bandwidth()) / 2)
            .attr("y2", day => yScale(day) - (step - yScale.bandwidth()) / 2);

        // Each series in its lane of the day, each session a bar on each day it spans
        const lane = scaleBand().domain(cell.lanes).range([0, yScale.bandwidth()]).padding(0.15);
        // A time's hour of its day as the user's clock shows it (e.g. 9.5 for 09:30)
        const zone = currentZone();
        const hourOf = time => zone.timeOfDay(time) / HOUR;
        const groups = this.barsGroup.selectAll("g.vis-session-map__series")
            .data(cell.series, one => one.key)
            .join("g")
            .attr("class", "vis-session-map__series");
        groups.selectAll("rect.vis-session-map__session")
            .data(one => one.sessions.flatMap((session, index) => piecesByDay(session, zone).map(piece => ({
                id: one.key + "~" + index + "~" + piece.day,
                seriesKey: one.key,
                seriesLabel: one.label,
                session,
                piece
            }))), bar => bar.id)
            .join("rect")
            .attr("class", "vis-session-map__session")
            .attr("x", bar => xScale(hourOf(bar.piece.start)))
            .attr("width", bar => Math.max(MIN_BAR_WIDTH, xScale(hourOf(bar.piece.end)) - xScale(hourOf(bar.piece.start))))
            .attr("y", bar => yScale(String(bar.piece.day)) + lane(bar.seriesKey))
            .attr("height", lane.bandwidth())
            .attr("rx", Math.min(3, lane.bandwidth() / 4))
            .style("fill", bar => cell.colourOf(bar.seriesKey));

        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // What Stroom is told of a selected session
    selectionItem(bar) {
        const start = new Date(bar.session.start).toISOString();
        return inCell({
            key: bar.seriesKey + "~#~" + start,
            series: bar.seriesKey,
            x: start,
            end: new Date(bar.session.end).toISOString()
        }, this.cell);
    }

    // The map for a screen reader, e.g. 'Sessions by User by hour and day: 9 sessions in 3 series
    // over 3 days, first Mon 7 Sep 2026, 08:00:00'
    describe(cell) {
        const settings = this.chart.settings;
        let text = "Sessions by " + (settings.series || "series") + " by hour and day";
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        const sessions = cell.series.flatMap(one => one.sessions);
        if (sessions.length === 0) {
            return text + ": no data";
        }
        text += ": " + sessions.length + (sessions.length === 1 ? " session" : " sessions");
        if (cell.series.length > 1) {
            text += " in " + cell.series.length + " series";
        }
        return text + " over " + cell.days.length + (cell.days.length === 1 ? " day" : " days")
               + ", first " + timeWords(Math.min(...sessions.map(one => one.start)));
    }

    // Rings the session shown and those selected, and fades the other series while one is shown
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.barsGroup.selectAll("g.vis-session-map__series").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-session-map__series--faded",
                highlightedSeries !== null && one.key !== highlightedSeries);
        });
        this.barsGroup.selectAll("rect.vis-session-map__session").each((bar, index, nodes) => {
            const element = nodes[index];
            // Both pieces of a session over midnight are rung when either is shown
            element.classList.toggle("vis-session-map__session--shown",
                highlighted !== null && highlighted.__data__.session === bar.session);
            element.classList.toggle("vis-session-map__session--selected", selection.has(this.selectionItem(bar).key));
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
window.visualisations.HourDaySessionMap = HourDaySessionMap;
