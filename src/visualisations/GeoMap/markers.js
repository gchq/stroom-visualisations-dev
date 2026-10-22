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

// The markers of a GeoMap's rows of [name, latitude, longitude, event time, icon, series, grid series]

import { numberFrom } from "../../shared/data.js";

// The fields of a row, by index
const NAME = 0;
const LATITUDE = 1;
const LONGITUDE = 2;
const TIME = 3;
const ICON = 4;
const SERIES = 5;

// The markers of some rows, as {markers: [{key, name, lat, lon, time, icon, series}], left}: rows
// without a latitude from -90 to 90 and a longitude from -180 to 180 are left out (`left` says how
// many), rather than stopping the whole map being drawn as they used to. A marker's key is its
// series and its place among the rows, so it stays the same as long as its rows do
export function geoMarkers(rows, seriesKey) {
    const markers = [];
    let left = 0;
    rows.forEach((row, index) => {
        if (!Array.isArray(row)) {
            return;
        }
        const lat = numberFrom(row[LATITUDE]);
        const lon = numberFrom(row[LONGITUDE]);
        if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            left++;
            return;
        }
        const series = row[SERIES] !== undefined && row[SERIES] !== null ? row[SERIES] : seriesKey;
        markers.push({
            key: String(series) + "~#~" + index,
            name: row[NAME] === undefined ? null : row[NAME],
            lat,
            lon,
            time: numberFrom(row[TIME]),
            icon: row[ICON] === undefined || row[ICON] === "" ? null : row[ICON],
            series: series === undefined ? null : series
        });
    });
    return { markers, left };
}
