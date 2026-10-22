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

// What the networks drawn on a canvas share (Force 2D with the canvas's 2D drawing, Force 3D with
// WebGL): their settings (Node Shape, Shading, Show Names, Line Width, Show Arrows, Show Flow and
// Flow Speed), the buttons in Stroom's toolbar, the dots flowing along the lines, and everything
// that doesn't depend on how the network is drawn.
//
// What a canvas draws can't be reached by the keyboard or a screen reader, so over it is a layer of
// clear points, one over each node and one in the middle of each line, kept where they are drawn as
// the view moves: Stroom's stroom.points makes them reachable from the keyboard (a group's nodes at a
// time, then the lines), shows their tooltips and names them, and the selected and found nodes are
// ringed on it. The mouse goes through the points to the drawing, which says what is under it (so
// that a node hidden behind another isn't pointed at). Clicking a group (or Enter on it) expands or
// collapses it; Ctrl+Click (or Space, or Enter on a node that isn't a group) selects, as Force does.
//
// A cell (CanvasNetworkCell) is made with the drawing's own parts, see its hooks below.

import { color, select } from "d3";
import { DARK_BACKGROUND, LIGHT_BACKGROUND, mix } from "./colour.js";
import { SHAPE_CONTRAST, readableColour } from "./edges.js";
import { prefersReducedMotion } from "./motion.js";
import { matchesOf, roleOf } from "./network.js";
import { NetworkChart } from "./networkChart.js";
import { isTrue } from "./settings.js";

// The Node Shape settings' choices that draw every node round (Force 3D's Sphere, Force 2D's Circle)
const ROUND_SHAPES = new Set(["Sphere", "Circle"]);
// With Show Names: Auto, the names are written beside the nodes when there are no more than this
// many (groups' and the search's matches always); All and None write all of them or none (they are
// still in the tooltips and the names screen readers are told)
const MAX_LABELLED_NODES = 60;
const SHOW_NAMES_ALL = "All";
const SHOW_NAMES_NONE = "None";
// The choices of Line Width: Same and of Shading: Flat
const LINE_WIDTH_SAME = "Same";
const SHADING_FLAT = "Flat";
// The dots flowing along each way of a line, and their speed by the Flow Speed setting, in lines a
// second
export const FLOW_DOTS = 3;
const FLOW_SPEEDS = { Slow: 0.15, Medium: 0.35, Fast: 0.7 };
// How much one press of + or − (or a toolbar button) zooms by
export const ZOOM_STEP = 1.25;
// How much a faded node or line is still seen
export const FADED_OPACITY = 0.15;
// How far the lines' colour is taken toward the background, so that the flowing dots (in the
// text's colour) stand out on them; never so far that they don't show (3:1)
const LINE_FADE = 0.45;
// How far a drag moves before it moves the view (rather than being a click)
const DRAG_THRESHOLD = 3;
// How near (in pixels) the mouse has to be to a line's middle to point at it
const HANDLE_REACH = 8;
// The smallest a point over a node is, in pixels, so that it can be seen and focused
const MIN_POINT_RADIUS = 4;

export class CanvasNetworkChart extends NetworkChart {

    constructor(createCell, kind) {
        super(createCell, kind);
        // Whether the person chose to play or pause the flow along the lines (null until they do)
        this.playChosen = null;
    }

    // Whether the lines are all the same width (Line Width: Same) rather than as thick as their counts
    sameLineWidths() {
        return this.settings.lineWidth === LINE_WIDTH_SAME;
    }

    // Whether the lines have arrowheads (the Show Arrows setting)
    showsArrows() {
        return isTrue(this.settings.showArrows, true);
    }

    // Whether the nodes are each one plain colour (Shading: Flat) rather than lit
    isFlat() {
        return this.settings.shading === SHADING_FLAT;
    }

    // Whether dots flow along the lines (the Show Flow setting)
    showsFlow() {
        return isTrue(this.settings.flow, true);
    }

    // Whether the dots are moving: as the person chose, or else unless they have asked their system
    // for less motion (WCAG 2.3.3). Paused, they stay where they are, still showing which way
    isPlaying() {
        if (!this.showsFlow()) {
            return false;
        }
        return this.playChosen !== null ? this.playChosen : !prefersReducedMotion();
    }

