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

// A tree of paths (e.g. 'home/alice/notes.txt'): each part of a path a box, joined to the part
// before it, growing down, up, right or left from the root (or, radial, a dot with its words beside
// it, the root in the middle and each level a ring further out), in a grid of trees if a Grid Series
// field is chosen. Each top-level branch has the dashboard's colour for its name, and the parts
// under it shades of it, unless the settings give a Base Colour, or a Colour field gives a path its
// own. Stroom makes it with `new visualisations.Tree()` and calls setData(context, settings, data)
// with data nested as grid cell, then rows of [path, value, colour].
//
// Clicking a branch (or Enter on it) shows or hides its children, the tree fitted to its cell again;
// Ctrl+Click (or Space, or Enter on a leaf) selects. The mouse wheel (or + and −) zooms and
// dragging pans; a double click (or 0) fits it again (shared/panZoom.js). Each box is reachable from
// the keyboard (Stroom's stroom.points): the arrow keys the way the tree grows move between its
// levels (Down and Up for north, Up and Down for south, Right and Left for east, Left and Right for
// west, out and in for radial), and the others along a level.

import "../../shared/shared.css";
import "./Tree.css";
import { select } from "d3";
import { Chart } from "../../shared/chart.js";
import { hexColour, isColour } from "../../shared/colours.js";
import { DARK_BACKGROUND, LIGHT_BACKGROUND, mix, textColourOn } from "../../shared/colour.js";
import { cellRows, distinct, keyOf } from "../../shared/data.js";
import { edgeColour } from "../../shared/edges.js";
import { fitOf, shortened } from "../../shared/fit.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { transitionMillis } from "../../shared/motion.js";
import { PanZoom } from "../../shared/panZoom.js";
import { inCell } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { DEFAULT_DELIMITER, ORIENTATIONS, boundsOf, elbowOf, layOut, layOutRadial, nodeCount, placeOf, radialTurn,
    shownHierarchy, treeDepth, treeOf } from "./tree.js";

// A box: as wide as its tree's longest words need, within these, with room for a branch's sign;
// and the room between boxes across and along the way the tree grows
const MIN_BOX_WIDTH = 72;
const MAX_BOX_WIDTH = 180;
const BOX_PADDING = 36;
const BOX_HEIGHT = 28;
const GAP_ACROSS = 16;
const GAP_ALONG = 44;
// The room around the tree when it is fitted to its cell, and the least it is scaled to fit: so
// that its words (12px, see Tree.css) are still 10px and readable; the rest is reached by panning,
// or from the keyboard
const MARGIN = 12;
const MIN_FIT_SCALE = 10 / 12;
// How much narrower the boxes are made each time, where the tree is too big to fit its cell
const NARROWING = 0.8;
// A character of a box's words is about this wide
const CHARACTER_WIDTH = 7;
// Radial: a node's dot, and how far apart the rings are (room for the longest words beside a dot)
const DOT_RADIUS = 6;
// How far outside a selected box or dot its ring is
const RING_GAP = 4;
// Radial: how far apart nodes next to each other round a ring are at the least, so that their
// words (a line high) don't overlap
const DOT_SPACING = 16;
const MIN_RING_GAP = 70;
const MAX_RING_GAP = 170;
const RING_PADDING = 24;
// How much each level further down is shaded towards the background, and the most it is
const SHADE_STEP = 0.12;
const MAX_SHADE = 0.4;
// How deep the tree is drawn at first when the settings don't say
const DEFAULT_DRAW_DEPTH = 3;
const TRANSITION_MILLIS = 400;
// Which way the next level of the tree is on the screen, by orientation, for the keyboard (radial,
// out is down, as for Sunburst's rings)
const GROUP_DIRECTIONS = { north: "down", south: "up", east: "right", west: "left", radial: "down" };



class Tree extends Chart {

    constructor() {
        super((body, chart) => new TreeCell(body, chart), "path");
    }

    delimiter() {
        return this.settings.delimiter || DEFAULT_DELIMITER;
    }

