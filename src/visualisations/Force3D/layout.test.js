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
import { networkOf } from "../../shared/network.js";
import { DEFAULT_CHARGE, boundingRadius, layOut, radiusOf } from "./layout.js";

const EMAILS = [
    ["alice", "bob", "Ops", "Ops", 12],
    ["alice", "carol", "Ops", "Dev", 5],
    ["bob", "carol", "Ops", "Dev", 3],
    ["carol", "dave", "Dev", "Dev", 20],
    ["dave", "erin", "Dev", "Security", 2],
    ["erin", "alice", "Security", "Ops", 7],
    ["frank", "erin", "Security", "Security", 9]
];

const people = () => networkOf(EMAILS, { isExpanded: () => true, hasCount: true });
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

test("every node is placed in three dimensions, and the same network the same way each time", () => {
    const network = people();
    const places = layOut(network);
    assert.equal(places.size, network.nodes.length);
    for (const place of places.values()) {
        assert.ok([place.x, place.y, place.z].every(Number.isFinite));
    }
    assert.ok([...places.values()].some(place => Math.abs(place.z) > 1), "not flat");
    assert.deepEqual(layOut(people()), places);
});

test("no two nodes overlap", () => {
    const network = people();
    const places = layOut(network);
    const nodes = network.nodes;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            assert.ok(distance(places.get(nodes[i].id), places.get(nodes[j].id))
                      >= radiusOf(nodes[i]) + radiusOf(nodes[j]), nodes[i].name + " and " + nodes[j].name);
        }
    }
});

test("linked nodes end up nearer each other than nodes that aren't linked", () => {
    const network = people();
    const places = layOut(network);
    const linked = new Set(network.links.map(link => link.source + "|" + link.target));
    const isLinked = (a, b) => linked.has(a.id + "|" + b.id) || linked.has(b.id + "|" + a.id);
    const linkedDistances = [];
    const otherDistances = [];
    const nodes = network.nodes;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const apart = distance(places.get(nodes[i].id), places.get(nodes[j].id));
            (isLinked(nodes[i], nodes[j]) ? linkedDistances : otherDistances).push(apart);
        }
    }
    const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
    assert.ok(mean(linkedDistances) < mean(otherDistances));
});

test("the network is about the middle", () => {
    const places = [...layOut(people()).values()];
    for (const axis of ["x", "y", "z"]) {
        const mean = places.reduce((sum, place) => sum + place[axis], 0) / places.length;
        assert.ok(Math.abs(mean) < 1e-6, axis);
    }
});

test("a stronger charge spreads the nodes further apart", () => {
    const network = people();
    const weak = boundingRadius(layOut(network, { charge: DEFAULT_CHARGE / 4 }), network.nodes);
    const strong = boundingRadius(layOut(network, { charge: DEFAULT_CHARGE * 4 }), network.nodes);
    assert.ok(strong > weak);
});

test("a node laid out before starts where it was, so a small change moves little", () => {
    const network = people();
    const before = layOut(network);
    const more = networkOf([...EMAILS, ["frank", "gina", "Security", "Security", 1]],
        { isExpanded: () => true, hasCount: true });
    const after = layOut(more, {}, before);
    const fresh = layOut(more);
    const meanMove = places => network.nodes
        .reduce((sum, node) => sum + distance(places.get(node.id), before.get(node.id)), 0) / network.nodes.length;
    assert.ok(meanMove(after) < meanMove(fresh));
    assert.ok(meanMove(after) < 0.15 * boundingRadius(before, network.nodes));
});

test("one node is in the middle, and no nodes is no places", () => {
    const one = networkOf([["alice", "alice", null, null, 1]], { hasCount: true });
    const places = layOut(one);
    assert.equal(places.size, 1);
    const [place] = places.values();
    assert.deepEqual([place.x, place.y, place.z].map(value => Math.abs(value) < 1e-9), [true, true, true]);
    assert.equal(layOut({ nodes: [], links: [] }).size, 0);
});

test("a group is bigger than a node, and the bounding sphere takes in each node's size", () => {
    assert.ok(radiusOf({ isGroup: true }) > radiusOf({ isGroup: false }));
    const nodes = [{ id: "a", isGroup: false }, { id: "b", isGroup: true }];
    const places = new Map([["a", { x: 10, y: 0, z: 0 }], ["b", { x: 0, y: 0, z: -3 }]]);
    assert.equal(boundingRadius(places, nodes), 10 + radiusOf(nodes[0]));
});
