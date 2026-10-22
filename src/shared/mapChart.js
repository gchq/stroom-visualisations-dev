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

// What the maps (GeoMap, FloorMap) share: a Leaflet map in each cell of the grid, which pans and
// zooms with the mouse and keyboard (Leaflet's own), and over it a marker for each row, drawn by d3,
// in its series' dashboard colour (or, if asked, its time's colour, edged in its series'), shaped by
// its icon value. The markers are reachable from the keyboard (Stroom's stroom.points), a series at
// a time, with Stroom's tooltips rather than Leaflet's popups, and can be selected.
//
// A map extends MapChart with: markersOf(rows, seriesKey) giving {markers, left} (markers each
// {key, name, time, icon, series} with whatever latLngOf needs); latLngOf(marker); addLayers(map)
// adding what is under the markers (e.g. tiles); initialView(); placeRows(marker) for its tooltip;
// selectionItem(marker); mapName(); and perhaps mapOptions() for Leaflet (e.g. its CRS), and
// prepare(mapCell, cell) and areaTooltip(area) to show only some of a cell's markers, with areas.

import "leaflet/dist/leaflet.css";
import "./map.css";
import { select, symbol, symbolCircle, symbolCross, symbolDiamond, symbolSquare, symbolStar, symbolTriangle,
    symbolWye } from "d3";
import L from "leaflet";
import { Chart } from "./chart.js";
import { textColourOn } from "./colour.js";
import { distinct, keyOf } from "./data.js";
import { formatKey, formatValue } from "./format.js";
import { ICONS, iconOf } from "./mapIcons.js";
import { shapesFor, timeColour, timeExtent, timeShare } from "./mapMarkers.js";
import { isTrue } from "./settings.js";

// The d3 symbol of each shape, as big as a circle 10 pixels across
const SYMBOL_SIZE = 80;
// How the map is moved from the keyboard, as its name for screen readers ends
const MAP_KEYS = "Arrow keys pan the map, plus and minus zoom it";
// How far from its middle a marker can be pointed at, 24 pixels across (WCAG 2.5.8)
const HIT_RADIUS = 12;
// How far outside what is pointed at a selected marker's ring is
const RING_GAP = 3;
// A marker with an icon: a round badge 24 pixels across (as big as what is pointed at), the icon 16
// pixels across on it (its 16 by 16 grid, see mapIcons.js)
const BADGE_RADIUS = 12;
const ICON_SIZE = 16;
const SYMBOLS = {
    circle: symbolCircle,
    square: symbolSquare,
    triangle: symbolTriangle,
    diamond: symbolDiamond,
    star: symbolStar,
    cross: symbolCross,
    wye: symbolWye
};
// When fitting the map to its markers, the room around them and the most it zooms in
const FIT_PADDING = 24;
const FIT_MAX_ZOOM = 16;

export class MapChart extends Chart {

    constructor() {
        super((body, chart) => new MapCell(body, chart), "series");
    }

    // Whether the markers are coloured by their time, as the setting says (and there are times)
    colourByTime(extent) {
        return extent !== null && Boolean(this.settings.eventTime)
               && isTrue(this.settings.isColourByEventTimeEnabled, true);
    }

    // A series' name as shown, e.g. 'No Van' for markers without one
    seriesName(series) {
        return this.seriesLabel(series === null || series === undefined ? null : series);
    }

