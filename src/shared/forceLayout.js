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

// Where the nodes of a network (network.js) go in two dimensions (Force and Force 2D), laid out by
// d3's forces: the nodes push each other apart (the charge, Barnes-Hut, so that big networks are
// quick), the links pull their ends together, nodes keep their room, and the whole is about the middle

import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation } from "d3";
import { seededRandom } from "./network.js";

// The settings' defaults: how hard the nodes push each other apart, how long a link is, and how much
// of a node's speed it keeps each step (d3's own)
export const DEFAULT_CHARGE = 240;
export const DEFAULT_LINK_DISTANCE = 80;
export const DEFAULT_DAMPING = 0.6;
// The Damping setting's choices (Force 2D's and Force 3D's), as how much speed a node keeps each
// step: the more damping, the less (so the layout settles sooner, and spreads out less)
const DAMPINGS = { Low: 0.8, Medium: DEFAULT_DAMPING, High: 0.4 };
// The room each node keeps round its middle (a group's more)
const NODE_ROOM = 14;
const GROUP_ROOM = 22;

// The Damping setting as how much speed a node keeps each step
export function dampingOf(choice) {
    return Object.hasOwn(DAMPINGS, choice) ? DAMPINGS[choice] : DEFAULT_DAMPING;
}

// Where each node goes, as a map of node id to {x, y}, around 0,0: the network laid out by d3's
// forces, run to rest at once rather than shown moving. A node laid out before (`previous`) starts
// where it was, so a network that changes a little moves a little. `options` are the settings (Force
// 2D's), each with Force's as its default: `charge` (how hard nodes push apart), `linkDistance` (a
// group's links to its members half as long) and `damping` (how much speed a node keeps each step)
export function layOut(network, previous = new Map(), { charge = DEFAULT_CHARGE, linkDistance = DEFAULT_LINK_DISTANCE,
                                                         damping = DEFAULT_DAMPING } = {}) {
    const nodes = network.nodes.map(node => {
        const was = previous.get(node.id);
        return was ? { id: node.id, isGroup: node.isGroup, x: was.x, y: was.y } : { id: node.id, isGroup: node.isGroup };
    });
    const links = network.links.map(link => ({ source: link.source, target: link.target, isMembership: link.isMembership }));
    const simulation = forceSimulation(nodes)
        .randomSource(seededRandom())
        .force("link", forceLink(links).id(node => node.id).distance(link => link.isMembership ? linkDistance / 2 : linkDistance))
        .force("charge", forceManyBody().strength(-charge))
        .force("collide", forceCollide(node => node.isGroup ? GROUP_ROOM : NODE_ROOM))
        .velocityDecay(1 - damping)
        .force("centre", forceCenter(0, 0))
        .stop();
    simulation.tick(300);
    return new Map(nodes.map(node => [node.id, { x: node.x, y: node.y }]));
}
