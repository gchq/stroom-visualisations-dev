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
import { barLayout, bucketMillis, smallestStep } from "./bars.js";

test("time buckets are named or given in milliseconds", () => {
    assert.equal(bucketMillis("hour"), 3600000);
    assert.equal(bucketMillis("Week"), 604800000);
    assert.equal(bucketMillis("5000"), 5000);
    assert.equal(bucketMillis(""), null);
    assert.equal(bucketMillis(undefined), null);
    assert.equal(bucketMillis("fortnight"), null);
    assert.equal(bucketMillis("-1"), null);
});

test("the step is the smallest gap between distinct values", () => {
    assert.equal(smallestStep([10, 30, 20, 20, 25]), 5);
    assert.equal(smallestStep([10]), null);
    assert.equal(smallestStep([]), null);
    assert.equal(smallestStep(["a", "b"]), null);
});

test("bars of categories share each band, side by side", () => {
    const series = [
        { key: "a", label: "A", rows: [["x", 10], ["y", 5]] },
        { key: "b", label: "B", rows: [["x", 4]] }
    ];
    const xScale = scaleBand().domain(["x", "y"]).range([0, 200]);
    const subBand = scaleBand().domain(["a", "b"]).range([0, xScale.bandwidth()]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
    const bars = barLayout({ series, xType: "TEXT", xScale, yScale, step: null, subBand });

    assert.deepEqual(bars.get("a").map(bar => [bar.x, bar.width, bar.y, bar.height]), [[0, 50, 0, 100], [100, 50, 50, 50]]);
    assert.deepEqual(bars.get("b").map(bar => [bar.x, bar.width, bar.y, bar.height]), [[50, 50, 60, 40]]);
    assert.equal(bars.get("a")[0].id, "a~#~x");
    assert.equal(bars.get("b")[0].seriesLabel, "B");
});

test("without a step, a value is a tenth of the axis wide", () => {
    const xScale = scaleLinear().domain([0, 100]).range([0, 500]);
    const yScale = scaleLinear().domain([0, 10]).range([100, 0]);
    const [bar] = barLayout({ series: [{ key: "a", label: "A", rows: [[50, 5]] }], xType: "NUMBER",
        xScale, yScale, step: null, subBand: null }).get("a");

    // 90% of the 50 pixels, the rest either side of it
    assert.equal(bar.width, 45);
    assert.equal(bar.x, 252.5);
});

test("a negative value's bar hangs below zero", () => {
    const xScale = scaleBand().domain(["x"]).range([0, 100]);
    const subBand = scaleBand().domain(["a"]).range([0, 100]);
    const yScale = scaleLinear().domain([-10, 10]).range([100, 0]);
    const [bar] = barLayout({ series: [{ key: "a", label: "A", rows: [["x", -5]] }], xType: "TEXT",
        xScale, yScale, step: null, subBand }).get("a");
    assert.equal(bar.y, 50);
    assert.equal(bar.height, 25);
});

test("bars of times start at their time and share its bucket", () => {
    const series = [
        { key: "a", label: "A", rows: [[0, 1]] },
        { key: "b", label: "B", rows: [[0, 1]] }
    ];
    const xScale = scaleLinear().domain([0, 100]).range([0, 1000]);
    const yScale = scaleLinear().domain([0, 1]).range([10, 0]);
    const bars = barLayout({ series, xType: "DATE_TIME", xScale, yScale, step: 10, subBand: null });
    // A bucket is 100px, of which 90px are the two bars after a 5px gap
    assert.deepEqual([bars.get("a")[0].x, bars.get("a")[0].width], [5, 45]);
    assert.deepEqual([bars.get("b")[0].x, bars.get("b")[0].width], [50, 45]);
});
