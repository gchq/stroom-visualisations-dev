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
import { DARK_BACKGROUND, LIGHT_BACKGROUND, contrast, textColourOn } from "./colour.js";
import {
    AMBER, GREEN, OUTSIDE, RED, STATUS_COLOURS, rangeWords, statusBandsOf, statusLegendItems, statusOf, statusWords
} from "./status.js";

// The settings' defaults: green low, red high
const DEFAULTS = { GreenLo: "0", GreenHi: "1999", AmberLo: "2000", AmberHi: "4999", RedLo: "5000", RedHi: "10000" };

test("the bands are the settings', lowest first, covering the lowest to the highest", () => {
    const bands = statusBandsOf(DEFAULTS);
    assert.deepEqual(bands.bands.map(band => [band.status, band.lo, band.hi]),
        [[GREEN, 0, 1999], [AMBER, 2000, 4999], [RED, 5000, 10000]]);
    assert.equal(bands.min, 0);
    assert.equal(bands.max, 10000);
});

test("both ends of a band are in it (1,999 is green, not outside)", () => {
    const bands = statusBandsOf(DEFAULTS);
    assert.equal(statusOf(0, bands), GREEN);
    assert.equal(statusOf(1999, bands), GREEN);
    assert.equal(statusOf(2000, bands), AMBER);
    assert.equal(statusOf(10000, bands), RED);
});

test("a value between bands, or beyond them, is outside them, and says where", () => {
    const bands = statusBandsOf(DEFAULTS);
    assert.equal(statusOf(1999.5, bands), OUTSIDE);
    assert.equal(statusOf(-1, bands), OUTSIDE);
    assert.equal(statusOf(10001, bands), OUTSIDE);
    assert.equal(statusWords(1999.5, bands), "Between bands");
    assert.equal(statusWords(-1, bands), "Below the bands");
    assert.equal(statusWords(10001, bands, "dial"), "Above the dial");
    assert.equal(statusWords(3000, bands), AMBER);
});

test("green can be at the top, compared as numbers (900 is less than 1,000)", () => {
    const bands = statusBandsOf({ RedLo: "0", RedHi: "900", AmberLo: "901", AmberHi: "999", GreenLo: "1000", GreenHi: "5000" });
    assert.deepEqual(bands.bands.map(band => band.status), [RED, AMBER, GREEN]);
    assert.equal(statusOf(950, bands), AMBER);
    assert.equal(statusOf(1000, bands), GREEN);
});

test("a band given high to low is the same band, and one without numbers is left out", () => {
    const bands = statusBandsOf({ GreenLo: "10", GreenHi: "0", AmberLo: "", AmberHi: "x", RedLo: "11", RedHi: "20" });
    assert.deepEqual(bands.bands.map(band => [band.status, band.lo, band.hi]), [[GREEN, 0, 10], [RED, 11, 20]]);
    assert.equal(statusBandsOf({}), null);
});

test("a band's range in words, none outside the bands", () => {
    const bands = statusBandsOf(DEFAULTS);
    assert.equal(rangeWords(AMBER, bands), "2,000 to 4,999");
    assert.equal(rangeWords(OUTSIDE, bands), null);
});

test("the legend has each band, highest first, then outside them; nothing without bands", () => {
    const colours = STATUS_COLOURS.light;
    assert.deepEqual(statusLegendItems(statusBandsOf(DEFAULTS), colours).map(item => item.label),
        ["Red (5,000 to 10,000)", "Amber (2,000 to 4,999)", "Green (0 to 1,999)", OUTSIDE]);
    assert.equal(statusLegendItems(statusBandsOf(DEFAULTS), colours)[0].colour, colours[RED]);
    assert.deepEqual(statusLegendItems(null, colours), []);
});

test("each status's colour stands out from its theme's background (3:1)", () => {
    for (const [theme, background] of [["light", LIGHT_BACKGROUND], ["dark", DARK_BACKGROUND]]) {
        for (const [status, colour] of Object.entries(STATUS_COLOURS[theme])) {
            assert.ok(contrast(colour, background) >= 3, theme + " " + status + " " + contrast(colour, background));
        }
    }
});

test("words written on each status's colour can be read (4.5:1)", () => {
    for (const theme of ["light", "dark"]) {
        for (const [status, colour] of Object.entries(STATUS_COLOURS[theme])) {
            assert.ok(contrast(textColourOn(colour), colour) >= 4.5, theme + " " + status);
        }
    }
});
