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

// A sunburst: rings of a tree of paths (e.g. 'var/log/stroom'), each part of a path an arc, its
// share of its ring, around the part before it, in a grid of sunbursts if a Grid Series field is
// chosen. Each top-level branch has the dashboard's colour for its name, and the parts under it
// shades of it, unless the settings give a Base Colour, or a Colour field gives a path its own.
// Stroom makes it with `new visualisations.Sunburst()` and calls setData(context, settings, data)
// with data nested as grid cell, then rows of [path, value, colour].
//
// Clicking a branch (or Enter on it) zooms in to it, which is then in the middle; the middle zooms
// back out. Ctrl+Click (or Space) selects. Each arc is reachable from the keyboard (Stroom's
// stroom.points): Up and Down move between the rings, Left and Right round a ring.

import "../../shared/shared.css";
import "./Sunburst.css";
import { arc, select } from "d3";
import { Chart } from "../../shared/chart.js";
import { hexColour, isColour } from "../../shared/colours.js";
import { DARK_BACKGROUND, LIGHT_BACKGROUND, mix, textColourOn } from "../../shared/colour.js";
import { cellRows, distinct, keyOf } from "../../shared/data.js";
import { edgeColour } from "../../shared/edges.js";
import { formatKey, formatShare, formatValue } from "../../shared/format.js";
import { inCell } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { DEFAULT_DELIMITER, branchOf, pathTree, rings } from "./paths.js";

// The room around the sunburst
const MARGIN = 4;
// How many rings are shown out from the middle when the settings don't say
const DEFAULT_DEPTH = 8;
// How much each ring further out is shaded towards the background, and the most it is
const SHADE_STEP = 0.12;
const MAX_SHADE = 0.4;



class Sunburst extends Chart {

    constructor() {
        super((body, chart) => new SunburstCell(body, chart), "path");
    }

    delimiter() {
        return this.settings.delimiter || DEFAULT_DELIMITER;
    }

    // A node's path for people to read, e.g. 'var / log / stroom', or 'All' for the root
    pathWords(node) {
        const names = node.ancestors().reverse().slice(1).map(one => one.data.name);
        return names.length === 0 ? "All" : names.join(" / ");
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const cells = this.data.values
            .filter(cell => Array.isArray(cell.values))
            .map(cell => ({ cell, root: rings(pathTree(cellRows(cell), this.delimiter())) }));

        // Each top-level branch has the dashboard's colour for its name (as the legend shows),
        // unless the settings give a base colour for them all
        const branches = distinct(cells.flatMap(({ root }) => (root.children || []).map(node => node.data.name)));
        const dashboardColours = this.colours.of(settings.path, branches);
        const baseColour = isColour(settings.baseColor) ? hexColour(settings.baseColor) : null;
        const branchColour = name => baseColour || dashboardColours(name);
        this.legend.setItems(branches.map(name => ({ key: name, label: name, colour: branchColour(name) })));

        const background = this.isDarkTheme() ? DARK_BACKGROUND : LIGHT_BACKGROUND;
        const shaded = isTrue(settings.gradient, true);
        const colourOf = node => {
            if (isColour(node.data.colour)) {
                return hexColour(node.data.colour);
            }
            const branch = branchOf(node);
            if (branch === null) {
                return null;
            }
            const base = branchColour(branch.data.name);
            return shaded ? mix(base, background, Math.min(MAX_SHADE, (node.depth - 1) * SHADE_STEP)) : base;
        };

        // With nothing to show, a sunburst that says so
        const shown = cells.length > 0 ? cells : [{ cell: { key: null }, root: rings(pathTree([], this.delimiter())) }];
        this.grid.update(shown.map(({ cell, root }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
            root,
            hidden: name => this.legend.isHidden(name),
            colourOf,
            background,
            gridCellCount: shown.length
        })));
    }
}

