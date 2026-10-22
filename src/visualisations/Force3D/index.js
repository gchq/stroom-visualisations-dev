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

// A force-directed network in three dimensions, drawn with three.js (WebGL): a node for each source
// and target, a line between each two joined by a count, as thick as their counts, with an
// arrowhead at each end something went to and dots flowing along it the way the counts went. The
// nodes of a group are drawn as one node for the group (bigger, edged in the text's colour) unless it
// is expanded, when its members are drawn joined to it (see shared/network.js). A node's shape says
// what it does: a pyramid sends, a ball receives, a diamond does both (or, with Node Shape: Sphere,
// every node is a ball). Nodes are coloured by their group, or (Colour By: Activity) by how busy
// they are. Stroom makes it with `new visualisations.Force3D()` and calls
// setData(context, settings, data) with rows of [source, target, source group, target group, count].
//
// The network is laid out at once (layout.js), not shown moving, and the camera fitted to it.
// Dragging turns it (Shift and drag moves it), the wheel zooms and a double click goes back to the
// start; from the keyboard Shift and the arrow keys turn it, + and − zoom and 0 goes back. What it
// shares with Force 2D (the points over the drawing for the keyboard and screen readers, the
// settings and the toolbar) is in shared/canvasNetwork.js.

import "../../shared/shared.css";
import "../../shared/canvasNetwork.css";
import {
    AmbientLight, BackSide, BoxGeometry, BufferGeometry, ConeGeometry, CylinderGeometry, DirectionalLight, EdgesGeometry,
    Float32BufferAttribute, Group, LineBasicMaterial, LineDashedMaterial, LineSegments, Mesh, MeshBasicMaterial,
    MeshPhongMaterial, OctahedronGeometry, PerspectiveCamera, Quaternion, Raycaster, Scene, SphereGeometry,
    TetrahedronGeometry, Vector2, Vector3, WebGLRenderer
} from "three";
import { CanvasNetworkCell, CanvasNetworkChart, FADED_OPACITY, FLOW_DOTS } from "../../shared/canvasNetwork.js";
import { edgeColour } from "../../shared/edges.js";
import { dampingOf } from "../../shared/forceLayout.js";
import { prefersReducedMotion } from "../../shared/motion.js";
import { settingNumber } from "../../shared/settings.js";
import {
    FIELD_OF_VIEW, KEY_TURN, cameraPosition, fitDistance, fittedView, isSameView, towards, turned, zoomed
} from "./camera.js";
import { DEFAULT_CHARGE, DEFAULT_LINK_DISTANCE, boundingRadius, layOut, radiusOf } from "./layout.js";

// How many nodes are drawn at most when the Max Nodes setting doesn't say
const DEFAULT_MAX_NODES = 300;
// Lines are from this thick (a count of 1) to this thick (the most), as radii, or all this thick
// with Line Width: Same
const MIN_LINE_RADIUS = 0.3;
const MAX_LINE_RADIUS = 1.2;
const SAME_LINE_RADIUS = 0.4;
// An arrowhead's length, and its radius beyond its line's
const ARROW_LENGTH = 4;
const ARROW_WIDTH = 1.2;
// A node's edge, as a share of its size beyond it: a group's thicker
const EDGE_SCALE = 1.1;
const GROUP_EDGE_SCALE = 1.18;
// The camera is fitted to a network at least this big (as a radius), so that a network of a few
// nodes isn't drawn huge
const MIN_FIT_RADIUS = 45;
// How bright the lights are (three.js's lights are physical, so a light of π lights a matt surface
// fully): enough all round that a node's colour stays its own, and from above to one side for its
// shape
const AMBIENT_LIGHT = 0.35 * Math.PI;
const KEY_LIGHT = 0.85 * Math.PI;
const FILL_LIGHT = 0.25 * Math.PI;
// How much a drag turns the network for each pixel, and how far it moves it (with Shift) for each
// pixel, as a share of the distance
const DRAG_TURN = 0.01;
const DRAG_MOVE = 0.0015;
// How much of the way to its new view the camera goes each frame, so that it moves smoothly
const EASE = 0.25;
// The direction a cylinder or cone is made along
const UP = new Vector3(0, 1, 0);

