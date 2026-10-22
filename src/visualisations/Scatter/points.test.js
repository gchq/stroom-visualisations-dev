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
import { scaleBand, scaleLinear } from "d3";
import { pointRadius, scatterPoints } from "./points.js";

const xScale = scaleLinear().domain([0, 10]).range([0, 100]);
const yScale = scaleLinear().domain([0, 10]).range([100, 0]);

test("points are in order along X, then Y, wherever they were in the data", () => {
    const points = scatterPoints([{ key: "a", label: "A", rows: [[5, 1], [2, 8], [5, 0]] }], "NUMBER",
        xScale, yScale).get("a");
    assert.deepEqual(points.map(point => point.row), [[2, 8], [5, 0], [5, 1]]);
    assert.deepEqual(points.map(point => [point.x, Math.round(point.y)]), [[20, 20], [50, 100], [50, 90]]);
    assert.equal(points[0].seriesLabel, "A");
});

test("two rows at the same place are both points, with ids of their own", () => {
    const points = scatterPoints([{ key: "a", label: "A", rows: [[1, 1], [1, 1], [1, 1]] }], "NUMBER",
        xScale, yScale).get("a");
    assert.deepEqual(points.map(point => point.id), ["a~#~1,1", "a~#~1,1~1", "a~#~1,1~2"]);
});

test("along a text axis a point is in the middle of its category, in the data's order", () => {
    const bands = scaleBand().domain(["x", "y"]).range([0, 200]);
    const points = scatterPoints([{ key: "", label: "", rows: [["y", 5], ["x", 10]] }], "TEXT",
        bands, yScale).get("");
    assert.deepEqual(points.map(point => [point.x, point.y]), [[150, 50], [50, 0]]);
});

test("a point's size is the settings' if it is a positive number, otherwise 4", () => {
    assert.equal(pointRadius("6"), 6);
    assert.equal(pointRadius("2.5"), 2.5);
    assert.equal(pointRadius(""), 4);
    assert.equal(pointRadius(undefined), 4);
    assert.equal(pointRadius("0"), 4);
    assert.equal(pointRadius("big"), 4);
});
