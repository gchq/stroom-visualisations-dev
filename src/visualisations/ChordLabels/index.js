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

// A chord diagram: each source and target name an arc round a ring, as long as its counts out and
// in, with an arrow of a ribbon from each source to each target, as wide as their count, in the
// source's colour; in a grid of diagrams if a Grid Series field is chosen.
// Stroom makes it with `new visualisations.ChordLabels()` and calls setData(context, settings, data)
// with data nested as grid cell, then rows of [source, target, count].
//
// The arcs, going round the ring, then the ribbons, widest first, are reachable from the keyboard
// (Stroom's stroom.points): Left/Right step through them and Up/Down cross between the two. The
// wheel (or + and −) zooms and dragging pans; a double click (or 0) puts it back (shared/panZoom.js).

import "../../shared/shared.css";
import "./ChordLabels.css";
import { arc, ribbonArrow, select } from "d3";
import { Chart } from "../../shared/chart.js";
import { distinct, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { shortened } from "../../shared/fit.js";
import { PanZoom } from "../../shared/panZoom.js";
import { inCell } from "../../shared/selection.js";
import { chordLayout, flowCount, flowsOf, largestFlow, nameTotals, padAngleOf } from "./chords.js";

// The room around the diagram
const MARGIN = 4;
// How far out from the ring the names are
const LABEL_OFFSET = 6;
// A name is about this wide a character, at the labels' font size (11px)
const CHARACTER_WIDTH = 6.6;
// The names take at most this share of the diagram's width
const MAX_LABEL_SHARE = 0.22;
// An arc's name is only shown if the arc is at least this long, so the names don't overlap
const MIN_LABEL_ARC = 12;
// How thick the ring is, as a share of its radius, but no thinner than the least
const RING_SHARE = 0.08;
const MIN_RING = 8;

class ChordLabels extends Chart {

    constructor() {
        super((body, chart) => new ChordCell(body, chart), "source");
    }

    // A name as shown: as a value of the source field if it is ever a source, otherwise of the target
    // field (whose type may differ, e.g. a date)
    nameOf(value) {
        const asTarget = this.targetOnly && this.targetOnly.has(String(value));
        return formatValue(value, this.data.types[asTarget ? 1 : 0]);
    }

    // What the counts are called, e.g. 'Emails'
    countName() {
        return this.settings.count || "Count";
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const gridCells = this.data.values.filter(cell => Array.isArray(cell.values));
        const allRows = gridCells.flatMap(cell => cell.values.filter(Array.isArray));

        // Each name has the dashboard's colour for it, whether it is a source or a target
        const names = distinct(allRows.flatMap(row => [row[0], row[1]])
            .filter(name => name !== null && name !== undefined && name !== "")
            .map(String));
        // The names that are only ever targets, which are shown as the target field's values
        const sources = new Set(allRows.map(row => String(row[0])));
        this.targetOnly = new Set(names.filter(name => !sources.has(name)));
        const colourOf = this.colours.of(settings.source, names);
        this.legend.setItems(names.map(name => ({ key: name, label: this.nameOf(name), colour: colourOf(name) })));

        // What is shown of each cell: the rows between names the legend hasn't hidden
        const shownCells = gridCells.map(cell => ({
            cell,
            rows: cell.values.filter(row => Array.isArray(row)
                                            && !this.legend.isHidden(String(row[0]))
                                            && !this.legend.isHidden(String(row[1])))
        }));
        // With nothing to show, a diagram that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, rows: [] });
        }

        this.grid.update(shownCells.map(({ cell, rows }) => {
            const flows = flowsOf(rows);
            return {
                key: keyOf(cell),
                label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
                ...flows,
                ...chordLayout(flows.matrix, padAngleOf(settings.padding, flows.names.length)),
                colourOf: index => colourOf(String(flows.names[index])),
                gridCellCount: shownCells.length
            };
        }));
    }
}

