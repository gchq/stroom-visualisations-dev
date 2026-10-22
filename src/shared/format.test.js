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
import { DATE_TIME, NUMBER, TEXT } from "./data.js";
import { formatKey, formatShare, formatValue } from "./format.js";

const OCT_12 = Date.UTC(2026, 9, 12, 8);

test("a number or date is formatted whether given as a number or as its text, as a legend's key is", () => {
    assert.equal(formatValue(1380, NUMBER), "1,380");
    assert.equal(formatValue("1380", NUMBER), "1,380");
    assert.equal(formatValue(OCT_12, DATE_TIME, "%Y-%m-%d"), "2026-10-12");
    assert.equal(formatValue(String(OCT_12), DATE_TIME, "%Y-%m-%d"), "2026-10-12");
    // Text is text, even if it looks like a number
    assert.equal(formatValue("1380", TEXT), "1380");
});

test("a value that isn't the number or date its type says is shown as it is", () => {
    assert.equal(formatValue("soon", DATE_TIME, "%Y"), "soon");
    assert.equal(formatValue("", NUMBER), "");
    assert.equal(formatValue(null, NUMBER), "");
});

test("a key is a date in the settings' pattern, whether a number or its text", () => {
    assert.equal(formatKey(OCT_12, "%Y-%m-%d"), "2026-10-12");
    assert.equal(formatKey(String(OCT_12), "%Y-%m-%d"), "2026-10-12");
    // Without a pattern, or if it isn't a number, as it is
    assert.equal(formatKey(String(OCT_12)), String(OCT_12));
    assert.equal(formatKey("web-01", "%Y"), "web-01");
    assert.equal(formatKey(null, "%Y"), "");
});

test("a share is a percentage to one decimal place", () => {
    assert.equal(formatShare(0.65646), "65.6%");
    assert.equal(formatShare(1), "100.0%");
    assert.equal(formatShare(0.0004), "0.0%");
});
