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
import { activityOf, filterNetwork, groupPairKey, matchesOf, networkOf, nodeId, roleOf } from "./network.js";

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

test("without groups, a node for each name and a link for each pair, counted each way", () => {
    const network = networkOf([["a", "b"], ["b", "a"], ["a", "b"], ["a", "c"]]);
    assert.deepEqual(names(network), ["a", "b", "c"]);
    assert.equal(network.links.length, 2);
    const ab = network.links.find(link => link.id === JSON.stringify([nodeId("a", null), nodeId("b", null)]));
    assert.equal(ab.forward, 2);
    assert.equal(ab.reverse, 1);
    const a = network.nodes[0];
    assert.equal(a.out, 3);
    assert.equal(a.in, 1);
});

test("groups are drawn as one node each, their members' links joined, counts within kept", () => {
    const network = networkOf(EMAILS, { hasCount: true });
    assert.deepEqual(names(network), ["Ops", "Dev", "Security"]);
    assert.ok(network.nodes.every(node => node.isGroup));
    const ops = network.nodes[0];
    assert.equal(ops.within, 12);
    assert.equal(ops.members, 2);
    assert.equal(ops.out, 8);
    assert.equal(ops.in, 7);
    const dev = network.nodes[1];
    assert.equal(dev.within, 20);
    assert.equal(network.links.length, 3);
});

test("an expanded group shows its members, each joined to the group", () => {
    const network = networkOf(EMAILS, { hasCount: true, isExpanded: group => group === "Dev" });
    assert.deepEqual(names(network), ["Ops", "Dev", "carol", "dave", "Security"]);
    const dev = network.nodes[1];
    assert.equal(dev.expanded, true);
    const memberships = network.links.filter(link => link.isMembership);
    assert.equal(memberships.length, 2);
    const carolToDave = network.links.find(link => !link.isMembership
        && [link.source, link.target].includes(nodeId("carol", "Dev"))
        && [link.source, link.target].includes(nodeId("dave", "Dev")));
    assert.equal(carolToDave.forward + carolToDave.reverse, 20);
});

test("a link between two collapsed groups knows its groups, and a group knows its members' names", () => {
    const network = networkOf(EMAILS, { hasCount: true });
    const opsDev = network.links.find(link => link.groups !== null && link.groups.includes("Ops")
                                              && link.groups.includes("Dev"));
    assert.deepEqual([...opsDev.groups].sort(), ["Dev", "Ops"]);
    assert.deepEqual(network.nodes[0].memberNames, ["alice", "bob"]);
});

test("an expanded group link shows the members it joins, each joined to its collapsed group", () => {
    const network = networkOf(EMAILS, { hasCount: true,
        isLinkExpanded: (a, b) => groupPairKey(a, b) === groupPairKey("Ops", "Dev") });
    // alice and bob (Ops) emailed carol (Dev): those three are drawn; dave (Dev) only through
    // other links, so isn't
    assert.deepEqual(names(network), ["Ops", "alice", "Dev", "carol", "bob", "Security"]);
    const members = network.links.filter(link => link.viaGroups === groupPairKey("Ops", "Dev"));
    assert.equal(members.length, 2);
    assert.equal(network.links.filter(link => link.isMembership).length, 3);
    // The groups are still collapsed, and still linked to Security as groups
    assert.ok(network.nodes.filter(node => node.isGroup).every(node => !node.expanded));
    assert.ok(network.links.some(link => link.groups !== null && link.groups.includes("Security")));
});

test("each counted row's ends as drawn, in order, leaving out rows within one node", () => {
    const network = networkOf(EMAILS, { hasCount: true });
    // alice to bob (12) and carol to dave (20) are within their groups, and frank to erin (9) too
    assert.equal(network.rowLinks.length, 4);
    assert.deepEqual(network.rowLinks[0], { source: nodeId("Ops", null, true), target: nodeId("Dev", null, true) });
});

test("a search matches names with the text in them, ignoring case, and groups with such a member", () => {
    const network = networkOf(EMAILS, { hasCount: true, isExpanded: group => group === "Dev" });
    assert.deepEqual([...matchesOf(network, "CAR")], [nodeId("carol", "Dev")]);
    assert.deepEqual([...matchesOf(network, "fra")], [nodeId("Security", null, true)]);
    assert.ok(matchesOf(network, "ops").has(nodeId("Ops", null, true)));
    assert.equal(matchesOf(network, "  ").size, 0);
    assert.equal(matchesOf(network, "zzz").size, 0);
});

test("with a count, rows without a count above zero are left out (the legacy force counted 0 as 1)", () => {
    const network = networkOf([["a", "b", null, null, 0], ["a", "c", null, null, -1], ["a", "d", null, null, "x"],
        ["a", "e", null, null, null], ["a", "f", null, null, 4]], { hasCount: true });
    assert.deepEqual(names(network), ["a", "f"]);
});

test("rows without a source or target are left out", () => {
    assert.deepEqual(networkOf([[null, "b"], ["a", ""], "not a row"]).nodes, []);
});

test("only so many nodes are kept, and links to the others go with them", () => {
    const network = networkOf([["a", "b"], ["b", "c"], ["c", "d"]], { maxNodes: 2 });
    assert.deepEqual(names(network), ["a", "b"]);
    assert.equal(network.links.length, 1);
    assert.equal(network.left, 2);
});

test("a node's role is what it does: sends, receives or both", () => {
    assert.equal(roleOf({ out: 1, in: 0 }), "source");
    assert.equal(roleOf({ out: 0, in: 2 }), "target");
    assert.equal(roleOf({ out: 1, in: 2 }), "both");
    assert.equal(roleOf({ out: 0, in: 0 }), "none");
});

test("a network can keep only some nodes, and the links and rows between them", () => {
    const network = networkOf(EMAILS, { isExpanded: () => true, hasCount: true });
    const kept = filterNetwork(network, node => node.isGroup || node.group !== "Security");
    assert.equal(kept.nodes.some(node => node.name === "erin"), false);
    assert.equal(kept.links.some(link => link.source.includes("erin") || link.target.includes("erin")), false);
    assert.equal(kept.rowLinks.some(row => row.source.includes("erin") || row.target.includes("erin")), false);
    assert.equal(kept.left, network.left);
    assert.equal(filterNetwork(network, () => true).links.length, network.links.length);
});

test("a node's activity is all its counts, out, in and within", () => {
    const network = networkOf(EMAILS, { hasCount: true });
    const ops = network.nodes.find(node => node.name === "Ops");
    assert.equal(activityOf(ops), ops.out + ops.in + ops.within);
    assert.equal(activityOf(ops), 12 + 5 + 3 + 7);
});
