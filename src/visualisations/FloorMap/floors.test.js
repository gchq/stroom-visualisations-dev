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
import { floorKey, floorLabel, floorMarkers, floorZoneList, nameAndTagsOf, nameAndTagsText, parseConfig, planOf,
    pointOf, savedDictionary, stroomBaseOf, zoneSource, zonesOf } from "./floors.js";

const CONFIG = {
    "HQ": {
        "Main": {
            "Ground": { image: "/plan.svg", width: 100, height: 60, zoneDictionaryUuid: "staticUrl:/zones.json" },
            "First": { image: "/first.svg", width: "100", height: "60", isOriginTopLeft: true }
        }
    }
};

test("the config is the setting's JSON, and says what is wrong with it", () => {
    assert.deepEqual(parseConfig("{\"a\": {}}"), { config: { a: {} }, error: null });
    assert.match(parseConfig("").error, /empty/);
    assert.match(parseConfig("{not json").error, /valid JSON/);
    assert.match(parseConfig("[1, 2]").error, /object/);
});

test("a floor's plan needs an image and a width and height above zero", () => {
    assert.deepEqual(planOf(CONFIG, "HQ", "Main", "Ground"), { image: "/plan.svg", width: 100, height: 60,
        isOriginTopLeft: false, zones: "staticUrl:/zones.json" });
    assert.equal(planOf(CONFIG, "HQ", "Main", "First").height, 60);
    assert.equal(planOf(CONFIG, "HQ", "Main", "Basement"), null);
    assert.equal(planOf(CONFIG, "Elsewhere", "Main", "Ground"), null);
    assert.equal(planOf({ a: { b: { c: { image: "/x", width: 0, height: 5 } } } }, "a", "b", "c"), null);
    assert.equal(planOf({ a: { b: { c: { width: 5, height: 5 } } } }, "a", "b", "c"), null);
});

test("each row is a marker on its floor, y up from the bottom unless the origin is the top left", () => {
    const { markers, floors, left, unplanned } = floorMarkers([
        ["badge-17", "HQ", "Main", "Ground", 10, 15, 1000, null, "badge-17"],
        ["badge-42", "HQ", "Main", "First", "20", "15", null, "star", "badge-42"]
    ], null, CONFIG);
    assert.equal(left, 0);
    assert.equal(unplanned, 0);
    assert.deepEqual(floors.map(floor => floor.floor), ["Ground", "First"]);
    assert.deepEqual(markers[0].latLng, [15, 10]);
    assert.deepEqual(markers[1].latLng, [45, 20]);
    assert.equal(markers[1].icon, "star");
    assert.equal(markers[0].floor.key, floorKey("HQ", "Main", "Ground"));
});

test("rows on a floor without a plan, or without an x and y, are left out and counted", () => {
    const { markers, floors, left, unplanned } = floorMarkers([
        ["a", "HQ", "Main", "Basement", 1, 1],
        ["b", "HQ", "Main", "Basement", 2, 2],
        ["c", "HQ", "Main", "Ground", null, 1],
        ["d", "HQ", "Main", "Ground", "left", 1],
        ["e", "HQ", "Main", "Ground", 0, 0]
    ], null, CONFIG);
    assert.deepEqual(markers.map(marker => marker.name), ["e"]);
    assert.equal(floors.length, 1);
    assert.equal(unplanned, 2);
    assert.equal(left, 2);
});

test("a floor's name says its campus, building and floor", () => {
    assert.equal(floorLabel({ campus: "HQ", building: "Main", floor: "Ground" }), "HQ, Main, Ground");
});

test("zones come from a static URL as they are, or from Stroom's dictionary", () => {
    assert.deepEqual(zoneSource("staticUrl:/assets/zones.json"), { url: "/assets/zones.json", isStatic: true });
    assert.deepEqual(zoneSource("1234-abcd"), { url: "/api/dictionary/v1/1234-abcd", isStatic: false });
});