// The sunburst in one cell of the grid
class SunburstCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-sunburst");
        this.centre = this.svg.append("g");
        this.nodesGroup = this.centre.append("g").attr("class", "vis-sunburst__nodes");
        this.labelsGroup = this.centre.append("g").attr("class", "vis-sunburst__labels").attr("aria-hidden", "true");
        // Said where the rings would be when there are none (the description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // The path of the node zoomed in to, in the middle; '' for the whole tree
        this.zoomPath = "";
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-sunburst__node",
                group: element => String(element.__data__.depth - this.view.depth),
                tooltip: element => this.tooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    this.showHighlight();
                },
                select: (element, event) => this.activate(element.__data__, event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Sunburst";
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
        this.centre.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // The node in the middle, the one zoomed in to if it is still there
        const root = cell.root;
        this.view = root.descendants().find(one => one.data.path === this.zoomPath) || root;
        this.zoomPath = this.view.data.path;
        const empty = !root.children || root.value <= 0;
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(empty ? "No data" : "");

        // The middle and the rings out from it, as many as the settings say, without the branches
        // the legend has hidden
        const view = this.view;
        const depth = Math.max(1, Number.parseInt(settings.displayDepth, 10) || DEFAULT_DEPTH);
        // As many rings as there are levels to show (no empty ring outside the last), at least one
        const levels = Math.max(1, Math.min(depth, view.height));
        const ringWidth = Math.max(1, (Math.min(width, height) / 2 - MARGIN) / (levels + 1));
        const angle = x => Math.max(0, Math.min(2 * Math.PI, (x - view.x0) / (view.x1 - view.x0) * 2 * Math.PI));
        const shape = arc()
            .startAngle(one => angle(one.x0))
            .endAngle(one => angle(one.x1))
            .innerRadius(one => one === view ? 0 : (one.depth - view.depth) * ringWidth)
            .outerRadius(one => (one.depth - view.depth + 1) * ringWidth - (one === view ? 0 : 1));
        const nodes = empty ? [] : view.descendants()
            .filter(one => one.depth - view.depth <= levels)
            .filter(one => one.depth === 0 || !cell.hidden(branchOf(one).data.name))
            .filter(one => one === view || angle(one.x1) - angle(one.x0) > 0.001);

        this.nodesGroup.selectAll("path.vis-sunburst__node")
            .data(nodes, one => one.data.path)
            .join("path")
            .attr("class", "vis-sunburst__node")
            .classed("vis-sunburst__node--middle", one => one === view)
            .classed("vis-sunburst__node--branch", one => Boolean(one.children))
            .attr("d", shape)
            .style("fill", one => one === view && view.depth === 0 ? null : cell.colourOf(one))
            // An arc too pale to show against the background by itself (a deep level, shaded towards
            // it) is edged in a deeper shade of its colour (see edges.js)
            .style("--vis-sunburst__edge", one => one === view && view.depth === 0
                ? null
                : edgeColour(cell.colourOf(one), cell.background))
            .order();

        // Each arc's name, where it fits, in black or white, whichever reads on its colour
        const showLabels = isTrue(settings.showLabels, true);
        const labels = this.labelsGroup.selectAll("text.vis-sunburst__label")
            .data(showLabels ? nodes : [], one => one.data.path)
            .join("text")
            .attr("class", "vis-sunburst__label")
            .text(one => one === view ? this.chart.pathWords(one) : one.data.name)
            .style("fill", one => one === view && view.depth === 0 ? null : textColourOn(cell.colourOf(one)));
        labels.each(function(one) {
            const label = select(this);
            if (one === view) {
                label.attr("transform", null).style("display", this.getComputedTextLength() <= 2 * ringWidth - 6 ? null : "none");
                return;
            }
            const start = angle(one.x0);
            const end = angle(one.x1);
            const middleRadius = (one.depth - view.depth + 0.5) * ringWidth;
            const fits = this.getComputedTextLength() <= ringWidth - 6 && (end - start) * middleRadius >= 14;
            // Along the radius, the right way up on either side
            const degrees = (start + end) / 2 * 180 / Math.PI;
            label.attr("transform", "rotate(" + (degrees - 90) + ") translate(" + middleRadius + ",0)"
                                    + (degrees < 180 ? "" : " rotate(180)"))
                .style("display", fits ? null : "none");
        });

        this.summary = this.describe(cell);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // A click (or Enter) on a node: Ctrl+Click (or Space) selects it; otherwise a branch is zoomed in
    // to (if the settings let it be) and the middle zooms back out, and a leaf is selected
    activate(node, event) {
        const expand = isTrue(this.chart.settings.expand, true);
        const keyboard = Boolean(event && event.keyboard);
        // Ctrl+Click, or Space, selects; Enter zooms
        // The middle at the top (everything) is not a thing to select
        const selectable = node.depth > 0;
        if ((event && (event.ctrlKey || event.metaKey) && !keyboard) || (keyboard && event.key === " ")) {
            if (selectable) {
                this.chart.selection.choose(this.selectionItem(node), event);
            }
            return;
        }
        if (expand && node === this.view && node.parent) {
            this.zoomTo(node.parent, keyboard);
        } else if (expand && node !== this.view && node.children) {
            this.zoomTo(node, keyboard);
        } else if (selectable) {
            this.chart.selection.choose(this.selectionItem(node), event);
        }
    }

    // Puts a node in the middle, keeping the keyboard's focus there if it was in the sunburst
    zoomTo(node, keepFocus) {
        this.zoomPath = node.data.path;
        this.highlighted = null;
        this.draw(this.cell);
        if (keepFocus) {
            const middle = this.nodesGroup.select(".vis-sunburst__node--middle").node();
            if (middle) {
                middle.focus();
            }
        }
    }

    // The tooltip of a node: its path, value and share of the whole tree
    tooltip(node) {
        const settings = this.chart.settings;
        const rows = [[settings.value || "Value", formatValue(node.value, this.chart.data.types[1])]];
        if (node.depth > 0) {
            rows.push(["Share", formatShare(node.value / this.cell.root.value)]);
        }
        return { title: this.chart.pathWords(node), rows };
    }

    // What Stroom is told of a selected node (as the legacy sunburst told it)
    selectionItem(node) {
        const item = { key: node.data.path, value: node.value, name: node.data.name, path: node.data.path };
        return inCell(item, this.cell);
    }

    // The sunburst for a screen reader, e.g. 'Sunburst of Bytes by Path: 9 paths, total 2,048,
    // largest branch var 1,200 (58.6%)'
    describe(cell) {
        const settings = this.chart.settings;
        let text = "Sunburst of " + (settings.value || "Value") + " by " + (settings.path || "Path");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        const root = cell.root;
        if (!root.children || root.value <= 0) {
            return text + ": no data";
        }
        const types = this.chart.data.types;
        const leaves = root.leaves().length;
        const largest = root.children[0];
        text += ": " + leaves + (leaves === 1 ? " path" : " paths") + ", total " + formatValue(root.value, types[1])
                + ", largest branch " + largest.data.name + " " + formatValue(largest.value, types[1])
                + " (" + formatShare(largest.value / root.value) + ")";
        if (this.view && this.view.depth > 0) {
            text += ", showing " + this.chart.pathWords(this.view);
        }
        return text;
    }

    // Fades every arc but the one shown, those it is in and those in it, and those selected
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted.__data__ : null;
        const related = highlighted === null
            ? null
            : new Set([...highlighted.ancestors(), ...highlighted.descendants()]);
        const fadedPaths = new Set();
        this.nodesGroup.selectAll("path.vis-sunburst__node").each((node, index, nodes) => {
            const selected = selection.has(this.selectionItem(node).key);
            const faded = related !== null ? !related.has(node) && !selected : !selection.isEmpty() && !selected;
            nodes[index].classList.toggle("vis-sunburst__node--faded", faded);
            nodes[index].classList.toggle("vis-sunburst__node--selected", selected);
            if (faded) {
                fadedPaths.add(node.data.path);
            }
        });
        // A faded arc's label with it
        this.labelsGroup.selectAll("text.vis-sunburst__label").each((node, index, nodes) => {
            nodes[index].classList.toggle("vis-sunburst__label--faded", fadedPaths.has(node.data.path));
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
window.visualisations.Sunburst = Sunburst;
