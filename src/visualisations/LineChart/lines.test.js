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
import { stateCounts } from "./lines.js";

test("state counting counts the states open after each change, in order of X", () => {
    const rows = [[3, "OUT"], [1, "IN"], [2, "IN"], [4, "Other"], [5, null], [6, "OUT"]];
    assert.deepEqual(stateCounts(rows, "IN", "OUT"), [[1, 1], [2, 2], [3, 1], [4, 1], [5, 1], [6, 0]]);
});

test("state counting can go below zero, when a stop comes first", () => {
    assert.deepEqual(stateCounts([[1, "Decrement"]], "Increment", "Decrement"), [[1, -1]]);
    assert.deepEqual(stateCounts([], "IN", "OUT"), []);
});

test("state counting with a text X keeps the data's order, as text has none to sort by", () => {
    const rows = [["tue", "IN"], ["mon", "IN"], ["wed", "OUT"], ["thu", "IN"]];
    assert.deepEqual(stateCounts(rows, "IN", "OUT"), [["tue", 1], ["mon", 2], ["wed", 1], ["thu", 2]]);
});
