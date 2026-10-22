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

// A tree of paths (e.g. 'home/alice/notes.txt'), laid out as boxes joined by elbowed lines, or round
// its root in rings, with its branches shown or hidden

import { hierarchy, linkRadial, tree } from "d3";

// The delimiter between a path's parts when the settings don't give one
export const DEFAULT_DELIMITER = "/";

// The ways a tree can grow from its root: down (north, the root at the top), up (south), right
// (east), left (west), or out all round (radial, the root in the middle and each level a ring
// further out, as the legacy RadialTree drew it)
export const ORIENTATIONS = ["north", "south", "east", "west", "radial"];

// The tree of some rows of [path, value, colour]: each path split by the delimiter into its parts,
// each part a node under the one before. A node is {name, path, depth, values, colour, children}:
// `path` its full path from the root (e.g. '/home/alice', '' for the root, which is 0 deep), `values`
// the different values
// its rows give (any type; a path given twice keeps both its values, and a path that also starts
// others keeps its own), and `colour` the last colour a row gives it. Empty parts (e.g. of
// '/home//alice') are skipped, as are rows without a path
export function treeOf(rows, delimiter) {
    const split = delimiter || DEFAULT_DELIMITER;
    const root = { name: "", path: "", depth: 0, values: [], colour: null, children: [] };
    const byPath = new Map([["", root]]);
    for (const row of rows) {
        if (!Array.isArray(row) || row[0] === null || row[0] === undefined) {
            continue;
        }
        const parts = String(row[0]).split(split).filter(part => part !== "");
        if (parts.length === 0) {
            continue;
        }
        let node = root;
        let path = "";
        for (const part of parts) {
            path = path + split + part;
            let child = byPath.get(path);
            if (!child) {
                child = { name: part, path, depth: node.depth + 1, values: [], colour: null, children: [] };
                byPath.set(path, child);
                node.children.push(child);
            }
            node = child;
        }
        const value = row[1];
        if (value !== null && value !== undefined && value !== "" && !node.values.includes(value)) {
            node.values.push(value);
        }
        if (typeof row[2] === "string" && row[2] !== "") {
            node.colour = row[2];
        }
    }
    return root;
}

// Whether a node's children are shown: as the person last chose for it (`chosen`, a map of path to
// true or false), otherwise if it is less deep than the draw depth (as the legacy tree drew it)
export function isExpanded(node, chosen, drawDepth) {
    if (chosen.has(node.path)) {
        return chosen.get(node.path);
    }
    return node.depth < drawDepth;
}

// The part of a tree that is shown, as a d3 hierarchy (a node's hidden children are left out)
export function shownHierarchy(root, chosen, drawDepth) {
    return hierarchy(root, node => node.children.length > 0 && isExpanded(node, chosen, drawDepth)
        ? node.children
        : null);
}

// A shown tree laid out by d3's tree, each node `nodeSize` ([across, along] the way it grows) apart,
// and nodes of different parents only a little further apart than brothers and sisters, so that a
// wide tree takes no more room than it must
export function layOut(shown, nodeSize) {
    return tree().nodeSize(nodeSize).separation((a, b) => a.parent === b.parent ? 1 : 1.2)(shown);
}

// A shown tree laid out round its root: each node's x its angle (0 at the top, going clockwise to 2π)
// and its y its distance from the middle, each level's ring at least `ringGap` further out than the
// last, and further still where its nodes are crowded, so that next to each other round the ring
// they are at least `spacing` apart (their words, beside them, then don't overlap). Brothers and
// sisters are closer than cousins; nodes further out are as far apart in angle as those nearer the
// middle, as squeezing them closer would only push their ring further out
export function layOutRadial(shown, ringGap, spacing = 0) {
    tree().size([2 * Math.PI, 1]).separation((a, b) => a.parent === b.parent ? 1 : 2)(shown);
    const levels = [];
    shown.each(node => {
        (levels[node.depth] = levels[node.depth] || []).push(node.x);
    });
    const radii = [0];
    for (let depth = 1; depth < levels.length; depth++) {
        const gap = smallestAngleBetween(levels[depth]);
        // The radius at which the straight line between the closest neighbours is `spacing` long
        const roomy = gap === null || spacing <= 0 ? 0 : spacing / (2 * Math.sin(Math.min(Math.PI, gap) / 2));
        radii.push(Math.max(radii[depth - 1] + ringGap, roomy));
    }
    shown.each(node => {
        node.y = radii[node.depth];
    });
    return shown;
}

