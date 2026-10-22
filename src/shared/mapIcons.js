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

// The icons a map's marker can show (GeoMap, FloorMap), named by its Icon Name value: simple line
// drawings, each a path on a 16 by 16 grid drawn with a stroke (not filled), so that they read at a
// marker's size. A value can also be one of FontAwesome 4's names for the same thing (e.g. 'male',
// 'ambulance', 'fa-truck'), as the legacy maps took those, so that existing dashboards keep their
// meaning. A value that names no icon gives the marker a shape instead (see mapMarkers.js).

// A circle as path data
function circle(cx, cy, r) {
    return "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + (2 * r) + " 0a" + r + " " + r + " 0 1 0 "
           + (-2 * r) + " 0";
}

// A rectangle as path data
function rect(x, y, width, height) {
    return "M" + x + " " + y + "h" + width + "v" + height + "h" + (-width) + "Z";
}

// A dot, drawn by a round cap on a line of no length
function dot(x, y) {
    return "M" + x + " " + y + "h.01";
}

// Each icon's path, by name
export const ICONS = {
    person: circle(8, 5, 2.5) + "M3 14.5c0-3 2.2-5 5-5s5 2 5 5",
    people: circle(6, 5.5, 2) + "M1.5 14c0-2.5 2-4.2 4.5-4.2s4.5 1.7 4.5 4.2" + circle(11.3, 4.5, 1.8)
            + "M11 8.5c2 0 3.7 1.4 3.7 3.6",
    desktop: rect(1.5, 2, 13, 9) + "M8 11v3M5 14.5h6",
    laptop: rect(3, 3, 10, 7) + "M1 12.5h14",
    server: rect(2, 2, 12, 5) + rect(2, 9, 12, 5) + dot(5, 4.5) + dot(5, 11.5),
    phone: rect(4.5, 1.5, 7, 13) + "M7.5 12h1",
    building: rect(3, 1.5, 10, 13) + dot(6, 4.5) + dot(10, 4.5) + dot(6, 7.5) + dot(10, 7.5) + "M7 14.5v-3h2v3",
    home: "M2 7.5L8 2l6 5.5M3.5 6.5V14h9V6.5M6.5 14v-4h3v4",
    car: "M2 11V8.5L3.5 5h9L14 8.5V11ZM2 8.5h12" + circle(4.5, 12, 1.5) + circle(11.5, 12, 1.5),
    truck: rect(1, 3.5, 8.5, 8) + "M9.5 6.5h3L15 9v2.5H9.5" + circle(4, 12.5, 1.5) + circle(12, 12.5, 1.5),
    plane: "M8 1.5c.8 0 1.2.8 1.2 1.8V6l5.3 3v1.6L9.2 9v3.2l1.8 1.3v1.2L8 14l-3 .7v-1.2l1.8-1.3V9L1.5 10.6V9"
           + "l5.3-3V3.3c0-1 .4-1.8 1.2-1.8Z",
    ship: "M1.5 10h13l-2 4h-9ZM4 10V7h7v3M6.5 7V4h2v3",
    flag: "M3.5 15V1.5M3.5 2h9l-2 3.5 2 3.5h-9",
    warning: "M8 1.8L15 14H1ZM8 6v4" + dot(8, 12),
    lock: rect(3, 7, 10, 7.5) + "M5 7V5a3 3 0 0 1 6 0v2",
    wifi: "M1.5 6a9.5 9.5 0 0 1 13 0M3.8 8.6a6 6 0 0 1 8.4 0M6 11.2a2.8 2.8 0 0 1 4 0" + dot(8, 13.5),
    globe: circle(8, 8, 6.5) + "M1.5 8h13M8 1.5c-2 2-2.8 4.2-2.8 6.5s.8 4.5 2.8 6.5M8 1.5c2 2 2.8 4.2 2.8 6.5"
           + "s-.8 4.5-2.8 6.5",
    camera: "M1.5 5h3L6 3h4l1.5 2h3v8.5h-13Z" + circle(8, 9, 2.5),
    envelope: rect(1.5, 3.5, 13, 9) + "M1.5 4L8 9l6.5-5",
    cloud: "M4.5 13a3.5 3.5 0 0 1-.5-7a4.5 4.5 0 0 1 8.6 1.2A3 3 0 0 1 12 13Z",
    database: "M2.5 3.5c0-1.1 2.5-2 5.5-2s5.5.9 5.5 2-2.5 2-5.5 2-5.5-.9-5.5-2ZM2.5 3.5v9c0 1.1 2.5 2 5.5 2"
              + "s5.5-.9 5.5-2v-9M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2",
    shield: "M8 1.5l5.5 2v4.5c0 3.3-2.3 5.6-5.5 6.5C4.8 13.6 2.5 11.3 2.5 8V3.5Z",
    bolt: "M9 1.5L3.5 9H8l-1 5.5L12.5 7H8Z",
    fire: "M8 14.5c-2.8 0-4.5-1.8-4.5-4.3C3.5 7 6.5 5.5 6.5 2c2.2 1.2 3.4 3.3 3.2 5.3c.7-.4 1.2-1.2 1.3-2.2"
          + "c1.3 1.3 1.5 2.9 1.5 4.6c0 3-1.7 4.8-4.5 4.8Z",
    pin: "M8 14.5s-5-4.6-5-8.3a5 5 0 0 1 10 0c0 3.7-5 8.3-5 8.3Z" + circle(8, 6.2, 1.8),
    key: circle(5, 8, 3) + "M8 8h6.5M12.5 8v2.5M14.5 8v2",
    clock: circle(8, 8, 6.5) + "M8 4.5V8l2.5 1.5",
    eye: "M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" + circle(8, 8, 2)
};

