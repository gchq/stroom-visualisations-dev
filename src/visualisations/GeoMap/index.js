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

// A map of the world, from a tile server, with a marker at the latitude and longitude of each row,
// in a grid of maps if a Grid Series field is chosen (see shared/mapChart.js). Stroom makes it with
// `new visualisations.GeoMap()` and calls setData(context, settings, data) with data nested as grid
// cell, then series, then rows of [name, latitude, longitude, event time, icon, series, grid series].

import "../../shared/shared.css";
import L from "leaflet";
import { MapChart } from "../../shared/mapChart.js";
import { geoMarkers } from "./markers.js";

// Where a map starts if the settings don't say (or say something that isn't a place)
const DEFAULT_CENTRE = [51.0, 0.0];
const DEFAULT_ZOOM = 13;
const DEFAULT_TILES = "https://{s}.tile.osm.org/{z}/{x}/{y}.png";

// A setting as a number, or `otherwise` if it isn't one
function numberSetting(value, otherwise) {
    const number = Number(value);
    return value !== undefined && value !== null && value !== "" && Number.isFinite(number) ? number : otherwise;
}

class GeoMap extends MapChart {

    markersOf(rows, seriesKey) {
        return geoMarkers(rows, seriesKey);
    }

    latLngOf(marker) {
        return [marker.lat, marker.lon];
    }

    mapName() {
        return "Map";
    }

    // The tiles are added as each map is drawn (see prepare), so that they follow the settings
    addLayers() {
    }

    // The tiles from the tile server the settings say, with its attribution: replaced when the
    // settings change, as well as added the first time
    prepare(mapCell, cell) {
        const url = this.settings.tileServerUrl || DEFAULT_TILES;
        const attribution = this.settings.tileServerAttribution || "";
        const key = url + "\n" + attribution;
        if (mapCell.tilesKey !== key) {
            if (mapCell.tiles) {
                mapCell.tiles.remove();
            }
            mapCell.tiles = L.tileLayer(url, { attribution }).addTo(mapCell.map);
            mapCell.tiles.bringToBack();
            mapCell.tilesKey = key;
        }
        return super.prepare(mapCell, cell);
    }

    initialView() {
        const lat = numberSetting(this.settings.initialLatitude, DEFAULT_CENTRE[0]);
        const lon = numberSetting(this.settings.initialLongitude, DEFAULT_CENTRE[1]);
        return {
            centre: [Math.max(-85, Math.min(85, lat)), Math.max(-180, Math.min(180, lon))],
            zoom: numberSetting(this.settings.initialZoomLevel, DEFAULT_ZOOM)
        };
    }

    placeRows(marker) {
        return [
            // As given, as rounding a place moves it
            [this.settings.lat || "Latitude", String(marker.lat)],
            [this.settings.lon || "Longitude", String(marker.lon)]
        ];
    }

    // What Stroom is told of a selected marker (the fields the legacy map told it)
    selectionItem(marker) {
        const item = { key: marker.key, lat: marker.lat, lon: marker.lon };
        if (marker.name !== null && marker.name !== "") {
            item.name = marker.name;
        }
        if (marker.series !== null && marker.series !== "") {
            item.series = marker.series;
        }
        if (marker.icon !== null) {
            item.icon = marker.icon;
        }
        if (marker.gridSeries !== undefined) {
            item.gridSeries = marker.gridSeries;
        }
        if (marker.time !== null) {
            item.eventTime = new Date(marker.time).toISOString();
        }
        return item;
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.GeoMap = GeoMap;
