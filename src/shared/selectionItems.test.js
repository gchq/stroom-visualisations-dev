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

// Checks each visualisation's declared selection keys (the `selection` section of its settings,
// see scripts/selection.mjs) against what it tells Stroom of a selected item: every field it tells
// with a value is declared, every key declared is told, and of its declared type

import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { DATE_TIME, NUMBER, TEXT } from "./data.js";
import { isoTime, seriesPointItem } from "./selection.js";
import {
    boxItem,
    bubbleItem,
    chordFlowItem,
    chordNameItem,
    heatCellItem,
    markerItem,
    networkNodeItem,
    scatterPointItem,
    sessionItem,
    sliceItem,
    sunburstNodeItem,
    timePointItem,
    timeWindowItem,
    treeNodeItem,
    wordItem
} from "./selectionItems.js";

const VISUALISATIONS = new URL("../visualisations/", import.meta.url);

const TIME = Date.UTC(2026, 9, 12, 8);
// A cell of a grid of two charts, so that items say which they are in, and the only cell
const GRID_CELL = { key: "Cell A", gridCellCount: 2, xType: TEXT };
const ONE_CELL = { key: "", gridCellCount: 1, xType: TEXT };
const CELLS = [GRID_CELL, ONE_CELL];

const SESSION = { start: TIME, end: TIME + 60000 };
const MARKER = { key: "m1", name: "Alice", series: "Staff", icon: "person", time: TIME, gridSeries: "Cell A" };
const NO_MARKER_DETAILS = { key: "m2", name: null, series: null, icon: null, time: null };
const markerItems = place => [markerItem(MARKER, place), markerItem(NO_MARKER_DETAILS, place)];
const seriesPointItems = cell => [seriesPointItem("Errors", [TIME, 3], { ...cell, xType: DATE_TIME }),
    seriesPointItem("Errors", ["Mon", 4], cell)];
const sessionItems = () => CELLS.map(cell => sessionItem("Alice", SESSION, cell));
const networkItems = () => [networkNodeItem({ name: "web1", group: "Servers", isGroup: false }, ONE_CELL),
    networkNodeItem({ name: "Servers", group: null, isGroup: true }, ONE_CELL),
    networkNodeItem({ name: "laptop", group: null, isGroup: false }, ONE_CELL)];

// What each visualisation tells of the items a person can select, in each way it can, or none if
// nothing can be selected in it. Keys of items whose names come from the settings are `named`.
const ITEMS = {
    BarChart: () => CELLS.flatMap(seriesPointItems),
    Bubble: () => CELLS.map(cell => bubbleItem("Errors", ["web1", 12], TEXT, cell)),
    ChordLabels: () => CELLS.flatMap(cell => [chordNameItem("alice", cell), chordFlowItem("alice", "bob", cell)]),
    DayWeekHeatMap: () => [heatCellItem({ mapKey: "", time: TIME, value: 5 })],
    Doughnut: () => CELLS.map(cell => sliceItem("200 OK", 1200, TEXT, cell)),
    FloorMap: () => markerItems({ x: 10, y: 20, campus: "North", building: "B1", floor: "2" }),
    Force: networkItems,
    Force2D: networkItems,
    Force3D: networkItems,
    Gauge: () => [],
    GeoMap: () => markerItems({ lat: 51.5, lon: -0.1 }),
    HourDayMultiHeatMap: () => [heatCellItem({ mapKey: "web1", time: TIME, value: 5 })],
    HourDayPointMap: () => CELLS.map(cell => timePointItem("Logins", [TIME, 3], cell)),
    HourDaySessionMap: sessionItems,
    LineChart: () => CELLS.flatMap(seriesPointItems),
    RAGStatus: () => [],
    Scatter: () => CELLS.map(cell => scatterPointItem("Errors", [2, 3], cell)),
    SeriesSessionMap: sessionItems,
    Session: sessionItems,
    StackedArea: () => CELLS.flatMap(seriesPointItems),
    Sunburst: () => CELLS.map(cell => sunburstNodeItem("a/b", "b", 7, cell)),
    TextValue: () => [],
    TimeSeries: () => [timeWindowItem(TIME, TIME + 3600000)],
    TrafficLights: () => [],
    // A tree's value is also told under the name its settings give values, which can't be declared
    Tree: () => CELLS.map(cell => treeNodeItem("a/b", "b", ["x", "y"], TEXT, "Count", cell)),
    TreeMap: () => [boxItem("Errors", ["web1", 12], TEXT)],
    WordCloud: () => CELLS.map(cell => wordItem("error", cell))
};
const NAMED = { Tree: ["Count"] };

const hasValue = value => value !== undefined && value !== null && value !== "";

const isOfType = (value, type) => {
    switch (type) {
        case NUMBER:
            return typeof value === "number";
        case DATE_TIME:
            return typeof value === "string" && !Number.isNaN(Date.parse(value));
        case TEXT:
            return typeof value === "string";
        default:
            return true;
    }
};

const settingsOf = name => JSON.parse(fs.readFileSync(new URL(name + "/settings.json", VISUALISATIONS), "utf8"));

test("every visualisation says what can be selected in it", () => {
    const names = fs.readdirSync(VISUALISATIONS, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();
    assert.deepEqual(Object.keys(ITEMS).sort(), names);
});

for (const [name, itemsOf] of Object.entries(ITEMS)) {
    test(name + "'s selection keys are what it tells Stroom", () => {
        const items = itemsOf();
        const declared = settingsOf(name).selection;
        if (items.length === 0) {
            // Nothing can be selected in it, so it declares no keys (leaving the section out would
            // have Stroom offer name and value)
            assert.deepEqual(declared, []);
            return;
        }
        const told = new Set(items.flatMap(item => Object.keys(item).filter(key => hasValue(item[key]))));
        told.delete("key");
        for (const key of NAMED[name] || []) {
            told.delete(key);
        }
        assert.deepEqual(declared.map(one => one.key).sort(), [...told].sort());
        for (const one of declared) {
            for (const item of items.filter(each => hasValue(each[one.key]))) {
                assert.ok(isOfType(item[one.key], one.type),
                    one.key + " is told as " + JSON.stringify(item[one.key]) + ", not " + one.type);
            }
        }
    });
}

test("a tree's values are told as their type, times in ISO 8601", () => {
    const item = treeNodeItem("a/b", "b", [TIME, TIME + 60000], DATE_TIME, null, ONE_CELL);
    assert.equal(item.value, "2026-10-12T08:00:00.000Z, 2026-10-12T08:01:00.000Z");
    assert.equal(item.Value, item.value);
});

test("the name a tree's settings give values can't take the item's own keys", () => {
    for (const valueName of ["key", "path", "name", "value", "gridSeries"]) {
        const item = treeNodeItem("a/b", "b", ["5"], TEXT, valueName, GRID_CELL);
        assert.deepEqual(item, { key: "Cell A~#~a/b", path: "a/b", name: "b", value: "5", gridSeries: "Cell A" },
            valueName);
    }
});

test("a time no date can hold is told as it is, rather than failing", () => {
    const farOff = 1e17;
    assert.equal(isoTime(farOff), farOff);
    assert.deepEqual(markerItem({ ...MARKER, time: farOff }, { lat: 1, lon: 2 }).eventTime, farOff);
    assert.equal(sessionItem("Alice", { start: farOff, end: farOff }, ONE_CELL).x, farOff);
    assert.deepEqual(timeWindowItem(TIME, farOff), { minTime: "2026-10-12T08:00:00.000Z", maxTime: farOff });
});
