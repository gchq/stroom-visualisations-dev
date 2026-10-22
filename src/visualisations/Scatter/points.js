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

// Where a scatter chart's points go

import { isOrdinal } from "../../shared/data.js";

// The size of a point when the settings don't say (pointSize, its radius in pixels)
export const DEFAULT_POINT_SIZE = 4;

// A point's radius from the settings' pointSize: a positive number of pixels, or the default
export function pointRadius(pointSize) {
    const size = Number.parseFloat(pointSize);
    return Number.isFinite(size) && size > 0 ? size : DEFAULT_POINT_SIZE;
}

// The points of each series, by series key, each {id, seriesKey, seriesLabel, row, x, y} in the
// plot's pixels, in order along X (then Y) so that the keyboard moves along the chart. Two rows of
// a series at the same place are both points, each with an id of its own. Along a text axis a
// point is in the middle of its category's band.
export function scatterPoints(series, xType, xScale, yScale) {
    const offset = isOrdinal(xType) ? xScale.bandwidth() / 2 : 0;
    const points = new Map();
    for (const one of series) {
        const rows = isOrdinal(xType)
            ? one.rows
            : [...one.rows].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        const seen = new Map();
        points.set(one.key, rows.map(row => {
            const place = one.key + "~#~" + row[0] + "," + row[1];
            const count = seen.get(place) || 0;
            seen.set(place, count + 1);
            return {
                id: count === 0 ? place : place + "~" + count,
                seriesKey: one.key,
                seriesLabel: one.label,
                row,
                x: xScale(row[0]) + offset,
                y: yScale(row[1])
            };
        }));
    }
    return points;
}
