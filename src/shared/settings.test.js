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
import { isTrue, settingNumber } from "./settings.js";

test("a true or false setting, as Stroom gives it, or the default when it isn't set", () => {
    assert.equal(isTrue("True", false), true);
    assert.equal(isTrue("false", true), false);
    assert.equal(isTrue("", true), true);
    assert.equal(isTrue(undefined, false), false);
});

test("a number setting is a number within its range, otherwise its default", () => {
    assert.equal(settingNumber("200", 120, 10, 1000), 200);
    assert.equal(settingNumber("5000", 120, 10, 1000), 1000);
    assert.equal(settingNumber("-3", 120, 10, 1000), 10);
    assert.equal(settingNumber("lots", 120, 10, 1000), 120);
    assert.equal(settingNumber("", 120, 10, 1000), 120);
    assert.equal(settingNumber(undefined, 120, 10, 1000), 120);
});
