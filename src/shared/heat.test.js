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
import { DARK_BACKGROUND, LIGHT_BACKGROUND, contrast } from "./colour.js";
import { HEAT_BUCKETS, dayWeekGrid, daysOf, heatColours, heatScale, hourDayGrid, sumBySlot } from "./heat.js";
import { Zone } from "./time.js";

const HOUR = 3600000;
const DAY = 24 * HOUR;
// Monday 12 October 2026, 00:00 UTC
const MONDAY = Date.UTC(2026, 9, 12);
// British time: BST (+60) until 01:00 UTC on Sunday 25 October 2026, then GMT
const BST_END = Date.UTC(2026, 9, 25, 1);
const LONDON = new Zone({ offsetMinutes: ms => (ms < BST_END ? 60 : 0) });

test("days and weeks are the zone's: 23:30 UTC on Sunday is Monday in London", () => {
    const sunday = MONDAY - 30 * 60000;
    const utc = dayWeekGrid([[sunday, 1]]);
    assert.equal(utc.cells[0].row, "6");
    const london = dayWeekGrid([[sunday, 1]], LONDON);
    assert.equal(london.cells[0].row, "0");
    // The day starts at London's midnight, 23:00 UTC
    assert.equal(london.cells[0].time, MONDAY - HOUR);
    assert.equal(london.columns[0].key, String(MONDAY - HOUR));
    assert.equal(london.columns[0].label, "12 Oct");
});

test("hours and days are the zone's, and the hour repeated when the clocks go back is one cell", () => {
    // 00:30 and 01:30 UTC on 25 October are both 01:30 in London (BST, then GMT)
    const rows = [[Date.UTC(2026, 9, 25, 0, 30), 2], [Date.UTC(2026, 9, 25, 1, 30), 3]];
    const days = daysOf(rows.map(row => row[0]), LONDON);
    assert.deepEqual(days, [Date.UTC(2026, 9, 24, 23)]);
    const grid = hourDayGrid(rows, days, LONDON);
    assert.deepEqual(grid.rows.map(row => row.label), ["Sun 25 Oct"]);
    assert.equal(grid.cells.length, 1);
    assert.equal(grid.cells[0].column, "1");
    assert.equal(grid.cells[0].value, 5);
});

test("each theme's heat colours go from close to its background to far from it", () => {
    for (const [dark, background] of [[false, LIGHT_BACKGROUND], [true, DARK_BACKGROUND]]) {
        const colours = heatColours(dark);
        assert.equal(colours.length, HEAT_BUCKETS);
        const contrasts = colours.map(colour => contrast(colour, background));
        // The lowest still shows against the background
        assert.ok(contrasts[0] >= 1.5, (dark ? "dark " : "light ") + contrasts[0]);
        for (let i = 1; i < contrasts.length; i++) {
            assert.ok(contrasts[i] > contrasts[i - 1], (dark ? "dark " : "light ") + i);
        }
    }
});

test("values are coloured in equal buckets, the highest in the last", () => {
    const scale = heatScale(0, 90, heatColours(false));
    assert.equal(scale.buckets.length, HEAT_BUCKETS);
    assert.deepEqual([scale.buckets[0].lo, scale.buckets[0].hi], [0, 10]);
    assert.equal(scale.bucketOf(0).index, 0);
    assert.equal(scale.bucketOf(10).index, 1);
    assert.equal(scale.bucketOf(89).index, 8);
    assert.equal(scale.bucketOf(90).index, 8);
});

test("one value is one bucket, in the highest colour; no values, none", () => {
    const colours = heatColours(true);
    const scale = heatScale(5, 5, colours);
    assert.equal(scale.buckets.length, 1);
    assert.equal(scale.bucketOf(5).colour, colours[colours.length - 1]);
    assert.equal(heatScale(null, null, colours).buckets.length, 0);
});

test("values in the same slot are added, and rows without a time or number are left out", () => {
    const rows = [[MONDAY + HOUR, 2], [MONDAY + 2 * HOUR, 3], [MONDAY + DAY, 1], [null, 4], [MONDAY, "x"]];
    assert.deepEqual(sumBySlot(rows, time => Math.floor(time / DAY) * DAY),
        [{ time: MONDAY, value: 5 }, { time: MONDAY + DAY, value: 1 }]);
});

test("a day and week grid has a column for every week from the first to the last, Monday first", () => {
    // Monday of the first week, then Sunday of the third
    const grid = dayWeekGrid([[MONDAY + 9 * HOUR, 4], [MONDAY + 20 * DAY + HOUR, 7]]);
    assert.deepEqual(grid.columns.map(column => column.label), ["12 Oct", "19 Oct", "26 Oct"]);
    assert.equal(grid.rows[0].label, "Mon");
    assert.deepEqual(grid.cells.map(cell => [cell.column, cell.row, cell.value]), [
        [String(MONDAY), "0", 4],
        [String(MONDAY + 14 * DAY), "6", 7]
    ]);
});

test("a day is the UTC day, whatever the browser's time zone (Sunday 23:30 UTC is Sunday)", () => {
    const grid = dayWeekGrid([[MONDAY - HOUR / 2, 1]]);
    assert.deepEqual(grid.cells.map(cell => cell.row), ["6"]);
    assert.equal(grid.columns[0].label, "5 Oct");
});

test("weeks across a new year say which year", () => {
    const grid = dayWeekGrid([[Date.UTC(2026, 11, 30), 1], [Date.UTC(2027, 0, 5), 1]]);
    assert.deepEqual(grid.columns.map(column => column.label), ["28 Dec 2026", "4 Jan 2027"]);
});

test("nothing to show is an empty grid", () => {
    assert.deepEqual(dayWeekGrid([]), { columns: [], rows: [], cells: [] });
    assert.deepEqual(daysOf([]), []);
});

test("an hour and day grid has 24 hours and the days given, its cells by UTC hour", () => {
    const days = daysOf([MONDAY + 5 * HOUR, MONDAY + 2 * DAY]);
    assert.equal(days.length, 3);
    const grid = hourDayGrid([[MONDAY + 5 * HOUR + 60000, 2], [MONDAY + 5 * HOUR + 120000, 3]], days);
    assert.equal(grid.columns.length, 24);
    assert.equal(grid.columns[5].label, "05:00");
    assert.deepEqual(grid.rows.map(row => row.label), ["Mon 12 Oct", "Tue 13 Oct", "Wed 14 Oct"]);
    assert.deepEqual(grid.cells, [{ column: "5", row: String(MONDAY), time: MONDAY + 5 * HOUR, value: 5 }]);
});
