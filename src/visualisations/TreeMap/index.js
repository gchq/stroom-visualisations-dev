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

// A tree map: a box for each name, as big as its value. With a Series field, each series' boxes
// are in a block headed by its name, the biggest box in the series' colour and the smaller ones
// lighter tints of it; without one, each box has the dashboard's colour for its name. Stroom makes
// it with `new visualisations.TreeMap()` and calls setData(context, settings, data) with data
// nested as series, then rows of [name, value].
//
// Clicking a series' header (or Enter on it) zooms in to the series, its block then filling the tree
// map, and again zooms back out (as the legacy ZoomableTreeMap did), unless the Zoom Into Series
// setting is off. Each header and box is reachable from the keyboard (Stroom's stroom.points): a
// series' header and then its boxes are a group, Left and Right along it, Up and Down between them.

import "../../shared/shared.css";
import "./TreeMap.css";
import { select } from "d3";
import { Chart } from "../../shared/chart.js";
import { DARK_BACKGROUND, LIGHT_BACKGROUND, mix, textColourOn } from "../../shared/colour.js";
import { distinct, hasValue, isNumber, keyOf } from "../../shared/data.js";
import { edgeColour } from "../../shared/edges.js";
import { formatShare, formatValue } from "../../shared/format.js";
import { selectedValue } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { layoutBoxes } from "./boxes.js";

// The room around the tree map
const MARGIN = 6;
// How light a series' smallest box is, tinted towards white
const MAX_TINT = 0.45;
// A box's name is only shown if the box is at least this big, and its value if it is this tall
const MIN_LABEL_WIDTH = 30;
const MIN_LABEL_HEIGHT = 18;
const MIN_VALUE_HEIGHT = 32;

class TreeMap extends Chart {

    constructor() {
        super((body, chart) => new TreeMapCell(body, chart), "series");
    }

    // Whether the boxes are in a block for each series (a Series field is chosen)
    bySeries() {
        return Boolean(this.settings.series);
    }

    // Whether a series' header zooms in to it
    zooms() {
        return this.bySeries() && isTrue(this.settings.zoomSeries, true);
    }

    // A box's name as shown
    nameOf(value) {
        return formatValue(value, this.data.types[0]);
    }

    // Works out what the tree map shows and draws it
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const nameType = this.data.types[0];
        const series = this.data.values.filter(one => Array.isArray(one.values));
        const bySeries = this.bySeries();

        // Coloured as the Series field's values are everywhere on the dashboard, or without one the
        // Names field's
        const legendKeys = bySeries
            ? distinct(series.map(keyOf))
            : distinct(series.flatMap(one => one.values.filter(Array.isArray).map(row => String(row[0]))));
        const colours = this.colours.of(bySeries ? settings.series : settings.names, legendKeys);
        this.legend.setItems(legendKeys.map(key => ({
            key,
            label: bySeries ? this.seriesLabel(key) || "Series" : this.nameOf(key),
            colour: colours(key)
        })));

        // The series (or names) the legend hasn't hidden. A row without a name has nothing to say
        // what it is
        const shown = series
            .filter(one => !bySeries || !this.legend.isHidden(keyOf(one)))
            .map(one => ({
                key: keyOf(one),
                label: this.seriesLabel(one.key),
                rows: one.values.filter(row => Array.isArray(row) && hasValue(row[0], nameType)
                    && (bySeries || !this.legend.isHidden(String(row[0]))))
            }));

        this.grid.update([{
            key: "",
            label: "Tree map",
            series: shown,
            colourOf: box => colours(bySeries ? box.seriesKey : String(box.row[0]))
        }]);
    }
}