    // A time as shown
    timeWords(time) {
        return formatValue(time, "DATE_TIME");
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const cells = this.data.values.filter(cell => Array.isArray(cell.values)).map(cell => {
            let left = 0;
            const markers = cell.values.filter(node => node && Array.isArray(node.values)).flatMap(node => {
                const result = this.markersOf(node.values, node.key === undefined ? null : node.key);
                left += result.left;
                return result.markers;
            });
            return { cell, markers, left };
        });
        if (cells.length === 0) {
            cells.push({ cell: { key: null }, markers: [], left: 0 });
        }
        // In a grid of maps, each marker is its cell's own (its key, and when it is selected, which
        // cell it is in), so that a marker in one cell isn't taken for one in another
        if (cells.length > 1) {
            cells.forEach(({ cell, markers }) => markers.forEach(marker => {
                marker.gridSeries = keyOf(cell);
                marker.key = marker.gridSeries + "~#~" + marker.key;
            }));
        }
        const all = cells.flatMap(({ markers }) => markers);

        // Each series has the dashboard's colour for it, and the legend can hide it
        const seriesKeys = distinct(all.map(marker => String(marker.series)));
        const colourOf = this.colours.of(settings.series, seriesKeys);
        const hasSeries = Boolean(settings.series);
        this.legend.setItems(hasSeries
            ? seriesKeys.map(key => ({ key, label: this.seriesName(all.find(marker => String(marker.series) === key).series),
                colour: colourOf(key) }))
            : []);
        const extent = timeExtent(all);
        const byTime = this.colourByTime(extent);
        // An icon value that names an icon shows it; the others give their markers shapes
        const shapes = shapesFor(all.map(marker => marker.icon).filter(icon => iconOf(icon) === null));

        this.grid.update(cells.map(({ cell, markers, left }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
            markers: markers.filter(marker => !this.legend.isHidden(String(marker.series))),
            left,
            shapeOf: marker => marker.icon === null ? "circle" : shapes.get(marker.icon),
            iconOf: marker => iconOf(marker.icon),
            fillOf: marker => byTime && marker.time !== null
                ? timeColour(timeShare(marker.time, extent))
                : colourOf(String(marker.series)),
            edgeOf: marker => byTime && hasSeries ? colourOf(String(marker.series)) : null,
            extent: byTime ? extent : null,
            gridCellCount: cells.length
        })));
    }

    // Leaflet's options for each map
    mapOptions() {
        return {};
    }

    // What a cell's map shows of its markers, as {markers, areas, label, note}: here all its markers
    // and no areas, the map fitted to them (as the setting says). A map with more to it (e.g.
    // floors) shows what it chooses, with a label for the screen reader's description, and areas
    // ({key, latLngs, ...} for areaTooltip) under the markers, and a note to say if something is wrong
    prepare(mapCell, cell) {
        mapCell.showView(cell.markers);
        return { markers: cell.markers, areas: [], label: null, note: null };
    }

    // The tooltip of an area (see prepare)
    areaTooltip(area) {
        return { title: area.name, rows: [] };
    }
}

