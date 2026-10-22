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
import { geoMarkers } from "./markers.js";

test("each row is a marker, with its name, place, time, icon and series", () => {
    const { markers, left } = geoMarkers([["van-1", 51.5, -0.09, 1000, "truck", "van-1", null]], "van-1");
    assert.equal(left, 0);
    assert.deepEqual(markers, [{ key: "van-1~#~0", name: "van-1", lat: 51.5, lon: -0.09, time: 1000,
        icon: "truck", series: "van-1" }]);
});

test("a latitude and longitude given as text are numbers", () => {
    const { markers } = geoMarkers([["a", "51.5", "-0.1"]], null);
    assert.equal(markers[0].lat, 51.5);
    assert.equal(markers[0].lon, -0.1);
    assert.equal(markers[0].time, null);
    assert.equal(markers[0].icon, null);
});

test("rows without a place on the earth are left out and counted, not stopping the map", () => {
    const { markers, left } = geoMarkers([["ok", 0, 0], ["no lat", null, 1], ["text", "north", 1],
        ["too far north", 91, 0], ["too far west", 0, -181], ["blank", "", ""], "not a row"], null);
    assert.deepEqual(markers.map(marker => marker.name), ["ok"]);
    assert.equal(left, 5);
});

test("without a series value in the row, a marker has its series node's", () => {
    const { markers } = geoMarkers([["a", 1, 2, null, null]], "van-2");
    assert.equal(markers[0].series, "van-2");
    assert.equal(markers[0].key, "van-2~#~0");
});

test("the poles and the date line are on the earth", () => {
    const { markers } = geoMarkers([["n", 90, 180], ["s", -90, -180]], null);
    assert.equal(markers.length, 2);
});
