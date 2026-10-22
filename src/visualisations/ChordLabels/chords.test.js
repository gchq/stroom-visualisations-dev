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
import { chordLayout, flowCount, flowsOf, largestFlow, nameTotals, padAngleOf } from "./chords.js";

const ROWS = [["alice", "bob", 12], ["alice", "carol", 5], ["bob", "alice", 3]];

test("each name once, in the order first seen, with the counts from each to each", () => {
    const { names, matrix, total } = flowsOf(ROWS);
    assert.deepEqual(names, ["alice", "bob", "carol"]);
    assert.deepEqual(matrix, [[0, 12, 5], [3, 0, 0], [0, 0, 0]]);
    assert.equal(total, 20);
});

test("rows from and to the same names are added up, not the last one kept", () => {
    const { matrix, total } = flowsOf([["a", "b", 2], ["a", "b", "3"]]);
    assert.deepEqual(matrix, [[0, 5], [0, 0]]);
    assert.equal(total, 5);
});

test("rows without a name or a count above zero are left out, and so are names only they have", () => {
    const { names, matrix } = flowsOf([["a", "b", 1], [null, "c", 4], ["d", "", 4], ["e", "f", 0],
        ["g", "h", -2], ["i", "j", "lots"], ["k", "l", null], "not a row"]);
    assert.deepEqual(names, ["a", "b"]);
    assert.deepEqual(matrix, [[0, 1], [0, 0]]);
});

test("a name can be a number, and is the same name as its text", () => {
    const { names, matrix } = flowsOf([[1, "1", 2], ["1", 2, 3]]);
    assert.deepEqual(names, [1, 2]);
    assert.deepEqual(matrix, [[2, 3], [0, 0]]);
});

test("nothing to draw", () => {
    assert.deepEqual(flowsOf([]), { names: [], matrix: [], total: 0 });
    assert.equal(largestFlow([]), null);
    assert.equal(flowCount([]), 0);
});

test("the gaps are the padding in hundredths of a radian, but never more than half the ring", () => {
    assert.equal(padAngleOf("3", 5), 0.03);
    assert.equal(padAngleOf(10, 200), Math.PI / 200);
    assert.equal(padAngleOf("3", 1), 0);
    assert.equal(padAngleOf("", 4), 0);
    assert.equal(padAngleOf("x", 4), 0.03);
    assert.equal(padAngleOf(-4, 4), 0);
});

test("the biggest name and the widest ribbon come first, a ribbon for each way", () => {
    const { matrix } = flowsOf(ROWS);
    const { groups, ribbons } = chordLayout(matrix, 0);
    assert.equal(groups.length, 3);
    const first = groups.reduce((best, group) => group.startAngle < best.startAngle ? group : best);
    assert.equal(first.index, 0);
    assert.equal(first.startAngle, 0);
    assert.deepEqual(ribbons.map(ribbon => ribbon.id), ["0-1", "0-2", "1-0"]);
    assert.deepEqual(ribbons.map(ribbon => ribbon.value), [12, 5, 3]);
    const aliceBob = ribbons[0];
    assert.equal(aliceBob.source.index, 0);
    assert.equal(aliceBob.target.index, 1);
    assert.equal(aliceBob.target.value, 12);
});

test("a name that is only ever a target has an arc as long as its counts in", () => {
    const { matrix } = flowsOf(ROWS);
    const { groups } = chordLayout(matrix, 0);
    const carol = groups.find(group => group.index === 2);
    const alice = groups.find(group => group.index === 0);
    assert.equal(carol.value, 5);
    assert.equal(alice.value, 20);
    assert.ok(carol.endAngle - carol.startAngle > 0);
});

test("a name's counts to itself are a ribbon from it to it", () => {
    const { matrix } = flowsOf([["a", "a", 4], ["a", "b", 1]]);
    const { ribbons } = chordLayout(matrix, 0);
    assert.deepEqual(ribbons.map(ribbon => ribbon.id), ["0-0", "0-1"]);
    assert.deepEqual(nameTotals(0, matrix), { out: 5, in: 4 });
});

test("a name's totals out and in, the largest flow and how many flows there are", () => {
    const { matrix } = flowsOf(ROWS);
    assert.deepEqual(nameTotals(0, matrix), { out: 17, in: 3 });
    assert.deepEqual(nameTotals(2, matrix), { out: 0, in: 5 });
    assert.deepEqual(largestFlow(matrix), [0, 1, 12]);
    assert.equal(flowCount(matrix), 3);
});
