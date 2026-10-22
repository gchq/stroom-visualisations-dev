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

// A force-directed network drawn on a canvas (its 2D drawing), which is quick for big networks: a
// node for each source and target, a line between each two joined by a count, as thick as their
// counts, with an arrowhead at each end something went to and dots flowing along it the way the
// counts went. The nodes of a group are drawn as one node for the group (bigger, edged in the text's
// colour) unless it is expanded, when its members are drawn joined to it (see shared/network.js). A
// node's shape says what it does: a triangle sends, a circle receives, a diamond does both (or, with
// Node Shape: Circle, every node is a circle). Nodes are coloured by their group, or (Colour By:
// Activity) by how busy they are. It replaces the legacy ForceCanvas script, which was never
// finished. Stroom makes it with `new visualisations.Force2D()` and calls
// setData(context, settings, data) with rows of [source, target, source group, target group, count].
//
// The network is laid out at once (shared/forceLayout.js, as Force's), not shown moving, and
// fitted to the visualisation. Dragging moves it, the wheel zooms about the mouse and a double click
// fits it again; from the keyboard Shift and the arrow keys move it, + and − zoom and 0 fits it. What
// it shares with Force 3D (the points over the drawing for the keyboard and screen readers, the
// settings and the toolbar) is in shared/canvasNetwork.js.

import "../../shared/shared.css";
import "../../shared/canvasNetwork.css";
import { symbol, symbolCircle, symbolDiamond, symbolSquare, symbolTriangle } from "d3";
import { CanvasNetworkCell, CanvasNetworkChart, FADED_OPACITY, FLOW_DOTS } from "../../shared/canvasNetwork.js";
import { mix } from "../../shared/colour.js";
import { edgeColour } from "../../shared/edges.js";
import { fitOf } from "../../shared/fit.js";
import { DEFAULT_CHARGE, DEFAULT_LINK_DISTANCE, dampingOf, layOut } from "../../shared/forceLayout.js";
import { prefersReducedMotion } from "../../shared/motion.js";
import { settingNumber } from "../../shared/settings.js";
import { centredOn, isSameView, moved, toScreen, towards, zoomedAbout } from "./view.js";

// How many nodes are drawn at most when the Max Nodes setting doesn't say
const DEFAULT_MAX_NODES = 2000;
// The shape of a node by what it does (as Force's), and with Node Shape: Circle; an expanded group
// is hollow
const SHAPES = { source: symbolTriangle, target: symbolCircle, both: symbolDiamond, none: symbolSquare,
    globe: symbolCircle };
// How big a node is (a group's bigger), as d3 symbol areas, and how far its edge is from its middle
const NODE_SIZE = 140;
const GROUP_SIZE = 420;
const NODE_RADIUS = 8;
const GROUP_RADIUS = 14;
// Lines are from this thick (a count of 1) to this thick (the most), or all this thick with Line
// Width: Same
const MIN_LINE_WIDTH = 1.5;
const MAX_LINE_WIDTH = 8;
const SAME_LINE_WIDTH = 2;
// An arrowhead's length, and how far it reaches beyond its line either side
const ARROW_LENGTH = 10;
const ARROW_WIDTH = 4;
// The room round the network when it is fitted (more on the right, for the names), and the least
// and most it is scaled to fit
const MARGIN = 24;
const LABEL_ROOM = 60;
const MIN_FIT_SCALE = 0.05;
const MAX_FIT_SCALE = 1.5;
// How far Shift and an arrow key move the view, in pixels
const KEY_MOVE = 50;
// How much of the way to its new view it goes each frame, so that it moves smoothly
const EASE = 0.25;

class Force2D extends CanvasNetworkChart {

    constructor() {
        super((body, chart) => new Force2DCell(body, chart), "2D network");
    }

    defaultMaxNodes() {
        return DEFAULT_MAX_NODES;
    }

    // The layout's settings
    layoutOptions() {
        const settings = this.settings;
        return {
            charge: settingNumber(settings.charge, DEFAULT_CHARGE, 10, 1000),
            linkDistance: settingNumber(settings.linkDistance, DEFAULT_LINK_DISTANCE, 10, 400),
            damping: dampingOf(settings.damping)
        };
    }
}

// How far a node's edge is from its middle
function radiusOf(node) {
    return node.isGroup ? GROUP_RADIUS : NODE_RADIUS;
}

// The network, in the visualisation's one cell, drawn on a canvas
class Force2DCell extends CanvasNetworkCell {

    constructor(body, chart) {
        super(body, chart, {
            keysDescription: "Shift and the arrow keys move it, plus and minus zoom in and out, and 0 fits it to the "
                             + "visualisation",
            unavailableWords: "This browser can't draw the network (it has no canvas)"
        });
        // The scale that fits the network
        this.fittedScale = 1;
    }

