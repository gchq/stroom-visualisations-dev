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
import { afterEach, test } from "node:test";
import { paletteColours } from "./colour.js";
import { Colours, hexColour } from "./colours.js";

test("a colour given by name or in any CSS form is '#rrggbb', and a value that isn't one is grey", () => {
    assert.equal(hexColour("red"), "#ff0000");
    assert.equal(hexColour("rgb(0, 128, 0)"), "#008000");
    assert.equal(hexColour("#D62728"), "#d62728");
    assert.equal(hexColour("#abc"), "#aabbcc");
    assert.equal(hexColour("not a colour"), "#808080");
});

// A stand-in for vis.js's stroom, which answers colour requests when told to
function fakeStroom(palette = "Vivid") {
    const fake = {
        asked: [],
        changedHandler: null,
        colours(field, values, callback) {
            fake.asked.push({ field, values, callback });
        },
        colourPalette: () => palette,
        onColoursChanged(handler) {
            fake.changedHandler = handler;
        }
    };
    globalThis.stroom = fake;
    return fake;
}

afterEach(() => {
    delete globalThis.stroom;
});

test("unlisted colours come from the user's palette by a hash, the same each time, without asking Stroom", () => {
    const fake = fakeStroom("Colour-blind safe");
    const colours = new Colours(() => false, () => assert.fail("nothing should change"));
    const colourOf = colours.unlisted("Message");
    const palette = paletteColours("Colour-blind safe", false).all;
    for (const word of ["disk", "error", "user", "login"]) {
        assert.ok(palette.includes(colourOf(word)), word);
        assert.equal(colourOf(word), colours.unlisted("Message")(word));
    }
    assert.equal(fake.asked.length, 0);
    // Another theme, another palette's colours
    const dark = new Colours(() => true, () => {}).unlisted("Message")("disk");
    assert.ok(paletteColours("Colour-blind safe", true).all.includes(dark));
});

test("without Stroom's colours, values are coloured as Stroom's list would", () => {
    const colours = new Colours(() => true, () => assert.fail("nothing should change"));
    const colourOf = colours.of("Host", ["web-01", "web-02", "db-01"]);
    assert.deepEqual(["web-01", "web-02", "db-01"].map(colourOf), ["#e86bd1", "#38c6f4", "#ff8c42"]);
});

test("Stroom is asked once for each value, and its colours are used once given", () => {
    const fake = fakeStroom();
    let changes = 0;
    const colours = new Colours(() => true, () => changes++);
    colours.of("Host", ["web-01", "web-02"]);
    colours.of("Host", ["web-01", "web-02"]);
    assert.equal(fake.asked.length, 1);
    assert.deepEqual(fake.asked[0].values, ["web-01", "web-02"]);

    // Another visualisation of the dashboard gave web-02 its preferred colour first
    fake.asked[0].callback(["#e86bd1", "#ff8c42"]);
    assert.equal(changes, 1);
    assert.equal(colours.of("Host", ["web-02"])("web-02"), "#ff8c42");
    assert.equal(fake.asked.length, 1);
});

test("an answer that matches what was given doesn't redraw", () => {
    const fake = fakeStroom();
    let changes = 0;
    const colours = new Colours(() => true, () => changes++);
    const colourOf = colours.of("Host", ["web-01"]);
    fake.asked[0].callback([colourOf("web-01")]);
    assert.equal(changes, 0);
});

test("a change of palette or theme asks again", () => {
    const fake = fakeStroom("Colour-blind safe");
    let dark = true;
    let changes = 0;
    const colours = new Colours(() => dark, () => changes++);
    // The local colours are from the palette Stroom says
    assert.equal(colours.of("Host", ["web-01"])("web-01"), "#7f8ef0");
    fake.asked[0].callback(["#7f8ef0"]);

    fake.changedHandler();
    assert.equal(changes, 1);
    colours.of("Host", ["web-01"]);
    assert.equal(fake.asked.length, 2);

    dark = false;
    colours.of("Host", ["web-01"]);
    assert.equal(fake.asked.length, 3);
});