    // How fast the dots flow, in lines a second
    flowSpeed() {
        return Object.hasOwn(FLOW_SPEEDS, this.settings.flowSpeed) ? FLOW_SPEEDS[this.settings.flowSpeed]
            : FLOW_SPEEDS.Medium;
    }

    // The shape a node is drawn as: by what it does (see roleOf: 'source', 'target', 'both' or
    // 'none'), or with a round Node Shape round ('target'; an expanded group 'globe', see-through)
    shapeOf(node) {
        if (ROUND_SHAPES.has(this.settings.nodeShape)) {
            return node.expanded ? "globe" : "target";
        }
        return roleOf(node);
    }

    // The nodes whose names are written beside them (see MAX_LABELLED_NODES)
    labelledNodes(network) {
        const names = this.settings.showNames;
        if (names === SHOW_NAMES_NONE) {
            return [];
        }
        if (names === SHOW_NAMES_ALL || network.nodes.length <= MAX_LABELLED_NODES) {
            return network.nodes;
        }
        const matches = matchesOf(network, this.searchText);
        return network.nodes.filter(node => node.isGroup || matches.has(node.id));
    }

    // How thick a line is between the thinnest and the thickest, 0 to 1: as its counts, out of the
    // `most` any line has; with Line Width: Same, null
    lineWeight(link, most) {
        return this.sameLineWidths() ? null : Math.sqrt((link.forward + link.reverse - 1) / Math.max(1, most - 1));
    }

    // The layout's settings, which each network has its own of
    layoutOptions() {
        return {};
    }

    networkChanged() {
        this.updateButtons();
    }

    // The buttons in Stroom's toolbar: Pause or Play the flow (when it is shown, so that the moving
    // dots can always be stopped, WCAG 2.2.2), and zoom in, out and back to the start
    updateButtons() {
        if (this.showsFlow()) {
            const playing = this.isPlaying();
            this.toolbar.set({ id: "flow", title: playing ? "Pause the flow" : "Play the flow",
                icon: playing ? "PAUSE" : "PLAY", pressed: playing }, () => {
                this.playChosen = !this.isPlaying();
                this.updateButtons();
                this.cells.forEach(cell => cell.animate());
            });
        } else {
            this.toolbar.remove("flow");
        }
        this.toolbar.set({ id: "zoomIn", title: "Zoom in", icon: "ADD" },
            () => this.cells.forEach(cell => cell.zoom(ZOOM_STEP)));
        this.toolbar.set({ id: "zoomOut", title: "Zoom out", icon: "REMOVE" },
            () => this.cells.forEach(cell => cell.zoom(1 / ZOOM_STEP)));
        this.toolbar.set({ id: "resetView", title: "Reset the view", icon: "UNDO" },
            () => this.cells.forEach(cell => cell.resetView()));
    }
}

// The network in the visualisation's one cell. A network extends it with its drawing's own parts:
//   createSurface()          makes what it draws on, in this.element, returning false if it can't
//   layOut(network, options, previous)  where each node goes, as a map of node id to {x, y[, z]}
//   fit(relaidOut)           sets this.goal (the view to move to) and this.view, e.g. fitted to the
//                            network when it was laid out again (`relaidOut`) or first drawn
//   resize(width, height)    sizes what it draws on
//   build(network)           makes (or works out) what it draws of the network
//   stepView()               moves this.view toward this.goal, returning whether it is still moving
//   paint()                  draws the network as the view sees it
//   placeDots()              puts each flowing dot where it is along its line at this.flowTime
//   screenPlace(place)       where a place is on the screen, as {x, y, behind}
//   screenRadius(node)       how big a node is on the screen, in pixels
//   middleOf(link)           the middle of a line (a place)
//   nodeAt(x, y)             the node drawn at a point of the screen, or null
//   zoom(factor, at)         zooms in (a factor above 1) or out, about a point of the screen if given
//   resetView()              goes back to the start
//   keyMove(dx, dy)          Shift and an arrow key, -1 to 1 each way
//   dragBy(dx, dy, shift)    a drag, by pixels, with or without Shift
//   centreOn(place)          moves the view so that a place is in the middle
//   fade(keepNode, keepLine) fades the nodes and lines not kept
//   disposeSurface()         frees what it drew on
export class CanvasNetworkCell {

