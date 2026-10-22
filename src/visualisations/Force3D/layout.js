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

// Where the nodes of a network (shared/network.js) go in Force 3D: laid out in three dimensions by
// forces as d3's are in two (d3-force is two dimensional only), and run to rest at once rather than
// shown moving. The nodes push each other apart (the charge), the links pull their ends together
// to about the link distance, nodes don't overlap, and the whole is kept about the middle. The
// same network is laid out the same way each time (the starting places are seeded, not random).

import { DEFAULT_DAMPING } from "../../shared/forceLayout.js";
import { seededRandom } from "../../shared/network.js";

// How big a node is, and a group's (which is drawn bigger)
export const NODE_RADIUS = 4;
export const GROUP_RADIUS = 7;
// The settings' defaults: how hard the nodes push each other apart, how long a link is (a group's
// links to its members half as long); how much of a node's speed it keeps each step is the
// Damping setting's, as Force 2D's (see forceLayout.js)
export const DEFAULT_CHARGE = 120;
export const DEFAULT_LINK_DISTANCE = 40;

// How many steps the forces are run for, and how far they have died down by the end (as d3's do)
const STEPS = 300;
const ALPHA_MIN = 0.001;
const ALPHA_DECAY = 1 - Math.pow(ALPHA_MIN, 1 / STEPS);
// Where the forces start for a network mostly laid out before
const REHEAT_ALPHA = 0.1;
// How hard the charge pushes, for a charge of 1 (so that a setting of 120 lays out about as Force's
// 2D layout does)
const CHARGE_SCALE = 2;
// The room left between two nodes, and how many times overlaps are undone after the last step
const PADDING = 2;
const SEPARATE_PASSES = 10;

// The size of a node: a group's is bigger
export function radiusOf(node) {
    return node.isGroup ? GROUP_RADIUS : NODE_RADIUS;
}

// Starting places spread evenly over a sphere big enough for the nodes, in a seeded order
function startingPlaces(count, random) {
    const radius = 10 * Math.cbrt(Math.max(1, count));
    const golden = Math.PI * (3 - Math.sqrt(5));
    const places = [];
    for (let index = 0; index < count; index++) {
        const y = count === 1 ? 0 : 1 - 2 * (index + 0.5) / count;
        const ring = Math.sqrt(1 - y * y);
        const angle = index * golden;
        // A little off the sphere, so that no two nodes start the same distance from the middle
        const r = radius * (0.8 + 0.4 * random());
        places.push({ x: r * ring * Math.cos(angle), y: r * y, z: r * ring * Math.sin(angle) });
    }
    return places;
}

// Where each node goes, as a map of node id to {x, y, z}, about 0,0,0. `options` are the settings:
// `charge` (how hard nodes push apart), `linkDistance` and `damping` (how much speed a node keeps
// each step, 0 to 1). A node laid out before (`previous`) starts where it was, so that a network
// that changes a little moves a little
export function layOut(network, { charge = DEFAULT_CHARGE, linkDistance = DEFAULT_LINK_DISTANCE,
                                  damping = DEFAULT_DAMPING } = {}, previous = new Map()) {
    const random = seededRandom();
    const starts = startingPlaces(network.nodes.length, random);
    const nodes = network.nodes.map((node, index) => {
        const was = previous.get(node.id);
        const start = was || starts[index];
        return { id: node.id, radius: radiusOf(node), x: start.x, y: start.y, z: start.z, vx: 0, vy: 0, vz: 0 };
    });
    const byId = new Map(nodes.map(node => [node.id, node]));
    const links = network.links
        .map(link => ({ source: byId.get(link.source), target: byId.get(link.target),
            distance: link.isMembership ? linkDistance / 2 : linkDistance }))
        .filter(link => link.source && link.target);

    // As d3's link force: each link's pull shared by its ends by how many links each has, so that a
    // node with many links moves less
    const degree = new Map(nodes.map(node => [node, 0]));
    links.forEach(link => {
        degree.set(link.source, degree.get(link.source) + 1);
        degree.set(link.target, degree.get(link.target) + 1);
    });
    links.forEach(link => {
        const a = degree.get(link.source);
        const b = degree.get(link.target);
        link.strength = 1 / Math.min(a, b);
        link.bias = a / (a + b);
    });

    // A network mostly laid out before starts with the forces lower, so that it settles from where
    // it was rather than being shaken up again
    const known = network.nodes.filter(node => previous.has(node.id)).length;
    let alpha = known * 2 > network.nodes.length ? REHEAT_ALPHA : 1;
    for (let step = 0; step < STEPS && alpha > ALPHA_MIN; step++) {
        alpha += (0 - alpha) * ALPHA_DECAY;
        pullLinks(links, alpha, random);
        pushApart(nodes, charge * CHARGE_SCALE, alpha, random);
        for (const node of nodes) {
            node.vx *= damping;
            node.vy *= damping;
            node.vz *= damping;
            node.x += node.vx;
            node.y += node.vy;
            node.z += node.vz;
        }
        separate(nodes);
        centre(nodes);
    }
    // Moving two nodes apart can move one into a third, so a few more times at the end
    for (let pass = 0; pass < SEPARATE_PASSES; pass++) {
        separate(nodes);
    }
    return new Map(nodes.map(node => [node.id, { x: node.x, y: node.y, z: node.z }]));
}

