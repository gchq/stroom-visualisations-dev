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
import { afterEach, test } from "node:test";
import { UTC, Zone, currentZone, formatTime, zonedTimeScale } from "./time.js";

const at = text => Date.parse(text);

// British time: GMT (0) until 01:00 UTC on 29 March 2026, then BST (+60) until 01:00 UTC on
// 25 October 2026
const BST_START = at("2026-03-29T01:00:00Z");
const BST_END = at("2026-10-25T01:00:00Z");
const LONDON = new Zone({ offsetMinutes: ms => (ms >= BST_START && ms < BST_END ? 60 : 0) });
const KOLKATA = new Zone({ offsetMinutes: () => 330, is12Hour: true });

afterEach(() => {
    delete globalThis.stroom;
});

test("an instant's wall clock time, and back", () => {
    const instant = at("2026-10-12T23:30:00Z");
    assert.equal(LONDON.toWall(instant), at("2026-10-13T00:30:00Z"));
    assert.equal(LONDON.fromWall(at("2026-10-13T00:30:00Z")), instant);
    assert.equal(UTC.toWall(instant), instant);
    assert.equal(KOLKATA.toWall(instant), at("2026-10-13T05:00:00Z"));
});

test("an instant's day and hour are the zone's, not UTC's", () => {
    // 23:30 UTC on 12 October is 00:30 on Tuesday 13 October in London
    const instant = at("2026-10-12T23:30:00Z");
    assert.equal(LONDON.dayStart(instant), at("2026-10-12T23:00:00Z"));
    assert.equal(LONDON.hourOf(instant), 0);
    assert.equal(LONDON.weekdayOf(instant), 1);
    assert.equal(UTC.weekdayOf(instant), 0);
    assert.equal(LONDON.hourStart(instant), at("2026-10-12T23:00:00Z"));
    assert.equal(LONDON.timeOfDay(instant), 30 * 60000);
});

test("the day the clocks go back is 25 hours long", () => {
    const day = LONDON.dayStart(at("2026-10-25T12:00:00Z"));
    assert.equal(day, at("2026-10-24T23:00:00Z"));
    assert.equal(LONDON.nextDay(day) - day, 25 * 3600000);
});

test("a label is the zone's wall clock time", () => {
    assert.equal(LONDON.label("%a %-d %b %H:%M")(at("2026-10-12T23:30:00Z")), "Tue 13 Oct 00:30");
    assert.equal(UTC.label("%a %-d %b %H:%M")(at("2026-10-12T23:30:00Z")), "Mon 12 Oct 23:30");
});

test("axis ticks are labelled with a 24-hour clock, or a 12-hour one if the user's pattern has it", () => {
    assert.equal(UTC.tickFormat()(at("2026-10-12T08:00:00Z")), "08:00");
    assert.equal(UTC.tickFormat()(at("2026-10-12T08:30:00Z")), "08:30");
    assert.equal(UTC.tickFormat()(at("2026-10-12T00:00:00Z")), "Mon 12");
    assert.equal(KOLKATA.tickFormat()(at("2026-10-12T02:30:00Z")), "8 AM");
});

test("an hour of the day is labelled with the user's 24- or 12-hour clock", () => {
    assert.deepEqual([0, 6, 24].map(hour => UTC.hourLabel(hour)), ["00:00", "06:00", "24:00"]);
    assert.deepEqual([0, 6, 12, 18, 24].map(hour => KOLKATA.hourLabel(hour)),
        ["12 AM", "6 AM", "12 PM", "6 PM", "12 AM"]);
});

test("a zoned scale places and ticks instants by their wall clock time", () => {
    const scale = zonedTimeScale(LONDON)
        .domain([at("2026-10-12T23:00:00Z"), at("2026-10-13T23:00:00Z")])
        .range([0, 240]);
    // Midnight to midnight in London
    assert.equal(scale(at("2026-10-13T11:00:00Z")), 120);
    assert.deepEqual(scale.domain().map(date => date.getTime()),
        [at("2026-10-12T23:00:00Z"), at("2026-10-13T23:00:00Z")]);
    assert.equal(scale.invert(120).getTime(), at("2026-10-13T11:00:00Z"));
    // Ticks on the London hour, labelled as London's
    const ticks = scale.ticks(4);
    assert.equal(ticks[0].getTime(), at("2026-10-12T23:00:00Z"));
    assert.equal(scale.tickFormat()(ticks[1]), "06:00");
    const copy = scale.copy();
    assert.equal(copy(at("2026-10-13T11:00:00Z")), 120);
});

test("without Stroom's settings, times are UTC and ISO 8601", () => {
    assert.equal(currentZone(), UTC);
    assert.equal(formatTime(at("2026-10-12T09:00:00Z")), "2026-10-12T09:00:00.000Z");
});

test("with Stroom's settings, its offsets and formats are used", () => {
    const settings = { use: "Offset", offsetMinutes: 60 };
    globalThis.stroom = {
        time: {
            settings: () => settings,
            offsetMinutes: () => 60,
            format: ms => "formatted " + ms,
            formatCompact: ms => "compact " + ms,
            is12Hour: () => false
        }
    };
    const zone = currentZone();
    assert.equal(zone.hourOf(at("2026-10-12T09:00:00Z")), 10);
    assert.equal(formatTime(5), "formatted 5");
    assert.equal(currentZone(), zone);
});