// The tree map, in the grid's one cell
class TreeMapCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.root = select(body).append("div").attr("class", "vis-chart vis-treemap");
        this.emptyText = this.root.append("div").attr("class", "vis-treemap__empty").attr("aria-hidden", "true");
        this.highlighted = null;
        // The key of the series zoomed in to, or null for them all
        this.zoomKey = null;
        const isHeader = element => element.classList.contains("vis-treemap__header");
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.root.node(), {
                selector: ".vis-treemap__header--zoomable, .vis-treemap__box",
                group: element => isHeader(element) ? element.__data__.key : element.__data__.seriesKey,
                tooltip: element => isHeader(element) ? this.headerTooltip(element.__data__) : this.tooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    this.showHighlight();
                },
                select: (element, event) => {
                    if (isHeader(element)) {
                        this.zoomTo(this.zoomKey === null ? element.__data__.key : null);
                    } else {
                        chart.selection.choose(this.selectionItem(element.__data__), event);
                    }
                },
                // A series' header zooms in to it, or back out, when pressed: a button, saying
                // whether it is zoomed in (expanded)
                role: element => isHeader(element) ? "button" : "img",
                summary: () => this.summary
            })
            : null;
        this.summary = "Tree map";
    }

    draw(cell) {
        this.cell = cell;
        const settings = this.chart.settings;
        const node = this.root.node();
        const width = node.clientWidth;
        const height = node.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        const bySeries = this.chart.bySeries();
        const zooms = this.chart.zooms();
        // Zoomed in to a series that is still there, only it is laid out, filling the tree map
        if (!zooms || !cell.series.some(one => one.key === this.zoomKey)) {
            this.zoomKey = null;
        }
        const series = this.zoomKey === null ? cell.series : cell.series.filter(one => one.key === this.zoomKey);
        const { blocks, boxes } = layoutBoxes(series, bySeries, settings.mode, width - 2 * MARGIN, height - 2 * MARGIN);
        this.total = boxes.reduce((sum, box) => sum + box.row[1], 0);
        this.boxes = boxes;
        this.emptyText.text(boxes.length === 0 ? "No data" : "");

        const place = selection => selection
            .style("left", one => MARGIN + one.x0 + "px")
            .style("top", one => MARGIN + one.y0 + "px")
            .style("width", one => one.x1 - one.x0 + "px")
            .style("height", one => one.y1 - one.y0 + "px");

        // Each series' block, headed by its name in the theme's text colour beside a swatch of its
        // colour, so that the header reads on any background; the header zooms in to the series
        // (+) or back out (−)
        this.root.selectAll("div.vis-treemap__block")
            .data(blocks, block => block.key)
            .join(enter => {
                const block = enter.append("div").attr("class", "vis-treemap__block");
                const header = block.append("div").attr("class", "vis-treemap__header");
                header.append("span").attr("class", "vis-treemap__swatch").attr("aria-hidden", "true");
                header.append("span").attr("class", "vis-treemap__series").attr("aria-hidden", "true");
                header.append("span").attr("class", "vis-treemap__zoom").attr("aria-hidden", "true");
                return block;
            })
            .call(place)
            .call(block => block.select(".vis-treemap__header")
                .classed("vis-treemap__header--zoomable", zooms)
                .classed("vis-treemap__header--zoomed", this.zoomKey !== null)
                .attr("aria-expanded", zooms ? String(this.zoomKey !== null) : null))
            .call(block => block.select(".vis-treemap__swatch")
                .style("background-color", one => cell.colourOf({ seriesKey: one.key, row: [one.key] })))
            .call(block => block.select(".vis-treemap__series").text(one => one.label || "Series"))
            .call(block => block.select(".vis-treemap__zoom").text(!zooms ? "" : this.zoomKey === null ? "+" : "−"))
            .order();

        // The boxes, in their series' order, the biggest of each first, so that each series is a
        // group for the keyboard
        const colourOf = box => {
            const base = cell.colourOf(box);
            return bySeries && box.of > 1 ? mix(base, "#ffffff", MAX_TINT * box.rank / (box.of - 1)) : base;
        };
        this.root.selectAll("div.vis-treemap__box")
            .data(boxes, box => box.id)
            .join(enter => {
                const box = enter.append("div").attr("class", "vis-treemap__box");
                box.append("div").attr("class", "vis-treemap__name").attr("aria-hidden", "true");
                box.append("div").attr("class", "vis-treemap__value").attr("aria-hidden", "true");
                return box;
            })
            .call(place)
            .classed("vis-treemap__box--no-label", box => box.x1 - box.x0 < MIN_LABEL_WIDTH || box.y1 - box.y0 < MIN_LABEL_HEIGHT)
            .classed("vis-treemap__box--no-value", box => box.y1 - box.y0 < MIN_VALUE_HEIGHT)
            // Its colours as custom properties, so that a faded box can fade only its background
            .style("--vis-treemap__colour", colourOf)
            // A box too pale to show against the background by itself (a small one, tinted towards
            // white) is edged in a deeper shade of its colour (see edges.js)
            .style("--vis-treemap__edge", box => edgeColour(colourOf(box),
                this.chart.isDarkTheme() ? DARK_BACKGROUND : LIGHT_BACKGROUND))
            .style("--vis-treemap__text", box => textColourOn(colourOf(box)))
            .call(box => box.select(".vis-treemap__name").text(one => this.chart.nameOf(one.row[0])))
            .call(box => box.select(".vis-treemap__value").text(one => formatValue(one.row[1], this.chart.data.types[1])))
            .order();

        this.summary = this.describe(boxes);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // Zooms in to a series (by its key), or back out to them all (null), keeping the keyboard's focus
    // on its header, which stays where it was in the document
    zoomTo(key) {
        this.zoomKey = key;
        this.highlighted = null;
        this.draw(this.cell);
    }

    // The tooltip of a series' header: its boxes, total and share of the whole map, and whether it is
    // shown on its own
    headerTooltip(block) {
        const boxes = this.boxes.filter(box => box.seriesKey === block.key);
        const total = boxes.reduce((sum, box) => sum + box.row[1], 0);
        const all = this.cell.series.reduce((sum, one) => sum + one.rows
            .filter(row => isNumber(row[1]) && row[1] > 0)
            .reduce((rowSum, row) => rowSum + row[1], 0), 0);
        const rows = [
            ["Boxes", String(boxes.length)],
            [this.chart.settings.values || "Value", formatValue(total, this.chart.data.types[1])],
            ["Share", formatShare(all > 0 ? total / all : 0)]
        ];
        if (this.zoomKey !== null) {
            rows.push(["Shown", "on its own"]);
        }
        return { title: block.label || "Series", rows };
    }

    // The tooltip of a box: its name, value and share of the whole map
    tooltip(box) {
        const settings = this.chart.settings;
        return {
            title: this.chart.bySeries() ? box.seriesLabel || "Series" : null,
            rows: [
                [settings.names || "Name", this.chart.nameOf(box.row[0])],
                [settings.values || "Value", formatValue(box.row[1], this.chart.data.types[1])],
                ["Share", formatShare(box.row[1] / this.total)]
            ]
        };
    }

    // What Stroom is told of a selected box
    selectionItem(box) {
        return {
            key: box.seriesKey + "~#~" + box.row[0],
            name: selectedValue(box.row[0], this.chart.data.types[0]),
            series: box.seriesKey,
            value: box.row[1]
        };
    }

    // The tree map for a screen reader, e.g. 'Tree map of Requests by Status: 12 boxes in 3 series,
    // largest Requests 1,380 (200 OK, db-01)'
    describe(boxes) {
        const settings = this.chart.settings;
        const valueField = settings.values || "Value";
        const text = "Tree map of " + valueField + " by " + (settings.names || "Name");
        if (boxes.length === 0) {
            return text + ": no data";
        }
        const seriesCount = distinct(boxes.map(box => box.seriesKey)).length;
        const largest = boxes.reduce((best, box) => box.row[1] > best.row[1] ? box : best);
        const what = [this.chart.nameOf(largest.row[0])];
        if (this.chart.bySeries() && largest.seriesLabel) {
            what.push(largest.seriesLabel);
        }
        return text + ": " + boxes.length + (boxes.length === 1 ? " box" : " boxes")
               + (this.chart.bySeries() && seriesCount > 1 ? " in " + seriesCount + " series" : "")
               + ", largest " + valueField + " " + formatValue(largest.row[1], this.chart.data.types[1])
               + " (" + what.join(", ") + ")"
               + (this.zoomKey !== null ? ", showing " + (largest.seriesLabel || "Series") + " on its own" : "");
    }

    // Fades every box but the one shown and those selected; with a series' header shown, every box
    // but its series'
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const header = highlighted !== null && highlighted.classList.contains("vis-treemap__header") ? highlighted : null;
        this.root.selectAll("div.vis-treemap__box").each((box, index, nodes) => {
            const element = nodes[index];
            const selected = selection.has(this.selectionItem(box).key);
            const shown = header !== null ? box.seriesKey === header.__data__.key : element === highlighted;
            const faded = highlighted !== null
                ? !shown && !selected
                : !selection.isEmpty() && !selected;
            element.classList.toggle("vis-treemap__box--faded", faded);
            element.classList.toggle("vis-treemap__box--selected", selected);
        });
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.root.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.TreeMap = TreeMap;
