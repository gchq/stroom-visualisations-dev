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

// A floor plan with a marker where each row was on it, in a grid of plans if a Grid Series field is
// chosen (see shared/mapChart.js). The plans, and any zones drawn on them, are in the FloorMap
// Config JSON setting (see floors.js); a map shows one floor at a time, chosen from a list when
// its markers are on more than one. Stroom makes it with `new visualisations.FloorMap()` and calls
// setData(context, settings, data) with data nested as grid cell, then series, then rows of [name,
// campus, building, floor, x, y, event time, icon, series, grid series].
//
// The zones are shown, named; with the Enable Zone Editing setting, a floor's zones held in a Stroom
// dictionary can be edited with the mouse and saved to it, as the legacy FloorMap allowed (see
// zoneEditor.js).

import "../../shared/shared.css";
import "./FloorMap.css";
import L from "leaflet";
import { MapChart } from "../../shared/mapChart.js";
import { formatDate, formatNumber } from "../../shared/format.js";
import { isTrue } from "../../shared/settings.js";
import { floorLabel, floorMarkers, floorZoneList, nameAndTagsOf, parseConfig, pointOf, savedDictionary,
    stroomBaseOf, zoneSource, zonesOf } from "./floors.js";
import { ZoneEditor } from "./zoneEditor.js";

// The longest a reason for a save failing is shown, in characters
const MAX_REASON_LENGTH = 200;
// The ids of the zone tools' buttons in Stroom's toolbar (see showZoneTools)
const ZONE_TOOLS = ["zoneDraw", "zoneReshape", "zoneDelete", "zoneSave"];

class FloorMap extends MapChart {

    constructor() {
        super();
        // Each zone dictionary by where it is read from: {state: 'loading', 'loaded' or 'failed',
        // zones}, shared by every cell's map
        this.zoneDictionaries = new Map();
    }

    redraw() {
        this.config = parseConfig(this.settings.config);
        super.redraw();
    }

    markersOf(rows, seriesKey) {
        const result = floorMarkers(rows, seriesKey, this.config.config);
        return { markers: result.markers, left: result.left + result.unplanned };
    }

    latLngOf(marker) {
        return marker.latLng;
    }

    mapName() {
        return "Floor plan";
    }

    mapOptions() {
        // A plan is in its own units, and may be much bigger or smaller than the map's pixels
        return { crs: L.CRS.Simple, minZoom: -5, maxZoom: 5, zoomSnap: 0.25 };
    }

    // The plan is per floor, so is added when a floor is shown (see prepare)
    addLayers() {
    }

    initialView() {
        return { centre: [0, 0], zoom: 0 };
    }

    // A time as shown: in the Event Time Display Format setting (a d3 time format) if there is one
    timeWords(time) {
        return formatDate(time, this.settings.dateFormat || undefined);
    }

    placeRows(marker) {
        return [
            ["Floor", floorLabel(marker.floor)],
            [this.settings.xPos || "X", formatNumber(marker.x)],
            [this.settings.yPos || "Y", formatNumber(marker.y)]
        ];
    }

