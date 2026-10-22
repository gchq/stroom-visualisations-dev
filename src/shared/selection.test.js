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
import { afterEach, beforeEach, test } from "node:test";
import { DATE_TIME, NUMBER, TEXT } from "./data.js";
import { Selection, inCell, selectedValue, seriesPointItem } from "./selection.js";

const A = { key: "a", name: "alpha" };
const B = { key: "b", name: "beta" };
const C = { key: "c", name: "gamma" };

// What Stroom was told, each time (vis.js's stroom.select)
let told;
let changes;
let selection;

beforeEach(() => {
    told = [];
    changes = 0;
    globalThis.stroom = { select: items => told.push(items.map(item => item.key)) };
    selection = new Selection(() => changes++);
});

afterEach(() => {
    delete globalThis.stroom;
});

test("a click selects a point in place of the others", () => {
    selection.choose(A, {});
    selection.choose(B, { ctrlKey: false });
    assert.deepEqual(told, [["a"], ["b"]]);
    assert.equal(selection.has("a"), false);
    assert.equal(selection.has("b"), true);
    assert.equal(changes, 2);
});

test("a click on the only point selected selects nothing", () => {
    selection.choose(A, {});
    selection.choose(A, {});
    assert.deepEqual(told, [["a"], []]);
    assert.equal(selection.isEmpty(), true);
});

test("Ctrl+Click, Cmd+Click and the keyboard add a point, or take it out", () => {
    selection.choose(A, {});
    selection.choose(B, { ctrlKey: true });
    selection.choose(C, { metaKey: true });
    selection.choose(B, { keyboard: true });
    assert.deepEqual(told, [["a"], ["a", "b"], ["a", "b", "c"], ["a", "c"]]);
});

test("a click on one of several selected points selects just it", () => {
    selection.choose(A, {});
    selection.choose(B, { ctrlKey: true });
    selection.choose(A, {});
    assert.deepEqual(told.at(-1), ["a"]);
});

test("clearing tells Stroom of an empty selection, once", () => {
    selection.clear();
    assert.deepEqual(told, []);
    selection.choose(A, {});
    selection.clear();
    selection.clear();
    assert.deepEqual(told, [["a"], []]);
    assert.equal(changes, 2);
});

test("after new data, what is no longer drawn is selected no more", () => {
    selection.choose(A, {});
    selection.choose(B, { ctrlKey: true });
    selection.noteDrawn();
    // The chart shows the selection of what it draws: a and c, not b
    selection.has("a");
    selection.has("c");
    selection.keepDrawn();
    assert.deepEqual(told.at(-1), ["a"]);
    assert.equal(selection.has("b"), false);
});

test("after new data that is all still drawn, Stroom isn't told again", () => {
    selection.choose(A, {});
    selection.noteDrawn();
    selection.has("a");
    selection.keepDrawn();
    assert.deepEqual(told, [["a"]]);
});

test("if nothing was drawn (e.g. no room to draw in), the selection is kept", () => {
    selection.choose(A, {});
    selection.noteDrawn();
    selection.keepDrawn();
    assert.equal(selection.has("a"), true);
    assert.deepEqual(told, [["a"]]);
});

test("a time is told in ISO 8601, and any other value as it is", () => {
    assert.equal(selectedValue(Date.UTC(2026, 9, 12, 8), DATE_TIME), "2026-10-12T08:00:00.000Z");
    assert.equal(selectedValue(42, NUMBER), 42);
    assert.equal(selectedValue("200 OK", TEXT), "200 OK");
    // A time that isn't one is left as it is
    assert.equal(selectedValue(null, DATE_TIME), null);
    assert.equal(selectedValue("soon", DATE_TIME), "soon");
});

test("in a grid of charts, an item says which cell it is in, and has a key of the cell's own", () => {
    const item = { key: "a", name: "alpha" };
    assert.deepEqual(inCell(item, { key: "web-01", gridCellCount: 3 }),
        { key: "web-01~#~a", name: "alpha", gridSeries: "web-01" });
    // A single chart (not a grid) is as it is
    assert.equal(inCell(item, { key: "", gridCellCount: 1 }), item);
    assert.equal(inCell(item, undefined), item);
});

test("without Stroom, a selection is still kept and shown", () => {
    delete globalThis.stroom;
    selection.choose(A, {});
    assert.equal(selection.has("a"), true);
    assert.equal(changes, 1);
});

test("a series' point is selected as its series, X and Y, in its cell", () => {
    const time = Date.UTC(2026, 9, 12, 8);
    assert.deepEqual(seriesPointItem("web-01", [time, 42], { xType: DATE_TIME, gridCellCount: 1 }), {
        key: "web-01~#~2026-10-12T08:00:00.000Z", series: "web-01", x: "2026-10-12T08:00:00.000Z", value: 42, y: 42
    });
    assert.deepEqual(seriesPointItem("", ["GET", 7], { key: "eu", xType: TEXT, gridCellCount: 2 }), {
        key: "eu~#~~#~GET", series: "", x: "GET", value: 7, y: 7, gridSeries: "eu"
    });
});
