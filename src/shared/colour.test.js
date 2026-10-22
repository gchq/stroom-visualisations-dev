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
import {
    ColourList,
    DARK_BACKGROUND,
    LIGHT_BACKGROUND,
    PALETTES,
    contrast,
    hash,
    mix,
    paletteColours,
    textColourOn
} from "./colour.js";

// The same vectors are checked by Stroom's TestVisColourList, so that the two give the same colours
test("the hash is FNV-1a, as Stroom computes it", () => {
    assert.equal(hash(""), 2166136261);
    assert.equal(hash("a"), 3826002220);
    assert.equal(hash("Host\u0000web-01"), 1867768847);
    assert.equal(hash("Status\u0000200 OK"), 1270965377);
    assert.equal(hash("Ünïcödé"), 4191047478);
});

test("a colour list gives each value its preferred colour if free, else the next free one", () => {
    const list = new ColourList();
    assert.deepEqual(list.colours("Host", ["web-01", "web-02", "db-01"], "Vivid", true),
        ["#e86bd1", "#38c6f4", "#ff8c42"]);
    assert.deepEqual(list.colours("Status", ["200 OK", "301 Moved", "404 Not Found", "500 Error"], "Vivid", true),
        ["#3d8bfd", "#20c997", "#f0507a", "#9b7bff"]);
    // A value keeps its colour, and a new one takes a free colour
    assert.deepEqual(list.colours("Host", ["db-01", "web-03"], "Vivid", true), ["#ff8c42", "#e9b434"]);
});

test("a value keeps its place in the palette when the palette or theme changes", () => {
    const list = new ColourList();
    const [vivid] = list.colours("Host", ["web-01"], "Vivid", true);
    const [light] = list.colours("Host", ["web-01"], "Vivid", false);
    assert.equal(PALETTES.Vivid.dark.indexOf(vivid), PALETTES.Vivid.light.indexOf(light));
});

test("every colour of every palette, and every shade, has 3:1 contrast against its theme", () => {
    for (const name of Object.keys(PALETTES)) {
        for (const dark of [false, true]) {
            for (const colour of paletteColours(name, dark).all) {
                const background = dark ? DARK_BACKGROUND : LIGHT_BACKGROUND;
                assert.ok(contrast(colour, background) >= 3, name + " " + colour + (dark ? " dark" : " light"));
            }
        }
    }
});

// Simulates how someone with a kind of colour blindness sees colours (Machado, Oliveira and
// Fernandes 2009, severity 1) and measures the smallest CIE76 difference (in Lab) between two of them
const SIMULATIONS = {
    normal: null,
    protanopia: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
    deuteranopia: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]],
    tritanopia: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]
};

function smallestDifference(colours, matrix) {
    const labs = colours.map(colour => {
        let linear = [0, 2, 4].map(i => parseInt(colour.substring(1 + i, 3 + i), 16) / 255)
            .map(c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
        if (matrix) {
            linear = matrix.map(row => Math.min(1, Math.max(0, row[0] * linear[0] + row[1] * linear[1] + row[2] * linear[2])));
        }
        const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
        const x = f((0.4124 * linear[0] + 0.3576 * linear[1] + 0.1805 * linear[2]) / 0.95047);
        const y = f(0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]);
        const z = f((0.0193 * linear[0] + 0.1192 * linear[1] + 0.9505 * linear[2]) / 1.08883);
        return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    });
    let smallest = Infinity;
    for (let i = 0; i < labs.length; i++) {
        for (let j = i + 1; j < labs.length; j++) {
            smallest = Math.min(smallest, Math.hypot(...labs[i].map((v, k) => v - labs[j][k])));
        }
    }
    return smallest;
}

test("the colour-blind safe palette's colours stay distinct for the common kinds of colour blindness", () => {
    for (const dark of [false, true]) {
        const colours = dark ? PALETTES["Colour-blind safe"].dark : PALETTES["Colour-blind safe"].light;
        for (const [name, matrix] of Object.entries(SIMULATIONS)) {
            assert.ok(smallestDifference(colours, matrix) >= 10, name + (dark ? " dark" : " light"));
        }
    }
    // Which the vivid palette's don't: two of its colours look almost the same with protanopia
    assert.ok(smallestDifference(PALETTES.Vivid.dark, SIMULATIONS.protanopia) < 5);
});

test("shades extend each palette before any colour repeats", () => {
    assert.equal(paletteColours("Vivid", false).all.length, 27);
    assert.equal(paletteColours("Vivid", true).all.length, 32);
    assert.equal(paletteColours("Colour-blind safe", false).all.length, 22);
    assert.equal(paletteColours("Colour-blind safe", true).all.length, 26);
    // A name that isn't a palette's gives the default
    assert.deepEqual(paletteColours("Nope", true), paletteColours("Vivid", true));
});

test("mixing towards white or black", () => {
    assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
    assert.equal(mix("#3d8bfd", "#000000", 0), "#3d8bfd");
});

test("contrast follows WCAG", () => {
    assert.equal(contrast("#000000", "#ffffff"), 21);
    assert.equal(contrast("#777777", "#777777"), 1);
});

test("text on a colour is whichever of black and white reads better", () => {
    assert.equal(textColourOn("#ffff00"), "#000000");
    assert.equal(textColourOn("#000080"), "#ffffff");
});
