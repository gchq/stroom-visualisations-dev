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
import { extent, stackSeries } from "./areas.js";

const bands = layer => layer.values.map(value => [value.x, value.y0, value.y1, value.value]);

test("the series with the highest values is at the bottom, the others on top of it", () => {
    const { xs, layers, totals } = stackSeries([
        { key: "small", label: "Small", rows: [[1, 2], [2, 3]] },
        { key: "big", label: "Big", rows: [[1, 10], [2, 20]] }
    ], "NUMBER");

    assert.deepEqual(xs, [1, 2]);
    assert.deepEqual(layers.map(layer => layer.key), ["big", "small"]);
    assert.deepEqual(bands(layers[0]), [[1, 0, 10, 10], [2, 0, 20, 20]]);
    assert.deepEqual(bands(layers[1]), [[1, 10, 12, 2], [2, 20, 23, 3]]);
    assert.equal(layers[1].label, "Small");
    assert.deepEqual([...totals], [[1, 12], [2, 23]]);
});

test("numbers along X are in order of value, not of their text (10 after 9)", () => {
    const { xs } = stackSeries([{ key: "", label: "", rows: [[10, 1], [9, 1], [100, 1]] }], "NUMBER");
    assert.deepEqual(xs, [9, 10, 100]);
});

test("categories along X are in the order they first appear", () => {
    const { xs } = stackSeries([
        { key: "a", label: "A", rows: [["web-02", 1], ["db-01", 1]] },
        { key: "b", label: "B", rows: [["web-01", 1], ["web-02", 1]] }
    ], "TEXT");
    assert.deepEqual(xs, ["web-02", "db-01", "web-01"]);
});

test("a series without a value at an X adds nothing there, and has no value of its own", () => {
    const { layers } = stackSeries([
        { key: "a", label: "A", rows: [[1, 5], [2, 5]] },
        { key: "b", label: "B", rows: [[1, 1], [2, null]] }
    ], "NUMBER");
    assert.deepEqual(bands(layers[1]), [[1, 5, 6, 1], [2, 5, 5, null]]);
});

test("values below zero stack down from zero, apart from those above it", () => {
    const { layers, totals } = stackSeries([
        { key: "up", label: "Up", rows: [[1, 10]] },
        { key: "down", label: "Down", rows: [[1, -4]] }
    ], "NUMBER");
    assert.deepEqual(bands(layers[0]), [[1, 0, 10, 10]]);
    // From zero (nearer) down to -4 (further)
    assert.deepEqual(bands(layers[1]), [[1, 0, -4, -4]]);
    assert.deepEqual(extent(layers), { min: -4, max: 10 });
    assert.equal(totals.get(1), 6);
});

test("nothing to stack", () => {
    const { xs, layers } = stackSeries([], "NUMBER");
    assert.deepEqual(xs, []);
    assert.deepEqual(layers, []);
    assert.deepEqual(extent(layers), { min: null, max: null });
});
