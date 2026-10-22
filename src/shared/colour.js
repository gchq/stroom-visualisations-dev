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

// The colours of categories (series, or values of a text field), and the arithmetic behind them.
//
// Stroom keeps a colour list for each dashboard and gives visualisations their values' colours
// from it (see colours.js), in the palette the user chose. This module does exactly what Stroom does
// (stroom.visualisation.shared.VisPalette, VisColourList and VisColourMaths), so that an older
// Stroom, which has no list, gives the same colours: the palettes, their shades, the hash that
// picks a value's preferred colour, and a colour list of its own.

// The backgrounds of Stroom's dashboards in each theme
export const LIGHT_BACKGROUND = "#ffffff";
export const DARK_BACKGROUND = "#1a1d22";

// The palettes, by the name the user's preferences give them, each with a version for each theme
// whose every colour has at least the 3:1 contrast against the theme's background that graphics
// need (WCAG 1.4.11)
export const PALETTES = {
    // Bright, saturated colours
    "Vivid": {
        light: ["#1f6fd6", "#c25400", "#0b8460", "#d0305f", "#7a52e0",
            "#8f6a00", "#0a7fa3", "#b0369a", "#4a7f12", "#d23b3b"],
        dark: ["#3d8bfd", "#ff8c42", "#20c997", "#f0507a", "#9b7bff",
            "#e9b434", "#38c6f4", "#e86bd1", "#8bd450", "#ff6b6b"]
    },
    // Colours that stay distinct for the common kinds of colour blindness: Paul Tol's on the
    // light theme and Okabe and Ito's on the dark
    "Colour-blind safe": {
        light: ["#0077bb", "#cc3311", "#117733", "#882255", "#332288", "#aa4499", "#888888"],
        dark: ["#56b4e9", "#e69f00", "#009e73", "#cc79a7", "#f0e442", "#d55e00", "#bbbbbb", "#7f8ef0"]
    }
};
export const DEFAULT_PALETTE = "Vivid";

// How far a shade is mixed towards white (positive) or black (negative), in the order shades are
// added once a palette's own colours have all been used
const SHADE_STEPS = [0.3, -0.3, 0.5, -0.5];
// How far apart (in RGB) a shade must be from every colour before it
const MIN_SHADE_DISTANCE = 32;

function channel(colour, index) {
    return parseInt(colour.substring(1 + index * 2, 3 + index * 2), 16);
}

// The relative luminance of a colour '#rrggbb', as WCAG defines it
export function luminance(colour) {
    const linear = [0, 1, 2].map(i => channel(colour, i) / 255)
        .map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

// The contrast ratio of two colours '#rrggbb', from 1 to 21
export function contrast(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Black or white, whichever reads better on a background colour '#rrggbb'
export function textColourOn(background) {
    return contrast(background, "#000000") >= contrast(background, "#ffffff") ? "#000000" : "#ffffff";
}

// A colour mixed towards another (e.g. white, to lighten it) by an amount from 0 to 1
export function mix(colour, towards, amount) {
    let result = "#";
    for (let i = 0; i < 3; i++) {
        const from = channel(colour, i);
        const value = Math.round(from + (channel(towards, i) - from) * amount);
        result += Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
    }
    return result;
}

// How far apart two colours are in RGB
export function distance(a, b) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
        const d = channel(a, i) - channel(b, i);
        sum += d * d;
    }
    return Math.sqrt(sum);
}

// A 32-bit FNV-1a hash of a string's UTF-16 code units, multiplying by the FNV prime with shifts
// and adds so that it is exact (as VisColourMaths.hash is in Java)
export function hash(text) {
    let h = 0x811c9dc5 | 0;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) | 0;
    }
    return h >>> 0;
}

// A palette's colours, followed by the shades of them that still have 3:1 contrast against the
// background and are distinct from every colour before them
export function withShades(base, background) {
    const colours = [...base];
    for (const step of SHADE_STEPS) {
        for (const colour of base) {
            const shade = step > 0 ? mix(colour, "#ffffff", step) : mix(colour, "#000000", -step);
            if (contrast(shade, background) >= 3 && colours.every(other => distance(shade, other) >= MIN_SHADE_DISTANCE)) {
                colours.push(shade);
            }
        }
    }
    return colours;
}

// A palette's colours for a theme: its own, then its shades. A name that isn't a palette's gives
// the default's
export function paletteColours(name, darkTheme) {
    const palette = PALETTES[name] || PALETTES[DEFAULT_PALETTE];
    const base = darkTheme ? palette.dark : palette.light;
    return { base, all: withShades(base, darkTheme ? DARK_BACKGROUND : LIGHT_BACKGROUND) };
}

// The key a colour list knows a field's value by
export function colourKey(field, value) {
    return (field === null || field === undefined ? "" : String(field)) + "\u0000"
           + (value === null || value === undefined ? "" : String(value));
}

// A list of values' colours, as Stroom keeps for a dashboard (VisColourList): a value gets its
// preferred colour (from a hash of its field and value) if no other value has it, else the next
// colour no value has, the palette's own first; once every colour is taken, its preferred one
export class ColourList {

    constructor() {
        this.positions = new Map();
        this.used = new Set();
    }

    // The colours of some values of a field, in the order given
    colours(field, values, paletteName, darkTheme) {
        const { base, all } = paletteColours(paletteName, darkTheme);
        return values.map(value => all[this.position(colourKey(field, value), base.length, all.length) % all.length]);
    }

    position(key, baseSize, size) {
        if (this.positions.has(key)) {
            return this.positions.get(key);
        }
        const preferred = hash(key) % baseSize;
        let position = preferred;
        if (this.used.has(position)) {
            position = -1;
            for (let i = 0; i < size; i++) {
                if (!this.used.has(i)) {
                    position = i;
                    break;
                }
            }
            if (position < 0) {
                position = preferred;
            }
        }
        this.positions.set(key, position);
        this.used.add(position);
        return position;
    }
}
