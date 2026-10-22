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
    ZoomWindows, clampWindow, isWhole, panWindow, rowsAround, valueRangeIn, windowAtEdge, windowForKey, zoomWindow
} from "./window.js";

const EXTENT = [0, 1000];

test("no window is the whole extent, and a window past an edge is moved back, keeping its width", () => {
    assert.deepEqual(clampWindow(null, EXTENT), [0, 1000]);
    assert.deepEqual(clampWindow([900, 1100], EXTENT), [800, 1000]);
    assert.deepEqual(clampWindow([-50, 50], EXTENT), [0, 100]);
    assert.deepEqual(clampWindow([300, 100], EXTENT), [100, 300]);
    assert.deepEqual(clampWindow([-100, 2000], EXTENT), [0, 1000]);
});

test("a window can't shrink to nothing", () => {
    assert.deepEqual(clampWindow([500, 500], EXTENT), [500, 502]);
});

test("whether a window shows everything", () => {
    assert.equal(isWhole(null, EXTENT), true);
    assert.equal(isWhole([0, 1000], EXTENT), true);
    assert.equal(isWhole([0, 999], EXTENT), false);
});

test("panning moves by a share of the window's width, stopping at the edges", () => {
    assert.deepEqual(panWindow([100, 300], EXTENT, 0.5), [200, 400]);
    assert.deepEqual(panWindow([100, 300], EXTENT, -1), [0, 200]);
    assert.deepEqual(panWindow([700, 900], EXTENT, 1), [800, 1000]);
});

test("zooming narrows or widens about the middle, never beyond the extent", () => {
    assert.deepEqual(zoomWindow([200, 600], EXTENT, 0.5), [300, 500]);
    assert.deepEqual(zoomWindow([200, 600], EXTENT, 2), [0, 800]);
    assert.deepEqual(zoomWindow(null, EXTENT, 4), [0, 1000]);
});

test("a window can be moved to the start or the end", () => {
    assert.deepEqual(windowAtEdge([400, 500], EXTENT, false), [0, 100]);
    assert.deepEqual(windowAtEdge([400, 500], EXTENT, true), [900, 1000]);
});

test("a line goes through the rows in its window and the one either side", () => {
    const rows = [[0, 1], [100, 2], [200, 3], [300, 4], [400, 5]];
    assert.deepEqual(rowsAround(rows, [150, 250]).map(row => row[0]), [100, 200, 300]);
    assert.deepEqual(rowsAround(rows, [0, 100]).map(row => row[0]), [0, 100, 200]);
    assert.deepEqual(rowsAround(rows, [450, 500]).map(row => row[0]), [400]);
});

test("the values in a window, ignoring rows without one", () => {
    const series = [{ rows: [[0, 5], [100, 50], [200, null], [300, 9]] }, { rows: [[150, -2]] }];
    assert.deepEqual(valueRangeIn(series, [100, 300]), { min: -2, max: 50 });
    assert.deepEqual(valueRangeIn(series, [400, 500]), { min: null, max: null });
});

test("keys move and resize a window, and Escape shows the whole extent", () => {
    assert.deepEqual(windowForKey("ArrowRight", [400, 500], EXTENT), [410, 510]);
    assert.deepEqual(windowForKey("ArrowLeft", [400, 500], EXTENT), [390, 490]);
    assert.deepEqual(windowForKey("PageDown", [400, 500], EXTENT), [500, 600]);
    assert.deepEqual(windowForKey("End", [400, 500], EXTENT), [900, 1000]);
    assert.deepEqual(windowForKey("ArrowUp", [400, 500], EXTENT), [425, 475]);
    assert.deepEqual(windowForKey("-", [400, 500], EXTENT), [350, 550]);
    assert.deepEqual(windowForKey("Escape", [400, 500], EXTENT), [0, 1000]);
    // Without a window, the keys start from the whole extent
    assert.deepEqual(windowForKey("+", null, EXTENT), [250, 750]);
    assert.equal(windowForKey("a", [400, 500], EXTENT), null);
});

test("cells share a zoom window when their axes are synchronised, else each has its own", () => {
    assert.equal(ZoomWindows.keyOf("alice", true), "");
    assert.equal(ZoomWindows.keyOf("alice", false), "alice");
});

test("a zoom window is kept within the extent, and the whole extent is no zoom", () => {
    const windows = new ZoomWindows();
    assert.equal(windows.get("", EXTENT), null);
    windows.set("", [900, 1100], EXTENT);
    assert.deepEqual(windows.get("", EXTENT), [800, 1000]);
    // Fewer rows since: the window is moved back within the extent there is now
    assert.deepEqual(windows.get("", [0, 500]), [300, 500]);
    windows.set("", [-10, 2000], EXTENT);
    assert.equal(windows.get("", EXTENT), null);
    windows.set("", [100, 200], EXTENT);
    windows.set("", null, EXTENT);
    assert.equal(windows.get("", EXTENT), null);
    // An axis that doesn't zoom (text, or no data) has no window
    windows.set("", [100, 200], EXTENT);
    assert.equal(windows.get("", null), null);
});