// FontAwesome 4's names (and some plain words) for the icons, by name. 'star' isn't one: it is a
// marker shape's name (see mapMarkers.js)
const ALIASES = {
    user: "person",
    male: "person",
    female: "person",
    child: "person",
    "user-circle": "person",
    users: "people",
    group: "people",
    computer: "desktop",
    television: "desktop",
    tv: "desktop",
    hdd: "server",
    mobile: "phone",
    "mobile-phone": "phone",
    tablet: "phone",
    industry: "building",
    bank: "building",
    university: "building",
    hospital: "building",
    hotel: "building",
    office: "building",
    house: "home",
    taxi: "car",
    automobile: "car",
    ambulance: "truck",
    bus: "truck",
    lorry: "truck",
    "fighter-jet": "plane",
    "paper-plane": "plane",
    aeroplane: "plane",
    airplane: "plane",
    anchor: "ship",
    boat: "ship",
    "flag-checkered": "flag",
    "exclamation-triangle": "warning",
    exclamation: "warning",
    "exclamation-circle": "warning",
    alert: "warning",
    signal: "wifi",
    "video-camera": "camera",
    at: "envelope",
    email: "envelope",
    mail: "envelope",
    flash: "bolt",
    "map-marker": "pin",
    "map-pin": "pin",
    "clock-o": "clock",
    time: "clock"
};

// The names of the icons a value can name, in order
export const ICON_NAMES = Object.keys(ICONS);

// The icon an Icon Name value names, or null if none: its name in any case, or one of FontAwesome
// 4's names for it, with or without 'fa-' (or 'fa fa-') before it or '-o' (FontAwesome's outline
// versions) after it, e.g. 'Truck', 'fa-user' or 'envelope-o'
export function iconOf(value) {
    if (value === null || value === undefined) {
        return null;
    }
    let name = String(value).trim().toLowerCase().replace(/^fa\s+/, "").replace(/^fa-/, "");
    for (let pass = 0; pass < 2; pass++) {
        if (Object.hasOwn(ICONS, name)) {
            return name;
        }
        if (Object.hasOwn(ALIASES, name)) {
            return ALIASES[name];
        }
        name = name.replace(/-o$/, "");
    }
    return null;
}
