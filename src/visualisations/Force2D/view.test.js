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
    MAX_ZOOM_SHARE, MIN_ZOOM_SHARE, centredOn, isSameView, moved, toScreen, towards, zoomedAbout
} from "./view.js";

const near = (a, b) => Math.abs(a - b) < 1e-9;

test("a place is scaled and moved onto the screen", () => {
    assert.deepEqual(toScreen({ k: 2, x: 10, y: 20 }, { x: 5, y: -5 }), { x: 20, y: 10 });
});

test("zooming keeps the point zoomed about where it is", () => {
    const view = { k: 1, x: 100, y: 50 };
    const at = { x: 300, y: 200 };
    const zoomed = zoomedAbout(view, 2, at, 1);
    assert.equal(zoomed.k, 2);
    // The place under the point before is still under it
    const place = { x: (at.x - view.x) / view.k, y: (at.y - view.y) / view.k };
    const after = toScreen(zoomed, place);
    assert.ok(near(after.x, at.x) && near(after.y, at.y));
});

test("zooming stops at its limits", () => {
    const view = { k: 1, x: 0, y: 0 };
    assert.equal(zoomedAbout(view, 1000, { x: 0, y: 0 }, 1).k, MAX_ZOOM_SHARE);
    assert.equal(zoomedAbout(view, 0.0001, { x: 0, y: 0 }, 1).k, MIN_ZOOM_SHARE);
});

test("moving and centring", () => {
    assert.deepEqual(moved({ k: 2, x: 1, y: 2 }, 10, -5), { k: 2, x: 11, y: -3 });
    const centred = centredOn({ k: 2, x: 0, y: 0 }, { x: 10, y: 20 }, { width: 400, height: 300 });
    assert.deepEqual(toScreen(centred, { x: 10, y: 20 }), { x: 200, y: 150 });
});

test("a view moves part of the way to another, and arrives", () => {
    const from = { k: 1, x: 0, y: 0 };
    const to = { k: 3, x: 100, y: -40 };
    assert.deepEqual(towards(from, to, 0.5), { k: 2, x: 50, y: -20 });
    assert.equal(isSameView(towards(from, to, 0.5), to), false);
    assert.equal(isSameView(towards(from, to, 1), to), true);
});
