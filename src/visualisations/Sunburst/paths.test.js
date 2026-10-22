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
import { branchOf, pathTree, rings } from "./paths.js";

// The tree as [name, own, children...] for comparing
const shape = node => [node.name, node.own, ...node.children.map(shape)];

test("each path's parts are nodes, one under the other", () => {
    const tree = pathTree([["var/log", 5], ["var/tmp", 3], ["home", 2]], "/");
    assert.deepEqual(shape(tree), ["", 0, ["var", 0, ["log", 5], ["tmp", 3]], ["home", 2]]);
    assert.equal(tree.children[0].children[0].path, "/var/log");
});

test("two rows of the same path are added together", () => {
    const tree = pathTree([["var/log", 5], ["var/log", 4]], "/");
    assert.equal(tree.children[0].children[0].own, 9);
});

test("a path with a value of its own that starts others keeps it", () => {
    const root = rings(pathTree([["var", 10], ["var/log", 5]], "/"));
    assert.equal(root.children[0].value, 15);
});

test("empty parts are skipped, and only values above zero count", () => {
    const tree = pathTree([["/var//log/", 5], ["home", 0], ["tmp", -1], ["opt", null], [null, 3], ["///", 3]], "/");
    assert.deepEqual(shape(tree), ["", 0, ["var", 0, ["log", 5]]]);
});

test("another delimiter splits the paths", () => {
    const tree = pathTree([["com.example.web", 1]], ".");
    assert.deepEqual(shape(tree), ["", 0, ["com", 0, ["example", 0, ["web", 1]]]]);
    assert.equal(tree.children[0].children[0].children[0].path, ".com.example.web");
});

test("a row's colour is its node's", () => {
    const tree = pathTree([["a", 1, "red"], ["b", 1, ""]], "/");
    assert.deepEqual(tree.children.map(node => node.colour), ["red", null]);
});

test("the rings share the circle by value, the biggest first, one ring for each level", () => {
    const root = rings(pathTree([["a/x", 1], ["b", 3]], "/"));
    assert.deepEqual(root.children.map(node => [node.data.name, node.x0, node.x1, node.y0, node.y1]),
        [["b", 0, 0.75, 1, 2], ["a", 0.75, 1, 1, 2]]);
    assert.deepEqual([root.y0, root.y1], [0, 1]);
    const x = root.children[1].children[0];
    assert.deepEqual([x.y0, x.y1], [2, 3]);
    assert.equal(branchOf(x).data.name, "a");
    assert.equal(branchOf(root), null);
});
