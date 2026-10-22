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

// A FloorMap's floors, markers and zones. The config (the FloorMap Config JSON setting) gives the
// plan of each floor of each building of each campus (building group):
//   {"<campus>": {"<building>": {"<floor>": {"image": "<url>", "width": 100, "height": 60,
//       "isOriginTopLeft": false, "zoneDictionaryUuid": "<uuid>" or "staticUrl:<url>"}}}}
// The rows are [name, campus, building, floor, x, y, event time, icon, series, grid series], x and
// y in the plan's units, y up from the bottom unless the plan's origin is its top left. A zone
// dictionary holds {"<campus>": {"<building>": {"<floor>": [{name, tags, points: [{x, y}]}]}}}

import { numberFrom } from "../../shared/data.js";

// The fields of a row, by index
const NAME = 0;
const CAMPUS = 1;
const BUILDING = 2;
const FLOOR = 3;
const X = 4;
const Y = 5;
const TIME = 6;
const ICON = 7;
const SERIES = 8;

// The config from the setting's text, as {config, error}: an error says what is wrong with it
export function parseConfig(text) {
    if (typeof text !== "string" || text.trim() === "") {
        return { config: {}, error: "The FloorMap Config JSON setting is empty, so there are no floor plans" };
    }
    try {
        const config = JSON.parse(text);
        if (config === null || typeof config !== "object" || Array.isArray(config)) {
            return { config: {}, error: "The FloorMap Config JSON setting isn't an object of campuses" };
        }
        return { config, error: null };
    } catch (error) {
        return { config: {}, error: "The FloorMap Config JSON setting isn't valid JSON" };
    }
}

// A floor's key, the same for the same campus, building and floor
export function floorKey(campus, building, floor) {
    return JSON.stringify([String(campus), String(building), String(floor)]);
}

// A floor's name as shown, e.g. 'Head Office, Main Building, Ground Floor'
export function floorLabel(floor) {
    return floor.campus + ", " + floor.building + ", " + floor.floor;
}

// The plan of a floor from the config, as {image, width, height, isOriginTopLeft, zones}, or null
// if it hasn't one with an image and a width and height above zero
export function planOf(config, campus, building, floor) {
    const plan = config?.[campus]?.[building]?.[floor];
    if (!plan || typeof plan.image !== "string" || plan.image === "") {
        return null;
    }
    const width = numberFrom(plan.width);
    const height = numberFrom(plan.height);
    if (width === null || height === null || width <= 0 || height <= 0) {
        return null;
    }
    return {
        image: plan.image,
        width,
        height,
        isOriginTopLeft: plan.isOriginTopLeft === true || plan.isOriginTopLeft === "true",
        zones: typeof plan.zoneDictionaryUuid === "string" && plan.zoneDictionaryUuid !== ""
            ? plan.zoneDictionaryUuid
            : null
    };
}

// Where a point of a plan is on the map ([y, x] as Leaflet's simple CRS takes it), y counted up
// from the bottom
function latLngOf(x, y, plan) {
    return [plan.isOriginTopLeft ? plan.height - y : y, x];
}

// The markers of some rows, as {markers, floors, left, unplanned}: each marker {key, name, floor,
// x, y, latLng, time, icon, series}, and each floor with markers {key, campus, building, floor,
// plan} in the order first seen. Rows on a floor without a plan are left out (`unplanned` says how
// many), rather than the legacy map's alert() for each, as are rows without an x and y (`left`)
export function floorMarkers(rows, seriesKey, config) {
    const markers = [];
    const floors = new Map();
    let left = 0;
    let unplanned = 0;
    rows.forEach((row, index) => {
        if (!Array.isArray(row)) {
            return;
        }
        const key = floorKey(row[CAMPUS], row[BUILDING], row[FLOOR]);
        if (!floors.has(key)) {
            const plan = planOf(config, row[CAMPUS], row[BUILDING], row[FLOOR]);
            floors.set(key, plan === null ? null : { key, campus: String(row[CAMPUS]), building: String(row[BUILDING]),
                floor: String(row[FLOOR]), plan });
        }
        const floor = floors.get(key);
        if (floor === null) {
            unplanned++;
            return;
        }
        const x = numberFrom(row[X]);
        const y = numberFrom(row[Y]);
        if (x === null || y === null) {
            left++;
            return;
        }
        const series = row[SERIES] !== undefined && row[SERIES] !== null ? row[SERIES] : seriesKey;
        markers.push({
            key: String(series) + "~#~" + index,
            name: row[NAME] === undefined ? null : row[NAME],
            floor,
            x,
            y,
            latLng: latLngOf(x, y, floor.plan),
            time: numberFrom(row[TIME]),
            icon: row[ICON] === undefined || row[ICON] === "" ? null : row[ICON],
            series: series === undefined ? null : series
        });
    });
    return { markers, floors: [...floors.values()].filter(floor => floor !== null), left, unplanned };
}