test("Stroom's dictionary is found where Stroom is, at the root or under a path", () => {
    assert.equal(stroomBaseOf("/assets/4ac9c3f6/index.html"), "");
    assert.equal(stroomBaseOf("/stroom/assets/4ac9c3f6/index.html"), "/stroom");
    assert.equal(stroomBaseOf("/ui/vis.html"), "");
    assert.deepEqual(zoneSource("1234-abcd", "/stroom"), { url: "/stroom/api/dictionary/v1/1234-abcd", isStatic: false });
});

test("a floor's zones, leaving out those deleted or with fewer than three points", () => {
    const floor = { key: "k", campus: "HQ", building: "Main", floor: "First", plan: planOf(CONFIG, "HQ", "Main", "First") };
    const dictionary = { HQ: { Main: { First: [
        { name: "Reception", tags: ["public"], points: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }] },
        { name: "Gone", deleted: true, points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] },
        { name: "Line", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
        { points: [{ x: 5, y: 5 }, { x: 6, y: "x" }, { x: 6, y: 5 }, { x: 6, y: 6 }] }
    ] } } };
    const zones = zonesOf(dictionary, floor);
    assert.deepEqual(zones.map(zone => zone.name), ["Reception", "Unnamed zone"]);
    assert.deepEqual(zones[0].tags, ["public"]);
    // The origin is the top left, so y is turned over
    assert.deepEqual(zones[0].latLngs, [[60, 0], [60, 10], [50, 10]]);
    assert.equal(zones[1].latLngs.length, 3);
    // Each knows where it is in the floor's list, to edit it
    assert.deepEqual(zones.map(zone => zone.index), [0, 3]);
    assert.deepEqual(zonesOf({}, floor), []);
    assert.deepEqual(zonesOf(null, floor), []);
});

test("a point drawn on the map is in the plan's units, y turned over for a top left origin", () => {
    const topLeft = planOf(CONFIG, "HQ", "Main", "First");
    assert.deepEqual(pointOf([60, 0], topLeft), { x: 0, y: 0 });
    assert.deepEqual(pointOf({ lat: 50.004, lng: 10.126 }, topLeft), { x: 10.13, y: 10 });
    assert.deepEqual(pointOf([12.5, 3], { width: 100, height: 60, isOriginTopLeft: false }), { x: 3, y: 12.5 });
});

test("a floor's list of zones is made where there isn't one, to add a zone to", () => {
    const floor = { campus: "HQ", building: "Annex", floor: "Ground" };
    const dictionary = { HQ: { Main: { First: [] } } };
    floorZoneList(dictionary, floor).push({ name: "Hall", points: [] });
    assert.deepEqual(dictionary.HQ.Annex.Ground, [{ name: "Hall", points: [] }]);
    assert.equal(floorZoneList(dictionary, floor), dictionary.HQ.Annex.Ground);
    assert.deepEqual(dictionary.HQ.Main.First, []);
});

test("a zone is renamed as the legacy map took it, its tags after a '#'", () => {
    assert.deepEqual(nameAndTagsOf("Kitchen #food # water #"), { name: "Kitchen", tags: ["food", "water"] });
    assert.deepEqual(nameAndTagsOf("  Hall  "), { name: "Hall", tags: [] });
    assert.deepEqual(nameAndTagsOf(""), { name: "", tags: [] });
    assert.equal(nameAndTagsText({ name: "Kitchen", tags: ["food", "water"] }), "Kitchen #food #water");
    assert.equal(nameAndTagsText({ name: "Hall" }), "Hall");
});

test("zones are saved in the dictionary as it was read, its data replaced", () => {
    const doc = { uuid: "1234", name: "Zones", version: "v7", data: "{}" };
    const saved = savedDictionary(doc, { HQ: { Main: { First: [{ name: "Hall", points: [] }] } } });
    assert.equal(saved.uuid, "1234");
    assert.equal(saved.version, "v7");
    assert.deepEqual(JSON.parse(saved.data), { HQ: { Main: { First: [{ name: "Hall", points: [] }] } } });
    // The doc as read is left as it was
    assert.equal(doc.data, "{}");
});
