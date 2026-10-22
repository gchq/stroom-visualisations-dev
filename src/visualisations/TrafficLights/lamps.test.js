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
import { contrast } from "../../shared/colour.js";
import { AMBER, GREEN, RED } from "../../shared/status.js";
import { HOUSING, LAMPS, lampColour } from "./lamps.js";

test("the lamps are red, amber and green from the top", () => {
    assert.deepEqual(LAMPS, [RED, AMBER, GREEN]);
});

test("a lit lamp stands out from the housing (3:1), and from itself unlit", () => {
    for (const status of LAMPS) {
        assert.ok(contrast(lampColour(status, true), HOUSING) >= 3, status + " on the housing");
        assert.ok(contrast(lampColour(status, true), lampColour(status, false)) >= 3, status + " lit or not");
    }
});
