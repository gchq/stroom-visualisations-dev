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

// What Force 2D's view of the network is: {k, x, y}, a place {x, y} in the network being at
// x * k + view.x, y * k + view.y on the screen. Dragging (or Shift and the arrow keys) moves it,
// and the wheel (or + and −) zooms in or out.

// How far zooming can go: from this share of the scale that fits the network to this many times it
export const MIN_ZOOM_SHARE = 0.1;
export const MAX_ZOOM_SHARE = 10;

// Where a place in the network is on the screen
export function toScreen(view, place) {
    return { x: place.x * view.k + view.x, y: place.y * view.k + view.y };
}

// A view zoomed in (a factor above 1) or out about a point of the screen (`at`, which stays where it
// is), no nearer or further than its shares of `fittedScale`
export function zoomedAbout(view, factor, at, fittedScale) {
    const k = Math.max(fittedScale * MIN_ZOOM_SHARE, Math.min(fittedScale * MAX_ZOOM_SHARE, view.k * factor));
    const ratio = k / view.k;
    return { k, x: at.x - (at.x - view.x) * ratio, y: at.y - (at.y - view.y) * ratio };
}

// A view moved across the screen by dx, dy pixels
export function moved(view, dx, dy) {
    return { k: view.k, x: view.x + dx, y: view.y + dy };
}

// A view with a place of the network in the middle of a screen of `size` {width, height}
export function centredOn(view, place, size) {
    return { k: view.k, x: size.width / 2 - place.x * view.k, y: size.height / 2 - place.y * view.k };
}

// A view moved part of the way (`share`, 0 to 1) toward another, so that it moves smoothly
export function towards(view, goal, share) {
    const between = (a, b) => a + (b - a) * share;
    return { k: between(view.k, goal.k), x: between(view.x, goal.x), y: between(view.y, goal.y) };
}

// Whether two views are the same, near enough that moving on from one to the other can stop
export function isSameView(a, b) {
    return Math.abs(a.k - b.k) <= 1e-4 * b.k && Math.abs(a.x - b.x) <= 0.1 && Math.abs(a.y - b.y) <= 0.1;
}