    // The canvas, if the browser can draw on one, and what it draws
    createSurface() {
        this.canvas = document.createElement("canvas");
        this.canvas.className = "vis-network__canvas";
        this.canvas.setAttribute("aria-hidden", "true");
        this.element.append(this.canvas);
        this.context = this.canvas.getContext("2d");
        this.ratio = Math.min(window.devicePixelRatio || 1, 2);
        // What is drawn of each node and line: [{node, shape, fill, edge, edgeWidth}] and [{link,
        // start, end, lineStart, lineEnd, width, arrows: [{tip, direction}], dots: [{from, to, phase}]}]
        this.drawnNodes = [];
        this.drawnLinks = [];
        this.drawnLinkById = new Map();
        this.keepNode = () => true;
        this.keepLine = () => true;
        return this.context !== null;
    }

    layOut(network, options, previous) {
        return layOut(network, previous, options);
    }

    // Fitted to the network when it is laid out again, or first drawn
    fit(relaidOut) {
        const fitted = this.fittedView();
        this.fittedScale = fitted.k;
        if (this.view === null || relaidOut) {
            this.goal = fitted;
            this.view = this.view === null || prefersReducedMotion() ? this.goal : this.view;
        }
    }

    // The view that fits the network to the visualisation
    fittedView() {
        const places = this.cell.network.nodes.map(node => this.places.get(node.id));
        if (places.length === 0) {
            return { k: 1, x: this.size.width / 2, y: this.size.height / 2 };
        }
        const bounds = {
            left: Math.min(...places.map(place => place.x)) - MARGIN,
            right: Math.max(...places.map(place => place.x)) + MARGIN + LABEL_ROOM,
            top: Math.min(...places.map(place => place.y)) - MARGIN,
            bottom: Math.max(...places.map(place => place.y)) + MARGIN
        };
        return fitOf(bounds, this.size.width, this.size.height, MIN_FIT_SCALE, MAX_FIT_SCALE);
    }

    resize(width, height) {
        this.canvas.width = Math.round(width * this.ratio);
        this.canvas.height = Math.round(height * this.ratio);
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";
    }

    // Works out what is drawn of the network: each node in its shape and colour with an edge round it
    // (a group's in the text's colour), and each line with its arrowheads and flowing dots
    build(network) {
        const colours = this.colours;
        this.drawnNodes = network.nodes.map(node => {
            const fill = this.cell.colourOfNode(node);
            let edge = colours.forced ? colours.text : edgeColour(fill, colours.background) || colours.background;
            let edgeWidth = 1.5;
            if (node.expanded) {
                // An expanded group, whose members are drawn, is hollow, edged in its colour
                edge = fill;
                edgeWidth = 3;
            } else if (node.isGroup) {
                edge = colours.text;
                edgeWidth = 2.5;
            }
            return { node, shape: this.chart.shapeOf(node), fill, edge, edgeWidth };
        });

        const most = Math.max(1, ...network.links.map(link => link.forward + link.reverse));
        const flow = this.chart.showsFlow();
        const arrows = this.chart.showsArrows();
        this.drawnLinks = network.links.map(link => {
            const a = this.places.get(link.source);
            const b = this.places.get(link.target);
            const length = Math.max(1e-6, Math.hypot(b.x - a.x, b.y - a.y));
            const direction = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
            const along = (place, distance) => ({ x: place.x + direction.x * distance, y: place.y + direction.y * distance });
            // The line stops at the edges of its nodes
            const start = along(a, radiusOf(this.byId.get(link.source)) + 2);
            const end = along(b, -(radiusOf(this.byId.get(link.target)) + 2));
            const drawn = { link, start, end, lineStart: start, lineEnd: end, width: 1, arrows: [], dots: [] };
            if (link.isMembership) {
                return drawn;
            }
            const weight = this.chart.lineWeight(link, most);
            drawn.width = weight === null ? SAME_LINE_WIDTH : MIN_LINE_WIDTH + (MAX_LINE_WIDTH - MIN_LINE_WIDTH) * weight;
            // An arrowhead at each end something went to, the line stopping at it
            if (arrows && link.forward > 0) {
                drawn.arrows.push({ tip: end, direction });
                drawn.lineEnd = along(end, -ARROW_LENGTH);
            }
            if (arrows && link.reverse > 0) {
                drawn.arrows.push({ tip: start, direction: { x: -direction.x, y: -direction.y } });
                drawn.lineStart = along(start, ARROW_LENGTH);
            }
            if (flow) {
                const ways = [[link.forward, start, end], [link.reverse, end, start]];
                for (const [count, from, to] of ways) {
                    for (let index = 0; count > 0 && index < FLOW_DOTS; index++) {
                        drawn.dots.push({ from, to, phase: index / FLOW_DOTS });
                    }
                }
            }
            return drawn;
        });
        this.drawnLinkById = new Map(this.drawnLinks.map(drawn => [drawn.link.id, drawn]));
    }

    // The view moves part of the way to its goal each frame
    stepView() {
        if (isSameView(this.view, this.goal)) {
            this.view = this.goal;
            return false;
        }
        this.view = prefersReducedMotion() ? this.goal : towards(this.view, this.goal, EASE);
        return this.view !== this.goal;
    }

    // The dots are put in place as they are drawn
    placeDots() {
    }

