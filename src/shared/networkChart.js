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

// What the networks of sources and targets share (Force, Force 2D and Force 3D): the network of the rows
// (network.js), its groups expanded or collapsed as the person chooses, a link between two collapsed
// groups shown as the members it joins, the Find nodes field (searchField.js), the legend and colour
// of each node (its group's, or with Colour By: Activity how busy it is), and the words of its
// tooltips, screen reader names and summary, and what Stroom is told of a selected node. Stroom
// gives rows of [source, target, source group, target group, count].

import { Chart } from "./chart.js";
import { distinct, isPresent } from "./data.js";
import { formatNumber } from "./format.js";
import { bucketWords, heatColours, heatScale } from "./heat.js";
import { activityOf, filterNetwork, groupPairKey, networkOf } from "./network.js";
import { SearchField } from "./searchField.js";
import { inCell } from "./selection.js";
import { isTrue } from "./settings.js";

// How many of a node's links its tooltip lists
const TOOLTIP_LINKS = 5;
// The Colour By setting's choices
export const COLOUR_BY_GROUP = "Group";
export const COLOUR_BY_ACTIVITY = "Activity";

export class NetworkChart extends Chart {

    // `createCell(body, chart)` makes the network's drawing, as for Chart; `kind` is what the
    // network is called for a screen reader, e.g. 'Network'
    constructor(createCell, kind) {
        super(createCell, "sourceGroup");
        this.kind = kind;
        // Whether each group is expanded, as the person chose, by its name
        this.chosen = new Map();
        // The links between two collapsed groups shown as the members they join, by groupPairKey
        this.expandedLinks = new Set();
        // What the search field has in it, and the search field (opened from Stroom's toolbar)
        this.searchText = "";
        this.search = new SearchField(this);
    }

    isLinkExpanded(a, b) {
        return this.expandedLinks.has(groupPairKey(a, b));
    }

    // Shows the search's matches, and says how many there are
    setSearch(text) {
        this.searchText = text;
        this.cells.forEach(cell => cell.showHighlight());
        this.search.showCount(this.cells.size > 0 ? [...this.cells][0].matchCount() : 0);
    }

    // What the counts are called, e.g. 'Emails'
    countName() {
        return this.settings.count || "Count";
    }

    hasGroups() {
        return Boolean(this.settings.sourceGroup || this.settings.targetGroup);
    }

    isExpanded(group) {
        return this.chosen.has(group) ? this.chosen.get(group) : isTrue(this.settings.expandGroups, false);
    }

    // How the nodes are coloured: by their group's colour (COLOUR_BY_GROUP), or by how busy they
    // are (COLOUR_BY_ACTIVITY); a network that has no Colour By setting colours by group
    colourBy() {
        return this.settings.colourBy === COLOUR_BY_ACTIVITY ? COLOUR_BY_ACTIVITY : COLOUR_BY_GROUP;
    }

    // The colour key of a node: its group's name, or its own name if it has no group
    colourKeyOf(node) {
        if (node.isGroup) {
            return String(node.name);
        }
        return node.group === null ? String(node.name) : String(node.group);
    }

    // The network of some rows, as the settings and the person's choices say
    networkOf(rows) {
        const maxNodes = Number(this.settings.maxNodes);
        return networkOf(rows, {
            isExpanded: group => this.isExpanded(group),
            isLinkExpanded: (a, b) => this.isLinkExpanded(a, b),
            hasCount: Boolean(this.settings.count),
            maxNodes: Number.isFinite(maxNodes) && maxNodes > 0 ? maxNodes : this.defaultMaxNodes()
        });
    }

    // How many nodes are drawn at most when the Max Nodes setting doesn't say
    defaultMaxNodes() {
        return Infinity;
    }