    orientation() {
        return ORIENTATIONS.includes(this.settings.orientation) ? this.settings.orientation : "north";
    }

    drawDepth() {
        const depth = Number(this.settings.drawDepth);
        return Number.isFinite(depth) && depth >= 1 ? depth : DEFAULT_DRAW_DEPTH;
    }

    // What the values are called, e.g. 'Size'
    valueName() {
        return this.settings.valueName || this.settings.value || "Value";
    }

    // A node's values as shown, e.g. '12' or 'big, small'
    valueWords(node) {
        return node.values.map(value => formatValue(value, this.data.types[1])).join(", ");
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
            .map(cell => ({ cell, root: treeOf(cellRows(cell), this.delimiter()) }));
        if (cells.length === 0) {
            cells.push({ cell: { key: null }, root: treeOf([], this.delimiter()) });
        }

        // Each top-level branch has the dashboard's colour for its name (as the legend shows),
        // unless the settings give a base colour for them all
        const branches = distinct(cells.flatMap(({ root }) => root.children.map(node => node.name)));
        const dashboardColours = this.colours.of(settings.path, branches);
        const baseColour = isColour(settings.baseColor) ? hexColour(settings.baseColor) : null;
        const branchColour = name => baseColour || dashboardColours(name);
        this.legend.setItems(branches.map(name => ({ key: name, label: name, colour: branchColour(name) })));

        const background = this.isDarkTheme() ? DARK_BACKGROUND : LIGHT_BACKGROUND;
        const shaded = isTrue(settings.gradient, true);
        // A node's colour, from its top-level branch (`branch`), or null for the root
        const colourOf = (node, branch) => {
            if (isColour(node.colour)) {
                return hexColour(node.colour);
            }
            if (branch === null) {
                return null;
            }
            const base = branchColour(branch.name);
            return shaded ? mix(base, background, Math.min(MAX_SHADE, (node.depth - 1) * SHADE_STEP)) : base;
        };

        this.grid.update(cells.map(({ cell, root }) => {
            // Without the branches the legend has hidden
            const shownRoot = { ...root, children: root.children.filter(node => !this.legend.isHidden(node.name)) };
            return {
                key: keyOf(cell),
                label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
                root: shownRoot,
                colourOf,
                background,
                gridCellCount: cells.length
            };
        }));
    }
}