    paint() {
        const context = this.context;
        const colours = this.colours;
        const { k, x, y } = this.view;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        context.setTransform(this.ratio * k, 0, 0, this.ratio * k, this.ratio * x, this.ratio * y);
        context.lineCap = "round";

        for (const drawn of this.drawnLinks) {
            context.globalAlpha = this.keepLine(drawn.link) ? 1 : FADED_OPACITY;
            context.strokeStyle = colours.line;
            context.fillStyle = colours.line;
            context.lineWidth = drawn.width;
            // A group's line to a member is a thin dashed line
            context.setLineDash(drawn.link.isMembership ? [3, 3] : []);
            context.beginPath();
            context.moveTo(drawn.lineStart.x, drawn.lineStart.y);
            context.lineTo(drawn.lineEnd.x, drawn.lineEnd.y);
            context.stroke();
            for (const { tip, direction } of drawn.arrows) {
                const half = drawn.width / 2 + ARROW_WIDTH;
                const baseX = tip.x - direction.x * ARROW_LENGTH;
                const baseY = tip.y - direction.y * ARROW_LENGTH;
                context.beginPath();
                context.moveTo(tip.x, tip.y);
                context.lineTo(baseX - direction.y * half, baseY + direction.x * half);
                context.lineTo(baseX + direction.y * half, baseY - direction.x * half);
                context.closePath();
                context.fill();
            }
            context.fillStyle = colours.dot;
            for (const dot of drawn.dots) {
                const share = this.flowShare(dot.phase);
                context.beginPath();
                context.arc(dot.from.x + (dot.to.x - dot.from.x) * share, dot.from.y + (dot.to.y - dot.from.y) * share,
                    2 + drawn.width * 0.35, 0, 2 * Math.PI);
                context.fill();
            }
        }
        context.setLineDash([]);

        const path = symbol().context(context);
        const flat = this.chart.isFlat();
        for (const { node, shape, fill, edge, edgeWidth } of this.drawnNodes) {
            const place = this.places.get(node.id);
            context.globalAlpha = this.keepNode(node) ? 1 : FADED_OPACITY;
            context.save();
            context.translate(place.x, place.y);
            context.beginPath();
            path.type(SHAPES[shape]).size(node.isGroup ? GROUP_SIZE : NODE_SIZE)();
            if (node.expanded) {
                context.fillStyle = colours.background;
            } else if (flat) {
                context.fillStyle = fill;
            } else {
                // Shiny: lit from the top left
                const radius = radiusOf(node);
                const gradient = context.createRadialGradient(-radius * 0.35, -radius * 0.35, radius * 0.1, 0, 0,
                    radius * 1.2);
                gradient.addColorStop(0, mix(fill, "#ffffff", 0.45));
                gradient.addColorStop(0.55, fill);
                gradient.addColorStop(1, mix(fill, "#000000", 0.3));
                context.fillStyle = gradient;
            }
            context.fill();
            context.strokeStyle = edge;
            context.lineWidth = edgeWidth;
            context.stroke();
            context.restore();
        }
        context.globalAlpha = 1;
    }

    screenPlace(place) {
        return { ...toScreen(this.view, place), behind: false };
    }

    screenRadius(node) {
        return radiusOf(node) * this.view.k;
    }

    // The middle of a line, between the edges of its nodes
    middleOf(link) {
        const drawn = this.drawnLinkById.get(link.id);
        return drawn ? { x: (drawn.start.x + drawn.end.x) / 2, y: (drawn.start.y + drawn.end.y) / 2 } : { x: 0, y: 0 };
    }

    // The node drawn at a point of the screen: the last drawn (on top) of those there
    nodeAt(x, y) {
        for (let index = this.drawnNodes.length - 1; index >= 0; index--) {
            const node = this.drawnNodes[index].node;
            const place = this.screenPlace(this.places.get(node.id));
            if (Math.hypot(place.x - x, place.y - y) <= this.screenRadius(node) + 2) {
                return node;
            }
        }
        return null;
    }

    // Zooms in or out about a point of the screen (the middle if not given), or back to the start
    zoom(factor, at) {
        const about = at || { x: this.size.width / 2, y: this.size.height / 2 };
        this.setGoal(zoomedAbout(this.goal, factor, about, this.fittedScale));
    }

    resetView() {
        if (this.cell) {
            this.setGoal(this.fittedView());
        }
    }

    // Shift and the arrow keys move the view (to see more of the network that way)
    keyMove(dx, dy) {
        this.setGoal(moved(this.goal, -dx * KEY_MOVE, dy * KEY_MOVE));
    }

    // Dragging moves the network with the mouse, straight there, rather than smoothly, so that it
    // keeps up
    dragBy(dx, dy) {
        this.goal = moved(this.goal, dx, dy);
        this.view = this.goal;
        this.animate();
    }

    centreOn(place) {
        this.setGoal(centredOn(this.goal, place, this.size));
    }

    fade(keepNode, keepLine) {
        this.keepNode = keepNode;
        this.keepLine = keepLine;
    }

    disposeSurface() {
        this.drawnNodes = [];
        this.drawnLinks = [];
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Force2D = Force2D;
