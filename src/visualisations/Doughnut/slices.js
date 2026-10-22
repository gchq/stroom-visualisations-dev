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

// A doughnut's slices

import { pie } from "d3";
import { isNumber } from "../../shared/data.js";

// The slices of some rows of [name, value, colour?]: one for each row with a value above zero (a
// slice's angle is its share of the total, so nothing else can be drawn), the biggest first if
// `sort`, otherwise in the rows' order. Returns {slices, total}, each slice {id, row, value, share,
// startAngle, endAngle} going round clockwise from the top, `share` being its part of the total
// (0 to 1); two rows with the same name are both slices, each with an id of its own.
export function pieSlices(rows, sort) {
    const withValues = rows.filter(row => row[0] !== null && row[0] !== undefined && isNumber(row[1]) && row[1] > 0);
    const total = withValues.reduce((sum, row) => sum + row[1], 0);
    const layout = pie()
        .value(row => row[1])
        .sort(sort ? (a, b) => b[1] - a[1] : null);
    const seen = new Map();
    const slices = layout(withValues)
        .sort((a, b) => a.startAngle - b.startAngle)
        .map(arc => {
            const name = String(arc.data[0]);
            const count = seen.get(name) || 0;
            seen.set(name, count + 1);
            return {
                id: count === 0 ? name : name + "~" + count,
                row: arc.data,
                value: arc.data[1],
                share: arc.data[1] / total,
                startAngle: arc.startAngle,
                endAngle: arc.endAngle
            };
        });
    return { slices, total };
}
