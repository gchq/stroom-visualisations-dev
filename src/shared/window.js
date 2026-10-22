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

// A window onto a number or time axis: the span of it a chart shows, [start, end], e.g. a time
// series window chosen on its overview, or a zoomed axis (axisZoom.js), within the extent of the
// data (by dragging, or from the keyboard)

import { isNumber } from "./data.js";

// The narrowest a window can be, as a share of the extent, so that it can't shrink to nothing
const MIN_SHARE = 0.002;
// How far the arrow keys move a window (a share of its width), and Page Up and Page Down
const PAN_SHARE = 0.1;
const PAGE_SHARE = 1;
// How much Up and Down (or + and -) zoom a window in and out
const ZOOM_FACTOR = 2;

// A window moved and cut to fit within an extent, keeping its width where it can; the whole
// extent if there is no window or it is no narrower than the extent
export function clampWindow(window, extent) {
    const [min, max] = extent;
    if (!window || max <= min) {
        return [min, max];
    }
    const span = max - min;
    const width = Math.max(span * MIN_SHARE, Math.min(span, Math.abs(window[1] - window[0])));
    let start = Math.min(window[0], window[1]);
    start = Math.max(min, Math.min(max - width, start));
    return [start, start + width];
}

// Whether a window shows the whole extent
export function isWhole(window, extent) {
    return !window || (window[0] <= extent[0] && window[1] >= extent[1]);
}

// A window moved along by a share of its own width (negative for back in time), within the extent
export function panWindow(window, extent, share) {
    const current = clampWindow(window, extent);
    const by = (current[1] - current[0]) * share;
    return clampWindow([current[0] + by, current[1] + by], extent);
}

// A window made narrower (a factor below 1) or wider (above 1) about its middle, within the extent
export function zoomWindow(window, extent, factor) {
    const current = clampWindow(window, extent);
    const middle = (current[0] + current[1]) / 2;
    const half = (current[1] - current[0]) * factor / 2;
    return clampWindow([middle - half, middle + half], extent);
}

// A window moved to the start or the end of the extent, keeping its width
export function windowAtEdge(window, extent, atEnd) {
    const current = clampWindow(window, extent);
    const width = current[1] - current[0];
    return atEnd ? [extent[1] - width, extent[1]] : [extent[0], extent[0] + width];
}

// The window a key moves or resizes a window to, within the extent, or null if the key does
// nothing: Left and Right move it a tenth of its width, Page Up and Page Down a whole width, Home
// and End to the start and end, Up (or +) zooms in to half its width, Down (or -) out to twice it,
// and Escape shows the whole extent
export function windowForKey(key, window, extent) {
    switch (key) {
        case "ArrowLeft":
            return panWindow(window, extent, -PAN_SHARE);
        case "ArrowRight":
            return panWindow(window, extent, PAN_SHARE);
        case "PageUp":
            return panWindow(window, extent, -PAGE_SHARE);
        case "PageDown":
            return panWindow(window, extent, PAGE_SHARE);
        case "Home":
            return windowAtEdge(window, extent, false);
        case "End":
            return windowAtEdge(window, extent, true);
        case "ArrowUp":
        case "+":
        case "=":
            return zoomWindow(window, extent, 1 / ZOOM_FACTOR);
        case "ArrowDown":
        case "-":
            return zoomWindow(window, extent, ZOOM_FACTOR);
        case "Escape":
            return [extent[0], extent[1]];
        default:
            return null;
    }
}

// The windows a chart's cells are zoomed to (axisZoom.js), by a key: one for every cell when their
// X axes are the same (Synch X Axis), else each cell's own
export class ZoomWindows {

    constructor() {
        this.windows = new Map();
    }

    // The key of a cell's window: its grid cell's key, or "" for all of them if `synched`
    static keyOf(cellKey, synched) {
        return synched ? "" : cellKey;
    }

    // The window shown for a key, kept within an extent, or null for all of it
    get(key, extent) {
        const window = this.windows.get(key);
        if (!window || !extent) {
            return null;
        }
        const clamped = clampWindow(window, extent);
        return isWhole(clamped, extent) ? null : clamped;
    }

    // Chooses the window for a key (null, or the whole extent, for all of it)
    set(key, window, extent) {
        if (window === null || !extent || isWhole(clampWindow(window, extent), extent)) {
            this.windows.delete(key);
        } else {
            this.windows.set(key, clampWindow(window, extent));
        }
    }
}

// A series' rows ([time, value], in time order) that a window's line goes through: those within it,
// and the one either side, so that the line runs on to the window's edges
export function rowsAround(rows, window) {
    const first = rows.findIndex(row => row[0] >= window[0]);
    if (first === -1) {
        return rows.slice(-1);
    }
    let last = first;
    while (last < rows.length && rows[last][0] <= window[1]) {
        last++;
    }
    return rows.slice(Math.max(0, first - 1), Math.min(rows.length, last + 1));
}

// The lowest and highest values of the series' rows within a window, {min, max}, both null if it
// has none
export function valueRangeIn(series, window) {
    const values = series.flatMap(one => one.rows
        .filter(row => row[0] >= window[0] && row[0] <= window[1] && isNumber(row[1]))
        .map(row => row[1]));
    return values.length === 0
        ? { min: null, max: null }
        : { min: Math.min(...values), max: Math.max(...values) };
}
