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

// A network from rows of [source, target, source group, target group, count]: a node for each
// source and target, a link between each two joined by a count (either way), and the nodes of a
// group drawn as one node for the group unless it is shown expanded, its members joined to it.
// Force and Force 3D draw it, each laying it out in its own way.

import { isNumber, isPresent } from "./data.js";

// A node's id: a group's from its name, a member's from its name and group
export function nodeId(name, group, isGroup) {
    return isGroup ? JSON.stringify(["group", String(name)]) : JSON.stringify(["node", String(name), group === null ? null : String(group)]);
}

// The key of a pair of groups, the same whichever way round they are given
export function groupPairKey(a, b) {
    return JSON.stringify([String(a), String(b)].sort());
}

// The network of some rows, as {nodes, links, rowLinks, left}:
//   nodes  [{id, name, group, isGroup, expanded, out, in, within, members, memberNames}], in the order
//          first seen: `out` and `in` the counts from and to it, `within` the counts between its own
//          members (for a group drawn as one node), `members` how many members a group has and
//          `memberNames` their names, in alphabetical order
//   links  [{id, source, target, forward, reverse, isMembership, groups, viaGroups}]: source and
//          target are node ids, the source's the lesser; `forward` the counts from source to target,
//          `reverse` back. A membership link joins an expanded group to each of its members. `groups`
//          is the pair of group names of a link between two collapsed groups (which can be expanded
//          to the members it joins), and `viaGroups` the pair key of the expanded group link a link
//          between members came from (see groupPairKey), otherwise null
//   rowLinks  each counted row's ends as drawn, [{source, target}] (node ids), in the rows' order,
//          leaving out rows within one node
//   left   how many nodes were left out by `maxNodes`, with their links
// `isExpanded(group)` says whether a group is shown as its members, and `isLinkExpanded(a, b)`
// whether the link between two collapsed groups is shown as the members it joins (each joined to
// its group), as the legacy network did when such a link was clicked. Without a count field
// (`hasCount` false) each row counts once; with one, rows whose count isn't above zero are left out
export function networkOf(rows, { isExpanded = () => false, isLinkExpanded = () => false, hasCount = false,
                                  maxNodes = Infinity } = {}) {
    const nodes = new Map();
    const links = new Map();
    const groupMembers = new Map();
    const rowLinks = [];

    const nodeOf = (name, group, isGroup) => {
        const id = nodeId(name, group, isGroup);
        if (!nodes.has(id)) {
            nodes.set(id, { id, name, group: isGroup ? null : group, isGroup, expanded: isGroup && isExpanded(name),
                out: 0, in: 0, within: 0, members: 0, memberNames: [] });
        }
        return nodes.get(id);
    };
    const linkOf = (a, b, isMembership) => {
        const [source, target] = a.id < b.id ? [a, b] : [b, a];
        const id = JSON.stringify([source.id, target.id]);
        if (!links.has(id)) {
            links.set(id, { id, source: source.id, target: target.id, forward: 0, reverse: 0, isMembership,
                groups: null, viaGroups: null });
        }
        return links.get(id);
    };
    // The node a row's end is drawn as: its group's, if it has one that isn't expanded (unless
    // `asMember`, for a row of an expanded group link)
    const endOf = (name, group, asMember) => {
        if (!isPresent(group)) {
            return nodeOf(name, null, false);
        }
        const groupNode = nodeOf(group, null, true);
        if (!groupMembers.has(group)) {
            groupMembers.set(group, new Set());
        }
        groupMembers.get(group).add(String(name));
        if (!groupNode.expanded && !asMember) {
            return groupNode;
        }
        const member = nodeOf(name, group, false);
        linkOf(groupNode, member, true);
        return member;
    };

    for (const row of rows) {
        if (!Array.isArray(row) || !isPresent(row[0]) || !isPresent(row[1])) {
            continue;
        }
        const count = hasCount ? Number(row[4]) : 1;
        if (hasCount && (!isPresent(row[4]) || !isNumber(count) || count <= 0)) {
            continue;
        }
        const fromGroup = isPresent(row[2]) ? row[2] : null;
        const toGroup = isPresent(row[3]) ? row[3] : null;
        // A row between two collapsed groups whose link is expanded is drawn between its members
        const viaGroups = fromGroup !== null && toGroup !== null && String(fromGroup) !== String(toGroup)
                          && !isExpanded(fromGroup) && !isExpanded(toGroup) && isLinkExpanded(fromGroup, toGroup)
            ? groupPairKey(fromGroup, toGroup)
            : null;
        const from = endOf(row[0], fromGroup, viaGroups !== null);
        const to = endOf(row[1], toGroup, viaGroups !== null);
        if (from === to) {
            from.within += count;
            continue;
        }
        from.out += count;
        to.in += count;
        const link = linkOf(from, to, false);
        if (from.id === link.source) {
            link.forward += count;
        } else {
            link.reverse += count;
        }
        if (viaGroups !== null) {
            link.viaGroups = viaGroups;
        } else if (from.isGroup && to.isGroup && !from.expanded && !to.expanded) {
            link.groups = [from.name, to.name];
        }
        rowLinks.push({ source: from.id, target: to.id });
    }
    for (const [group, members] of groupMembers) {
        const groupNode = nodes.get(nodeId(group, null, true));
        groupNode.members = members.size;
        groupNode.memberNames = [...members].sort();
    }

    const kept = [...nodes.values()].slice(0, Math.max(0, maxNodes));
    const keptIds = new Set(kept.map(node => node.id));
    const bothKept = link => keptIds.has(link.source) && keptIds.has(link.target);
    return {
        nodes: kept,
        links: [...links.values()].filter(bothKept),
        rowLinks: rowLinks.filter(bothKept),
        left: nodes.size - kept.length
    };
}

// A network with only the nodes `keep(node)` says to keep, and the links and rows between them
// (e.g. without the nodes whose colour the legend hides)
export function filterNetwork(network, keep) {
    const kept = network.nodes.filter(keep);
    const keptIds = new Set(kept.map(node => node.id));
    const bothKept = link => keptIds.has(link.source) && keptIds.has(link.target);
    return { ...network, nodes: kept, links: network.links.filter(bothKept), rowLinks: network.rowLinks.filter(bothKept) };
}

// How busy a node is: all its counts, out, in and within it
export function activityOf(node) {
    return node.out + node.in + node.within;
}

// The nodes that match a search, by id: those whose name has the text in it, ignoring case, and
// collapsed groups with a member whose name has it (an expanded group's members match themselves).
// An empty search matches none
export function matchesOf(network, text) {
    const wanted = String(text || "").trim().toLowerCase();
    if (wanted === "") {
        return new Set();
    }
    const has = name => String(name).toLowerCase().includes(wanted);
    return new Set(network.nodes
        .filter(node => has(node.name) || (node.isGroup && !node.expanded && node.memberNames.some(has)))
        .map(node => node.id));
}

// What a node does: 'source' if it only sends, 'target' if it only receives, 'both' if it does both,
// or 'none' (e.g. an expanded group, whose counts are its members')
export function roleOf(node) {
    if (node.out > 0 && node.in > 0) {
        return "both";
    }
    if (node.out > 0) {
        return "source";
    }
    return node.in > 0 ? "target" : "none";
}

// A random number source that gives the same numbers each time, so that the same network is laid
// out the same way each time
export function seededRandom() {
    let seed = 1;
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}