class Force3D extends CanvasNetworkChart {

    constructor() {
        super((body, chart) => new Force3DCell(body, chart), "3D network");
    }

    defaultMaxNodes() {
        return DEFAULT_MAX_NODES;
    }

    // The layout's settings
    layoutOptions() {
        const settings = this.settings;
        return {
            charge: settingNumber(settings.charge, DEFAULT_CHARGE, 10, 1000),
            linkDistance: settingNumber(settings.linkDistance, DEFAULT_LINK_DISTANCE, 10, 200),
            damping: dampingOf(settings.damping)
        };
    }
}

// The network, in the visualisation's one cell, drawn by WebGL
class Force3DCell extends CanvasNetworkCell {

    constructor(body, chart) {
        super(body, chart, {
            keysDescription: "Shift and the arrow keys turn it, plus and minus zoom in and out, and 0 goes back to "
                             + "the start",
            unavailableWords: "This browser can't draw in 3D (it has no WebGL)"
        });
        // The distance that fits the network
        this.fitted = 1;
    }

    // WebGL, if the browser has it, the scene, its camera and lights, and the shapes it draws
    createSurface() {
        this.renderer = null;
        try {
            this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            this.renderer.setClearColor(0x000000, 0);
            this.renderer.domElement.classList.add("vis-network__canvas");
            this.renderer.domElement.setAttribute("aria-hidden", "true");
            this.element.append(this.renderer.domElement);
        } catch (error) {
            this.renderer = null;
        }
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(FIELD_OF_VIEW, 1, 0.1, 100000);
        this.scene.add(new AmbientLight(0xffffff, AMBIENT_LIGHT));
        // The lights go round with the camera, so the side of each node turned to the person is lit
        const key = new DirectionalLight(0xffffff, KEY_LIGHT);
        key.position.set(1, 1.5, 2);
        const fill = new DirectionalLight(0xffffff, FILL_LIGHT);
        fill.position.set(-1.5, -1, 1);
        this.camera.add(key, fill);
        this.scene.add(this.camera);
        this.graph = new Group();
        this.scene.add(this.graph);
        // The shapes of the nodes by what they do (see roleOf), each reaching 1 from its middle (so
        // that a node's size is how far it reaches), and the lines', arrowheads' and dots'
        this.geometries = {
            source: new TetrahedronGeometry(1),
            target: new SphereGeometry(1, 32, 16),
            both: new OctahedronGeometry(1),
            none: new BoxGeometry(2 / Math.sqrt(3), 2 / Math.sqrt(3), 2 / Math.sqrt(3)),
            // An expanded group's globe, with Node Shape: Sphere
            globe: new SphereGeometry(1, 16, 8),
            line: new CylinderGeometry(1, 1, 1, 10),
            arrow: new ConeGeometry(1, 1, 16),
            dot: new SphereGeometry(1, 12, 8)
        };
        this.raycaster = new Raycaster();
        // What is drawn of each node and line, by id: {node, shape, edge} and {link, parts, dots,
        // start, end}
        this.nodeObjects = new Map();
        this.linkObjects = new Map();
        return this.renderer !== null;
    }

    layOut(network, options, previous) {
        return layOut(network, options, previous);
    }

    // The camera fitted to the network when it is laid out again, or first drawn
    fit(relaidOut) {
        const aspect = this.size.width / this.size.height;
        this.fitted = fitDistance(this.fitRadius(), aspect);
        if (this.view === null || relaidOut) {
            this.goal = fittedView(this.fitRadius(), aspect);
            this.view = this.view === null || prefersReducedMotion() ? this.goal : this.view;
        }
    }

    // How big a network the camera is fitted to (see MIN_FIT_RADIUS)
    fitRadius() {
        return Math.max(MIN_FIT_RADIUS, boundingRadius(this.places, this.cell.network.nodes));
    }

