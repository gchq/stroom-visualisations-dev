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
import { fitFontSize, fitOf, fitText, shortened } from "./fit.js";

test("content is fitted in the middle, no bigger than it is and no smaller than the least", () => {
    assert.deepEqual(fitOf({ left: 0, top: 0, right: 100, bottom: 50 }, 400, 200, 0.5), { k: 1, x: 150, y: 75 });
    assert.deepEqual(fitOf({ left: -200, top: 0, right: 200, bottom: 100 }, 200, 200, 0.25),
        { k: 0.5, x: 100, y: 75 });
    assert.equal(fitOf({ left: 0, top: 0, right: 10000, bottom: 10 }, 100, 100, 0.4).k, 0.4);
    assert.equal(fitOf({ left: 0, top: 0, right: 100, bottom: 100 }, 1000, 1000, 0.4, 1.5).k, 1.5);
});

test("a long line is as big as fits across the box", () => {
    assert.equal(fitFontSize(10, 300, 1000, 10, 200), 50);
});

test("a short line is as big as fits down the box", () => {
    assert.equal(fitFontSize(1, 300, 60, 10, 200), 50);
});

test("the size stays between the smallest and biggest", () => {
    assert.equal(fitFontSize(1000, 300, 60, 12, 200), 12);
    assert.equal(fitFontSize(1, 3000, 3000, 12, 200), 200);
});

test("nothing to write is sized as one character", () => {
    assert.equal(fitFontSize(0, 60, 1000, 10, 200), 100);
});

test("a word stays on one line, never broken to make it bigger", () => {
    assert.deepEqual(fitText("Running", 340, 250, 12, 200), { fontSize: fitFontSize(7, 340, 250, 12, 200), wraps: false });
});

test("a sentence too long for one line wraps, bigger than it would be on one line", () => {
    const text = "The nightly export to the archive failed after four retries because the destination volume was full";
    const fitted = fitText(text, 600, 400, 12, 200);
    assert.equal(fitted.wraps, true);
    assert.ok(fitted.fontSize > fitFontSize(text.length, 600, 400, 12, 200));
    // Its longest word, 'destination', still fits across
    assert.ok(fitted.fontSize * 0.6 * "destination".length <= 600);
});

test("in a wide, low box a sentence stays on one line", () => {
    assert.equal(fitText("Disk nearly full", 2000, 40, 12, 200).wraps, false);
});

test("text too long for its room is shortened with an ellipsis", () => {
    assert.equal(shortened("alice", 5), "alice");
    assert.equal(shortened("alice", 4), "ali…");
    assert.equal(shortened("an admin", 4), "an…");
    assert.equal(shortened("alice", 1), "");
    assert.equal(shortened("", 0), "");
});