    // Works out the network, the legend and each node's colour, and draws it: the cell is
    // {key, label, network, colourOfNode, gridCellCount}
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const rows = this.data.values.filter(Array.isArray);
        const { network, colourOfNode } = this.colourBy() === COLOUR_BY_ACTIVITY
            ? this.byActivity(rows)
            : this.byGroup(rows);
        this.networkChanged(network);
        this.grid.update([{ key: null, label: "Chart", network, colourOfNode, gridCellCount: 1 }]);
        this.search.showCount(this.cells.size > 0 ? [...this.cells][0].matchCount() : 0);
    }

    // Each group (or, without groups, each node) has the dashboard's colour for it, and the legend
    // can hide it (the rows to or from it)
    byGroup(rows) {
        const settings = this.settings;
        const keyOf = (name, group) => String(isPresent(group) ? group : name);
        const keys = distinct(rows.flatMap(row => [keyOf(row[0], row[2]), keyOf(row[1], row[3])]));
        const colourOf = this.colours.of(this.hasGroups() ? (settings.sourceGroup || settings.targetGroup)
            : settings.source, keys);
        this.legend.setItems(keys.map(key => ({ key, label: key, colour: colourOf(key) })));
        const shownRows = rows.filter(row => !this.legend.isHidden(keyOf(row[0], row[2]))
                                             && !this.legend.isHidden(keyOf(row[1], row[3])));
        return { network: this.networkOf(shownRows), colourOfNode: node => colourOf(this.colourKeyOf(node)) };
    }

    // Each node is coloured by how busy it is (activityOf), from cold to hot in the heat colours of
    // the theme, the legend the key of them, which can hide the nodes of each colour
    byActivity(rows) {
        const all = this.networkOf(rows);
        const values = all.nodes.map(activityOf);
        const scale = values.length === 0
            ? heatScale(null, null, [])
            : heatScale(Math.min(...values), Math.max(...values), heatColours(this.isDarkTheme()));
        this.legend.setItems(scale.buckets.slice().reverse().map(bucket => ({
            key: String(bucket.index),
            label: bucketWords(bucket) + " " + this.countName(),
            colour: bucket.colour
        })));
        const bucketOf = node => scale.bucketOf(activityOf(node));
        return {
            network: filterNetwork(all, node => !this.legend.isHidden(String(bucketOf(node).index))),
            colourOfNode: node => bucketOf(node).colour
        };
    }

    // Called with the network about to be drawn, e.g. to change the toolbar's buttons for it
    networkChanged() {
    }

    // A click on a node (or Enter on it): a group expands or collapses, and any other node, or a
    // Ctrl+Click or Space on any node, selects it
    activateNode(node, event, cell) {
        const keyboard = Boolean(event && event.keyboard);
        const space = keyboard && event.key === " ";
        if ((event && (event.ctrlKey || event.metaKey) && !keyboard) || space || !node.isGroup) {
            this.selection.choose(this.selectionItem(node, cell), event);
            return;
        }
        this.chosen.set(String(node.name), !node.expanded);
        this.redraw();
    }

    // A click on a line (or Enter on it): a line between two collapsed groups shows the members it
    // joins, and a line between members shown so goes back to the groups' line. Returns whether it
    // did either
    activateLine(link, event) {
        if (event && event.keyboard && event.key === " ") {
            return false;
        }
        if (link.groups !== null) {
            this.expandedLinks.add(groupPairKey(link.groups[0], link.groups[1]));
        } else if (link.viaGroups !== null) {
            this.expandedLinks.delete(link.viaGroups);
        } else {
            return false;
        }
        this.redraw();
        return true;
    }

    // What Stroom is told of a selected node (as the legacy network told it), in its cell
    selectionItem(node, cell) {
        // A group is told as its name (the legacy network told only its key, which no selection
        // handler could use), and a node without a group as just its name (rather than 'null')
        if (node.isGroup) {
            return inCell({ key: "Group: " + node.name, name: node.name, group: node.name }, cell);
        }
        const item = { key: node.name + " (" + node.group + ")", name: node.name };
        if (node.group !== null && node.group !== undefined) {
            item.group = node.group;
        }
        return inCell(item, cell);
    }

    // A node's name for people to read, e.g. 'alice' or 'Ops (group)'
    nameOf(node) {
        return node.isGroup ? node.name + " (group)" : String(node.name);
    }

    // The tooltip of a node of a network (whose nodes `byId` has): its group or members, its counts
    // out, in and within, and its biggest links, e.g. 'To bob: 12'
    nodeTooltip(node, network, byId) {
        const count = this.countName();
        const rows = [];
        if (node.isGroup) {
            rows.push(["Members", formatNumber(node.members) + (node.expanded ? ", shown" : ", hidden")]);
        } else if (node.group !== null) {
            rows.push([this.settings.sourceGroup || "Group", String(node.group)]);
        }
        if (node.out > 0) {
            rows.push([count + " out", formatNumber(node.out)]);
        }
        if (node.in > 0) {
            rows.push([count + " in", formatNumber(node.in)]);
        }
        if (node.within > 0) {
            rows.push([count + " within", formatNumber(node.within)]);
        }
        const flows = network.links
            .filter(link => !link.isMembership && (link.source === node.id || link.target === node.id))
            .flatMap(link => {
                const fromMe = link.source === node.id ? link.forward : link.reverse;
                const toMe = link.source === node.id ? link.reverse : link.forward;
                const other = byId.get(link.source === node.id ? link.target : link.source);
                return [["To " + this.nameOf(other), fromMe], ["From " + this.nameOf(other), toMe]];
            })
            .filter(([, value]) => value > 0)
            .sort((a, b) => b[1] - a[1]);
        flows.slice(0, TOOLTIP_LINKS).forEach(([name, value]) => rows.push([name, formatNumber(value)]));
        if (flows.length > TOOLTIP_LINKS) {
            rows.push(["And", (flows.length - TOOLTIP_LINKS) + " more"]);
        }
        return { title: this.nameOf(node), rows };
    }

    // The tooltip of a line: its two ends, and the counts each way, e.g. 'Ops (group) to Dev
    // (group): 8', and what Enter (or a click) does to it, if anything
    lineTooltip(link, byId) {
        const source = byId.get(link.source);
        const target = byId.get(link.target);
        const rows = [];
        if (link.forward > 0) {
            rows.push([this.nameOf(source) + " to " + this.nameOf(target), formatNumber(link.forward)]);
        }
        if (link.reverse > 0) {
            rows.push([this.nameOf(target) + " to " + this.nameOf(source), formatNumber(link.reverse)]);
        }
        if (link.groups !== null) {
            rows.push(["Click or Enter", "shows the members it joins"]);
        } else if (link.viaGroups !== null) {
            rows.push(["Click or Enter", "shows their groups' line again"]);
        }
        return { title: this.nameOf(source) + " and " + this.nameOf(target), rows };
    }

    // The network for a screen reader, e.g. 'Network of Emails between From and To: 3 nodes, 3 of
    // them groups (2 collapsed), 3 links'
    describe(network) {
        const settings = this.settings;
        let text = this.kind + " of " + this.countName() + " between " + (settings.source || "Source") + " and "
                   + (settings.target || "Target");
        if (network.nodes.length === 0) {
            return text + ": no data";
        }
        const nodes = network.nodes.length;
        const groups = network.nodes.filter(node => node.isGroup);
        const collapsed = groups.filter(node => !node.expanded).length;
        const links = network.links.filter(link => !link.isMembership).length;
        text += ": " + nodes + (nodes === 1 ? " node" : " nodes");
        if (groups.length > 0) {
            text += ", " + groups.length + (groups.length === 1 ? " of them a group" : " of them groups")
                    + " (" + collapsed + " collapsed)";
        }
        text += ", " + links + (links === 1 ? " link" : " links");
        if (network.left > 0) {
            text += ", " + network.left + " more nodes left out by Max Nodes";
        }
        return text;
    }

    // The nodes and lines kept bright when something is shown (hovered or focused: a node, or a
    // line when `isLine`), or else the search's `matches`, as {keepNode(node), keepLine(link)}:
    // those joined to what is shown, or the matches and their lines
    kept(network, shown, isLine, matches) {
        if (shown !== null && isLine) {
            return {
                keepNode: node => node.id === shown.source || node.id === shown.target,
                keepLine: link => link === shown
            };
        }
        if (shown !== null) {
            const near = new Set([shown.id]);
            for (const link of network.links) {
                if (link.source === shown.id) {
                    near.add(link.target);
                }
                if (link.target === shown.id) {
                    near.add(link.source);
                }
            }
            return {
                keepNode: node => near.has(node.id),
                keepLine: link => link.source === shown.id || link.target === shown.id
            };
        }
        if (matches.size > 0) {
            return {
                keepNode: node => matches.has(node.id),
                keepLine: link => matches.has(link.source) || matches.has(link.target)
            };
        }
        if (this.searchText.trim() !== "") {
            // A search that matches nothing fades everything
            return { keepNode: () => false, keepLine: () => false };
        }
        return { keepNode: () => true, keepLine: () => true };
    }

    // The nodes in the order the keyboard goes through them: a group's nodes together, the groups in
    // the order they are first seen
    keyboardOrder(network) {
        const firstSeen = new Map();
        network.nodes.forEach((node, index) => {
            const key = this.colourKeyOf(node);
            if (!firstSeen.has(key)) {
                firstSeen.set(key, index);
            }
        });
        return network.nodes.slice()
            .sort((a, b) => firstSeen.get(this.colourKeyOf(a)) - firstSeen.get(this.colourKeyOf(b)));
    }
}