// The diagram in one cell of the grid
class ChordCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-chord");
        // What the wheel (or + and −) zooms and dragging pans; a double click (or 0) puts it back,
        // as the diagram is drawn to fit (the legacy diagram zoomed and panned with the mouse only)
        this.zoomed = this.svg.append("g");
        this.panZoom = new PanZoom(this.svg, this.zoomed, {
            fit: () => this.panZoom.apply({ k: 1, x: 0, y: 0 }, true),
            scaleExtent: [0.5, 8]
        });
        this.centre = this.zoomed.append("g");
        this.arcsGroup = this.centre.append("g").attr("class", "vis-chord__arcs vis-glow");
        this.ribbonsGroup = this.centre.append("g").attr("class", "vis-chord__ribbons");
        this.labelsGroup = this.centre.append("g").attr("class", "vis-chord__labels").attr("aria-hidden", "true");
        // Said where the ring would be when there are no names (the description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        this.highlighted = null;
        this.summary = "Chord diagram";
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-chord__arc, .vis-chord__ribbon",
                group: element => element.classList.contains("vis-chord__arc") ? "names" : "flows",
                tooltip: element => element.classList.contains("vis-chord__arc")
                    ? this.arcTooltip(element.__data__)
                    : this.ribbonTooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    if (element !== null && element === document.activeElement) {
                        this.bringIntoView(element);
                    }
                    this.showHighlight();
                },
                // A name can be selected, telling Stroom of it, as can a ribbon's two names
                select: (element, event) => chart.selection.choose(element.classList.contains("vis-chord__arc")
                    ? this.nameItem(element.__data__.index)
                    : this.ribbonItem(element.__data__), event),
                summary: () => this.summary
            })
            : null;
    }

    draw(cell) {
        this.cell = cell;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }
        this.size = { width, height };

        // Room beside the ring for the longest name, but no more than a share of the diagram
        const size = Math.min(width, height);
        const longest = Math.max(0, ...cell.names.map(name => this.chart.nameOf(name).length));
        const labelRoom = Math.min(longest * CHARACTER_WIDTH, size * MAX_LABEL_SHARE) + LABEL_OFFSET;
        const outer = Math.max(0, size / 2 - labelRoom - MARGIN);
        const inner = Math.max(0, outer - Math.max(MIN_RING, outer * RING_SHARE));
        const labelChars = Math.floor((labelRoom - LABEL_OFFSET) / CHARACTER_WIDTH);
        const empty = cell.names.length === 0;
        this.centre.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(empty ? "No data" : "");

        // Each name's arc, going round the ring from the top
        const groups = cell.groups.slice().sort((a, b) => a.startAngle - b.startAngle);
        const arcPath = arc().innerRadius(inner).outerRadius(outer);
        this.arcPath = arcPath;
        this.arcsGroup.selectAll("path.vis-chord__arc")
            .data(groups, group => String(cell.names[group.index]))
            .join("path")
            .attr("class", "vis-chord__arc")
            .attr("d", arcPath)
            .style("fill", group => cell.colourOf(group.index));

        // Each ribbon, an arrow from its source to its target, in its source's colour
        const ribbonRadius = Math.max(1, inner - 1);
        const ribbonPath = ribbonArrow().radius(ribbonRadius).padAngle(1 / ribbonRadius);
        this.ribbonsGroup.selectAll("path.vis-chord__ribbon")
            .data(cell.ribbons, item => item.id)
            .join("path")
            .attr("class", "vis-chord__ribbon")
            .attr("d", ribbonPath)
            .style("fill", item => cell.colourOf(item.source.index));

        // Each long enough arc's name beside it, reading outwards, turned to read left to right
        // on the left of the ring
        this.labelsGroup.selectAll("text.vis-chord__label")
            .data(groups.filter(group => (group.endAngle - group.startAngle) * outer >= MIN_LABEL_ARC),
                group => String(cell.names[group.index]))
            .join("text")
            .attr("class", "vis-chord__label")
            .attr("dy", "0.35em")
            .attr("transform", group => {
                const middle = (group.startAngle + group.endAngle) / 2;
                return "rotate(" + (middle * 180 / Math.PI - 90) + ")translate(" + (outer + LABEL_OFFSET) + ")"
                       + (middle > Math.PI ? "rotate(180)" : "");
            })
            .attr("text-anchor", group => (group.startAngle + group.endAngle) / 2 > Math.PI ? "end" : "start")
            .text(group => shortened(this.chart.nameOf(cell.names[group.index]), labelChars));

        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // Pans an arc reached from the keyboard (or a ribbon, by its source's end) into view, if it is
    // out of it when zoomed in
    bringIntoView(element) {
        if (!this.arcPath || !this.size) {
            return;
        }
        const data = element.__data__;
        const [x, y] = this.arcPath.centroid(element.classList.contains("vis-chord__arc") ? data : data.source);
        this.panZoom.bringIntoView([x + this.size.width / 2, y + this.size.height / 2], { x: 20, y: 20 }, this.size);
    }

    // A name, by its index, as shown
    nameAt(index) {
        return this.chart.nameOf(this.cell.names[index]);
    }

    // The tooltip of a name's arc, e.g. 'alice', 'Emails out: 17', 'Emails in: 7'
    arcTooltip(group) {
        const totals = nameTotals(group.index, this.cell.matrix);
        const types = this.chart.data.types;
        const count = this.chart.countName();
        return {
            title: this.nameAt(group.index),
            rows: [
                [count + " out", formatValue(totals.out, types[2])],
                [count + " in", formatValue(totals.in, types[2])]
            ]
        };
    }

    // The tooltip of a ribbon, e.g. 'alice to bob', 'Emails: 12'
    ribbonTooltip(item) {
        return {
            title: this.nameAt(item.source.index) + " to " + this.nameAt(item.target.index),
            rows: [[this.chart.countName(), formatValue(item.value, this.chart.data.types[2])]]
        };
    }

    // What Stroom is told of a selected name
    nameItem(index) {
        const name = this.cell.names[index];
        return inCell({ key: String(name), name }, this.cell);
    }

    // What Stroom is told of a selected ribbon: its source and target
    ribbonItem(item) {
        const source = this.cell.names[item.source.index];
        const target = this.cell.names[item.target.index];
        return inCell({ key: JSON.stringify([String(source), String(target)]), source, target }, this.cell);
    }

    // The diagram for a screen reader, e.g. 'Chord diagram of Emails between From and To: 6 names,
    // 7 flows, total 58, largest carol to dave 20'
    describe(cell) {
        const settings = this.chart.settings;
        let text = "Chord diagram of " + this.chart.countName() + " between " + (settings.source || "Source")
                   + " and " + (settings.target || "Target");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (cell.names.length === 0) {
            return text + ": no data";
        }
        const type = this.chart.data.types[2];
        const flows = flowCount(cell.matrix);
        const [from, to, count] = largestFlow(cell.matrix);
        return text + ": " + cell.names.length + (cell.names.length === 1 ? " name, " : " names, ")
               + flows + (flows === 1 ? " flow" : " flows") + ", total " + formatValue(cell.total, type)
               + ", largest " + this.nameAt(from) + " to " + this.nameAt(to) + " " + formatValue(count, type);
    }

    // Fades every arc and ribbon but the one shown and those joined to it, or else, if there is a
    // selection, all but the selected and those joined to them
    showHighlight() {
        if (!this.cell) {
            return;
        }
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const isSelectedName = index => selection.has(this.nameItem(index).key);
        const isSelectedRibbon = item => selection.has(this.ribbonItem(item).key)
                                         || isSelectedName(item.source.index) || isSelectedName(item.target.index);
        // The names joined to a name by a ribbon
        const joined = index => this.cell.ribbons
            .filter(item => item.source.index === index || item.target.index === index)
            .flatMap(item => [item.source.index, item.target.index]);

        let keepNames = null;
        let keepRibbon = () => true;
        if (highlighted !== null && highlighted.classList.contains("vis-chord__arc")) {
            const index = highlighted.__data__.index;
            keepNames = new Set([index, ...joined(index)]);
            keepRibbon = item => item.source.index === index || item.target.index === index;
        } else if (highlighted !== null) {
            const shown = highlighted.__data__;
            keepNames = new Set([shown.source.index, shown.target.index]);
            keepRibbon = item => item === shown;
        } else if (!selection.isEmpty()) {
            const selected = this.cell.ribbons.filter(isSelectedRibbon);
            keepNames = new Set(selected.flatMap(item => [item.source.index, item.target.index]));
            this.cell.groups.forEach(group => {
                if (isSelectedName(group.index)) {
                    keepNames.add(group.index);
                }
            });
            keepRibbon = isSelectedRibbon;
        }

        this.arcsGroup.selectAll("path.vis-chord__arc").each((group, index, nodes) => {
            const selected = isSelectedName(group.index);
            nodes[index].classList.toggle("vis-chord__arc--faded",
                keepNames !== null && !keepNames.has(group.index) && !selected);
            nodes[index].classList.toggle("vis-chord__arc--selected", selected);
        });
        this.ribbonsGroup.selectAll("path.vis-chord__ribbon").each((item, index, nodes) => {
            const selected = isSelectedRibbon(item);
            nodes[index].classList.toggle("vis-chord__ribbon--faded", !keepRibbon(item) && !selected);
            nodes[index].classList.toggle("vis-chord__ribbon--selected", selected);
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
window.visualisations.ChordLabels = ChordLabels;
