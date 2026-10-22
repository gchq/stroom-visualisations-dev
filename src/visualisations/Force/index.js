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

// A force-directed network: a node for each source and target, a line between each two joined by a
// count, as thick as their counts, with an arrowhead at each end something went to. The nodes of a
// group are drawn as one node for the group (bigger, edged thickly) unless it is expanded, when
// its members are drawn joined to it (see network.js). Stroom makes it with
// `new visualisations.Force()` and calls setData(context, settings, data) with rows of [source,
// target, source group, target group, count].
//
// The network is laid out at once, not shown moving, and fitted to the visualisation; the wheel
// (or + and −) zooms and dragging pans, and a double click (or 0) fits it again (shared/panZoom.js).
// Clicking a group (or Enter on it) expands or collapses it; Ctrl+Click (or Space, or Enter on a node
// that isn't a group) selects. Clicking a line between two collapsed groups (or Enter on the ring in
// its middle) shows the members it joins, as the legacy network did, and again goes back.
// A node's shape says what it does: a triangle sends, a circle receives, a diamond does both. Each
// node is reachable from the keyboard (Stroom's stroom.points), a group's nodes at a time, its
// tooltip listing its links, and then each line, its tooltip the counts each way.
//
// A search field, opened from Stroom's toolbar, highlights the nodes it matches. With the Animate
// setting, a dot runs along each row's line in turn (as the legacy network's did), paused and played
// from Stroom's toolbar, and paused at first for someone who has asked for less motion.

import "../../shared/shared.css";
import "./Force.css";
import { select, symbol, symbolCircle, symbolDiamond, symbolSquare, symbolTriangle } from "d3";
import { fitOf } from "../../shared/fit.js";
import { layOut } from "../../shared/forceLayout.js";
import { prefersReducedMotion, transitionMillis } from "../../shared/motion.js";
import { matchesOf, roleOf } from "../../shared/network.js";
import { NetworkChart } from "../../shared/networkChart.js";
import { PanZoom } from "../../shared/panZoom.js";
import { isTrue } from "../../shared/settings.js";

// The shape of a node by what it does; an expanded group (whose counts are its members') is a square
const SHAPES = { source: symbolTriangle, target: symbolCircle, both: symbolDiamond, none: symbolSquare };
// How big a node is (a group's bigger), as d3 symbol areas, and how far its edge is from its middle
const NODE_SIZE = 140;
const GROUP_SIZE = 420;
const NODE_RADIUS = 8;
const GROUP_RADIUS = 14;
// Lines are from this thick (a count of 1) to this thick (the most)
const MIN_LINE_WIDTH = 1.5;
const MAX_LINE_WIDTH = 8;
// The names are written beside the nodes when there are no more than this many (groups' always)
const MAX_LABELLED_NODES = 60;
// The room around the network when it is fitted, and the least and most it is scaled to fit
const MARGIN = 24;
const MIN_FIT_SCALE = 0.4;
const MAX_FIT_SCALE = 1.5;
const TRANSITION_MILLIS = 400;
// The target in the middle of each line
const HANDLE_RADIUS = 7;
// The replay of the rows: its dot, how long it takes along a line, and the pause between lines
const ZAP_RADIUS = 4;
const ZAP_MILLIS = 600;
const ZAP_PAUSE_MILLIS = 200;

class Force extends NetworkChart {

    constructor() {
        super((body, chart) => new ForceCell(body, chart), "Network");
        // Whether the rows are being replayed along their links (the Animate setting), and whether
        // the person chose to play or pause it (null until they do)
        this.playChosen = null;
    }

    // Whether the rows are being replayed: as the person chose, or else unless they have asked
    // their system for less motion (WCAG 2.3.3)
    isPlaying() {
        if (!isTrue(this.settings.animate, false)) {
            return false;
        }
        return this.playChosen !== null ? this.playChosen : !prefersReducedMotion();
    }

    // The Play/Pause button in Stroom's toolbar, when the Animate setting is on, so that the moving
    // dot can always be stopped (WCAG 2.2.2)
    updateAnimateButton() {
        if (!isTrue(this.settings.animate, false)) {
            this.toolbar.remove("animate");
            return;
        }
        const playing = this.isPlaying();
        this.toolbar.set({ id: "animate", title: playing ? "Pause the animation" : "Play the animation",
            icon: playing ? "PAUSE" : "PLAY", pressed: playing }, () => {
            this.playChosen = !this.isPlaying();
            this.updateAnimateButton();
            this.cells.forEach(cell => cell.animate());
        });
    }