    // `keysDescription` is what a screen reader is told of the keys that move the view, and
    // `unavailableWords` what is said when the browser can't draw (createSurface returns false)
    constructor(body, chart, { keysDescription, unavailableWords }) {
        this.chart = chart;
        this.unavailableWords = unavailableWords;
        chart.cells.add(this);
        this.element = document.createElement("div");
        this.element.className = "vis-network";
        body.append(this.element);
        // Reads the theme's colours, for a canvas, which can't use CSS's (see themeColours)
        this.probe = document.createElement("div");
        this.probe.className = "vis-network__probe";
        this.element.append(this.probe);
        this.available = this.createSurface();

        // The layer of points over the network (see above), with the names and what it says when
        // there is nothing to draw
        this.svg = select(this.element).append("svg").attr("class", "vis-chart vis-network__overlay")
            .attr("aria-description", keysDescription);
        this.labelsGroup = this.svg.append("g").attr("class", "vis-network__labels").attr("aria-hidden", "true");
        this.nodesGroup = this.svg.append("g").attr("class", "vis-network__nodes");
        this.handlesGroup = this.svg.append("g").attr("class", "vis-network__handles");
        this.emptyText = this.svg.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");

        // Where each node was laid out, by its id, and what the layout was of
        this.places = new Map();
        this.laidOut = null;
        // The view now, and the view it is moving to (each network has its own kind)
        this.view = null;
        this.goal = null;
        this.size = null;
        // The view the points were last put in place for, and whether they need it again anyway
        this.placedView = null;
        this.pointsStale = true;
        this.highlighted = null;
        this.summary = chart.kind;
        // The next frame asked for, the flow's time (in seconds) and when it was last moved on
        this.frame = null;
        this.flowTime = 0;
        this.lastFrameTime = null;
        // A drag in progress, and whether the last press was a drag (so that its click does nothing)
        this.drag = null;
        this.dragged = false;

        // The view's keys and the mouse come before stroom.points's, so that they can keep the keys
        // and clicks they deal with from it
        const overlay = this.svg.node();
        overlay.addEventListener("keydown", event => this.onKey(event));
        overlay.addEventListener("pointerdown", event => this.onPointerDown(event));
        overlay.addEventListener("pointermove", event => this.onPointerMove(event));
        overlay.addEventListener("pointerup", event => this.onPointerUp(event));
        overlay.addEventListener("pointercancel", event => this.onPointerUp(event));
        overlay.addEventListener("pointerleave", () => this.onPointerLeave());
        overlay.addEventListener("wheel", event => this.onWheel(event), { passive: false });
        overlay.addEventListener("dblclick", event => {
            event.preventDefault();
            this.resetView();
        });
        overlay.addEventListener("click", event => this.onClick(event), true);

        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(overlay, {
                selector: ".vis-network__node, .vis-network__handle",
                // A group's nodes at a time, then the lines
                group: element => isHandle(element) ? "\u0000lines" : chart.colourKeyOf(element.__data__),
                tooltip: element => isHandle(element)
                    ? this.chart.lineTooltip(element.__data__, this.byId)
                    : this.chart.nodeTooltip(element.__data__, this.cell.network, this.byId),
                highlight: element => {
                    this.highlighted = element;
                    if (element !== null && element === document.activeElement) {
                        this.bringIntoView(element);
                    }
                    this.showHighlight();
                },
                select: (element, event) => isHandle(element)
                    ? this.activateLine(element.__data__, event)
                    : this.chart.activateNode(element.__data__, event, this.cell),
                summary: () => this.summary
            })
            : null;
    }

    draw(cell) {
        this.cell = cell;
        const width = this.element.clientWidth || this.element.parentNode.clientWidth;
        const height = this.element.clientHeight || this.element.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }
        const network = cell.network;
        this.byId = new Map(network.nodes.map(node => [node.id, node]));
        let empty = "";
        if (network.nodes.length === 0) {
            empty = "No data";
        } else if (!this.available) {
            empty = this.unavailableWords;
        }
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(empty);

        // Laid out again only when the network or the layout's settings have changed (not when
        // the visualisation is resized)
        const options = this.chart.layoutOptions();
        const shape = network.nodes.map(node => node.id).join("|") + "#" + network.links.map(link => link.id).join("|")
                      + "#" + JSON.stringify(options);
        const relaidOut = shape !== this.laidOut;
        if (relaidOut) {
            this.places = this.layOut(network, options, this.places);
            this.laidOut = shape;
        }
        this.size = { width, height };
        this.resize(width, height);
        this.fit(relaidOut);

