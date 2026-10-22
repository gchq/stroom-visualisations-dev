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

// The colours of a visualisation's values (e.g. its series), which Stroom gives it from the
// dashboard's colour list (vis.js's stroom.colours), so that a value has the same colour in every
// visualisation of the dashboard, in the palette the user chose.
//
// Asking Stroom takes a moment, so a value is first coloured by a colour list of the visualisation's
// own, which gives colours exactly as Stroom's does (see colour.js) and so is almost always right.
// When Stroom answers with a different colour the visualisation is told to redraw. An older Stroom,
// which can't give colours, is never asked.

import { color } from "d3";
import { ColourList, DEFAULT_PALETTE, colourKey, hash, paletteColours } from "./colour.js";

// Whether a value is a colour the browser knows, e.g. 'red' or '#d62728' (a field may give one)
export function isColour(value) {
    return typeof value === "string" && value !== "" && typeof CSS !== "undefined" && CSS.supports("color", value);
}

// A colour a setting or a field gives (e.g. 'red', 'rgb(0, 128, 0)' or '#d62728') as '#rrggbb', which
// the colour maths (shading, and choosing black or white words) needs; grey if it isn't a colour
export function hexColour(value) {
    const parsed = color(value);
    return parsed === null ? "#808080" : parsed.formatHex();
}

// Whether this Stroom can give colours
export function hasHostColours() {
    return typeof stroom !== "undefined" && typeof stroom.colours === "function";
}

export class Colours {

    // `isDarkTheme()` says whether the dashboard has the dark theme, and `onChange()` is called
    // when Stroom's colours differ from those given, or the palette changes, so that the
    // visualisation can redraw
    constructor(isDarkTheme, onChange) {
        this.isDarkTheme = isDarkTheme;
        this.onChange = onChange;
        this.local = new ColourList();
        // Stroom's colours, by value key, for the theme they were given for
        this.fromHost = new Map();
        this.hostTheme = null;
        // Values asked for and not yet answered, by value key
        this.pending = new Set();
        if (typeof stroom !== "undefined" && typeof stroom.onColoursChanged === "function") {
            stroom.onColoursChanged(() => {
                this.fromHost.clear();
                this.pending.clear();
                this.onChange();
            });
        }
    }

    // The palette Stroom says colours come from, or the default
    palette() {
        const palette = typeof stroom !== "undefined" && typeof stroom.colourPalette === "function"
            ? stroom.colourPalette()
            : null;
        return palette || DEFAULT_PALETTE;
    }

    // The colour of each value of a field, as a function of the value, asking Stroom for those it
    // hasn't given yet
    of(field, values) {
        const dark = this.isDarkTheme();
        if (this.hostTheme !== dark) {
            // Stroom's colours were for the other theme
            this.fromHost.clear();
            this.pending.clear();
            this.hostTheme = dark;
        }
        const strings = values.map(value => value === null || value === undefined ? "" : String(value));
        const localColours = this.local.colours(field, strings, this.palette(), dark);
        const colours = new Map();
        const toAsk = [];
        strings.forEach((value, index) => {
            const key = colourKey(field, value);
            colours.set(value, this.fromHost.get(key) || localColours[index]);
            if (!this.fromHost.has(key) && !this.pending.has(key)) {
                toAsk.push(value);
                this.pending.add(key);
            }
        });
        if (toAsk.length > 0 && hasHostColours()) {
            stroom.colours(field, toAsk, answer => this.answered(field, toAsk, answer, colours));
        }
        return value => colours.get(value === null || value === undefined ? "" : String(value));
    }

    // The colour of any value of a field, as a function of the value, from the palette the user
    // chose for the theme, by a hash of the field and value (the same each time), without going in
    // the dashboard's colour list: for values too many, and too unlike other visualisations' values,
    // to share it (e.g. a word cloud's words), so that they don't crowd it
    unlisted(field) {
        const colours = paletteColours(this.palette(), this.isDarkTheme()).all;
        return value => colours[hash(colourKey(field, value)) % colours.length];
    }

    answered(field, values, answer, given) {
        if (!Array.isArray(answer)) {
            return;
        }
        let changed = false;
        values.forEach((value, index) => {
            const key = colourKey(field, value);
            this.pending.delete(key);
            if (typeof answer[index] === "string") {
                this.fromHost.set(key, answer[index]);
                if (given.get(value) !== answer[index]) {
                    changed = true;
                }
            }
        });
        if (changed) {
            this.onChange();
        }
    }
}
