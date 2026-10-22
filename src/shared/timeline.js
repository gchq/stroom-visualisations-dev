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

// What the timelines of sessions share (Session, SeriesSessionMap): each series a row, and each of
// its sessions (shared/sessions.js) a bar from its start to its end along a time axis, in the
// series' colour, in a grid of timelines if a Grid Series field is chosen. A session of a moment
// is still a sliver. Each session is reachable from the keyboard (Stroom's stroom.points), along
// its series and between series. Stroom gives the data nested as grid cell, then series, then rows.

import "./timeline.css";
import { scaleBand, select } from "d3";
import { fieldScale } from "./axis.js";
import { Chart } from "./chart.js";
import { DATE_TIME, TEXT, distinct, keyOf } from "./data.js";
import { formatKey, formatNumber } from "./format.js";
import { MARGIN, fitAxes } from "./plot.js";
import { inCell } from "./selection.js";
import { passesSeriesFilter, durationWords } from "./sessions.js";
import { isTrue } from "./settings.js";
import { currentZone, formatTime } from "./time.js";

// The narrowest a session's bar is drawn, so that a session of a moment can be seen and pointed at
const MIN_BAR_WIDTH = 3;
// The tallest a session's bar is drawn, so that a few series aren't great slabs
const MAX_BAR_HEIGHT = 32;
// A series' row is about this high at the least, to space their labels so they don't overlap
const LABEL_HEIGHT = 14;
// The most of a session's states its tooltip lists
const MAX_STATES = 6;

// A time in words, as the user has Stroom show times, e.g. '2026-09-07T08:00:00.000Z'
export function timeWords(time) {
    return formatTime(time);
}

// A session's span in words, its end just a time of day when on the same day (in the user's time
// zone), e.g. '2026-09-07T08:00:00.000Z to 09:12:00'
export function spanWords(session) {
    const zone = currentZone();
    const sameDay = zone.dayStart(session.start) === zone.dayStart(session.end);
    const endTime = zone.label(zone.is12Hour ? "%-I:%M:%S %p" : "%H:%M:%S");
    return timeWords(session.start) + " to " + (sameDay ? endTime(session.end) : timeWords(session.end));
}

// A session's events in words, e.g. '4 events'
export function countWords(session) {
    return formatNumber(session.count) + (session.count === 1 ? " event" : " events");
}

// A session for a screen reader, e.g. 'Mon 7 Sep 2026, 08:00:00 to 09:12:00, 1 h 12 min, 4 events',
// without its events if `countsEvents` is false
export function sessionWords(session, countsEvents) {
    return spanWords(session) + ", " + durationWords(session.end - session.start)
           + (countsEvents ? ", " + countWords(session) : "");
}

// The rows of a session's tooltip: its start, end, duration, events (if `countsEvents`) and states
export function sessionTooltipRows(session, countsEvents) {
    const rows = [
        ["Start", timeWords(session.start)],
        ["End", timeWords(session.end)],
        ["Duration", durationWords(session.end - session.start)]
    ];
    if (countsEvents) {
        rows.push(["Events", formatNumber(session.count)]);
    }
    if (session.states.length > 0) {
        const states = session.states.slice(0, MAX_STATES).join(", ");
        rows.push(["States", session.states.length > MAX_STATES ? states + ", …" : states]);
    }
    return rows;
}

export class TimelineChart extends Chart {

    constructor() {
        super((body, chart) => new TimelineCell(body, chart), "series");
    }

    // A series' rows as sessions, each {start, end, count, states}; each timeline has its own
    sessionsFor() {
        return [];
    }

    // Whether a session's count of events means anything (not for sessions given as spans)
    countsEvents() {
        return true;
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const gridCells = this.data.values.filter(cell => Array.isArray(cell.values));

        // Each series is coloured as the series field's values are everywhere on the dashboard
        const seriesKeys = distinct(gridCells.flatMap(cell => cell.values.map(keyOf)));
        const colours = this.colours.of(settings.series, seriesKeys);
        this.legend.setItems(seriesKeys.map(key => ({
            key,
            label: this.seriesLabel(key) || "Sessions",
            colour: colours(key)
        })));

        // What is shown of each cell: the series the legend hasn't hidden, and that the series
        // filter keeps, each with its sessions
        const shownCells = gridCells.map(cell => ({
            cell,
            series: cell.values
                .filter(one => !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key) || "Sessions",
                    sessions: this.sessionsFor((one.values || []).filter(Array.isArray))
                }))
                .filter(one => one.sessions.length > 0 && passesSeriesFilter(one.sessions, settings.seriesFilter))
        }));
        // With nothing to show, a timeline that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, series: [] });
        }

        // The time axis's range, the same in every cell unless the settings say not
        const rangeOf = series => {
            const sessions = series.flatMap(one => one.sessions);
            return sessions.length === 0
                ? { min: null, max: null }
                : { min: Math.min(...sessions.map(one => one.start)), max: Math.max(...sessions.map(one => one.end)) };
        };
        const all = rangeOf(shownCells.flatMap(shown => shown.series));
        const synchX = isTrue(settings.synchXAxis, true);

        this.grid.update(shownCells.map(({ cell, series }) => {
            const range = synchX ? all : rangeOf(series);
            return {
                key: keyOf(cell),
                label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Timeline",
                series,
                xMin: range.min,
                xMax: range.max,
                colourOf: seriesKey => colours(seriesKey),
                gridCellCount: shownCells.length
            };
        }));
    }
}

