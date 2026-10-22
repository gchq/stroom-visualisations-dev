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

// Editing a floor's zones on one map, as the legacy FloorMap did, with the mouse only (Leaflet.draw
// has no keyboard support; this is to be retired in favour of Stroom's own FloorMap documents):
// buttons in Stroom's toolbar (see FloorMap) to draw a new zone, reshape zones, delete them and save
// them; a click on a zone to rename it ('Name #tag #tag'). Leaflet.draw's own toolbar is hidden, its
// tools started by those buttons (see start), but what it asks for while one is in use (e.g. Finish,
// Cancel) is shown at the map's top left. The zones are drawn as Leaflet polygons while they are
// edited, rather than by the map (see FloorMap's prepare). What is done to them is told to the chart
// (`edits`), which changes the zone dictionary and draws every map again.

import "./leafletGlobal.js";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { nameAndTagsText } from "./floors.js";

// A zone as it is drawn while editing (as the map's areas are, see shared/map.css)
const ZONE_STYLE = { color: "#1f4e79", weight: 2, fillColor: "#1f78b4", fillOpacity: 0.12 };

// The draw toolbar's words, for zones rather than shapes (Leaflet.draw's are global)
L.drawLocal.draw.toolbar.buttons.polygon = "Draw a new zone";
L.drawLocal.edit.toolbar.buttons.edit = "Reshape zones";
L.drawLocal.edit.toolbar.buttons.editDisabled = "No zones to reshape";
L.drawLocal.edit.toolbar.buttons.remove = "Delete zones";
L.drawLocal.edit.toolbar.buttons.removeDisabled = "No zones to delete";

export class ZoneEditor {

    // `map` is the cell's Leaflet map; `edits` is {add(points), reshape(index, points),
    // remove(indexes), rename(index, text)}, points being [lat, lng]s on the map
    constructor(map, edits) {
        this.map = map;
        this.edits = edits;
        this.shown = false;
        // Whether a Leaflet.draw tool is in use, while which the zones aren't drawn again (that would
        // take them from under it)
        this.busy = false;
        this.layers = L.featureGroup();
        this.drawControl = new L.Control.Draw({
            position: "topleft",
            draw: {
                polygon: { allowIntersection: false, showArea: false, shapeOptions: ZONE_STYLE },
                polyline: false,
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false
            },
            edit: { featureGroup: this.layers }
        });
        this.statusControl = new StatusControl({ position: "topleft" });
        const latLngsOf = layer => layer.getLatLngs()[0].map(latLng => [latLng.lat, latLng.lng]);
        map.on(L.Draw.Event.CREATED, event => edits.add(latLngsOf(event.layer)));
        map.on(L.Draw.Event.EDITED, event => {
            event.layers.eachLayer(layer => edits.reshape(layer.options.zoneIndex, latLngsOf(layer)));
        });
        map.on(L.Draw.Event.DELETED, event => {
            const indexes = [];
            event.layers.eachLayer(layer => indexes.push(layer.options.zoneIndex));
            if (indexes.length > 0) {
                edits.remove(indexes);
            }
        });
        const start = () => {
            this.busy = true;
        };
        const stop = () => {
            this.busy = false;
        };
        map.on("draw:drawstart draw:editstart draw:deletestart", start);
        map.on("draw:drawstop draw:editstop draw:deletestop", stop);
    }

    // Starts one of Leaflet.draw's tools, as its own (hidden) toolbar's button would: 'polygon' to
    // draw a new zone, 'edit' to reshape zones or 'remove' to delete them. A tool that has nothing to
    // work on (e.g. no zones to reshape) does nothing
    start(tool) {
        const selector = { polygon: ".leaflet-draw-draw-polygon", edit: ".leaflet-draw-edit-edit",
            remove: ".leaflet-draw-edit-remove" }[tool];
        const button = this.shown && selector ? this.drawControl.getContainer().querySelector(selector) : null;
        if (button && !button.classList.contains("leaflet-disabled")) {
            button.click();
        }
    }

    // Shows a floor's zones ([{index, name, tags, latLngs}], see zonesOf) to edit, and whether there
    // are changes to save, and what became of the last save (null for nothing)
    show(zones, unsaved, message) {
        if (!this.shown) {
            this.shown = true;
            this.layers.addTo(this.map);
            this.drawControl.addTo(this.map);
            this.statusControl.addTo(this.map);
        }
        this.statusControl.show(unsaved, message);
        if (this.busy) {
            return;
        }
        this.layers.clearLayers();
        for (const zone of zones) {
            const polygon = L.polygon(zone.latLngs, { ...ZONE_STYLE, zoneIndex: zone.index });
            polygon.bindPopup(() => this.renameForm(zone));
            this.layers.addLayer(polygon);
        }
    }

    // Takes the zones (and Leaflet.draw) off the map
    hide() {
        if (this.shown) {
            this.shown = false;
            this.layers.remove();
            this.drawControl.remove();
            this.statusControl.remove();
        }
    }

    // The form, in a zone's popup, to rename it: its name and #tags in one box
    renameForm(zone) {
        const form = L.DomUtil.create("form", "vis-floor-map__rename");
        const label = L.DomUtil.create("label", "vis-floor-map__rename-label", form);
        label.append("Name and #tags");
        const input = L.DomUtil.create("input", "vis-floor-map__rename-input", label);
        input.type = "text";
        input.value = nameAndTagsText(zone);
        const button = L.DomUtil.create("button", "vis-floor-map__rename-button", form);
        button.type = "submit";
        button.textContent = "Rename";
        form.addEventListener("submit", event => {
            event.preventDefault();
            this.map.closePopup();
            this.edits.rename(zone.index, input.value);
        });
        return form;
    }
}

// Whether there are changes to save, and what became of the last save, at the map's top left (the
// Save zones button is in Stroom's toolbar); shown only when there is something to say
const StatusControl = L.Control.extend({

    onAdd() {
        this.element = L.DomUtil.create("div", "vis-floor-map__save leaflet-bar");
        this.status = L.DomUtil.create("span", "vis-floor-map__save-status", this.element);
        this.status.setAttribute("role", "status");
        L.DomEvent.disableClickPropagation(this.element);
        L.DomEvent.disableScrollPropagation(this.element);
        return this.element;
    },

    // Whether there are changes to save, and what became of the last save ({text, failed}, or null)
    show(unsaved, message) {
        if (!this.element) {
            return;
        }
        this.status.textContent = message ? message.text : (unsaved ? "Unsaved changes" : "");
        this.status.classList.toggle("vis-floor-map__save-status--failed", Boolean(message && message.failed));
        this.element.classList.toggle("vis-floor-map__save--empty", this.status.textContent === "");
    }
});
