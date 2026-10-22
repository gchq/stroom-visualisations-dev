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

import assert from "node:assert/strict";
import { test } from "node:test";
import {
    DEFAULT_THRESHOLD_MILLIS, durationWords, passesSeriesFilter, piecesByDay, sessionsFromSpans, sessionsOf, thresholdOf
} from "./sessions.js";

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const MONDAY = Date.UTC(2026, 9, 12);
const at = minutes => MONDAY + minutes * MINUTE;
const spans = sessions => sessions.map(session => [(session.start - MONDAY) / MINUTE, (session.end - MONDAY) / MINUTE, session.count]);

test("events closer than the threshold are one session, ending at the last event", () => {
    const sessions = sessionsOf([[at(0)], [at(4)], [at(8)], [at(30)], [at(31)]], { threshold: 10 * MINUTE });
    assert.deepEqual(spans(sessions), [[0, 8, 3], [30, 31, 2]]);
});

test("an event exactly the threshold after the last starts a new session", () => {
    assert.equal(sessionsOf([[at(0)], [at(10)]], { threshold: 10 * MINUTE }).length, 2);
});

test("a session stays open the tail after its last event, but not past the next session's start", () => {
    const sessions = sessionsOf([[at(0)], [at(12)], [at(30)]], { threshold: 10 * MINUTE, tail: 15 * MINUTE });
    assert.deepEqual(spans(sessions).map(span => span.slice(0, 2)), [[0, 12 - 1 / MINUTE], [12, 27], [30, 45]]);
});

test("a start opens a session that waits for its stop, however long between", () => {
    const options = { threshold: 10 * MINUTE, tail: 10 * MINUTE, openText: "Start", closeText: "Stop" };
    const sessions = sessionsOf([[at(0), "Start"], [at(120), "Stop"], [at(200), "Start"], [at(205), "Stop"]], options);
    assert.deepEqual(spans(sessions), [[0, 120, 2], [200, 205, 2]]);
    assert.deepEqual(sessions[0].states, ["Start", "Stop"]);
});

test("a second start in an open session is part of it; a stop after a stop is a session of its own", () => {
    const options = { threshold: 10 * MINUTE, openText: "Start", closeText: "Stop" };
    const sessions = sessionsOf([[at(0), "Start"], [at(50), "Start"], [at(60), "Stop"], [at(90), "Stop"]], options);
    assert.deepEqual(spans(sessions), [[0, 60, 3], [90, 90, 1]]);
});

test("events out of order are put in order, and rows without a time left out", () => {
    const sessions = sessionsOf([[at(8)], [null], [at(0)], [at(4)]], { threshold: 10 * MINUTE });
    assert.deepEqual(spans(sessions), [[0, 8, 3]]);
});

test("spans are sessions, an end before its start swapped and a missing end a moment", () => {
    assert.deepEqual(spans(sessionsFromSpans([[at(30), at(10)], [at(0), null], [null, at(5)]])), [[0, 0, 1], [10, 30, 1]]);
});

test("a session over midnight is a piece on each day, its events counted once", () => {
    const session = sessionsOf([[MONDAY - 5 * MINUTE], [MONDAY + 3 * MINUTE]], { threshold: 10 * MINUTE })[0];
    assert.equal(session.count, 2);
    const pieces = piecesByDay(session);
    assert.deepEqual(pieces.map(piece => [piece.day, piece.start, piece.end]), [
        [MONDAY - 24 * HOUR, MONDAY - 5 * MINUTE, MONDAY - 1],
        [MONDAY, MONDAY, MONDAY + 3 * MINUTE]
    ]);
    assert.equal(pieces[1].session, session);
});

test("the series filter keeps broken series, whole series, or all", () => {
    assert.equal(passesSeriesFilter([1, 2], "Non-contiguous Only"), true);
    assert.equal(passesSeriesFilter([1], "Non-contiguous Only"), false);
    assert.equal(passesSeriesFilter([1], "Contiguous Only"), true);
    assert.equal(passesSeriesFilter([1, 2], "Unfiltered"), true);
});

test("the threshold is the setting's milliseconds, or ten minutes", () => {
    assert.equal(thresholdOf("300000"), 300000);
    assert.equal(thresholdOf(""), DEFAULT_THRESHOLD_MILLIS);
    assert.equal(thresholdOf("-5"), DEFAULT_THRESHOLD_MILLIS);
});

test("a length of time in words", () => {
    assert.equal(durationWords(72 * MINUTE), "1 h 12 min");
    assert.equal(durationWords(45000), "45 s");
    assert.equal(durationWords(0), "0 s");
    assert.equal(durationWords(HOUR + 5000), "1 h 5 s");
});
