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
import { curveBasisOpen, curveLinear, curveMonotoneX, curveStepAfter, scaleBand, scaleLinear } from "d3";
import { lineCurve, lineDash, linePoints, orderedRows } from "./lines.js";

test("the settings' interpolation modes are d3 7's curves", () => {
    assert.equal(lineCurve("basis-open"), curveBasisOpen);
    assert.equal(lineCurve("step-after"), curveStepAfter);
    assert.equal(lineCurve("monotone"), curveMonotoneX);
    // The blank choice is straight lines, as it was
    assert.equal(lineCurve(""), curveLinear);
});

test("without a mode, or with one d3 doesn't have, lines are monotone", () => {
    assert.equal(lineCurve(undefined), curveMonotoneX);
    assert.equal(lineCurve(null), curveMonotoneX);
    assert.equal(lineCurve("wiggly"), curveMonotoneX);
});

test("along a number or time axis a line goes in order of X, along a text axis in the data's order", () => {
    const rows = [[30, 1], [10, 2], [20, 3]];
    assert.deepEqual(orderedRows(rows, "NUMBER"), [[10, 2], [20, 3], [30, 1]]);
    assert.deepEqual(orderedRows(rows, "DATE_TIME"), [[10, 2], [20, 3], [30, 1]]);
    assert.deepEqual(orderedRows([["b", 1], ["a", 2]], "TEXT"), [["b", 1], ["a", 2]]);
    // Not changed in place
    assert.deepEqual(rows, [[30, 1], [10, 2], [20, 3]]);
});

test("a point is where its row is, but only a row with a Y value has one", () => {
    const series = [{ key: "a", label: "A", rows: [[0, 10], [5, null], [10, 0]] }];
    const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
    const yScale = scaleLinear().domain([0, 10]).range([50, 0]);
    const points = linePoints(series, "NUMBER", xScale, yScale).get("a");
    assert.deepEqual(points.map(point => [point.x, point.y]), [[0, 0], [100, 50]]);
    assert.equal(points[0].id, "a~#~0");
    assert.equal(points[0].seriesLabel, "A");
});

test("a point without a line to either side of it is lone", () => {
    const series = [{ key: "a", label: "A", rows: [[0, 1], [1, 2], [2, null], [3, 4], [4, null], [5, 6], [6, 7]] }];
    const xScale = scaleLinear().domain([0, 6]).range([0, 60]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
    const points = linePoints(series, "NUMBER", xScale, yScale).get("a");
    assert.deepEqual(points.map(point => [point.row[0], point.lone]),
        [[0, false], [1, false], [3, true], [5, false], [6, false]]);
    const [only] = linePoints([{ key: "b", label: "B", rows: [[0, 1]] }], "NUMBER", xScale, yScale).get("b");
    assert.equal(only.lone, true);
});

test("along a text axis a point is in the middle of its category's band", () => {
    const xScale = scaleBand().domain(["x", "y"]).range([0, 200]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
    const [first, second] = linePoints([{ key: "", label: "", rows: [["x", 5], ["y", 10]] }], "TEXT",
        xScale, yScale).get("");
    assert.deepEqual([first.x, first.y, second.x, second.y], [50, 50, 150, 0]);
});

test("each line in turn has dashes of its own, the first solid, so lines aren't told apart by colour alone", () => {
    assert.equal(lineDash(0), "");
    const dashes = [1, 2, 3, 4, 5].map(lineDash);
    assert.equal(new Set(["", ...dashes]).size, 6);
    // Round again after the last
    assert.equal(lineDash(6), lineDash(0));
    assert.equal(lineDash(7), lineDash(1));
    assert.equal(lineDash(-1), "");
});
