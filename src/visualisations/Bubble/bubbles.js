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

// Where a bubble chart's bubbles go

import { hierarchy, pack } from "d3";
import { isNumber } from "../../shared/data.js";

// The gap between bubbles, in pixels
const PADDING = 1;
// The gap inside a series' bubble, around its own bubbles, in pixels
const GROUP_PADDING = 4;

// Packs the bubbles of some series ({key, label, rows of [name, value]}) into a width and height:
// a bubble for each row with a value above zero (a bubble's area is its value, so nothing else can
// be drawn), the biggest first. Flattened, all of the series' bubbles are packed together;
// otherwise each series' bubbles are packed in a bubble of its own.
//
// Returns {bubbles, groups}: each bubble {id, seriesKey, seriesLabel, row, x, y, r}, in its series'
// order, and when not flattened each series' bubble {key, label, x, y, r}.
export function packBubbles(series, flatten, width, height) {
    const bubblesOf = one => one.rows
        .filter(row => isNumber(row[1]) && row[1] > 0)
        .map((row, index) => ({ seriesKey: one.key, seriesLabel: one.label, row, index }));
    const withBubbles = series
        .map(one => ({ key: one.key, label: one.label, bubbles: bubblesOf(one) }))
        .filter(one => one.bubbles.length > 0);
    if (withBubbles.length === 0 || width <= 0 || height <= 0) {
        return { bubbles: [], groups: [] };
    }

    const children = flatten
        ? withBubbles.flatMap(one => one.bubbles)
        : withBubbles.map(one => ({ key: one.key, label: one.label, children: one.bubbles }));
    const root = hierarchy({ children })
        .sum(node => node.row ? node.row[1] : 0)
        .sort((a, b) => b.value - a.value);
    pack().size([width, height]).padding(node => node.depth === 1 && !flatten ? GROUP_PADDING : PADDING)(root);

    const seen = new Map();
    const bubbles = root.leaves()
        .filter(leaf => leaf.data.row)
        .map(leaf => {
            const data = leaf.data;
            const place = data.seriesKey + "~#~" + data.row[0];
            const count = seen.get(place) || 0;
            seen.set(place, count + 1);
            return {
                id: count === 0 ? place : place + "~" + count,
                seriesKey: data.seriesKey,
                seriesLabel: data.seriesLabel,
                row: data.row,
                order: [withBubbles.findIndex(one => one.key === data.seriesKey), data.index],
                x: leaf.x,
                y: leaf.y,
                r: leaf.r
            };
        })
        // In the series' order, each series' bubbles in the order of its rows
        .sort((a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1])
        .map(({ order, ...bubble }) => bubble);
    const groups = flatten
        ? []
        : root.children.map(node => ({ key: node.data.key, label: node.data.label, x: node.x, y: node.y, r: node.r }));
    return { bubbles, groups };
}
