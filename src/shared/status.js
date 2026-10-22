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

// The red, amber and green statuses the visualisations of a single value share (Gauge, RAGStatus
// and TrafficLights), their colours, which mean what they say whatever the dashboard's colours, and
// the bands of values the settings give each

import { isNumber } from "./data.js";
import { formatNumber } from "./format.js";

export const GREEN = "Green";
export const AMBER = "Amber";
export const RED = "Red";
// A value in none of the statuses' bands: beyond them, or between two
export const OUTSIDE = "Outside the bands";

// The statuses' colours on each theme: each at least 3:1 against the theme's background, as a
// graphic must be (WCAG 1.4.11). A status is never told by its colour alone
export const STATUS_COLOURS = {
    light: { [GREEN]: "#2e7d32", [AMBER]: "#b45f06", [RED]: "#c62828", [OUTSIDE]: "#6b6b6b" },
    dark: { [GREEN]: "#66bb6a", [AMBER]: "#ffb300", [RED]: "#ef5350", [OUTSIDE]: "#9e9e9e" }
};

// The settings' bands (GreenLo to GreenHi and so on, given as text), lowest first, each
// {status, lo, hi}, and the {min, max} they cover: from the lowest band's bottom to the highest's
// top. Green can be at the bottom (more is worse) or the top (more is better). A band whose ends
// aren't numbers is left out; null if none is left.
export function statusBandsOf(settings) {
    const band = (status, lo, hi) => ({ status, lo: Number.parseFloat(lo), hi: Number.parseFloat(hi) });
    const bands = [
        band(GREEN, settings.GreenLo, settings.GreenHi),
        band(AMBER, settings.AmberLo, settings.AmberHi),
        band(RED, settings.RedLo, settings.RedHi)
    ]
        .filter(one => isNumber(one.lo) && isNumber(one.hi))
        .map(one => one.lo <= one.hi ? one : { status: one.status, lo: one.hi, hi: one.lo })
        .sort((a, b) => a.lo - b.lo);
    if (bands.length === 0) {
        return null;
    }
    const min = Math.min(...bands.map(one => one.lo));
    const max = Math.max(...bands.map(one => one.hi));
    return { bands, min, max: max > min ? max : min + 1 };
}

// The status of a value: that of the band it is in (both ends of a band are in it), or OUTSIDE
export function statusOf(value, bands) {
    const band = bands.bands.find(one => value >= one.lo && value <= one.hi);
    return band ? band.status : OUTSIDE;
}

// The band of a status, or undefined
export function bandOf(status, bands) {
    return bands.bands.find(one => one.status === status);
}

// A value's status in words: its band's, or where it is outside the bands, e.g. 'Above the
// bands'. `beyond` names what the bands make, e.g. 'dial'
export function statusWords(value, bands, beyond = "bands") {
    const status = statusOf(value, bands);
    if (status !== OUTSIDE) {
        return status;
    }
    if (value > bands.max) {
        return "Above the " + beyond;
    }
    if (value < bands.min) {
        return "Below the " + beyond;
    }
    return "Between bands";
}

// The range of a status's band in words, e.g. '2,000 to 4,999', or null if it has none
export function rangeWords(status, bands) {
    const band = bandOf(status, bands);
    return band ? formatNumber(band.lo) + " to " + formatNumber(band.hi) : null;
}

// The legend's items for some bands: each band's status, highest first, and outside them, each
// labelled with its range, e.g. 'Amber (2,000 to 4,999)'; none without bands
export function statusLegendItems(bands, colours) {
    if (bands === null) {
        return [];
    }
    return [...bands.bands.map(band => band.status).reverse(), OUTSIDE].map(status => {
        const range = rangeWords(status, bands);
        return { key: status, label: range === null ? status : status + " (" + range + ")", colour: colours[status] };
    });
}
