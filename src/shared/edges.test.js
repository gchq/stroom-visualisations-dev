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
import { DARK_BACKGROUND, LIGHT_BACKGROUND, contrast } from "./colour.js";
import { SHAPE_CONTRAST, edgeColour, readableColour } from "./edges.js";

test("a colour is darkened on light, or lightened on dark, until it reads", () => {
    const yellow = "#e6c229";
    assert.ok(contrast(yellow, LIGHT_BACKGROUND) < 4.5);
    assert.ok(contrast(readableColour(yellow, LIGHT_BACKGROUND, 4.5), LIGHT_BACKGROUND) >= 4.5);
    const navy = "#1f3a93";
    assert.ok(contrast(readableColour(navy, DARK_BACKGROUND, 4.5), DARK_BACKGROUND) >= 4.5);
    // A colour that already reads is kept
    assert.equal(readableColour("#000000", LIGHT_BACKGROUND, 4.5), "#000000");
});

test("a pale shape gets an edge of a deeper shade of its colour that shows against the background", () => {
    const paleYellow = "#ffffcc";
    const edge = edgeColour(paleYellow, LIGHT_BACKGROUND);
    assert.ok(contrast(edge, LIGHT_BACKGROUND) >= SHAPE_CONTRAST);
    // Still a yellow: more red and green than blue
    const [r, g, b] = [1, 3, 5].map(index => parseInt(edge.substring(index, index + 2), 16));
    assert.ok(r > b && g > b, edge);
    // On the dark background, a dark shape is edged in a lighter shade
    assert.ok(contrast(edgeColour("#2a2d33", DARK_BACKGROUND), DARK_BACKGROUND) >= SHAPE_CONTRAST);
});

test("a shape that shows by itself has no edge", () => {
    assert.equal(edgeColour("#1f78b4", LIGHT_BACKGROUND), null);
    assert.equal(edgeColour("#ffd54f", DARK_BACKGROUND), null);
    assert.equal(edgeColour(null, LIGHT_BACKGROUND), null);
});
