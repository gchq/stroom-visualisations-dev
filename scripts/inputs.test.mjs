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
import { checkInputs } from "./inputs.mjs";

const settings = inputs => ({
    tabs: [{ name: "Data", controls: [{ id: "x", type: "field", label: "X" }, { id: "max", type: "number" }] }],
    inputs: inputs
});

test("settings without inputs have no problems", () => {
    assert.deepEqual(checkInputs({ tabs: [] }), []);
});

test("an input for each field control is fine", () => {
    assert.deepEqual(checkInputs(settings([
        { id: "x", label: "X axis", description: "Time", types: ["DATE_TIME", "NUMBER"], required: true }
    ])), []);
});

test("each problem is reported", () => {
    assert.deepEqual(checkInputs(settings([
        { id: "x", label: "X", types: ["DATE"], required: "yes" },
        { id: "x", label: "Again", types: ["TEXT"] },
        { id: "max", types: [] },
        null
    ])), [
        "inputs[0] ('x') has the unknown type 'DATE' (expected one of TEXT, NUMBER, DATE_TIME)",
        "inputs[0] ('x') has a 'required' that isn't true or false",
        "inputs[1] ('x') repeats an id",
        "inputs[2] ('max') has no field control with its id",
        "inputs[2] ('max') has no label",
        "inputs[2] ('max') has no types",
        "inputs[3] must be an object"
    ]);
});

test("a field control without an input is reported", () => {
    assert.deepEqual(checkInputs(settings([])), ["the field control 'x' has no input"]);
});

test("inputs that aren't a list are reported", () => {
    assert.deepEqual(checkInputs(settings({})), ["'inputs' must be a list"]);
});