// The box round laid out nodes as drawn for an orientation, {left, right, top, bottom}: `reach` is how
// far each node's drawing goes either side of its middle ({x, y}), and `margin` more room all round
export function boundsOf(nodes, orientation, reach, margin) {
    const places = nodes.map(one => placeOf(one, orientation));
    return {
        left: Math.min(...places.map(([x]) => x)) - reach.x - margin,
        right: Math.max(...places.map(([x]) => x)) + reach.x + margin,
        top: Math.min(...places.map(([, y]) => y)) - reach.y - margin,
        bottom: Math.max(...places.map(([, y]) => y)) + reach.y + margin
    };
}

// How far (in degrees, clockwise) a radial node's words are turned to run out along its radius from
// an angle round the ring (0 at the top, going clockwise to 2π): on the right of the ring, out from
// the middle; on the left, turned half way round as well, so that they don't read upside down
export function radialTurn(angle) {
    const outwards = (angle - Math.PI / 2) * 180 / Math.PI;
    return Math.sin(angle) >= 0 ? outwards : outwards + 180;
}

// The smallest angle between neighbours of some angles round a circle (the last and the first
// neighbours too), or null if there are fewer than two
function smallestAngleBetween(angles) {
    if (angles.length < 2) {
        return null;
    }
    const sorted = [...angles].sort((a, b) => a - b);
    let smallest = 2 * Math.PI - (sorted[sorted.length - 1] - sorted[0]);
    for (let index = 1; index < sorted.length; index++) {
        smallest = Math.min(smallest, sorted[index] - sorted[index - 1]);
    }
    return smallest;
}

// The part of a tree that is shown, laid out (see shownHierarchy and layOut)
export function shownTree(root, chosen, drawDepth, nodeSize) {
    return layOut(shownHierarchy(root, chosen, drawDepth), nodeSize);
}

// How many nodes there are in a tree, without its root
export function nodeCount(root) {
    return root.children.reduce((count, child) => count + 1 + nodeCount(child), 0);
}

// How deep a tree goes: 0 for just the root
export function treeDepth(root) {
    return root.children.reduce((deepest, child) => Math.max(deepest, 1 + treeDepth(child)), 0);
}

// Where a laid out node (x across, y along the way the tree grows; for radial, x its angle and y its
// distance from the middle) is drawn, as [x, y], for an orientation
export function placeOf(node, orientation) {
    switch (orientation) {
        case "radial":
            return [node.y * Math.sin(node.x), -node.y * Math.cos(node.x)];
        case "south":
            return [node.x, -node.y];
        case "east":
            return [node.y, node.x];
        case "west":
            return [-node.y, node.x];
        default:
            return [node.x, node.y];
    }
}

// The line from a node to a child of it, as an SVG path, for an orientation: elbowed (out from the
// parent half way, across, then on to the child), or for radial a curve out from the middle
export function elbowOf(from, to, orientation) {
    if (orientation === "radial") {
        return linkRadial().angle(node => node.x).radius(node => node.y)({ source: from, target: to });
    }
    const [x1, y1] = placeOf(from, orientation);
    const [x2, y2] = placeOf(to, orientation);
    if (orientation === "east" || orientation === "west") {
        const middle = (x1 + x2) / 2;
        return "M" + x1 + "," + y1 + "H" + middle + "V" + y2 + "H" + x2;
    }
    const middle = (y1 + y2) / 2;
    return "M" + x1 + "," + y1 + "V" + middle + "H" + x2 + "V" + y2;
}
