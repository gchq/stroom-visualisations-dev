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
import { TEXT, cellRows, hasValue, isPresent, numberFrom } from "./data.js";

test("a value is given unless it is null, undefined or no text", () => {
    assert.equal(isPresent("web-01"), true);
    assert.equal(isPresent(0), true);
    assert.equal(isPresent(false), true);
    assert.equal(isPresent(""), false);
    assert.equal(isPresent(null), false);
    assert.equal(isPresent(undefined), false);
    assert.equal(hasValue("", TEXT), false);
    assert.equal(hasValue("web-01", TEXT), true);
});

test("a number or its text is a number; anything else is null", () => {
    assert.equal(numberFrom(51.5), 51.5);
    assert.equal(numberFrom("-0.12"), -0.12);
    assert.equal(numberFrom(0), 0);
    assert.equal(numberFrom(""), null);
    assert.equal(numberFrom(null), null);
    assert.equal(numberFrom(undefined), null);
    assert.equal(numberFrom("north"), null);
    assert.equal(numberFrom(Number.NaN), null);
    assert.equal(numberFrom(Number.POSITIVE_INFINITY), null);
});

test("a cell's rows are those straight under it or under a level of their own", () => {
    assert.deepEqual(cellRows({ values: [["a", 1], ["b", 2]] }), [["a", 1], ["b", 2]]);
    assert.deepEqual(cellRows({ values: [{ key: null, values: [["a", 1]] }, { values: [["b", 2]] }] }),
        [["a", 1], ["b", 2]]);
    assert.deepEqual(cellRows({ values: [["a", 1], { values: [["b", 2]] }] }), [["a", 1], ["b", 2]]);
    assert.deepEqual(cellRows({ values: [{ key: "x" }] }), []);
    assert.deepEqual(cellRows({}), []);
});
