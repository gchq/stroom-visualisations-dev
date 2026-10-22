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

// What the maps (GeoMap, FloorMap) share about their markers: the shape a marker's icon value
// gives it, the colour its time gives it, and the time range of some markers

import { interpolateViridis } from "d3";

// The shapes a marker can have, by name, as d3's symbol types are named; a marker without an icon
// value is a circle
export const SHAPES = ["circle", "square", "triangle", "diamond", "star", "cross", "wye"];

// The shape of each icon value: one that is the name of a shape (any case) has that shape, and the
// others have the shapes not named, in the order first seen (round again if there are more of them)
export function shapesFor(icons) {
    const shapes = new Map();
    const named = new Set();
    const others = [];
    for (const icon of icons) {
        if (icon === null || icon === undefined || icon === "" || shapes.has(icon)) {
            continue;
        }
        const name = String(icon).toLowerCase();
        if (SHAPES.includes(name)) {
            shapes.set(icon, name);
            named.add(name);
        } else {
            shapes.set(icon, null);
            others.push(icon);
        }
    }
    // Circles are for markers without an icon, so an icon not named a shape has another one if it can
    const free = SHAPES.filter(shape => shape !== "circle" && !named.has(shape));
    const pool = free.length > 0 ? free : SHAPES.slice(1);
    others.forEach((icon, index) => shapes.set(icon, pool[index % pool.length]));
    return shapes;
}

// The earliest and latest of some markers' times ({time}, a number of milliseconds or null), as
// {min, max}, or null if none of them has a time
export function timeExtent(markers) {
    let min = Infinity;
    let max = -Infinity;
    for (const marker of markers) {
        if (typeof marker.time === "number" && Number.isFinite(marker.time)) {
            min = Math.min(min, marker.time);
            max = Math.max(max, marker.time);
        }
    }
    return min === Infinity ? null : { min, max };
}

// The share of the way a time is from the earliest to the latest, from 0 to 1 (1 when they are the
// same time)
export function timeShare(time, extent) {
    if (extent.max === extent.min) {
        return 1;
    }
    return Math.max(0, Math.min(1, (time - extent.min) / (extent.max - extent.min)));
}

// The colour of a time, by its share of the way from the earliest (dark purple) to the latest
// (yellow green): a colour-blind safe scale (viridis), stopping short of its lightest yellow
export function timeColour(share) {
    return interpolateViridis(0.85 * share);
}
