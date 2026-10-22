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
import { DEFAULT_DAMPING, dampingOf, layOut } from "./forceLayout.js";
import { networkOf, nodeId } from "./network.js";

const EMAILS = [
    ["alice", "bob", "Ops", "Ops", 12],
    ["alice", "carol", "Ops", "Dev", 5],
    ["bob", "carol", "Ops", "Dev", 3],
    ["carol", "dave", "Dev", "Dev", 20],
    ["dave", "erin", "Dev", "Security", 2],
    ["erin", "alice", "Security", "Ops", 7],
    ["frank", "erin", "Security", "Security", 9]
];

const names = network => network.nodes.map(node => node.name);

test("the layout puts every node somewhere, and the same network the same way each time", () => {
    const network = networkOf(EMAILS, { hasCount: true, isExpanded: () => true });
    const first = layOut(network);
    assert.equal(first.size, network.nodes.length);
    for (const place of first.values()) {
        assert.ok(Number.isFinite(place.x) && Number.isFinite(place.y));
    }
    assert.deepEqual(layOut(network), first);
});

test("a node laid out before starts where it was", () => {
    const network = networkOf([["a", "b"]]);
    const previous = new Map([[nodeId("a", null), { x: 500, y: 500 }], [nodeId("b", null), { x: 520, y: 500 }]]);
    const places = layOut(network, previous);
    // Centred again, but still side by side as they were
    const a = places.get(nodeId("a", null));
    const b = places.get(nodeId("b", null));
    assert.ok(Math.abs(a.y - b.y) < Math.abs(a.x - b.x));
});

test("the settings change the layout: a longer link distance makes the links longer", () => {
    const network = networkOf(EMAILS, { isExpanded: () => true, hasCount: true });
    const meanLink = places => network.links.reduce((sum, link) => sum + Math.hypot(
        places.get(link.source).x - places.get(link.target).x,
        places.get(link.source).y - places.get(link.target).y), 0) / network.links.length;
    assert.ok(meanLink(layOut(network, new Map(), { linkDistance: 160 })) > meanLink(layOut(network)));
});

test("more damping keeps less speed each step, and an unknown choice is the default", () => {
    assert.ok(dampingOf("Low") > dampingOf("Medium"));
    assert.ok(dampingOf("Medium") > dampingOf("High"));
    assert.equal(dampingOf("Medium"), DEFAULT_DAMPING);
    assert.equal(dampingOf("Lots"), DEFAULT_DAMPING);
    assert.equal(dampingOf(undefined), DEFAULT_DAMPING);
});
