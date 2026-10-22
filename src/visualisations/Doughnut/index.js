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

// A doughnut: a ring of slices, one for each name, each its share of the total, which is in the
// middle, in a grid of doughnuts if a Grid Series field is chosen. A Colour field gives a slice its
// own colour; otherwise it has the dashboard's colour for its name. Stroom makes it with
// `new visualisations.Doughnut()` and calls setData(context, settings, data) with data nested as
// grid cell, then rows of [name, value, colour].
//
// Each slice is reachable from the keyboard (Stroom's stroom.points), going round the ring.

import "../../shared/shared.css";
import "./Doughnut.css";
import { arc, select } from "d3";
import { Chart } from "../../shared/chart.js";
import { distinct, keyOf } from "../../shared/data.js";
import { formatKey, formatShare, formatValue } from "../../shared/format.js";
import { isOutlineStyle } from "../../shared/look.js";
import { inCell, selectedValue } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { pieSlices } from "./slices.js";

// The room around the ring, and beside and above it for the labels when they are shown
const MARGIN = 4;
const LABEL_ROOM = { x: 90, y: 30 };
// How far out from the ring the labels are
const LABEL_OFFSET = 12;
// A slice's label is only shown if it is at least this share of the total, so they don't crowd
const LABEL_MIN_SHARE = 0.05;
// The total in the middle is only shown if the hole is at least this wide
const TOTAL_MIN_RADIUS = 24;

// Whether a value is a colour a browser can draw, e.g. 'red' or '#d62728'
function isColour(value) {
    return typeof value === "string" && value !== "" && typeof CSS !== "undefined" && CSS.supports("color", value);
}

class Doughnut extends Chart {

    constructor() {
        super((body, chart) => new DoughnutCell(body, chart), "names");
    }

    // A slice's name as shown
    nameOf(value) {
        return formatValue(value, this.data.types[0], this.settings.nameDateFormat);
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const data = this.data;
        const settings = this.settings;
        const gridCells = data.values.filter(cell => Array.isArray(cell.values));
        const allRows = gridCells.flatMap(cell => cell.values.filter(Array.isArray));

        // Each name has the dashboard's colour for it, unless a row gives it one of its own
        const names = distinct(allRows.map(row => String(row[0])));
        const dashboardColours = this.colours.of(settings.names, names);
        const ownColours = new Map();
        for (const row of allRows) {
            if (isColour(row[2]) && !ownColours.has(String(row[0]))) {
                ownColours.set(String(row[0]), row[2]);
            }
        }
        const colourOf = name => ownColours.get(name) || dashboardColours(name);
        this.legend.setItems(names.map(name => ({ key: name, label: this.nameOf(name), colour: colourOf(name) })));

        // What is shown of each cell: the names the legend hasn't hidden
        const shownCells = gridCells.map(cell => ({
            cell,
            rows: cell.values.filter(row => Array.isArray(row) && !this.legend.isHidden(String(row[0])))
        }));
        // With nothing to show, a doughnut that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, rows: [] });
        }

        const sort = isTrue(settings.sort, true);
        this.grid.update(shownCells.map(({ cell, rows }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
            ...pieSlices(rows, sort),
            colourOf: slice => isColour(slice.row[2]) ? slice.row[2] : colourOf(String(slice.row[0])),
            gridCellCount: shownCells.length
        })));
    }
}

