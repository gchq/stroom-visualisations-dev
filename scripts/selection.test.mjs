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
import { checkSelection } from "./selection.mjs";

test("settings without selection keys have no problems", () => {
    assert.deepEqual(checkSelection({ tabs: [] }), []);
});

test("keys with labels, and types or none, are fine", () => {
    assert.deepEqual(checkSelection({
        selection: [
            { key: "series", label: "Series" },
            { key: "x", label: "Time", type: "DATE_TIME" }
        ]
    }), []);
});

test("each problem is reported", () => {
    assert.deepEqual(checkSelection({
        selection: [
            { key: "x", label: "X", type: "DATE" },
            { key: "x", label: "Again" },
            { key: " lat ", label: "Latitude" },
            { key: "key", label: "Key" },
            { label: "No key" },
            { key: "y" },
            null
        ]
    }), [
        "selection[0] ('x') has the unknown type 'DATE' (expected one of TEXT, NUMBER, DATE_TIME)",
        "selection[1] ('x') repeats a key",
        "selection[2] (' lat ') has a key with a space in it",
        "selection[3] ('key') is the key that says which item is selected, which no selection handler can use",
        "selection[4] has no key",
        "selection[5] ('y') has no label",
        "selection[6] must be an object"
    ]);
});

test("selection keys that aren't a list are reported", () => {
    assert.deepEqual(checkSelection({ selection: {} }), ["'selection' must be a list"]);
});