// The tree in one cell of the grid
class TreeCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-tree");
        this.content = this.svg.append("g");
        this.linksGroup = this.content.append("g").attr("class", "vis-tree__links").attr("aria-hidden", "true");
        this.nodesGroup = this.content.append("g").attr("class", "vis-tree__nodes");
        // Said where the tree would be when there is none (the description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // Whether each branch, by its path, is shown open or closed, as the person chose
        this.chosen = new Map();
        // Where each node, by its path, was last drawn, for the next to move from
        this.places = new Map();
        this.fitted = null;
        this.highlighted = null;
        this.summary = "Tree";

        // The wheel zooms and dragging pans, as do + and −; a double click or 0 fits the tree again
        this.panZoom = new PanZoom(this.svg, this.content, { fit: () => this.fit(true), scaleExtent: [0.2, 2] });

        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-tree__node",
                group: element => String(element.__data__.depth),
                // The arrow keys go between levels the way the tree grows
                groupDirection: () => GROUP_DIRECTIONS[chart.orientation()],
                tooltip: element => this.tooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    if (element !== null && element === document.activeElement) {
                        this.bringIntoView(element.__data__);
                    }
                    this.showHighlight();
                },
                select: (element, event) => this.activate(element.__data__, event),
                summary: () => this.summary
            })
            : null;
    }

    draw(cell) {
        this.cell = cell;
        const chart = this.chart;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }
        this.size = { width, height };
        const empty = cell.root.children.length === 0;
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(empty ? "No data" : "");

        const shown = empty ? null : shownHierarchy(cell.root, this.chosen, chart.drawDepth());
        const orientation = chart.orientation();
        const radial = orientation === "radial";
        const { root, boxWidth, labelChars, reach } = this.layOutToFit(shown, orientation);
        this.boxWidth = boxWidth;
        this.reach = reach;
        this.svg.classed("vis-tree--radial", radial);
        const nodes = root === null ? [] : root.descendants();
        const links = root === null ? [] : root.links();
        const branchOf = one => one.depth === 0 ? null : one.ancestors()[one.depth - 1].data;
        const placedAt = one => placeOf(one, orientation);
        const millis = transitionMillis(TRANSITION_MILLIS);
        // Where a node comes in from: where its parent was last drawn, or is now
        const enteringPlace = one => {
            const parent = one.parent;
            return parent ? (this.places.get(parent.data.path) || placedAt(parent)) : placedAt(one);
        };

        this.linksGroup.selectAll("path.vis-tree__link")
            .data(links, link => link.target.data.path)
            .join(enter => enter.append("path")
                .attr("class", "vis-tree__link")
                .attr("d", link => {
                    const [x, y] = enteringPlace(link.target);
                    return "M" + x + "," + y;
                }))
            .transition().duration(millis)
            .attr("d", link => elbowOf(link.source, link.target, orientation));

        const boxes = this.nodesGroup.selectAll("g.vis-tree__node")
            .data(nodes, one => one.data.path)
            .join(enter => {
                const item = enter.append("g")
                    .attr("class", "vis-tree__node")
                    .attr("transform", one => "translate(" + enteringPlace(one) + ")");
                item.append("rect")
                    .attr("class", "vis-tree__box")
                    .attr("y", -BOX_HEIGHT / 2)
                    .attr("height", BOX_HEIGHT);
                item.append("circle").attr("class", "vis-tree__dot").attr("r", DOT_RADIUS);
                // A ring round a selected box (or radial, dot), outside the edge the one shown has
                item.append("rect")
                    .attr("class", "vis-tree__ring vis-tree__ring--box")
                    .attr("y", -BOX_HEIGHT / 2 - RING_GAP)
                    .attr("height", BOX_HEIGHT + 2 * RING_GAP)
                    .attr("rx", RING_GAP + 2);
                item.append("circle").attr("class", "vis-tree__ring vis-tree__ring--dot").attr("r", DOT_RADIUS + RING_GAP);
                item.append("text").attr("class", "vis-tree__label").attr("dy", "0.35em");
                item.append("text").attr("class", "vis-tree__sign").attr("aria-hidden", "true").attr("dy", "0.35em");
                return item;
            });
        boxes.select("rect").attr("x", -boxWidth / 2).attr("width", boxWidth);
        boxes.select(".vis-tree__ring--box").attr("x", -boxWidth / 2 - RING_GAP).attr("width", boxWidth + 2 * RING_GAP);
        boxes.select(".vis-tree__sign").attr("x", boxWidth / 2 - 10);
        // In the layout's order, level by level, so that the keyboard goes along each level in turn
        boxes.order();
        boxes.classed("vis-tree__node--root", one => one.depth === 0)
            .classed("vis-tree__node--leaf", one => one.data.children.length === 0)
            .classed("vis-tree__node--closed", one => one.data.children.length > 0 && !one.children);
        boxes.select("rect").style("fill", one => cell.colourOf(one.data, branchOf(one)));
        boxes.select(".vis-tree__dot").style("fill", one => cell.colourOf(one.data, branchOf(one)));
        // A box or dot too pale to show against the background by itself (a deep level, shaded
        // towards it) is edged in a deeper shade of its colour (see edges.js)
        boxes.style("--vis-tree__edge",
            one => edgeColour(cell.colourOf(one.data, branchOf(one)), cell.background));
        // A box's words are on it, black or white to read on it; a dot's beside it, outwards along
        // its ring's radius (so that neighbours round a ring are a line apart), turned to read left
        // to right on the left of the ring, in the theme's text colour. The root's words are level
        // A branch whose children are shown has its words inwards instead, as only the line to its
        // parent crosses them there, not the lines out to its children
        const rightSide = one => one.depth === 0 || placedAt(one)[0] >= -0.5;
        const labelSide = one => (rightSide(one) ? 1 : -1) * (one.depth > 0 && one.children ? -1 : 1);
        boxes.select(".vis-tree__label")
            .attr("x", one => {
                if (radial) {
                    return labelSide(one) * (DOT_RADIUS + 4);
                }
                return one.data.children.length > 0 ? -8 : 0;
            })
            .attr("transform", one => radial && one.depth > 0 ? "rotate(" + radialTurn(one.x) + ")" : null)
            .style("text-anchor", one => radial ? (labelSide(one) > 0 ? "start" : "end") : null)
            .style("fill", one => {
                const fill = cell.colourOf(one.data, branchOf(one));
                return radial || fill === null ? null : textColourOn(fill);
            })
            .text(one => shortened(this.labelOf(one), labelChars));
        // A box's sign says whether a branch's children are shown (−) or hidden (+); a dot says it by
        // its edge
        boxes.select(".vis-tree__sign")
            .style("fill", one => {
                const fill = cell.colourOf(one.data, branchOf(one));
                return fill === null ? null : textColourOn(fill);
            })
            .text(one => radial || one.data.children.length === 0 ? "" : one.children ? "−" : "+");
        boxes.transition().duration(millis)
            .attr("transform", one => "translate(" + placedAt(one) + ")");

        this.places = new Map(nodes.map(one => [one.data.path, placedAt(one)]));
        this.nodes = nodes;
        this.fit(false);

        this.summary = this.describe(cell, nodes);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // A box's words: its name (or 'All' for the root) and its values, as the legacy tree wrote them
    labelOf(node) {
        const name = node.depth === 0 ? "All" : node.data.name;
        const values = this.chart.valueWords(node.data);
        return values === "" ? name : name + ": " + values;
    }

    // The shown tree laid out for an orientation, {root, boxWidth, labelChars, reach}: the boxes (or
    // radial, the rings) as wide as the longest words shown need, within limits; but narrower, the
    // words shortened, where that lets the tree fit its cell without making its words smaller than
    // can be read (MIN_FIT_SCALE). `reach` is how far a node's drawing goes either side of its middle,
    // across and up and down
    layOutToFit(shown, orientation) {
        const radial = orientation === "radial";
        const sideways = orientation === "east" || orientation === "west";
        let chars = shown === null ? 0 : Math.max(...shown.descendants().map(one => this.labelOf(one).length));
        for (;;) {
            const boxWidth = Math.max(MIN_BOX_WIDTH, Math.min(MAX_BOX_WIDTH, chars * CHARACTER_WIDTH + BOX_PADDING));
            // Radial, each node is a dot with its words beside it, as boxes would overlap round a ring,
            // and the rings are far enough apart for the words between them
            const ringGap = Math.max(MIN_RING_GAP, Math.min(MAX_RING_GAP, chars * CHARACTER_WIDTH + RING_PADDING));
            const nodeSize = sideways
                ? [BOX_HEIGHT + GAP_ACROSS / 2, boxWidth + GAP_ALONG]
                : [boxWidth + GAP_ACROSS, BOX_HEIGHT + GAP_ALONG];
            const reach = radial ? { x: ringGap, y: DOT_RADIUS + 8 } : { x: boxWidth / 2, y: BOX_HEIGHT / 2 };
            const labelChars = Math.floor((radial ? ringGap - RING_PADDING : boxWidth - BOX_PADDING) / CHARACTER_WIDTH);
            const root = shown === null ? null
                : radial ? layOutRadial(shown, ringGap, DOT_SPACING) : layOut(shown, nodeSize);
            const narrowest = radial ? ringGap <= MIN_RING_GAP : boxWidth <= MIN_BOX_WIDTH;
            if (root === null || narrowest
                || this.fitScaleOf(boundsOf(root.descendants(), orientation, reach, MARGIN)) >= MIN_FIT_SCALE) {
                return { root, boxWidth, labelChars, reach };
            }
            chars = Math.floor(chars * NARROWING);
        }
    }

    // The scale that would fit some bounds to the cell
    fitScaleOf(bounds) {
        return Math.min(this.size.width / Math.max(1, bounds.right - bounds.left),
            this.size.height / Math.max(1, bounds.bottom - bounds.top));
    }

    // Fits the tree to its cell: always if asked (a double click), otherwise when what is shown, or
    // the cell's size, has changed since it was last fitted
    fit(always) {
        if (!this.nodes || this.nodes.length === 0 || !this.size) {
            return;
        }
        const bounds = boundsOf(this.nodes, this.chart.orientation(), this.reach, MARGIN);
        const key = [bounds.left, bounds.right, bounds.top, bounds.bottom, this.size.width, this.size.height].join();
        if (!always && key === this.fitted) {
            return;
        }
        const first = this.fitted === null;
        this.fitted = key;
        this.panZoom.apply(fitOf(bounds, this.size.width, this.size.height, MIN_FIT_SCALE), !first);
    }

    // Pans a node reached from the keyboard into view, if it is out of it
    bringIntoView(node) {
        this.panZoom.bringIntoView(placeOf(node, this.chart.orientation()), this.reach, this.size);
    }

    // A click on a box (or Enter on it): a branch shows or hides its children, and a leaf, or a
    // Ctrl+Click or Space on any box, selects it
    activate(node, event) {
        const keyboard = Boolean(event && event.keyboard);
        const branch = node.data.children.length > 0;
        const space = keyboard && event.key === " ";
        if ((event && (event.ctrlKey || event.metaKey) && !keyboard) || space || !branch) {
            // The root ('All') is not a thing to select
            if (node.depth > 0) {
                this.chart.selection.choose(this.selectionItem(node), event);
            }
            return;
        }
        this.chosen.set(node.data.path, !node.children);
        this.draw(this.cell);
    }

    // The tooltip of a box: its name, path, values and children
    tooltip(node) {
        const rows = [["Path", this.pathWords(node)]];
        const values = this.chart.valueWords(node.data);
        if (values !== "") {
            rows.push([this.chart.valueName(), values]);
        }
        const children = node.data.children.length;
        if (children > 0) {
            rows.push(["Children", children + (node.children ? ", shown" : ", hidden")]);
        }
        return { title: node.depth === 0 ? "All" : node.data.name, rows };
    }

    // A node's path for people to read, e.g. 'home / alice', or 'All' for the root
    pathWords(node) {
        const names = node.ancestors().reverse().slice(1).map(one => one.data.name);
        return names.length === 0 ? "All" : names.join(" / ");
    }

    // What Stroom is told of a selected box (the fields the legacy tree told it)
    selectionItem(node) {
        const values = node.data.values;
        const value = values.length === 0 ? undefined : values.length === 1 ? values[0] : values.join(", ");
        const item = { key: node.data.path, path: node.data.path, name: node.data.name, value };
        item[this.chart.settings.valueName || "Value"] = value;
        return inCell(item, this.cell);
    }

    // The tree for a screen reader, e.g. 'Tree of Path: 13 paths, 4 levels deep, 6 shown'
    describe(cell, nodes) {
        const settings = this.chart.settings;
        let text = "Tree of " + (settings.path || "Path");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        const count = nodeCount(cell.root);
        if (count === 0) {
            return text + ": no data";
        }
        const depth = treeDepth(cell.root);
        return text + ": " + count + (count === 1 ? " path, " : " paths, ") + depth
               + (depth === 1 ? " level deep, " : " levels deep, ") + (nodes.length - 1) + " shown";
    }

    // Marks the selected boxes, and the one shown (hovered or focused)
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        this.nodesGroup.selectAll("g.vis-tree__node").each((node, index, nodes) => {
            nodes[index].classList.toggle("vis-tree__node--selected", selection.has(this.selectionItem(node).key));
            nodes[index].classList.toggle("vis-tree__node--shown", nodes[index] === highlighted);
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
window.visualisations.Tree = Tree;
