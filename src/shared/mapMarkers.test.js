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
import { SHAPES, shapesFor, timeColour, timeExtent, timeShare } from "./mapMarkers.js";

test("an icon value named after a shape has that shape, whatever its case", () => {
    const shapes = shapesFor(["Square", "star", "TRIANGLE"]);
    assert.equal(shapes.get("Square"), "square");
    assert.equal(shapes.get("star"), "star");
    assert.equal(shapes.get("TRIANGLE"), "triangle");
});

test("other icon values have the shapes not named, in the order first seen, never a circle", () => {
    const shapes = shapesFor(["truck", "square", "car", "truck", null, ""]);
    assert.equal(shapes.get("square"), "square");
    assert.equal(shapes.get("truck"), "triangle");
    assert.equal(shapes.get("car"), "diamond");
    assert.equal(shapes.size, 3);
});

test("with more icon values than shapes, the shapes go round again", () => {
    const icons = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const shapes = shapesFor(icons);
    assert.equal(shapes.get("a"), SHAPES[1]);
    assert.equal(shapes.get("g"), SHAPES[1]);
    assert.ok([...shapes.values()].every(shape => shape !== "circle"));
});

test("the time range of some markers, leaving out those without a time", () => {
    assert.deepEqual(timeExtent([{ time: 30 }, { time: null }, { time: 10 }, { time: NaN }]), { min: 10, max: 30 });
    assert.equal(timeExtent([{ time: null }, {}]), null);
    assert.equal(timeExtent([]), null);
});

test("a time's share of the way from the earliest to the latest", () => {
    assert.equal(timeShare(20, { min: 10, max: 30 }), 0.5);
    assert.equal(timeShare(5, { min: 10, max: 30 }), 0);
    assert.equal(timeShare(10, { min: 10, max: 10 }), 1);
});

test("the earliest is dark and the latest light, and they differ", () => {
    assert.notEqual(timeColour(0), timeColour(1));
    assert.equal(timeColour(0), "#440154");
});