    resize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        if (this.renderer !== null) {
            this.renderer.setSize(width, height);
        }
    }

    // Makes what WebGL draws of the network: each node in its shape and colour with an edge round it
    // (a group's in the text's colour), and each line with its arrowheads and flowing dots
    build(network) {
        this.clear();
        const colours = this.colours;
        for (const node of network.nodes) {
            const place = this.places.get(node.id);
            const radius = radiusOf(node);
            const fill = this.cell.colourOfNode(node);
            const holder = new Group();
            holder.position.set(place.x, place.y, place.z);
            // An expanded group, whose members are drawn, is hollow: see-through, edged in its colour
            const shapeName = this.chart.shapeOf(node);
            // Shiny: lit, with highlights; Flat: one plain colour
            const shapeMaterial = this.chart.isFlat()
                ? new MeshBasicMaterial({ color: fill, transparent: true, opacity: node.expanded ? 0.25 : 1 })
                : new MeshPhongMaterial({ color: fill, shininess: 80, specular: 0x555555, transparent: true,
                    opacity: node.expanded ? 0.25 : 1 });
            const shape = new Mesh(this.geometries[shapeName], shapeMaterial);
            shape.scale.setScalar(radius);
            shape.userData.node = node;
            // The edge: the shape again, a little bigger, its inside showing round it, in a colour
            // that stands out from the background (the text's for a group); an expanded group's is
            // the lines of its box, or its globe's, in its colour
            let edge;
            if (node.expanded && shapeName === "globe") {
                edge = new Mesh(this.geometries.globe, new MeshBasicMaterial({
                    color: fill, wireframe: true, transparent: true
                }));
                edge.scale.setScalar(radius);
            } else if (node.expanded) {
                edge = new LineSegments(new EdgesGeometry(this.geometries[shapeName]),
                    new LineBasicMaterial({ color: fill, transparent: true }));
                edge.scale.setScalar(radius);
            } else {
                const edgeFill = node.isGroup || colours.forced ? colours.text
                    : edgeColour(fill, colours.background) || fill;
                edge = new Mesh(this.geometries[shapeName], new MeshBasicMaterial({
                    color: edgeFill, side: BackSide, transparent: true
                }));
                edge.scale.setScalar(radius * (node.isGroup ? GROUP_EDGE_SCALE : EDGE_SCALE));
            }
            holder.add(shape, edge);
            this.graph.add(holder);
            this.nodeObjects.set(node.id, { node, shape, edge });
        }

        const most = Math.max(1, ...network.links.map(link => link.forward + link.reverse));
        const flow = this.chart.showsFlow();
        const arrows = this.chart.showsArrows();
        for (const link of network.links) {
            const a = this.places.get(link.source);
            const b = this.places.get(link.target);
            const along = new Vector3(b.x - a.x, b.y - a.y, b.z - a.z);
            const length = Math.max(1e-6, along.length());
            const direction = along.clone().divideScalar(length);
            // The line stops at the edges of its nodes
            const start = new Vector3(a.x, a.y, a.z)
                .addScaledVector(direction, radiusOf(this.byId.get(link.source)) * EDGE_SCALE + 1);
            const end = new Vector3(b.x, b.y, b.z)
                .addScaledVector(direction, -(radiusOf(this.byId.get(link.target)) * EDGE_SCALE + 1));
            const parts = [];
            const dots = [];
            if (link.isMembership) {
                // A group's line to a member is a thin dashed line
                const geometry = new BufferGeometry();
                geometry.setAttribute("position", new Float32BufferAttribute([...start.toArray(), ...end.toArray()], 3));
                const line = new LineSegments(geometry, new LineDashedMaterial({
                    color: colours.line, dashSize: 2, gapSize: 2, transparent: true
                }));
                line.computeLineDistances();
                parts.push(line);
            } else {
                // As thick as its counts, or with Line Width: Same all the same
                const weight = this.chart.lineWeight(link, most);
                const radius = weight === null ? SAME_LINE_RADIUS
                    : MIN_LINE_RADIUS + (MAX_LINE_RADIUS - MIN_LINE_RADIUS) * weight;
                const material = new MeshBasicMaterial({ color: colours.line, transparent: true });
                // An arrowhead at each end something went to, the line stopping at it
                let lineStart = start;
                let lineEnd = end;
                if (arrows && link.forward > 0) {
                    parts.push(this.arrow(end, direction, radius, material));
                    lineEnd = end.clone().addScaledVector(direction, -ARROW_LENGTH);
                }
                if (arrows && link.reverse > 0) {
                    parts.push(this.arrow(start, direction.clone().negate(), radius, material));
                    lineStart = start.clone().addScaledVector(direction, ARROW_LENGTH);
                }
                parts.push(this.cylinder(lineStart, lineEnd, radius, material));
                if (flow) {
                    // Dots flowing each way something went
                    const dotMaterial = new MeshBasicMaterial({ color: colours.dot, transparent: true });
                    const ways = [[link.forward, start, end], [link.reverse, end, start]];
                    for (const [count, from, to] of ways) {
                        for (let index = 0; count > 0 && index < FLOW_DOTS; index++) {
                            const dot = new Mesh(this.geometries.dot, dotMaterial);
                            dot.scale.setScalar(0.6 + radius * 0.6);
                            dots.push({ mesh: dot, from, to, phase: index / FLOW_DOTS });
                            parts.push(dot);
                        }
                    }
                }
            }
            parts.forEach(part => this.graph.add(part));
            this.linkObjects.set(link.id, { link, parts, dots, start, end });
        }
        this.placeDots();
    }

    // A cylinder from `start` to `end` (Vector3s)
    cylinder(start, end, radius, material) {
        const along = end.clone().sub(start);
        const mesh = new Mesh(this.geometries.line, material);
        mesh.scale.set(radius, Math.max(0.01, along.length()), radius);
        mesh.position.copy(start).addScaledVector(along, 0.5);
        mesh.quaternion.copy(new Quaternion().setFromUnitVectors(UP, along.normalize()));
        return mesh;
    }

    // An arrowhead pointing along `direction` with its tip at `tip`
    arrow(tip, direction, lineRadius, material) {
        const mesh = new Mesh(this.geometries.arrow, material);
        const radius = lineRadius + ARROW_WIDTH;
        mesh.scale.set(radius, ARROW_LENGTH, radius);
        mesh.position.copy(tip).addScaledVector(direction, -ARROW_LENGTH / 2);
        mesh.quaternion.copy(new Quaternion().setFromUnitVectors(UP, direction));
        return mesh;
    }

    // Removes what WebGL draws of the network, freeing its materials (the shapes are kept)
    clear() {
        const shared = new Set(Object.values(this.geometries));
        this.graph.traverse(object => {
            if (object.geometry && !shared.has(object.geometry)) {
                object.geometry.dispose();
            }
            if (object.material) {
                object.material.dispose();
            }
        });
        this.graph.clear();
        this.nodeObjects.clear();
        this.linkObjects.clear();
    }

    // The camera moves part of the way to its new view each frame
    stepView() {
        if (isSameView(this.view, this.goal)) {
            this.view = this.goal;
            return false;
        }
        this.view = prefersReducedMotion() ? this.goal : towards(this.view, this.goal, EASE);
        return this.view !== this.goal;
    }

    placeDots() {
        for (const { dots } of this.linkObjects.values()) {
            for (const dot of dots) {
                dot.mesh.position.copy(dot.from).lerp(dot.to, this.flowShare(dot.phase));
            }
        }
    }

    paint() {
        const position = cameraPosition(this.view);
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.lookAt(this.view.target.x, this.view.target.y, this.view.target.z);
        this.camera.updateMatrixWorld();
        this.renderer.render(this.scene, this.camera);
    }

    // Where a place in the network is on the screen, as {x, y, behind} (behind the camera if so)
    screenPlace(place) {
        const projected = new Vector3(place.x, place.y, place.z).project(this.camera);
        return {
            x: (projected.x + 1) / 2 * this.size.width,
            y: (1 - projected.y) / 2 * this.size.height,
            behind: projected.z > 1
        };
    }

    // How big a node is on the screen, in pixels, as a radius
    screenRadius(node) {
        const place = this.places.get(node.id);
        const distance = this.camera.position.distanceTo(new Vector3(place.x, place.y, place.z));
        const scale = this.size.height / 2 / Math.tan(FIELD_OF_VIEW * Math.PI / 360);
        return radiusOf(node) * (node.isGroup ? GROUP_EDGE_SCALE : EDGE_SCALE) * scale / Math.max(1e-6, distance);
    }

    // The middle of a line, between the edges of its nodes
    middleOf(link) {
        const drawn = this.linkObjects.get(link.id);
        return drawn ? drawn.start.clone().lerp(drawn.end, 0.5) : new Vector3();
    }

    // The node WebGL draws at a point of the screen (the nearest, if one is in front of another)
    nodeAt(x, y) {
        this.raycaster.setFromCamera(new Vector2(x / this.size.width * 2 - 1, 1 - y / this.size.height * 2),
            this.camera);
        const hits = this.raycaster.intersectObjects([...this.nodeObjects.values()].map(drawn => drawn.shape), false);
        return hits.length > 0 ? hits[0].object.userData.node : null;
    }

    // Zooms in or out (the camera nearer or further), or back to the start
    zoom(factor) {
        this.setGoal(zoomed(this.goal, factor, this.fitted));
    }

    resetView() {
        if (this.cell) {
            this.setGoal(fittedView(this.fitRadius(), this.camera.aspect));
        }
    }

    // Shift and the arrow keys turn the camera round the network
    keyMove(dx, dy) {
        this.setGoal(turned(this.goal, dx * KEY_TURN, dy * KEY_TURN));
    }

    // Dragging turns the network, or with Shift moves it; straight there, rather than smoothly, so
    // that the network keeps up with the mouse
    dragBy(dx, dy, shift) {
        if (shift) {
            this.moveBy(dx, dy);
        } else {
            this.goal = turned(this.goal, -dx * DRAG_TURN, dy * DRAG_TURN);
            this.view = this.goal;
            this.animate();
        }
    }

    // Moves the network across the screen, as the mouse moved by dx, dy pixels
    moveBy(dx, dy) {
        const { yaw, pitch, distance } = this.goal;
        const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
        const up = new Vector3(-Math.sin(pitch) * Math.sin(yaw), Math.cos(pitch), -Math.sin(pitch) * Math.cos(yaw));
        const step = distance * DRAG_MOVE;
        const target = new Vector3(this.goal.target.x, this.goal.target.y, this.goal.target.z)
            .addScaledVector(right, -dx * step)
            .addScaledVector(up, dy * step);
        this.goal = { ...this.goal, target: { x: target.x, y: target.y, z: target.z } };
        this.view = this.goal;
        this.animate();
    }

    // The camera looks at a place
    centreOn(place) {
        this.setGoal({ ...this.goal, target: { x: place.x, y: place.y, z: place.z } });
    }

    fade(keepNode, keepLine) {
        for (const { node, shape, edge } of this.nodeObjects.values()) {
            const faded = !keepNode(node);
            shape.material.opacity = (node.expanded ? 0.25 : 1) * (faded ? FADED_OPACITY : 1);
            shape.material.depthWrite = !faded && !node.expanded;
            edge.material.opacity = faded ? FADED_OPACITY : 1;
            edge.material.depthWrite = !faded;
        }
        for (const { link, parts } of this.linkObjects.values()) {
            const opacity = keepLine(link) ? 1 : FADED_OPACITY;
            parts.forEach(part => {
                part.material.opacity = opacity;
                part.material.depthWrite = opacity === 1;
            });
        }
    }

    disposeSurface() {
        this.clear();
        Object.values(this.geometries).forEach(geometry => geometry.dispose());
        if (this.renderer !== null) {
            this.renderer.dispose();
        }
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Force3D = Force3D;