// A tiny random nudge, for two nodes in the same place (which have no direction between them)
function jiggle(random) {
    return (random() - 0.5) * 1e-6;
}

// Each link pulls (or pushes) its ends toward its distance apart
function pullLinks(links, alpha, random) {
    for (const link of links) {
        const { source, target } = link;
        let dx = target.x + target.vx - source.x - source.vx || jiggle(random);
        let dy = target.y + target.vy - source.y - source.vy || jiggle(random);
        let dz = target.z + target.vz - source.z - source.vz || jiggle(random);
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const pull = (length - link.distance) / length * alpha * link.strength;
        dx *= pull;
        dy *= pull;
        dz *= pull;
        target.vx -= dx * link.bias;
        target.vy -= dy * link.bias;
        target.vz -= dz * link.bias;
        source.vx += dx * (1 - link.bias);
        source.vy += dy * (1 - link.bias);
        source.vz += dz * (1 - link.bias);
    }
}

// Every two nodes push each other apart, less the further apart they are
function pushApart(nodes, strength, alpha, random) {
    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = b.x - a.x || jiggle(random);
            const dy = b.y - a.y || jiggle(random);
            const dz = b.z - a.z || jiggle(random);
            // No nearer than 1 apart, so that two nodes very close aren't flung far
            const distanceSquared = Math.max(1, dx * dx + dy * dy + dz * dz);
            const distance = Math.sqrt(distanceSquared);
            const push = strength * alpha / distanceSquared / distance;
            a.vx -= dx * push;
            a.vy -= dy * push;
            a.vz -= dz * push;
            b.vx += dx * push;
            b.vy += dy * push;
            b.vz += dz * push;
        }
    }
}

// Two nodes that overlap are moved apart, half each, until they just don't
function separate(nodes) {
    for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dz = b.z - a.z;
            const least = a.radius + b.radius + PADDING;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (distance >= least) {
                continue;
            }
            // Two nodes in the same place go apart along X
            const [ux, uy, uz] = distance > 0 ? [dx / distance, dy / distance, dz / distance] : [1, 0, 0];
            const half = (least - distance) / 2;
            a.x -= ux * half;
            a.y -= uy * half;
            a.z -= uz * half;
            b.x += ux * half;
            b.y += uy * half;
            b.z += uz * half;
        }
    }
}

// The nodes are moved together so that their middle is 0,0,0
function centre(nodes) {
    if (nodes.length === 0) {
        return;
    }
    const mean = axis => nodes.reduce((sum, node) => sum + node[axis], 0) / nodes.length;
    const mx = mean("x");
    const my = mean("y");
    const mz = mean("z");
    for (const node of nodes) {
        node.x -= mx;
        node.y -= my;
        node.z -= mz;
    }
}

// The sphere about 0,0,0 the nodes are in, as its radius (taking in each node's size)
export function boundingRadius(places, nodes) {
    let radius = 0;
    for (const node of nodes) {
        const place = places.get(node.id);
        if (place) {
            radius = Math.max(radius, Math.hypot(place.x, place.y, place.z) + radiusOf(node));
        }
    }
    return radius;
}