    // The Play/Pause button is shown for the network, if the Animate setting is on
    networkChanged() {
        this.updateAnimateButton();
    }
}

// The network, in the visualisation's one cell
class ForceCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-force");
        const defs = this.svg.append("defs");
        // The arrowheads, at the end of a line a count went to (or, turned round, at its start)
        defs.append("marker")
            .attr("id", "vis-force-arrow")
            .attr("class", "vis-force__arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr("refX", 10)
            .attr("markerWidth", 10)
            .attr("markerHeight", 10)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M0,-5L10,0L0,5Z");
        this.content = this.svg.append("g");
        this.linksGroup = this.content.append("g").attr("class", "vis-force__links").attr("aria-hidden", "true");
        this.nodesGroup = this.content.append("g").attr("class", "vis-force__nodes");
        // A target in the middle of each line, which the keyboard reaches after the nodes, its tooltip
        // the counts each way (a line between two collapsed groups shows the members it joins)
        this.handlesGroup = this.content.append("g").attr("class", "vis-force__handles");
        this.labelsGroup = this.content.append("g").attr("class", "vis-force__labels").attr("aria-hidden", "true");
        // The dot that runs along each row's line in turn, when the rows are replayed
        this.zap = this.content.append("circle")
            .attr("class", "vis-force__zap")
            .attr("r", ZAP_RADIUS)
            .attr("aria-hidden", "true")
            .style("display", "none");
        this.zapTimer = null;
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // Where each node was laid out, by its id, and what the layout was of
        this.places = new Map();
        this.laidOut = null;
        this.fitted = null;
        this.highlighted = null;
        this.summary = "Network";

        // The wheel zooms and dragging pans, as do + and −; a double click or 0 fits it again
        this.panZoom = new PanZoom(this.svg, this.content, { fit: () => this.fit(true), scaleExtent: [0.1, 4] });

        const isHandle = element => element.classList.contains("vis-force__handle");
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-force__node, .vis-force__handle",
                // A group's nodes at a time, then the lines
                group: element => isHandle(element) ? "\u0000lines" : chart.colourKeyOf(element.__data__),
                tooltip: element => isHandle(element) ? this.lineTooltip(element.__data__) : this.tooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    if (element !== null && element === document.activeElement) {
                        this.bringIntoView(element);
                    }
                    this.showHighlight();
                },
                select: (element, event) => isHandle(element)
                    ? this.activateLine(element.__data__, event)
                    : this.activate(element.__data__, event),
                summary: () => this.summary
            })
            : null;
        // A click on a line itself does what a click on its target does
        this.linksGroup.on("click", event => {
            const line = event.target.closest("line.vis-force__link");
            if (line) {
                this.activateLine(line.__data__, event);
            }
        });
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
        const network = cell.network;
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(network.nodes.length === 0 ? "No data" : "");

        // Laid out again only when the network has changed (not when the visualisation is resized)
        const shape = network.nodes.map(one => one.id).join("|") + "#" + network.links.map(link => link.id).join("|");
        if (shape !== this.laidOut) {
            this.places = layOut(network, this.places);
            this.laidOut = shape;
        }
        const byId = new Map(network.nodes.map(one => [one.id, one]));
        this.byId = byId;
        const placeOf = one => this.places.get(one.id);
        const millis = transitionMillis(TRANSITION_MILLIS);

        // Lines, as thick as their counts, stopping at the edges of their nodes
        const most = Math.max(1, ...network.links.map(link => link.forward + link.reverse));
        const widthOf = link => link.isMembership
            ? 1
            : MIN_LINE_WIDTH + (MAX_LINE_WIDTH - MIN_LINE_WIDTH) * Math.sqrt((link.forward + link.reverse - 1) / Math.max(1, most - 1));
        const ends = link => {
            const a = placeOf(byId.get(link.source));
            const b = placeOf(byId.get(link.target));
            const length = Math.max(1, Math.hypot(b.x - a.x, b.y - a.y));
            const ra = (byId.get(link.source).isGroup ? GROUP_RADIUS : NODE_RADIUS) + 2;
            const rb = (byId.get(link.target).isGroup ? GROUP_RADIUS : NODE_RADIUS) + 2;
            return {
                x1: a.x + (b.x - a.x) * ra / length, y1: a.y + (b.y - a.y) * ra / length,
                x2: b.x - (b.x - a.x) * rb / length, y2: b.y - (b.y - a.y) * rb / length
            };
        };
        this.ends = ends;
        this.linksGroup.selectAll("line.vis-force__link")
            .data(network.links, link => link.id)
            .join("line")
            .attr("class", "vis-force__link")
            .classed("vis-force__link--membership", link => link.isMembership)
            .classed("vis-force__link--expandable", link => link.groups !== null || link.viaGroups !== null)
            .style("stroke-width", widthOf)
            .attr("marker-end", link => link.forward > 0 ? "url(#vis-force-arrow)" : null)
            .attr("marker-start", link => link.reverse > 0 ? "url(#vis-force-arrow)" : null)
            .transition().duration(millis)
            .attr("x1", link => ends(link).x1)
            .attr("y1", link => ends(link).y1)
            .attr("x2", link => ends(link).x2)
            .attr("y2", link => ends(link).y2);

        // Nodes, a group's nodes together, so that the keyboard goes through a group at a time
        const ordered = this.chart.keyboardOrder(network);
        const path = symbol();
        this.nodesGroup.selectAll("path.vis-force__node")
            .data(ordered, one => one.id)
            .join("path")
            .attr("class", "vis-force__node")
            .classed("vis-force__node--group", one => one.isGroup)
            .classed("vis-force__node--expanded", one => one.expanded)
            .attr("d", one => path.type(SHAPES[roleOf(one)]).size(one.isGroup ? GROUP_SIZE : NODE_SIZE)())
            .style("fill", one => one.expanded ? null : cell.colourOfNode(one))
            .style("stroke", one => one.expanded ? cell.colourOfNode(one) : null)
            .order()
            .transition().duration(millis)
            .attr("transform", one => "translate(" + placeOf(one).x + "," + placeOf(one).y + ")");

        // A target in the middle of each line that has counts (not a group's line to a member): one
        // that can be expanded (or collapsed again) is drawn, the others are clear
        const middleOf = link => {
            const end = ends(link);
            return [(end.x1 + end.x2) / 2, (end.y1 + end.y2) / 2];
        };
        this.middleOf = middleOf;
        this.handlesGroup.selectAll("circle.vis-force__handle")
            .data(network.links.filter(link => !link.isMembership), link => link.id)
            .join("circle")
            .attr("class", "vis-force__handle")
            .classed("vis-force__handle--expandable", link => link.groups !== null || link.viaGroups !== null)
            .attr("r", HANDLE_RADIUS)
            .transition().duration(millis)
            .attr("cx", link => middleOf(link)[0])
            .attr("cy", link => middleOf(link)[1]);

        // Names beside the nodes, when there aren't too many to read (groups' and the search's
        // matches always)
        const matches = matchesOf(network, this.chart.searchText);
        const labelled = network.nodes.length <= MAX_LABELLED_NODES
            ? network.nodes
            : network.nodes.filter(one => one.isGroup || matches.has(one.id));
        this.labelsGroup.selectAll("text.vis-force__label")
            .data(labelled, one => one.id)
            .join("text")
            .attr("class", "vis-force__label")
            .classed("vis-force__label--group", one => one.isGroup)
            .attr("dy", "0.35em")
            .text(one => String(one.name))
            .transition().duration(millis)
            .attr("x", one => placeOf(one).x + (one.isGroup ? GROUP_RADIUS : NODE_RADIUS) + 4)
            .attr("y", one => placeOf(one).y);

        this.fit(false);
        this.summary = this.describe(network);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
        this.animate();
    }

    // Replays the rows, one after another, a dot running along each one's line from its source to
    // its target, those two nodes lit; or stops, as the chart says (see Force.isPlaying)
    animate() {
        clearTimeout(this.zapTimer);
        this.zapTimer = null;
        this.zap.interrupt();
        const rows = this.cell ? this.cell.network.rowLinks : [];
        if (!this.chart.isPlaying() || rows.length === 0 || !this.byId) {
            this.zap.style("display", "none");
            this.nodesGroup.selectAll("path.vis-force__node").classed("vis-force__node--lit", false);
            return;
        }
        let index = 0;
        const step = () => {
            const row = rows[index % rows.length];
            index++;
            const from = this.places.get(row.source);
            const to = this.places.get(row.target);
            this.nodesGroup.selectAll("path.vis-force__node")
                .classed("vis-force__node--lit", one => one.id === row.source || one.id === row.target);
            this.zap.style("display", null)
                .attr("cx", from.x)
                .attr("cy", from.y)
                .transition().duration(ZAP_MILLIS)
                .attr("cx", to.x)
                .attr("cy", to.y)
                .on("end", () => {
                    this.zapTimer = setTimeout(step, ZAP_PAUSE_MILLIS);
                });
        };
        step();
    }

    // The search's matches: how many there are, and the first, to move the focus to
    matchCount() {
        return this.cell ? matchesOf(this.cell.network, this.chart.searchText).size : 0;
    }

    focusFirstMatch() {
        const matches = this.cell ? matchesOf(this.cell.network, this.chart.searchText) : new Set();
        const first = this.nodesGroup.selectAll("path.vis-force__node").nodes()
            .find(element => matches.has(element.__data__.id));
        if (first) {
            first.focus();
        }
    }

    // Gives the focus back to the network's tab stop (e.g. when the search field closes)
    focusTabStop() {
        const stop = this.svg.node().querySelector("[tabindex='0']");
        if (stop) {
            stop.focus();
        }
    }

    // Fits the network to the visualisation: always if asked (a double click), otherwise when its
    // layout or the visualisation's size has changed since it was last fitted
    fit(always) {
        if (!this.cell || this.cell.network.nodes.length === 0 || !this.size) {
            return;
        }
        const places = this.cell.network.nodes.map(one => this.places.get(one.id));
        const bounds = {
            left: Math.min(...places.map(place => place.x)) - MARGIN,
            right: Math.max(...places.map(place => place.x)) + MARGIN + 60,
            top: Math.min(...places.map(place => place.y)) - MARGIN,
            bottom: Math.max(...places.map(place => place.y)) + MARGIN
        };
        const key = this.laidOut + "@" + this.size.width + "x" + this.size.height;
        if (!always && key === this.fitted) {
            return;
        }
        const first = this.fitted === null;
        this.fitted = key;
        this.panZoom.apply(fitOf(bounds, this.size.width, this.size.height, MIN_FIT_SCALE, MAX_FIT_SCALE), !first);
    }

    // Pans a node (or a line's target) reached from the keyboard into view, if it is out of it
    bringIntoView(element) {
        const data = element.__data__;
        const place = element.classList.contains("vis-force__handle")
            ? this.middleOf(data)
            : [this.places.get(data.id).x, this.places.get(data.id).y];
        this.panZoom.bringIntoView(place, { x: GROUP_RADIUS, y: GROUP_RADIUS }, this.size);
    }

    // A click on a line or its target (or Enter on it): see NetworkChart.activateLine
    activateLine(link, event) {
        if (link.groups !== null || link.viaGroups !== null) {
            this.highlighted = null;
        }
        this.chart.activateLine(link, event);
    }

    lineTooltip(link) {
        return this.chart.lineTooltip(link, this.byId);
    }

    // A click on a node (or Enter on it): see NetworkChart.activateNode
    activate(one, event) {
        this.chart.activateNode(one, event, this.cell);
    }

    selectionItem(one) {
        return this.chart.selectionItem(one, this.cell);
    }

    tooltip(one) {
        return this.chart.nodeTooltip(one, this.cell.network, this.byId);
    }

    describe(network) {
        return this.chart.describe(network);
    }

    // Fades the nodes and lines not joined to the node (or line) shown, hovered or focused, or else
    // those the search doesn't match: only their fills and lines fade, never the names. Marks the
    // search's matches and the selected nodes
    showHighlight() {
        if (!this.cell) {
            return;
        }
        const network = this.cell.network;
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const matches = matchesOf(network, this.chart.searchText);
        // The nodes and lines kept bright: those joined to what is shown, or the search's matches
        const { keepNode, keepLine } = this.chart.kept(network, highlighted === null ? null : highlighted.__data__,
            highlighted !== null && highlighted.classList.contains("vis-force__handle"), matches);
        this.nodesGroup.selectAll("path.vis-force__node").each((one, index, nodes) => {
            nodes[index].classList.toggle("vis-force__node--faded", !keepNode(one));
            nodes[index].classList.toggle("vis-force__node--match", matches.has(one.id));
            nodes[index].classList.toggle("vis-force__node--selected", selection.has(this.selectionItem(one).key));
        });
        this.linksGroup.selectAll("line.vis-force__link").each((link, index, lines) => {
            lines[index].classList.toggle("vis-force__link--faded", !keepLine(link));
        });
    }

    destroy() {
        clearTimeout(this.zapTimer);
        this.zap.interrupt();
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Force = Force;