// The map in one cell of the grid
class MapCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.container = select(body).append("div").attr("class", "vis-map").node();
        this.map = L.map(this.container, { ...chart.mapOptions(), keyboard: true, attributionControl: true,
            zoomControl: false });
        this.container.setAttribute("aria-label", "Map. " + MAP_KEYS);
        this.addButtons();
        chart.addLayers(this.map);
        // Leaflet only adds layers (and so makes the renderer's SVG, below) once the map has a view
        const view = chart.initialView();
        this.map.setView(view.centre, view.zoom, { animate: false });
        // The markers are drawn in the SVG of a Leaflet renderer, whose coordinates are Leaflet's
        // layer points, and are put in their places again whenever the map has zoomed
        this.renderer = L.svg({ padding: 0.5 }).addTo(this.map);
        this.svg = select(this.renderer._container).classed("vis-map__overlay", true);
        // Areas (e.g. a floor's zones) are under the markers
        this.areasGroup = this.svg.append("g").attr("class", "vis-map__areas");
        this.markersGroup = this.svg.append("g").attr("class", "vis-map__markers");
        this.map.on("zoomend viewreset", () => this.place());
        // A click on the map, not on a marker (Leaflet doesn't count a drag to pan it as one),
        // selects nothing
        this.map.on("click", event => {
            const target = event.originalEvent && event.originalEvent.target;
            if (!target || !target.closest || !target.closest(".vis-map__marker, .vis-map__area")) {
                chart.selection.clear();
            }
        });
        // Said over the map when there are no markers, or something is wrong (the description says
        // it too)
        this.note = select(body).append("div")
            .attr("class", "vis-map__empty")
            .attr("aria-hidden", "true")
            .node();
        this.timeKey = null;
        this.fitted = null;
        this.planBounds = null;
        this.highlighted = null;
        this.summary = "Map";
        const isArea = element => element.classList.contains("vis-map__area");
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-map__area, .vis-map__marker",
                // The areas are a group, and each series' markers are one
                group: element => isArea(element) ? "\u0000areas" : String(element.__data__.series),
                tooltip: element => isArea(element) ? chart.areaTooltip(element.__data__) : this.tooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    // A marker reached from the keyboard is brought into view
                    if (element !== null && element === document.activeElement && !isArea(element)) {
                        this.map.panInside(chart.latLngOf(element.__data__), { padding: [FIT_PADDING, FIT_PADDING] });
                    }
                    this.showHighlight();
                },
                // Only markers are selected
                select: (element, event) => {
                    if (!isArea(element)) {
                        chart.selection.choose(chart.selectionItem(element.__data__), event);
                    }
                },
                summary: () => this.summary
            })
            : null;
    }

    draw(cell) {
        this.cell = cell;
        const chart = this.chart;
        this.map.invalidateSize();
        // What is shown of the cell, as the map says (e.g. only one floor's markers)
        const shown = chart.prepare(this, cell);
        this.shown = shown;

        this.areasGroup.selectAll("path.vis-map__area")
            .data(shown.areas, area => area.key)
            .join("path")
            .attr("class", "vis-map__area leaflet-interactive");
        // Each marker: its shape, as small as a dot 10 pixels across, or its icon on a badge, over a
        // clear circle 24 pixels across that is what the mouse points at and the focus ring goes
        // round, so that it is big enough to point at (WCAG 2.5.8). Its colours are the group's,
        // which the shape and badge take; an icon is black or white, to read on its badge
        const path = symbol().size(SYMBOL_SIZE);
        const markers = this.markersGroup.selectAll("g.vis-map__marker")
            .data(shown.markers, marker => marker.key)
            .join(enter => {
                const marker = enter.append("g").attr("class", "vis-map__marker");
                // A ring round a selected marker, outside the edge the one shown has
                marker.append("circle").attr("class", "vis-map__ring").attr("r", HIT_RADIUS + RING_GAP);
                marker.append("circle").attr("class", "vis-map__hit").attr("r", HIT_RADIUS);
                marker.append("path").attr("class", "vis-map__shape");
                marker.append("circle").attr("class", "vis-map__badge");
                marker.append("path")
                    .attr("class", "vis-map__icon")
                    .attr("transform", "translate(" + (-ICON_SIZE / 2) + "," + (-ICON_SIZE / 2) + ") scale("
                                       + (ICON_SIZE / 16) + ")");
                return marker;
            })
            .style("fill", marker => cell.fillOf(marker))
            .style("stroke", marker => cell.edgeOf(marker))
            .classed("vis-map__marker--edged", marker => cell.edgeOf(marker) !== null);
        markers.select(".vis-map__shape")
            .attr("d", marker => cell.iconOf(marker) === null ? path.type(SYMBOLS[cell.shapeOf(marker)])() : null);
        markers.select(".vis-map__badge").attr("r", marker => cell.iconOf(marker) === null ? 0 : BADGE_RADIUS);
        markers.select(".vis-map__icon")
            .attr("d", marker => cell.iconOf(marker) === null ? null : ICONS[cell.iconOf(marker)])
            .style("stroke", marker => textColourOn(cell.fillOf(marker)));
        this.place();
        this.showTimeKey(cell.extent);
        const note = shown.note || (shown.markers.length === 0 ? "No data" : null);
        this.note.textContent = note || "";
        this.note.hidden = note === null;

        this.summary = this.describe(cell, shown);
        // The map is the first tab stop, so it says what it shows, then how to move it
        this.container.setAttribute("aria-label", this.summary + ". " + MAP_KEYS);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // Puts the markers and areas in their places on the map as it is now
    place() {
        const chart = this.chart;
        this.markersGroup.selectAll("g.vis-map__marker").attr("transform", marker => {
            const point = this.map.latLngToLayerPoint(chart.latLngOf(marker));
            return "translate(" + point.x + "," + point.y + ")";
        });
        this.areasGroup.selectAll("path.vis-map__area").attr("d", area => "M" + area.latLngs
            .map(latLng => {
                const point = this.map.latLngToLayerPoint(latLng);
                return point.x + "," + point.y;
            })
            .join("L") + "Z");
    }

    // The map's view: fitted to some markers when they change (as the setting says), otherwise
    // where the settings say to start, when they change
    showView(markers) {
        const settings = this.chart.settings;
        const fit = isTrue(settings.fitToMarkers, true) && markers.length > 0;
        if (fit) {
            const bounds = L.latLngBounds(markers.map(marker => this.chart.latLngOf(marker)));
            const key = bounds.toBBoxString();
            if (key !== this.fitted) {
                this.fitted = key;
                this.map.fitBounds(bounds, { padding: [FIT_PADDING, FIT_PADDING], maxZoom: FIT_MAX_ZOOM,
                    animate: false });
            }
        } else {
            // Where the settings say to start: the first time, and again when the settings change
            // (but not when the same data is drawn again, which would undo the person's panning)
            const view = this.chart.initialView();
            const key = "view:" + view.centre + ":" + view.zoom;
            if (key !== this.fitted) {
                this.fitted = key;
                this.map.setView(view.centre, view.zoom, { animate: false });
            }
        }
    }

    // Fits the map to some bounds (e.g. a floor plan's), if they aren't the last it was fitted to
    fitTo(bounds) {
        this.planBounds = bounds;
        const key = L.latLngBounds(bounds).toBBoxString();
        if (key !== this.fitted) {
            this.fitted = key;
            this.map.fitBounds(bounds, { animate: false });
        }
    }

    // The map's buttons, at its top left (rather than Leaflet's zoom buttons, which don't look like
    // Stroom's): zoom in, zoom out, and fit the map to its markers. Each is a button in the tab
    // order, named for a screen reader; zoom in and out can't be pressed once the map is as far in
    // or out as it goes
    addButtons() {
        const group = L.DomUtil.create("div", "vis-map__buttons leaflet-control");
        group.setAttribute("role", "group");
        group.setAttribute("aria-label", "Map zoom");
        const button = (name, iconPath, onPress) => {
            const element = L.DomUtil.create("button", "vis-map__button", group);
            element.type = "button";
            element.title = name;
            element.setAttribute("aria-label", name);
            element.innerHTML = "<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><path d=\"" + iconPath + "\"/></svg>";
            element.addEventListener("click", onPress);
            return element;
        };
        const zoomIn = button("Zoom in", "M8 3v10M3 8h10", () => this.map.zoomIn());
        const zoomOut = button("Zoom out", "M3 8h10", () => this.map.zoomOut());
        button("Fit to markers", "M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4", () => this.fitView());
        // The map doesn't take a click or the wheel over the buttons for itself
        L.DomEvent.disableClickPropagation(group);
        L.DomEvent.disableScrollPropagation(group);
        const ButtonsControl = L.Control.extend({ options: { position: "topleft" }, onAdd: () => group });
        new ButtonsControl().addTo(this.map);
        const showLimits = () => {
            zoomIn.disabled = this.map.getZoom() >= this.map.getMaxZoom();
            zoomOut.disabled = this.map.getZoom() <= this.map.getMinZoom();
        };
        this.map.on("zoomend", showLimits);
        showLimits();
    }

    // Fits the map to the markers shown, or with none, to its floor plan if it has one (FloorMap), or
    // else shows where the settings say to start
    fitView() {
        const markers = this.shown ? this.shown.markers : [];
        if (markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(marker => this.chart.latLngOf(marker)));
            this.map.fitBounds(bounds, { padding: [FIT_PADDING, FIT_PADDING], maxZoom: FIT_MAX_ZOOM });
        } else if (this.planBounds) {
            this.map.fitBounds(this.planBounds);
        } else {
            const view = this.chart.initialView();
            this.map.setView(view.centre, view.zoom);
        }
    }

    // A key of the time colours, earliest to latest, at the bottom left of the map, when the markers
    // are coloured by time
    showTimeKey(extent) {
        if (extent === null) {
            if (this.timeKey !== null) {
                this.timeKey.remove();
                this.timeKey = null;
            }
            return;
        }
        if (this.timeKey === null) {
            this.timeKey = new TimeKey({ position: "bottomleft" }).addTo(this.map);
        }
        this.timeKey.show(this.chart.timeWords(extent.min), this.chart.timeWords(extent.max));
    }

    // The tooltip of a marker: its name (or series), series, time, place and icon
    tooltip(marker) {
        const chart = this.chart;
        const settings = chart.settings;
        const series = chart.seriesName(marker.series);
        const name = marker.name !== null && marker.name !== "" ? String(marker.name) : null;
        const rows = [];
        if (settings.series && name !== series) {
            rows.push([settings.series, series]);
        }
        if (marker.time !== null) {
            rows.push([settings.eventTime || "Time", chart.timeWords(marker.time)]);
        }
        rows.push(...chart.placeRows(marker));
        if (marker.icon !== null) {
            rows.push([settings.iconName || "Icon", String(marker.icon)]);
        }
        return { title: name || (settings.series ? series : "Marker"), rows };
    }

    // The map for a screen reader, e.g. 'Map of Van: 10 markers in 2 series, coloured by Time from
    // 07 Sep 2026 09:00 to 10:20', and how many rows had no place. With what is shown (see prepare)
    // named, e.g. a floor, and its areas counted
    describe(cell, shown) {
        const chart = this.chart;
        const settings = chart.settings;
        let text = chart.mapName() + " of " + (settings.name || settings.series || "Name");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (shown.label) {
            text += ", " + shown.label;
        }
        const count = shown.markers.length;
        if (count === 0) {
            text += ": no data";
        } else {
            text += ": " + count + (count === 1 ? " marker" : " markers");
            if (settings.series) {
                const series = distinct(shown.markers.map(marker => String(marker.series))).length;
                text += " in " + series + " series";
            }
            if (cell.extent !== null) {
                text += ", coloured by " + (settings.eventTime || "Time") + " from "
                        + chart.timeWords(cell.extent.min) + " to " + chart.timeWords(cell.extent.max);
            }
        }
        if (shown.areas.length > 0) {
            text += ", " + shown.areas.length + (shown.areas.length === 1 ? " zone" : " zones");
        }
        if (cell.left > 0) {
            text += ", " + cell.left + (cell.left === 1 ? " row" : " rows") + " without a place left out";
        }
        if (shown.note) {
            text += ". " + shown.note;
        }
        return text;
    }

    // Marks the selected markers, and the one shown (hovered or focused)
    showHighlight() {
        if (!this.cell) {
            return;
        }
        const chart = this.chart;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        this.markersGroup.selectAll("g.vis-map__marker").each((marker, index, nodes) => {
            nodes[index].classList.toggle("vis-map__marker--selected",
                chart.selection.has(chart.selectionItem(marker).key));
            nodes[index].classList.toggle("vis-map__marker--shown", nodes[index] === highlighted);
        });
        this.areasGroup.selectAll("path.vis-map__area").each((area, index, nodes) => {
            nodes[index].classList.toggle("vis-map__area--shown", nodes[index] === highlighted);
        });
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.map.remove();
        this.container.remove();
        this.note.remove();
    }
}

// The key of the time colours: a bar from the earliest time's colour to the latest's, with the
// times either end
const TimeKey = L.Control.extend({

    onAdd() {
        this.element = L.DomUtil.create("div", "vis-map__time-key");
        this.element.setAttribute("aria-hidden", "true");
        const bar = L.DomUtil.create("div", "vis-map__time-key-bar", this.element);
        const stops = [0, 0.25, 0.5, 0.75, 1].map(share => timeColour(share));
        bar.style.background = "linear-gradient(to right, " + stops.join(", ") + ")";
        const labels = L.DomUtil.create("div", "vis-map__time-key-labels", this.element);
        this.from = L.DomUtil.create("span", "", labels);
        this.to = L.DomUtil.create("span", "", labels);
        return this.element;
    },

    show(from, to) {
        this.from.textContent = from;
        this.to.textContent = to;
    }
});
