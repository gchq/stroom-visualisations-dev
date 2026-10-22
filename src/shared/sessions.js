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

// Sessions: a series' events joined into spans of time, as the session visualisations show them
// (Session, SeriesSessionMap, HourDaySessionMap). Times are in milliseconds, days are the
// user's (see time.js).

import { isNumber } from "./data.js";
import { UTC } from "./time.js";

// How long an event keeps a session open when the settings don't say (thresholdMs): ten minutes
export const DEFAULT_THRESHOLD_MILLIS = 600000;

// The settings' thresholdMs: a positive number of milliseconds, or the default
export function thresholdOf(setting) {
    const millis = Number.parseInt(setting, 10);
    return Number.isFinite(millis) && millis > 0 ? millis : DEFAULT_THRESHOLD_MILLIS;
}

// A series' events, rows of [time] or [time, state], joined into sessions, each {start, end, count,
// states}: in time order, an event joins the session before it unless
// - there is none, or the event before closed it (its state was `closeText`),
// - the event opens a new one (its state is `openText`) and the event before wasn't in an open one,
// - or it is `threshold` or more after the event before, and the session wasn't opened by
//   `openText` (a session that was waits for its close, however long).
// A session closed by `closeText` ends then; any other ends `tail` after its last event (e.g. the
// threshold, as the session is taken to stay open that long), but never after the next starts.
// `states` are the states of its events, in turn. Rows without a time are left out.
export function sessionsOf(rows, { threshold, tail = 0, openText = null, closeText = null }) {
    const events = rows.filter(row => Array.isArray(row) && isNumber(row[0])).sort((a, b) => a[0] - b[0]);
    const sessions = [];
    let current = null;
    let last = null;
    for (const row of events) {
        const time = row[0];
        const state = row.length > 1 && row[1] !== null && row[1] !== undefined && row[1] !== "" ? String(row[1]) : null;
        const opens = openText !== null && state === openText;
        const closes = closeText !== null && state === closeText;
        const startsNew = current === null
            || current.closed
            || (opens && !current.opened)
            || (!current.opened && time - last >= threshold);
        if (startsNew) {
            current = { start: time, end: time, count: 0, states: [], opened: opens, closed: false };
            sessions.push(current);
        }
        current.end = time;
        current.count++;
        if (state !== null) {
            current.states.push(state);
        }
        if (closes) {
            current.closed = true;
        }
        last = time;
    }
    return sessions.map((session, index) => {
        const next = sessions[index + 1];
        let end = session.closed ? session.end : session.end + tail;
        if (next && end > next.start) {
            end = Math.max(session.end, next.start - 1);
        }
        return { start: session.start, end, count: session.count, states: session.states };
    });
}

// Sessions given as rows of [start, end]: an end before the start is swapped with it, and a
// missing end makes a session of a moment. Rows without a start are left out. In order of start.
export function sessionsFromSpans(rows) {
    return rows
        .filter(row => Array.isArray(row) && isNumber(row[0]))
        .map(row => {
            const end = isNumber(row[1]) ? row[1] : row[0];
            return { start: Math.min(row[0], end), end: Math.max(row[0], end), count: 1, states: [] };
        })
        .sort((a, b) => a.start - b.start || a.end - b.end);
}

// A session cut into a piece for each day it spans, in a time zone (the user's, see time.js; UTC
// unless given), each {day, start, end, session}: the instant its day starts, and its own start and
// end within the day
export function piecesByDay(session, zone = UTC) {
    const pieces = [];
    let day = zone.dayStart(session.start);
    while (day <= session.end) {
        const next = zone.nextDay(day);
        pieces.push({ day, start: Math.max(day, session.start), end: Math.min(next - 1, session.end), session });
        day = next;
    }
    return pieces;
}

// Whether a series' sessions pass the settings' seriesFilter: 'Non-contiguous Only' keeps series
// broken into more than one session, 'Contiguous Only' those of one; anything else keeps all
export function passesSeriesFilter(sessions, filter) {
    if (filter === "Non-contiguous Only") {
        return sessions.length > 1;
    }
    if (filter === "Contiguous Only") {
        return sessions.length === 1;
    }
    return true;
}

// A length of time in words, to the second, e.g. '1 h 12 min', '45 s' or '0 s'
export function durationWords(millis) {
    const seconds = Math.round(millis / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    const parts = [];
    if (hours > 0) {
        parts.push(hours + " h");
    }
    if (minutes > 0) {
        parts.push(minutes + " min");
    }
    if (rest > 0 || parts.length === 0) {
        parts.push(rest + " s");
    }
    return parts.join(" ");
}