// The timeline in one cell of the grid
class TimelineCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-timeline");
        this.plot = this.svg.append("g");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.barsGroup = this.plot.append("g").attr("class", "vis-timeline__bars");
        // Said where the bars would be when there are none (the timeline's description says it too)
        this.emptyText = this.plot.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-timeline__session",
                group: bar => bar.__data__.seriesKey,
                tooltip: bar => this.tooltip(bar.__data__),
                label: bar => this.label(bar.__data__),
                highlight: bar => {
                    this.highlighted = bar;
                    this.showHighlight();
                },
                select: (bar, event) => chart.selection.choose(this.selectionItem(bar.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Timeline";
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
        const keys = cell.series.map(one => one.key);
        const labels = new Map(cell.series.map(one => [one.key, one.label]));
        const every = Math.max(1, Math.ceil(LABEL_HEIGHT / Math.max(1, height / Math.max(1, keys.length))));
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width,
            height,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: range => fieldScale(DATE_TIME, [], cell.xMin, cell.xMax, range),
            // The first series at the top
            yScaleFor: range => scaleBand().domain(keys).range([range[1], range[0]]).paddingInner(0.25).paddingOuter(0.1),
            x: { type: DATE_TIME, show: !empty && isTrue(settings.displayXAxis, true) },
            y: {
                type: TEXT,
                show: !empty && isTrue(settings.displayYAxis, true),
                tickValues: keys.filter((key, index) => index % every === 0),
                tickFormat: key => labels.get(key) || ""
            }
        });
        this.plot.attr("transform", "translate(" + left + "," + MARGIN.top + ")");
        this.emptyText
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight / 2)
            .text(empty ? "No data" : "");

        // A bar is no taller than MAX_BAR_HEIGHT, in the middle of its series' row
        const barHeight = Math.min(MAX_BAR_HEIGHT, yScale.bandwidth());
        const groups = this.barsGroup.selectAll("g.vis-timeline__series")
            .data(cell.series, one => one.key)
            .join("g")
            .attr("class", "vis-timeline__series");
        groups.selectAll("rect.vis-timeline__session")
            .data(one => one.sessions.map((session, index) => ({
                id: one.key + "~" + index,
                seriesKey: one.key,
                seriesLabel: one.label,
                session
            })), bar => bar.id)
            .join("rect")
            .attr("class", "vis-timeline__session")
            .attr("x", bar => xScale(bar.session.start))
            .attr("width", bar => Math.max(MIN_BAR_WIDTH, xScale(bar.session.end) - xScale(bar.session.start)))
            .attr("y", bar => yScale(bar.seriesKey) + (yScale.bandwidth() - barHeight) / 2)
            .attr("height", barHeight)
            .attr("rx", Math.min(3, barHeight / 4))
            .style("fill", bar => cell.colourOf(bar.seriesKey));

        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // A session for a screen reader, e.g. 'Mon 7 Sep 2026, 08:00:00 to 09:12:00, 1 h 12 min, 4 events'
    label(bar) {
        return sessionWords(bar.session, this.chart.countsEvents());
    }

    tooltip(bar) {
        return { title: bar.seriesLabel, rows: sessionTooltipRows(bar.session, this.chart.countsEvents()) };
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

    // The timeline for a screen reader, e.g. 'Sessions by User: 9 sessions in 3 series, from Mon 7
    // Sep 2026, 08:00:00 to Mon 7 Sep 2026, 18:00:00'
    describe(cell) {
        const settings = this.chart.settings;
        let text = "Sessions by " + (settings.series || "series");
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
        const first = Math.min(...sessions.map(one => one.start));
        const last = Math.max(...sessions.map(one => one.end));
        return text + ", from " + timeWords(first) + " to " + timeWords(last);
    }

    // Rings the session shown and those selected, and fades the other series while one is shown
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const highlightedSeries = highlighted === null ? null : highlighted.__data__.seriesKey;
        this.barsGroup.selectAll("g.vis-timeline__series").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-timeline__series--faded",
                highlightedSeries !== null && one.key !== highlightedSeries);
        });
        this.barsGroup.selectAll("rect.vis-timeline__session").each((bar, index, nodes) => {
            const element = nodes[index];
            element.classList.toggle("vis-timeline__session--shown", element === highlighted);
            element.classList.toggle("vis-timeline__session--selected", selection.has(this.selectionItem(bar).key));
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
