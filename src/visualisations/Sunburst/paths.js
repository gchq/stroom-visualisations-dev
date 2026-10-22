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

// A sunburst's tree of paths

import { hierarchy, partition } from "d3";
import { isNumber } from "../../shared/data.js";

// The delimiter between a path's parts when the settings don't give one
export const DEFAULT_DELIMITER = "/";

// The tree of some rows of [path, value, colour?]: each path (e.g. 'var/log/stroom') split by the
// delimiter into its parts, each part a node under the one before. A node is {name, path, own,
// colour, children}: `path` is its full path, '' for the root; `own` its rows' values (two rows
// with the same path are added together), so that a path with a value of its own that is also the
// start of others keeps it; and `colour` the last colour a row of it gives. Empty parts (e.g. of
// '/var//log') are skipped, and only rows with a value above zero count.
export function pathTree(rows, delimiter) {
    const split = delimiter || DEFAULT_DELIMITER;
    const root = { name: "", path: "", own: 0, colour: null, children: [] };
    const byPath = new Map([["", root]]);
    for (const row of rows) {
        if (!isNumber(row[1]) || row[1] <= 0 || row[0] === null || row[0] === undefined) {
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
                child = { name: part, path, own: 0, colour: null, children: [] };
                byPath.set(path, child);
                node.children.push(child);
            }
            node = child;
        }
        node.own += row[1];
        if (typeof row[2] === "string" && row[2] !== "") {
            node.colour = row[2];
        }
    }
    return root;
}

// The tree laid out as rings: a d3 hierarchy of it, each node's value its own and its
// descendants', the biggest first, partitioned so that each node's x0 to x1 is its share of the
// circle (0 to 1) and its y0 to y1 its ring (the root 0 to 1, its children 1 to 2, and so on)
export function rings(tree) {
    const root = hierarchy(tree)
        .sum(node => node.own)
        .sort((a, b) => b.value - a.value);
    return partition().size([1, root.height + 1])(root);
}

// The top-level branch a node is in (the root's child it is under, or itself), or null for the root
export function branchOf(node) {
    if (node.depth === 0) {
        return null;
    }
    let branch = node;
    while (branch.depth > 1) {
        branch = branch.parent;
    }
    return branch;
}
