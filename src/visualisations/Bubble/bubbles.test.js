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
import { packBubbles } from "./bubbles.js";

const SERIES = [
    { key: "web-01", label: "web-01", rows: [["200 OK", 400], ["404", 100]] },
    { key: "db-01", label: "db-01", rows: [["200 OK", 900]] }
];

// Whether two circles overlap
const overlap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r - 0.01;

test("a bubble's area is its value, and bubbles don't overlap", () => {
    const { bubbles, groups } = packBubbles(SERIES, true, 300, 300);
    assert.equal(bubbles.length, 3);
    assert.deepEqual(groups, []);
    const [small, big] = [bubbles.find(b => b.row[1] === 100), bubbles.find(b => b.row[1] === 400)];
    assert.ok(Math.abs((big.r * big.r) / (small.r * small.r) - 4) < 0.01);
    for (let i = 0; i < bubbles.length; i++) {
        for (let j = i + 1; j < bubbles.length; j++) {
            assert.ok(!overlap(bubbles[i], bubbles[j]));
        }
    }
});

test("bubbles are in the series' order, each series' in the order of its rows", () => {
    const { bubbles } = packBubbles(SERIES, true, 300, 300);
    assert.deepEqual(bubbles.map(b => b.id), ["web-01~#~200 OK", "web-01~#~404", "db-01~#~200 OK"]);
    assert.equal(bubbles[0].seriesLabel, "web-01");
});

test("not flattened, each series' bubbles are inside a bubble of its own", () => {
    const { bubbles, groups } = packBubbles(SERIES, false, 300, 300);
    assert.deepEqual(groups.map(g => g.key).sort(), ["db-01", "web-01"]);
    for (const bubble of bubbles) {
        const group = groups.find(g => g.key === bubble.seriesKey);
        assert.ok(Math.hypot(bubble.x - group.x, bubble.y - group.y) + bubble.r <= group.r + 0.01);
    }
});

test("a series without a key (no Series field) is still a series, not a bubble", () => {
    const { bubbles, groups } = packBubbles([{ key: "", label: "", rows: [["a", 1], ["b", 2]] }], false, 100, 100);
    assert.equal(bubbles.length, 2);
    assert.deepEqual(groups.map(g => g.key), [""]);
});

test("only values above zero are bubbles", () => {
    const { bubbles } = packBubbles([{ key: "", label: "", rows: [["a", 0], ["b", -5], ["c", null], ["d", 3]] }],
        true, 100, 100);
    assert.deepEqual(bubbles.map(b => b.row[0]), ["d"]);
});

test("two rows of a series with the same name are both bubbles, with ids of their own", () => {
    const { bubbles } = packBubbles([{ key: "s", label: "S", rows: [["a", 1], ["a", 1]] }], true, 100, 100);
    assert.deepEqual(bubbles.map(b => b.id), ["s~#~a", "s~#~a~1"]);
});

test("nothing to pack", () => {
    assert.deepEqual(packBubbles([], true, 100, 100), { bubbles: [], groups: [] });
    assert.deepEqual(packBubbles(SERIES, true, 0, 100), { bubbles: [], groups: [] });
});
