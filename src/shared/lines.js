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

// What a chart's lines go through (LineChart, TimeSeries)

import { curveFor } from "./curves.js";
import { isNumber, isOrdinal } from "./data.js";

// The curve a line takes when the settings don't say: through every point, without overshooting
// them (so a peak is no higher than it was)
export const DEFAULT_CURVE = "monotone";

// The dashes of each line in turn (as SVG stroke-dasharray), so that lines are told apart by more
// than their colours (WCAG 1.4.1): the first solid, then dashes that differ in length and rhythm
const LINE_DASHES = ["", "8 4", "2 3", "8 3 2 3", "14 4", "4 4"];

// The dashes of a chart's line by its place among the series (0 for the first), as SVG
// stroke-dasharray: '' (solid) for the first, and round again after the last of them
export function lineDash(index) {
    return index < 0 ? "" : LINE_DASHES[index % LINE_DASHES.length];
}

// The d3 curve of a line's interpolation mode, or the default curve if it isn't set or isn't one
export function lineCurve(mode) {
    return curveFor(mode, DEFAULT_CURVE);
}

// A series' rows in the order its line goes through them: along a number or time axis in order
// of X (whatever order the data was sorted in), along a text axis in the data's order
export function orderedRows(rows, xType) {
    return isOrdinal(xType) ? rows : [...rows].sort((a, b) => a[0] - b[0]);
}

// The points of each series, by series key, each {id, seriesKey, seriesLabel, row, x, y, lone} in
// the plot's pixels: one for each row with a Y value. Along a text axis a point is in the middle of
// its category's band. A lone point has no line to either side of it (it is a series' only value,
// or between gaps), so its dot is all there is to see of it.
export function linePoints(series, xType, xScale, yScale) {
    const offset = isOrdinal(xType) ? xScale.bandwidth() / 2 : 0;
    const points = new Map();
    for (const one of series) {
        const hasY = index => index >= 0 && index < one.rows.length && isNumber(one.rows[index][1]);
        points.set(one.key, one.rows
            .map((row, index) => ({ row, index }))
            .filter(({ index }) => hasY(index))
            .map(({ row, index }) => ({
                id: one.key + "~#~" + row[0],
                seriesKey: one.key,
                seriesLabel: one.label,
                row,
                x: xScale(row[0]) + offset,
                y: yScale(row[1]),
                lone: !hasY(index - 1) && !hasY(index + 1)
            })));
    }
    return points;
}