    // What Stroom is told of a selected marker (the fields the legacy map told it, with y as in the
    // row rather than turned over for a plan whose origin is its top left)
    selectionItem(marker) {
        const item = { key: marker.key, x: marker.x, y: marker.y, campus: marker.floor.campus,
            building: marker.floor.building, floor: marker.floor.floor };
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

    // One floor of the cell: the one chosen, or the first with markers, its plan under its markers
    // and zones, and a list to choose another when there are more
    prepare(mapCell, cell) {
        // Each series' rows have floors of their own, so a floor is known by its key
        const floors = [];
        for (const marker of cell.markers) {
            if (!floors.some(floor => floor.key === marker.floor.key)) {
                floors.push(marker.floor);
            }
        }
        const floor = floors.find(candidate => candidate.key === mapCell.floorKey) || floors[0] || null;
        mapCell.floorKey = floor === null ? null : floor.key;
        this.showFloorChoice(mapCell, floors, floor);
        this.showPlan(mapCell, floor);

        let areas = [];
        let note = this.config.error;
        let editing = false;
        if (floor !== null && floor.plan.zones !== null) {
            const dictionary = this.zoneDictionary(floor.plan.zones, () => mapCell.draw(mapCell.cell));
            if (dictionary.state === "loaded") {
                const zones = zonesOf(dictionary.zones, floor);
                // Zones read from a static URL can't be saved, so aren't edited
                editing = isTrue(this.settings.isEditZoneModeEnabled, false) && !dictionary.isStatic;
                if (editing) {
                    this.showZoneEditor(mapCell, dictionary, floor, zones);
                } else {
                    areas = zones;
                }
            } else if (dictionary.state === "failed") {
                note = note || "The zones of this floor couldn't be loaded";
            }
        }
        if (!editing) {
            this.hideZoneEditor(mapCell);
        }
        return {
            markers: floor === null ? [] : cell.markers.filter(marker => marker.floor.key === floor.key),
            areas,
            label: floor === null ? null : floorLabel(floor),
            note
        };
    }

    // The list of floors, at the top right, when there is more than one
    showFloorChoice(mapCell, floors, floor) {
        if (floors.length < 2) {
            if (mapCell.floorChoice) {
                mapCell.floorChoice.remove();
                mapCell.floorChoice = null;
            }
            return;
        }
        if (!mapCell.floorChoice) {
            mapCell.floorChoice = new FloorChoice({ position: "topright" }).addTo(mapCell.map);
            mapCell.floorChoice.onChoose(key => {
                mapCell.floorKey = key;
                mapCell.draw(mapCell.cell);
            });
        }
        mapCell.floorChoice.show(floors, floor);
    }

    // The floor's plan as the map's image, fitted to the map when the floor changes
    showPlan(mapCell, floor) {
        const key = floor === null ? null : floor.key;
        if (mapCell.planKey === key) {
            return;
        }
        if (mapCell.plan) {
            mapCell.plan.remove();
            mapCell.plan = null;
        }
        mapCell.planKey = key;
        if (floor !== null) {
            const bounds = [[0, 0], [floor.plan.height, floor.plan.width]];
            mapCell.plan = L.imageOverlay(floor.plan.image, bounds, { alt: "Plan of " + floorLabel(floor) })
                .addTo(mapCell.map);
            mapCell.fitTo(bounds);
        }
    }

    // Shows the zone editor on a map, editing a floor's zones ([{index, ...}], see zonesOf) in a zone
    // dictionary
    showZoneEditor(mapCell, dictionary, floor, zones) {
        // What the map's editor edits, as it is now (the floor changes when another is chosen)
        mapCell.zonesEdited = { dictionary, floor };
        if (!mapCell.zoneEditor) {
            const zoneList = () => floorZoneList(mapCell.zonesEdited.dictionary.zones, mapCell.zonesEdited.floor);
            const pointsOf = latLngs => latLngs.map(latLng => pointOf(latLng, mapCell.zonesEdited.floor.plan));
            const changed = () => this.zonesChanged(mapCell.zonesEdited.dictionary);
            mapCell.zoneEditor = new ZoneEditor(mapCell.map, {
                add: latLngs => {
                    zoneList().push({ name: "Unnamed zone", tags: [], points: pointsOf(latLngs) });
                    changed();
                },
                reshape: (index, latLngs) => {
                    zoneList()[index].points = pointsOf(latLngs);
                    changed();
                },
                remove: indexes => {
                    // From the last, so that the others are still where they were
                    [...indexes].sort((a, b) => b - a).forEach(index => zoneList().splice(index, 1));
                    changed();
                },
                rename: (index, text) => {
                    Object.assign(zoneList()[index], nameAndTagsOf(text));
                    changed();
                }
            });
        }
        mapCell.zoneEditor.show(zones, dictionary.changes !== dictionary.savedChanges, dictionary.message);
        // The zone tools in Stroom's toolbar act on the first map editing zones
        if (!this.zoneToolsCell || !this.cells.has(this.zoneToolsCell) || !this.zoneToolsCell.zoneEditor.shown) {
            this.zoneToolsCell = mapCell;
        }
        if (this.zoneToolsCell === mapCell) {
            this.showZoneTools(dictionary);
        }
    }

    // A map no longer edits zones (e.g. the setting was turned off, or another floor is shown): Stroom's
    // toolbar no longer has the zone tools if they acted on it
    hideZoneEditor(mapCell) {
        if (mapCell.zoneEditor) {
            mapCell.zoneEditor.hide();
        }
        if (this.zoneToolsCell === mapCell) {
            this.zoneToolsCell = null;
            ZONE_TOOLS.forEach(id => this.toolbar.remove(id));
        }
    }

    // The zone tools in Stroom's toolbar (rather than Leaflet.draw's own, on the map): draw a new
    // zone, reshape zones, delete zones (each one of Leaflet.draw's tools, see ZoneEditor's start),
    // and save the zones of a zone dictionary
    showZoneTools(dictionary) {
        const start = tool => () => {
            if (this.zoneToolsCell) {
                this.zoneToolsCell.zoneEditor.start(tool);
            }
        };
        this.toolbar.set({ id: "zoneDraw", title: "Draw a new zone", icon: "ADD" }, start("polygon"));
        this.toolbar.set({ id: "zoneReshape", title: "Reshape zones", icon: "EDIT" }, start("edit"));
        this.toolbar.set({ id: "zoneDelete", title: "Delete zones", icon: "DELETE" }, start("remove"));
        // Save zones can't be pressed with nothing to save (nor while saving)
        const unsaved = dictionary.changes !== dictionary.savedChanges && !dictionary.saving;
        this.toolbar.set({ id: "zoneSave", title: "Save zones", icon: "SAVE", enabled: unsaved },
            () => this.saveZones(dictionary));
    }

    // A zone dictionary's zones were changed: every map shows them as they are now
    zonesChanged(dictionary) {
        dictionary.changes++;
        dictionary.message = null;
        this.drawCells();
    }

    // Draws every map again (e.g. to show a dictionary's zones as they are now)
    drawCells() {
        this.cells.forEach(mapCell => mapCell.draw(mapCell.cell));
    }

    // Saves a zone dictionary's zones to Stroom (with the X-CSRF header Stroom requires of a change
    // made from a browser), keeping the changes unsaved if it fails, and saying what became of it
    saveZones(dictionary) {
        if (dictionary.saving || dictionary.changes === dictionary.savedChanges) {
            return;
        }
        dictionary.saving = true;
        dictionary.message = { text: "Saving…", failed: false };
        const changes = dictionary.changes;
        this.drawCells();
        fetch(dictionary.url, {
            method: "PUT",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json", "X-CSRF": "1" },
            body: JSON.stringify(savedDictionary(dictionary.doc, dictionary.zones))
        })
            .then(response => response.ok
                ? response.json()
                : response.text().then(text => Promise.reject(new Error(reasonOf(text, response)))))
            .then(doc => {
                // Saved as it was when the save began: changes made since are still to be saved
                dictionary.doc = doc;
                dictionary.savedChanges = changes;
                dictionary.message = { text: "Zones saved", failed: false };
            })
            .catch(error => {
                dictionary.message = { text: "The zones couldn't be saved: " + error.message, failed: true };
            })
            .finally(() => {
                dictionary.saving = false;
                this.drawCells();
            });
    }

    // A zone dictionary, read once (`onLoaded()` is called when it has been read, or couldn't be).
    // `changes` counts the changes made to its zones, and `savedChanges` how many had been made when
    // they were last saved
    zoneDictionary(zones, onLoaded) {
        const source = zoneSource(zones, stroomBaseOf(window.location.pathname));
        let dictionary = this.zoneDictionaries.get(source.url);
        if (!dictionary) {
            dictionary = { state: "loading", url: source.url, isStatic: source.isStatic, zones: null, doc: null,
                changes: 0, savedChanges: 0, saving: false, message: null, waiting: [] };
            this.zoneDictionaries.set(source.url, dictionary);
            fetch(source.url, { credentials: "same-origin" })
                .then(response => response.ok ? response.json() : Promise.reject(new Error(response.statusText)))
                .then(content => {
                    dictionary.doc = source.isStatic ? null : content;
                    dictionary.zones = source.isStatic ? content : JSON.parse(content.data || "{}");
                    dictionary.state = "loaded";
                })
                .catch(() => {
                    dictionary.state = "failed";
                })
                .finally(() => {
                    dictionary.waiting.forEach(callback => callback());
                    dictionary.waiting = [];
                });
        }
        if (dictionary.state === "loading") {
            dictionary.waiting.push(onLoaded);
        }
        return dictionary;
    }

    // A zone's tooltip: its name, and its tags if the setting says
    areaTooltip(zone) {
        const rows = isTrue(this.settings.isShowTagsEnabled, false) && zone.tags.length > 0
            ? [["Tags", zone.tags.map(tag => "#" + tag).join(" ")]]
            : [];
        return { title: zone.name, rows };
    }
}

// Why Stroom refused a save, from its reply: the message of a JSON error, or its text, cut short, or
// else its status
function reasonOf(text, response) {
    let reason = text;
    try {
        const json = JSON.parse(text);
        reason = json.message || json.details || text;
    } catch {
        // Not JSON: the text as it is
    }
    reason = String(reason || response.statusText || response.status).trim();
    return reason.length > MAX_REASON_LENGTH ? reason.substring(0, MAX_REASON_LENGTH - 1) + "…" : reason;
}

// The list of floors to choose from
const FloorChoice = L.Control.extend({

    onAdd() {
        this.element = L.DomUtil.create("label", "vis-floor-map__floors leaflet-bar");
        this.element.append("Floor ");
        this.list = L.DomUtil.create("select", "vis-floor-map__floor-list", this.element);
        L.DomEvent.disableClickPropagation(this.element);
        L.DomEvent.disableScrollPropagation(this.element);
        return this.element;
    },

    onChoose(callback) {
        this.list.addEventListener("change", () => callback(this.list.value));
    },

    show(floors, floor) {
        this.list.replaceChildren(...floors.map(candidate => {
            const option = document.createElement("option");
            option.value = candidate.key;
            option.textContent = floorLabel(candidate);
            return option;
        }));
        this.list.value = floor.key;
    }
});

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.FloorMap = FloorMap;
