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
import { statusBandsOf } from "../../shared/status.js";
import { END_ANGLE, START_ANGLE, angleOf } from "./gauge.js";

// The settings' defaults: green low, red high
const DEFAULTS = { GreenLo: "0", GreenHi: "1999", AmberLo: "2000", AmberHi: "4999", RedLo: "5000", RedHi: "10000" };

test("the dial goes round from bottom left to bottom right, a value off it just past the end", () => {
    const dial = statusBandsOf(DEFAULTS);
    assert.equal(angleOf(0, dial), START_ANGLE);
    assert.equal(angleOf(10000, dial), END_ANGLE);
    assert.equal(angleOf(5000, dial), 0);
    assert.ok(angleOf(20000, dial) > END_ANGLE);
    assert.ok(angleOf(-5, dial) < START_ANGLE);
});
