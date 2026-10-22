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
    FIELD_OF_VIEW, MAX_PITCH, MAX_ZOOM_SHARE, MIN_ZOOM_SHARE, cameraPosition, fitDistance, fittedView, isSameView,
    towards, turned, zoomed
} from "./camera.js";

const near = (a, b) => Math.abs(a - b) < 1e-9;

test("the fitted view looks at the middle from the side and above, far enough to see it all", () => {
    const view = fittedView(50, 1);
    assert.deepEqual(view.target, { x: 0, y: 0, z: 0 });
    const position = cameraPosition(view);
    assert.ok(position.x > 0 && position.y > 0 && position.z > 0);
    assert.ok(near(Math.hypot(position.x, position.y, position.z), view.distance));
    // The sphere's edge is inside the field of view
    const halfAngle = Math.asin(50 / view.distance) * 180 / Math.PI;
    assert.ok(halfAngle < FIELD_OF_VIEW / 2);
});

test("a narrow visualisation is fitted by its width, so the camera is further away", () => {
    assert.ok(fitDistance(50, 0.5) > fitDistance(50, 1));
    assert.ok(near(fitDistance(50, 2), fitDistance(50, 1)));
});

test("turning goes round the target, and stops short of straight up or down", () => {
    const view = fittedView(50, 1);
    const front = { ...view, yaw: 0, pitch: 0 };
    const round = cameraPosition(turned(front, Math.PI / 2, 0));
    assert.ok(near(round.x, view.distance) && near(round.z, 0));
    assert.equal(turned(view, 0, 10).pitch, MAX_PITCH);
    assert.equal(turned(view, 0, -10).pitch, -MAX_PITCH);
});

test("zooming goes nearer or further, within its limits", () => {
    const view = fittedView(50, 1);
    assert.ok(near(zoomed(view, 2, view.distance).distance, view.distance / 2));
    assert.ok(near(zoomed(view, 1000, view.distance).distance, view.distance * MIN_ZOOM_SHARE));
    assert.ok(near(zoomed(view, 0.001, view.distance).distance, view.distance * MAX_ZOOM_SHARE));
});

test("a view moves part of the way to another, and arrives", () => {
    const from = fittedView(50, 1);
    const to = { ...turned(from, 1, 0.5), target: { x: 10, y: 0, z: 0 } };
    const half = towards(from, to, 0.5);
    assert.ok(near(half.yaw, (from.yaw + to.yaw) / 2) && near(half.target.x, 5));
    assert.equal(isSameView(half, to), false);
    assert.equal(isSameView(towards(from, to, 1), to), true);
});