// Where Stroom is, from the path of the visualisation's own page, which Stroom serves from
// '<Stroom>/assets/<visualisation>/index.html': the part before '/assets/' ('' for Stroom at the root)
export function stroomBaseOf(pagePath) {
    const index = String(pagePath).indexOf("/assets/");
    return index > 0 ? pagePath.substring(0, index) : "";
}

// Where a zone dictionary is read from: a 'staticUrl:<url>' from that URL, as the zones themselves;
// otherwise Stroom's dictionary of that UUID (Stroom being at `base`, see stroomBaseOf), whose data
// is the zones as JSON text
export function zoneSource(zones, base = "") {
    if (zones.startsWith("staticUrl:")) {
        return { url: zones.substring("staticUrl:".length), isStatic: true };
    }
    return { url: base + "/api/dictionary/v1/" + encodeURIComponent(zones), isStatic: false };
}

// The zones of a floor in a zone dictionary's zones, as [{key, index, name, tags, latLngs}] (index
// being where the zone is in the floor's list, for editing it): those deleted, or without at least
// three points with an x and y, are left out
export function zonesOf(dictionary, floor) {
    const zones = dictionary?.[floor.campus]?.[floor.building]?.[floor.floor];
    if (!Array.isArray(zones)) {
        return [];
    }
    const result = [];
    zones.forEach((zone, index) => {
        if (!zone || zone.deleted || !Array.isArray(zone.points)) {
            return;
        }
        const latLngs = zone.points
            .map(point => [numberFrom(point?.x), numberFrom(point?.y)])
            .filter(([x, y]) => x !== null && y !== null)
            .map(([x, y]) => latLngOf(x, y, floor.plan));
        if (latLngs.length < 3) {
            return;
        }
        result.push({
            key: floor.key + "\u0000" + index,
            index,
            name: typeof zone.name === "string" && zone.name !== "" ? zone.name : "Unnamed zone",
            tags: Array.isArray(zone.tags) ? zone.tags.map(String) : [],
            latLngs
        });
    });
    return result;
}

// A point on a plan, {x, y} in the plan's units (y up from the bottom unless the plan's origin is its
// top left), from where it is on the map ([lat, lng] or {lat, lng}), to two decimal places
export function pointOf(latLng, plan) {
    const lat = Array.isArray(latLng) ? latLng[0] : latLng.lat;
    const lng = Array.isArray(latLng) ? latLng[1] : latLng.lng;
    const round = value => Math.round(value * 100) / 100;
    return { x: round(lng), y: round(plan.isOriginTopLeft ? plan.height - lat : lat) };
}

// A floor's list of zones in a zone dictionary's zones, made (with its campus and building) if there
// isn't one yet, so that a zone can be added to it
export function floorZoneList(dictionary, floor) {
    const campus = dictionary[floor.campus] = dictionary[floor.campus] || {};
    const building = campus[floor.building] = campus[floor.building] || {};
    if (!Array.isArray(building[floor.floor])) {
        building[floor.floor] = [];
    }
    return building[floor.floor];
}

// A zone's name and tags from what is typed to rename it, as the legacy FloorMap took it: the name,
// then each tag after a '#', e.g. 'Kitchen #food #water' is {name: 'Kitchen', tags: ['food',
// 'water']}; empty tags are left out
export function nameAndTagsOf(text) {
    const [name, ...tags] = String(text).split("#").map(part => part.trim());
    return { name, tags: tags.filter(tag => tag !== "") };
}

// What a zone's name and tags are typed as, to rename it (see nameAndTagsOf)
export function nameAndTagsText(zone) {
    const tags = Array.isArray(zone.tags) ? zone.tags : [];
    return [zone.name || "", ...tags.map(tag => "#" + tag)].join(" ");
}

// The zone dictionary (a Stroom DictionaryDoc, as it was read) with its data replaced by some zones,
// to save it: everything else (its UUID, version and so on) as it was read, so that Stroom can tell
// if it has been changed since
export function savedDictionary(doc, zones) {
    return { ...doc, data: JSON.stringify(zones, null, 2) };
}
