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
import { pieSlices } from "./slices.js";

const ROWS = [["301 Moved", 25], ["200 OK", 50], ["404", 25]];

test("sorted, the biggest slice comes first, from the top, going round clockwise", () => {
    const { slices, total } = pieSlices(ROWS, true);
    assert.equal(total, 100);
    assert.deepEqual(slices.map(slice => slice.id), ["200 OK", "301 Moved", "404"]);
    assert.deepEqual(slices.map(slice => slice.share), [0.5, 0.25, 0.25]);
    assert.equal(slices[0].startAngle, 0);
    assert.ok(Math.abs(slices[0].endAngle - Math.PI) < 1e-9);
    assert.ok(Math.abs(slices[2].endAngle - 2 * Math.PI) < 1e-9);
});

test("unsorted, the slices are in the rows' order", () => {
    const { slices } = pieSlices(ROWS, false);
    assert.deepEqual(slices.map(slice => slice.id), ["301 Moved", "200 OK", "404"]);
});

test("only values above zero, with a name, are slices, and the total is theirs", () => {
    const { slices, total } = pieSlices([["a", 0], ["b", -5], ["c", null], [null, 4], ["d", 3], ["e", 1]], true);
    assert.deepEqual(slices.map(slice => slice.id), ["d", "e"]);
    assert.equal(total, 4);
});

test("two rows with the same name are both slices, with ids of their own", () => {
    const { slices } = pieSlices([["a", 1], ["a", 1]], false);
    assert.deepEqual(slices.map(slice => slice.id), ["a", "a~1"]);
});

test("nothing to slice", () => {
    assert.deepEqual(pieSlices([], true), { slices: [], total: 0 });
});
