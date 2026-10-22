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

// Where a tree map's blocks and boxes go

import { hierarchy, treemap, treemapDice, treemapSlice, treemapSliceDice, treemapSquarify } from "d3";
import { isNumber } from "../../shared/data.js";

// The height of a series' block's header, naming it
export const HEADER_HEIGHT = 22;
// The gap inside a block, around its boxes
export const INSET = 3;

// d3 7's tilings by the names of d3 3's tree map modes, which the settings (mode) use
const TILINGS = {
    "squarify": treemapSquarify,
    "slice-dice": treemapSliceDice,
    "dice": treemapDice,
    "slice": treemapSlice
};

// The tiling of a mode, or squarify (boxes as near square as they can be) if it isn't one
export function tilingFor(mode) {
    return TILINGS[mode] || treemapSquarify;
}

// Lays out some series ({key, label, rows of [name, value]}) in a width and height: a box for each
// row with a value above zero (a box's area is its value, so nothing else can be drawn), and with
// `blocks`, the boxes of each series in a block of its own with a header naming it.
//
// Returns {blocks, boxes}: each block {key, label, x0, y0, x1, y1}, and each box {id, seriesKey,
// seriesLabel, row, rank, of, x0, y0, x1, y1}, biggest first within its series; `rank` is its place
// among its series' boxes by size (0 the biggest) of `of`. Two rows of a series with the same name
// are both boxes, each with an id of its own.
export function layoutBoxes(series, blocks, mode, width, height) {
    const withBoxes = series
        .map(one => ({
            key: one.key,
            label: one.label,
            boxes: one.rows
                .filter(row => row[0] !== null && row[0] !== undefined && isNumber(row[1]) && row[1] > 0)
                .map(row => ({ seriesKey: one.key, seriesLabel: one.label, row }))
        }))
        .filter(one => one.boxes.length > 0);
    if (withBoxes.length === 0 || width <= 0 || height <= 0) {
        return { blocks: [], boxes: [] };
    }

    const children = blocks
        ? withBoxes.map(one => ({ key: one.key, label: one.label, children: one.boxes }))
        : withBoxes.flatMap(one => one.boxes);
    const root = hierarchy({ children })
        .sum(node => node.row ? node.row[1] : 0)
        .sort((a, b) => b.value - a.value);
    treemap()
        .tile(tilingFor(mode))
        .size([width, height])
        .paddingTop(node => blocks && node.depth === 1 ? HEADER_HEIGHT : 0)
        .paddingRight(node => blocks && node.depth === 1 ? INSET : 0)
        .paddingBottom(node => blocks && node.depth === 1 ? INSET : 0)
        .paddingLeft(node => blocks && node.depth === 1 ? INSET : 0)
        .paddingInner(blocks ? 0 : 1)(root);

    const seen = new Map();
    const boxes = [];
    const groups = blocks ? root.children : [root];
    for (const group of groups) {
        const leaves = group.children.filter(leaf => leaf.data.row);
        leaves.forEach((leaf, rank) => {
            const data = leaf.data;
            const place = data.seriesKey + "~#~" + data.row[0];
            const count = seen.get(place) || 0;
            seen.set(place, count + 1);
            boxes.push({
                id: count === 0 ? place : place + "~" + count,
                seriesKey: data.seriesKey,
                seriesLabel: data.seriesLabel,
                row: data.row,
                rank,
                of: leaves.length,
                x0: leaf.x0,
                y0: leaf.y0,
                x1: leaf.x1,
                y1: leaf.y1
            });
        });
    }
    const blockList = blocks
        ? root.children.map(node => ({ key: node.data.key, label: node.data.label, x0: node.x0, y0: node.y0, x1: node.x1, y1: node.y1 }))
        : [];
    return { blocks: blockList, boxes };
}