        this.colours = this.themeColours();
        this.build(network);
        this.drawPoints(network);
        this.pointsStale = true;
        this.summary = this.chart.describe(network);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
        this.animate();
    }

    // The theme's colours as '#rrggbb', for a canvas: the background's, the text's, the lines' (a
    // little toward the background) and the flowing dots'. With forced colours (a high contrast
    // theme), the system's, as CSS has them then
    themeColours() {
        const forced = typeof window.matchMedia === "function" && window.matchMedia("(forced-colors: active)").matches;
        const read = (expression, fallback) => {
            this.probe.style.color = "";
            this.probe.style.color = expression;
            const parsed = color(getComputedStyle(this.probe).color);
            return parsed && parsed.opacity > 0 ? parsed.formatHex() : fallback;
        };
        const dark = this.chart.isDarkTheme();
        const background = forced ? read("Canvas", "#000000")
            : read("var(--vis__background-color)", dark ? DARK_BACKGROUND : LIGHT_BACKGROUND);
        const text = forced ? read("CanvasText", "#ffffff") : read("var(--vis-text__color)", dark ? "#ffffff" : "#000000");
        const line = read("var(--vis-axis__color)", text);
        return {
            forced,
            background,
            text,
            line: forced ? text : readableColour(mix(line, background, LINE_FADE), background, SHAPE_CONTRAST),
            // On the lines in the text's colour, the dots are in the background's (a light pulse
            // along a dark line, or a dark one along a light)
            dot: forced ? background : text
        };
    }

    // The points over the nodes and lines, and the names beside the nodes
    drawPoints(network) {
        this.nodesGroup.selectAll("circle.vis-network__node")
            .data(this.chart.keyboardOrder(network), node => node.id)
            .join("circle")
            .attr("class", "vis-network__node")
            .classed("vis-network__node--group", node => node.isGroup)
            .classed("vis-network__node--expanded", node => node.expanded)
            // The shape it is drawn as, which a test can't otherwise see
            .attr("data-shape", node => this.chart.shapeOf(node))
            .order();
        this.handlesGroup.selectAll("circle.vis-network__handle")
            .data(network.links.filter(link => !link.isMembership), link => link.id)
            .join("circle")
            .attr("class", "vis-network__handle")
            .classed("vis-network__handle--expandable", link => link.groups !== null || link.viaGroups !== null);
        this.labelsGroup.selectAll("text.vis-network__label")
            .data(this.chart.labelledNodes(network), node => node.id)
            .join("text")
            .attr("class", "vis-network__label")
            .classed("vis-network__label--group", node => node.isGroup)
            .attr("dy", "0.35em")
            .text(node => String(node.name));
    }

    // Moves the flow on and the view toward its goal, draws the network as the view sees it, and
    // keeps the points over it; asks for another frame while anything is still moving
    animate() {
        if (this.frame === null) {
            this.frame = requestAnimationFrame(time => this.onFrame(time));
        }
    }

    onFrame(time) {
        this.frame = null;
        if (!this.cell || this.view === null) {
            return;
        }
        const playing = this.chart.isPlaying();
        if (playing && this.lastFrameTime !== null) {
            // No more than a tenth of a second at a time, so that the dots don't jump after a pause
            this.flowTime += Math.min(0.1, (time - this.lastFrameTime) / 1000);
            this.placeDots();
        }
        this.lastFrameTime = playing ? time : null;
        const moving = this.stepView();
        this.render();
        if (playing || moving) {
            this.animate();
        }
    }

    // Draws the network, and moves the points over it if the view has moved (not just for the flow,
    // which would move every point every frame for nothing)
    render() {
        if (this.available) {
            this.paint();
        }
        if (this.pointsStale || this.view !== this.placedView) {
            this.placePoints();
            this.placedView = this.view;
            this.pointsStale = false;
        }
    }

    // How far along its line a flowing dot is now, 0 to 1, from where it started (its `phase`)
    flowShare(phase) {
        return (phase + this.flowTime * this.chart.flowSpeed()) % 1;
    }

    // Keeps the points and names over the nodes and lines as the view sees them
    placePoints() {
        if (!this.size) {
            return;
        }
        this.nodesGroup.selectAll("circle.vis-network__node").each((node, index, elements) => {
            const place = this.screenPlace(this.places.get(node.id));
            elements[index].setAttribute("cx", place.x);
            elements[index].setAttribute("cy", place.y);
            elements[index].setAttribute("r", Math.max(MIN_POINT_RADIUS, this.screenRadius(node) + 2));
        });
        this.handlesGroup.selectAll("circle.vis-network__handle").each((link, index, elements) => {
            const place = this.screenPlace(this.middleOf(link));
            elements[index].setAttribute("cx", place.x);
            elements[index].setAttribute("cy", place.y);
            elements[index].setAttribute("r", HANDLE_REACH - 1);
        });
        this.labelsGroup.selectAll("text.vis-network__label").each((node, index, elements) => {
            const place = this.screenPlace(this.places.get(node.id));
            elements[index].setAttribute("x", place.x + this.screenRadius(node) + 4);
            elements[index].setAttribute("y", place.y);
            elements[index].style.display = place.behind ? "none" : null;
        });
    }

    setGoal(goal) {
        if (this.goal === null) {
            return;
        }
        this.goal = goal;
        this.animate();
    }

    // The view's keys, wherever the focus is among the points (which don't use them): Shift and the
    // arrow keys move it, + and − zoom and 0 goes back to the start
    onKey(event) {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || this.goal === null) {
            return;
        }
        const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
        if (event.shiftKey && Object.hasOwn(moves, event.key)) {
            this.keyMove(...moves[event.key]);
        } else if (event.key === "+" || event.key === "=") {
            this.zoom(ZOOM_STEP);
        } else if (event.key === "-" || event.key === "_" || event.key === "−") {
            this.zoom(1 / ZOOM_STEP);
        } else if (event.key === "0") {
            this.resetView();
        } else {
            return;
        }
        event.preventDefault();
    }

    onPointerDown(event) {
        if (event.button !== 0 || this.goal === null) {
            return;
        }
        this.drag = { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY,
            moved: false, shift: event.shiftKey };
        this.dragged = false;
        // The drag goes on when the mouse leaves the visualisation (a pointer that isn't really
        // down, as a test's, can't be captured)
        try {
            this.svg.node().setPointerCapture(event.pointerId);
        } catch (error) {
            // Not captured
        }
    }

    // Dragging moves the view; otherwise the node or line under the mouse shows its tooltip
    onPointerMove(event) {
        const drag = this.drag;
        if (drag === null) {
            this.hover(event);
            return;
        }
        if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) {
            return;
        }
        if (!drag.moved) {
            drag.moved = true;
            this.svg.classed("vis-network__overlay--dragging", true);
            if (this.points) {
                this.points.hide();
            }
        }
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        drag.x = event.clientX;
        drag.y = event.clientY;
        this.dragBy(dx, dy, drag.shift);
    }

    onPointerUp(event) {
        if (this.drag === null) {
            return;
        }
        this.dragged = this.drag.moved;
        this.drag = null;
        this.svg.classed("vis-network__overlay--dragging", false);
        if (this.svg.node().hasPointerCapture(event.pointerId)) {
            this.svg.node().releasePointerCapture(event.pointerId);
        }
    }

    onPointerLeave() {
        if (this.drag === null && this.points && this.highlighted !== null
            && this.highlighted !== document.activeElement) {
            this.points.hide();
        }
    }

    onWheel(event) {
        if (this.goal === null) {
            return;
        }
        event.preventDefault();
        this.zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, this.pointerPlace(event));
    }

    // Where the mouse is in the visualisation, in pixels from its top left
    pointerPlace(event) {
        const bounds = this.svg.node().getBoundingClientRect();
        return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }

    // A click: on a node or line, what a click on its point does (and not what a click on nothing
    // does, which stroom.points would otherwise take it for, as the points let clicks through); the
    // end of a drag, nothing
    onClick(event) {
        if (this.dragged) {
            this.dragged = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        // A click on a point itself (e.g. from an assistive technology) is stroom.points's
        if (event.target instanceof Element && event.target.closest(".vis-network__node, .vis-network__handle")) {
            return;
        }
        const hit = this.hitTest(event);
        if (hit === null) {
            return;
        }
        event.preventDefault();
        if (hit.node) {
            this.chart.activateNode(hit.node, event, this.cell);
        } else {
            this.activateLine(hit.link, event);
        }
    }

    // Shows the tooltip of the node or line under the mouse, if any
    hover(event) {
        if (!this.points) {
            return;
        }
        const hit = this.hitTest(event);
        const point = hit === null ? null : this.pointOf(hit);
        this.svg.classed("vis-network__overlay--over-point", point !== null);
        if (point !== null) {
            if (point !== this.highlighted) {
                this.points.show(point);
            }
        } else if (this.highlighted !== null && this.highlighted !== document.activeElement) {
            this.points.hide();
        }
    }

    // The point over a node or line ({node} or {link})
    pointOf(hit) {
        const selector = hit.node ? "circle.vis-network__node" : "circle.vis-network__handle";
        const wanted = hit.node || hit.link;
        return this.svg.selectAll(selector).nodes().find(element => element.__data__ === wanted) || null;
    }

    // What is under the mouse: the node drawn there (the nearest, if one is in front of another), as
    // {node}; or else the middle of a line it is near, as {link}; or null
    hitTest(event) {
        if (!this.size || this.cell === undefined) {
            return null;
        }
        const { x, y } = this.pointerPlace(event);
        const node = this.available ? this.nodeAt(x, y) : null;
        if (node !== null) {
            return { node };
        }
        let nearest = null;
        let nearestDistance = HANDLE_REACH;
        for (const link of this.cell.network.links) {
            if (link.isMembership) {
                continue;
            }
            const place = this.screenPlace(this.middleOf(link));
            const distance = Math.hypot(place.x - x, place.y - y);
            if (!place.behind && distance <= nearestDistance) {
                nearest = link;
                nearestDistance = distance;
            }
        }
        return nearest === null ? null : { link: nearest };
    }

    // A click on a line or its point (or Enter on it): see NetworkChart.activateLine
    activateLine(link, event) {
        if (link.groups !== null || link.viaGroups !== null) {
            this.highlighted = null;
        }
        this.chart.activateLine(link, event);
    }

    // Moves the view to a node (or a line's middle) reached from the keyboard, if it is out of view,
    // so that it is in the middle
    bringIntoView(element) {
        const data = element.__data__;
        const place = isHandle(element) ? this.middleOf(data) : this.places.get(data.id);
        if (!place || !this.size || this.goal === null) {
            return;
        }
        const screen = this.screenPlace(place);
        if (screen.behind || screen.x < 0 || screen.x > this.size.width || screen.y < 0 || screen.y > this.size.height) {
            this.centreOn(place);
        }
    }

    // The search's matches: how many there are, and the first, to move the focus to
    matchCount() {
        return this.cell ? matchesOf(this.cell.network, this.chart.searchText).size : 0;
    }

    focusFirstMatch() {
        const matches = this.cell ? matchesOf(this.cell.network, this.chart.searchText) : new Set();
        const first = this.nodesGroup.selectAll("circle.vis-network__node").nodes()
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

    // Fades the nodes and lines not joined to the node (or line) shown, hovered or focused, or else
    // those the search doesn't match: only the nodes and lines fade, never the names. Rings the
    // search's matches and the selected nodes
    showHighlight() {
        if (!this.cell) {
            return;
        }
        const network = this.cell.network;
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const matches = matchesOf(network, this.chart.searchText);
        const { keepNode, keepLine } = this.chart.kept(network, highlighted === null ? null : highlighted.__data__,
            highlighted !== null && isHandle(highlighted), matches);
        this.nodesGroup.selectAll("circle.vis-network__node").each((node, index, elements) => {
            elements[index].classList.toggle("vis-network__node--faded", !keepNode(node));
            elements[index].classList.toggle("vis-network__node--match", matches.has(node.id));
            elements[index].classList.toggle("vis-network__node--selected",
                selection.has(this.chart.selectionItem(node, this.cell).key));
        });
        this.handlesGroup.selectAll("circle.vis-network__handle").each((link, index, elements) => {
            elements[index].classList.toggle("vis-network__handle--faded", !keepLine(link));
        });
        this.fade(keepNode, keepLine);
        this.animate();
    }

    destroy() {
        if (this.frame !== null) {
            cancelAnimationFrame(this.frame);
            this.frame = null;
        }
        if (this.points) {
            this.points.destroy();
        }
        this.disposeSurface();
        this.chart.cells.delete(this);
        this.element.remove();
    }
}

// Whether a point is a line's (rather than a node's)
function isHandle(element) {
    return element.classList.contains("vis-network__handle");
}