// The doughnut in one cell of the grid
class DoughnutCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-doughnut");
        this.centre = this.svg.append("g");
        this.slicesGroup = this.centre.append("g").attr("class", "vis-doughnut__slices vis-glow");
        this.labelsGroup = this.centre.append("g").attr("class", "vis-doughnut__labels").attr("aria-hidden", "true");
        this.totalGroup = this.centre.append("g").attr("class", "vis-doughnut__total").attr("aria-hidden", "true");
        this.totalLabel = this.totalGroup.append("text")
            .attr("class", "vis-doughnut__total-label")
            .attr("dy", "-0.6em")
            .text("Total");
        this.totalValue = this.totalGroup.append("text")
            .attr("class", "vis-doughnut__total-value")
            .attr("dy", "0.7em");
        // Said where the ring would be when there are no slices (the description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-doughnut__slice",
                tooltip: slice => this.tooltip(slice.__data__),
                highlight: slice => {
                    this.highlighted = slice;
                    this.showHighlight();
                },
                select: (slice, event) => chart.selection.choose(this.selectionItem(slice.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Doughnut";
    }

    draw(cell) {
        this.cell = cell;
        const settings = this.chart.settings;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        const showLabels = isTrue(settings.showLabels, false);
        const room = showLabels ? LABEL_ROOM : { x: 0, y: 0 };
        const outer = Math.max(0, Math.min(width - 2 * room.x, height - 2 * room.y) / 2 - MARGIN);
        const inner = outer / 2;
        const empty = cell.slices.length === 0;
        this.centre.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(empty ? "No data" : "");

        const outline = isOutlineStyle(settings);
        const look = this.chart.look;
        const path = arc().innerRadius(inner).outerRadius(outer);
        this.slicesGroup.selectAll("path.vis-doughnut__slice")
            .data(cell.slices, slice => slice.id)
            .join("path")
            .attr("class", "vis-doughnut__slice")
            .classed("vis-doughnut__slice--outline", outline)
            .attr("d", path)
            .style("fill", slice => outline ? look.ringFadeFill(cell.colourOf(slice), inner, outer) : cell.colourOf(slice))
            .style("stroke", slice => outline ? cell.colourOf(slice) : null);

        // The total in the middle, where it fits
        this.totalGroup.style("display", !empty && inner >= TOTAL_MIN_RADIUS ? null : "none");
        this.totalValue.text(formatValue(cell.total, this.chart.data.types[1]));

        // Each big enough slice's name, value and share beside it, with a line to it
        const labels = this.labelsGroup.selectAll("g.vis-doughnut__label")
            .data(showLabels ? cell.slices.filter(slice => slice.share >= LABEL_MIN_SHARE) : [], slice => slice.id)
            .join(enter => {
                const label = enter.append("g").attr("class", "vis-doughnut__label");
                label.append("line").attr("class", "vis-doughnut__label-line");
                label.append("text").attr("class", "vis-doughnut__label-name");
                label.append("text").attr("class", "vis-doughnut__label-value").attr("dy", "1.2em");
                return label;
            });
        labels.each((slice, index, nodes) => {
            const middle = (slice.startAngle + slice.endAngle) / 2;
            const x = Math.sin(middle);
            const y = -Math.cos(middle);
            const label = select(nodes[index]);
            label.select("line")
                .attr("x1", x * (outer + 2)).attr("y1", y * (outer + 2))
                .attr("x2", x * (outer + LABEL_OFFSET - 4)).attr("y2", y * (outer + LABEL_OFFSET - 4));
            const anchor = x >= 0 ? "start" : "end";
            label.select(".vis-doughnut__label-name")
                .attr("x", x * (outer + LABEL_OFFSET)).attr("y", y * (outer + LABEL_OFFSET))
                .attr("text-anchor", anchor)
                .text(this.chart.nameOf(slice.row[0]));
            label.select(".vis-doughnut__label-value")
                .attr("x", x * (outer + LABEL_OFFSET)).attr("y", y * (outer + LABEL_OFFSET))
                .attr("text-anchor", anchor)
                .text(formatValue(slice.value, this.chart.data.types[1]) + " (" + formatShare(slice.share) + ")");
        });

        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a slice
    tooltip(slice) {
        const settings = this.chart.settings;
        return {
            title: this.chart.nameOf(slice.row[0]),
            rows: [
                [settings.values || "Value", formatValue(slice.value, this.chart.data.types[1])],
                ["Share", formatShare(slice.share)]
            ]
        };
    }

    // What Stroom is told of a selected slice (as the legacy doughnut told it)
    selectionItem(slice) {
        return inCell({
            key: slice.row[0],
            name: selectedValue(slice.row[0], this.chart.data.types[0]),
            value: slice.value
        }, this.cell);
    }

    // The doughnut for a screen reader, e.g. 'Doughnut of Requests by Status: 4 slices, total
    // 1,828, largest 200 OK 1,200 (65.6%)'
    describe(cell) {
        const settings = this.chart.settings;
        let text = "Doughnut of " + (settings.values || "Value") + " by " + (settings.names || "Name");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (cell.slices.length === 0) {
            return text + ": no data";
        }
        const types = this.chart.data.types;
        const largest = cell.slices.reduce((best, slice) => slice.value > best.value ? slice : best);
        return text + ": " + cell.slices.length + (cell.slices.length === 1 ? " slice" : " slices")
               + ", total " + formatValue(cell.total, types[1])
               + ", largest " + this.chart.nameOf(largest.row[0]) + " " + formatValue(largest.value, types[1])
               + " (" + formatShare(largest.share) + ")";
    }

    // Fades every slice but the one shown and those selected
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        this.slicesGroup.selectAll("path.vis-doughnut__slice").each((slice, index, nodes) => {
            const element = nodes[index];
            const selected = selection.has(this.selectionItem(slice).key);
            const faded = highlighted !== null
                ? element !== highlighted && !selected
                : !selection.isEmpty() && !selected;
            element.classList.toggle("vis-doughnut__slice--faded", faded);
            element.classList.toggle("vis-doughnut__slice--selected", selected);
        });
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Doughnut = Doughnut;
