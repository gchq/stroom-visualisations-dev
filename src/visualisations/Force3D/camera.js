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

// Where Force 3D's camera is: it goes round a point it looks at (the target), `yaw` radians round
// (about the up axis) and `pitch` radians up or down, `distance` from it. Dragging (or Shift and
// the arrow keys) turns it, and the wheel (or + and −) takes it nearer or further.

// The camera's field of view, top to bottom, in degrees
export const FIELD_OF_VIEW = 50;
// Where the camera starts, turned round and up from the front, in radians
export const START_YAW = 0.5;
export const START_PITCH = 0.3;
// How far up or down it can turn: just short of straight down or up, where which way is up is lost
export const MAX_PITCH = Math.PI / 2 - 0.1;
// How much one press of + or − zooms by, and the nearest and furthest it can be, as shares of the
// distance that fits the network
export const ZOOM_STEP = 1.25;
export const MIN_ZOOM_SHARE = 0.15;
export const MAX_ZOOM_SHARE = 4;
// How far one press of Shift and an arrow key turns it, in radians
export const KEY_TURN = Math.PI / 12;

// The view that shows the whole network, a sphere of `radius` about 0,0,0, in a visualisation
// `aspect` times as wide as it is high: from a little to one side and above, so that it is seen
// to be three dimensional
export function fittedView(radius, aspect) {
    return { yaw: START_YAW, pitch: START_PITCH, distance: fitDistance(radius, aspect), target: { x: 0, y: 0, z: 0 } };
}

// How far the camera is to be from the middle of a sphere of `radius` to see all of it, with a
// little room round it, in a visualisation `aspect` times as wide as it is high (the narrower of
// its two fields of view decides)
export function fitDistance(radius, aspect) {
    const vertical = FIELD_OF_VIEW * Math.PI / 180;
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * Math.max(0.01, aspect));
    const narrower = Math.min(vertical, horizontal);
    return Math.max(1, radius) * 1.1 / Math.sin(narrower / 2);
}

// Where the camera is for a view, as {x, y, z}
export function cameraPosition({ yaw, pitch, distance, target }) {
    return {
        x: target.x + distance * Math.sin(yaw) * Math.cos(pitch),
        y: target.y + distance * Math.sin(pitch),
        z: target.z + distance * Math.cos(yaw) * Math.cos(pitch)
    };
}

// A view turned by `yaw` and `pitch` radians, its pitch kept short of straight up or down
export function turned(view, yaw, pitch) {
    return { ...view, yaw: view.yaw + yaw, pitch: Math.max(-MAX_PITCH, Math.min(MAX_PITCH, view.pitch + pitch)) };
}

// A view zoomed in (a factor above 1) or out, no nearer or further than its shares of `fitted`
// (the distance that fits the network)
export function zoomed(view, factor, fitted) {
    const distance = view.distance / factor;
    return { ...view, distance: Math.max(fitted * MIN_ZOOM_SHARE, Math.min(fitted * MAX_ZOOM_SHARE, distance)) };
}

// A view moved part of the way (`share`, 0 to 1) toward another, so that it turns and zooms
// smoothly rather than jumping
export function towards(view, goal, share) {
    const between = (a, b) => a + (b - a) * share;
    return {
        yaw: between(view.yaw, goal.yaw),
        pitch: between(view.pitch, goal.pitch),
        distance: between(view.distance, goal.distance),
        target: {
            x: between(view.target.x, goal.target.x),
            y: between(view.target.y, goal.target.y),
            z: between(view.target.z, goal.target.z)
        }
    };
}

// Whether two views are the same, near enough that moving on from one to the other can stop
export function isSameView(a, b) {
    const near = (x, y, tolerance) => Math.abs(x - y) <= tolerance;
    return near(a.yaw, b.yaw, 1e-4) && near(a.pitch, b.pitch, 1e-4) && near(a.distance, b.distance, 1e-3 * b.distance)
           && near(a.target.x, b.target.x, 1e-3) && near(a.target.y, b.target.y, 1e-3)
           && near(a.target.z, b.target.z, 1e-3);
}
