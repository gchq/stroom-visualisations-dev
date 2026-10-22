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

import assert from "node:assert/strict";
import { test } from "node:test";
import { boundsOf, elbowOf, isExpanded, layOutRadial, nodeCount, placeOf, radialTurn, shownHierarchy, shownTree,
    treeDepth, treeOf } from "./tree.js";

const ROWS = [["home/alice/notes.txt", 12], ["home/bob", null], ["/var//log", "big", "#ff0000"]];

test("each path's parts are nodes under the ones before, empty parts skipped", () => {
    const root = treeOf(ROWS, "/");
    assert.deepEqual(root.children.map(node => node.name), ["home", "var"]);
    const alice = root.children[0].children[0];
    assert.equal(alice.path, "/home/alice");
    assert.equal(alice.depth, 2);
    assert.deepEqual(alice.children[0].values, [12]);
    const log = root.children[1].children[0];
    assert.equal(log.path, "/var/log");
    assert.deepEqual(log.values, ["big"]);
    assert.equal(log.colour, "#ff0000");
    assert.equal(nodeCount(root), 6);
    assert.equal(treeDepth(root), 3);
});

test("a path that also starts others keeps its value, whichever row comes first", () => {
    // The legacy tree lost the value of a path seen first as the start of another
    const root = treeOf([["a/b", 1], ["a", "own"]], "/");
    assert.deepEqual(root.children[0].values, ["own"]);
    assert.deepEqual(root.children[0].children[0].values, [1]);
});

test("a path given twice keeps each different value", () => {
    const root = treeOf([["a", 1], ["a", 2], ["a", 1]], "/");
    assert.deepEqual(root.children[0].values, [1, 2]);
});

test("another delimiter splits paths, and rows without a path are left out", () => {
    const root = treeOf([["a.b.c"], [null], [""], ["..."], "not a row"], ".");
    assert.equal(nodeCount(root), 3);
    assert.equal(root.children[0].children[0].path, ".a.b");
    assert.equal(treeOf([], "/").children.length, 0);
});

test("a node shows its children if less deep than the draw depth, unless the person chose", () => {
    const root = treeOf(ROWS, "/");
    const home = root.children[0];
    const alice = home.children[0];
    assert.equal(isExpanded(root, new Map(), 1), true);
    assert.equal(isExpanded(home, new Map(), 1), false);
    assert.equal(isExpanded(home, new Map([["/home", true]]), 1), true);
    assert.equal(isExpanded(alice, new Map([["/home/alice", false]]), 5), false);
});

test("only shown nodes are laid out, each a node size apart", () => {
    const root = treeOf(ROWS, "/");
    const shown = shownTree(root, new Map(), 1, [100, 50]);
    assert.deepEqual(shown.descendants().map(node => node.data.name), ["", "home", "var"]);
    const [home, varNode] = shown.children;
    assert.equal(varNode.x - home.x, 100);
    assert.equal(home.y, 50);
    const all = shownTree(root, new Map(), 10, [100, 50]);
    assert.equal(all.descendants().length, 7);
});

test("the tree grows down, up, right or left from its root", () => {
    const node = { x: 10, y: 50 };
    assert.deepEqual(placeOf(node, "north"), [10, 50]);
    assert.deepEqual(placeOf(node, "south"), [10, -50]);
    assert.deepEqual(placeOf(node, "east"), [50, 10]);
    assert.deepEqual(placeOf(node, "west"), [-50, 10]);
    assert.deepEqual(placeOf(node, "nonsense"), [10, 50]);
});

test("radial, the root is in the middle, each level a ring further out, the first child at the top", () => {
    const root = treeOf([["a/b"], ["a/c"], ["d"]], "/");
    // With room round every ring, each is a ring gap further out
    const shown = layOutRadial(shownHierarchy(root, new Map(), 10), 100, 16);
    assert.equal(Math.hypot(...placeOf(shown, "radial")), 0);
    for (const node of shown.descendants()) {
        const [x, y] = placeOf(node, "radial");
        assert.ok(Math.abs(Math.hypot(x, y) - node.depth * 100) < 1e-9, node.data.path);
        assert.ok(node.x >= 0 && node.x <= 2 * Math.PI);
    }
    assert.deepEqual(placeOf({ x: 0, y: 50 }, "radial"), [0, -50]);
    const [x, y] = placeOf({ x: Math.PI / 2, y: 50 }, "radial");
    assert.ok(Math.abs(x - 50) < 1e-9 && Math.abs(y) < 1e-9);
});

test("radial, a crowded ring is pushed further out, so that its nodes are a spacing apart", () => {
    const rows = Array.from({ length: 200 }, (unused, index) => ["a/" + index]);
    const shown = layOutRadial(shownHierarchy(treeOf([...rows, ["b"]], "/"), new Map(), 10), 100, 16);
    const leaves = shown.leaves().filter(leaf => leaf.depth === 2).sort((a, b) => a.x - b.x);
    // Further out than a ring gap past the first ring, as 200 leaves wouldn't fit there
    assert.ok(leaves[0].y > 200);
    for (let index = 1; index < leaves.length; index++) {
        const [x0, y0] = placeOf(leaves[index - 1], "radial");
        const [x1, y1] = placeOf(leaves[index], "radial");
        assert.ok(Math.hypot(x1 - x0, y1 - y0) >= 16 - 1e-9, "leaves " + (index - 1) + " and " + index);
    }
});

test("a tree's bounds are round its nodes as drawn, with their reach and a margin", () => {
    const nodes = [{ x: 0, y: 0 }, { x: -50, y: 40 }, { x: 80, y: 40 }];
    assert.deepEqual(boundsOf(nodes, "north", { x: 20, y: 10 }, 5), { left: -75, right: 105, top: -15, bottom: 55 });
    // Growing up, the nodes are drawn above the root
    assert.deepEqual(boundsOf(nodes, "south", { x: 20, y: 10 }, 5), { left: -75, right: 105, top: -55, bottom: 15 });
});

test("radial, words run out along the radius, never upside down", () => {
    // At the top, they read upwards; on the right, level; at the bottom, downwards
    assert.equal(radialTurn(0), -90);
    assert.equal(radialTurn(Math.PI / 2), 0);
    assert.equal(radialTurn(Math.PI), 90);
    // On the left they are turned half way round as well, to read left to right, level at the left
    assert.ok(Math.abs(radialTurn(3 * Math.PI / 2) - 360) < 1e-9);
    assert.ok(Math.abs(radialTurn(5 * Math.PI / 4) - 315) < 1e-9);
});

test("radial, a line curves out from the parent to the child", () => {
    const path = elbowOf({ x: 0, y: 0 }, { x: Math.PI / 2, y: 100 }, "radial");
    assert.match(path, /^M/);
    assert.match(path, /C/);
});

test("a line goes out from the parent half way, across, then on to the child", () => {
    const parent = { x: 0, y: 0 };
    const child = { x: 40, y: 100 };
    assert.equal(elbowOf(parent, child, "north"), "M0,0V50H40V100");
    assert.equal(elbowOf(parent, child, "east"), "M0,0H50V40H100");
});
