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

// How a stacked area chart's series are stacked

import { distinct, isNumber, isOrdinal } from "../../shared/data.js";

// Stacks series ({key, label, rows of [x, y]}) one on another at each X value any of them has:
// those with the highest values at the bottom (as they were), a series without a value at an X
// adding nothing there. Values below zero stack down from zero, apart from those above it.
//
// Returns {xs, layers, totals}: the X values in order (along a number or time axis by value, along
// a text axis as they first appear); a layer for each series, bottom first, {key, label, values}
// with a value for each X, {x, y0, y1, value}, `value` being the series' own (null if it has none)
// and its band from y0, its edge nearer zero, to y1, its edge further from it (where its line and
// points go); and the total of the series at each X, by X. A series without a value at an X has an
// empty band on top of those above zero below it, so that its area doesn't cut through theirs.
export function stackSeries(series, xType) {
    const allXs = distinct(series.flatMap(one => one.rows.map(row => row[0])));
    const xs = isOrdinal(xType) ? allXs : allXs.sort((a, b) => a - b);

    // Each series' value at each X (the last, if a series has more than one there)
    const valuesOf = series.map(one => {
        const byX = new Map();
        for (const row of one.rows) {
            if (isNumber(row[1])) {
                byX.set(row[0], row[1]);
            }
        }
        return byX;
    });

    // The highest at the bottom, otherwise in the series' order
    const maxOf = byX => Math.max(-Infinity, ...byX.values());
    const order = series.map((one, index) => index)
        .sort((a, b) => maxOf(valuesOf[b]) - maxOf(valuesOf[a]) || a - b);

    // The tops of the bands above and below zero so far at each X
    const above = xs.map(() => 0);
    const below = xs.map(() => 0);
    const layers = order.map(index => ({
        key: series[index].key,
        label: series[index].label,
        values: xs.map((x, i) => {
            const value = valuesOf[index].has(x) ? valuesOf[index].get(x) : null;
            if (value !== null && value < 0) {
                const y0 = below[i];
                below[i] += value;
                return { x, y0, y1: below[i], value };
            }
            const y0 = above[i];
            above[i] += value ?? 0;
            return { x, y0, y1: above[i], value };
        })
    }));

    const totals = new Map(xs.map(x => [x, valuesOf.reduce((sum, byX) => sum + (byX.get(x) ?? 0), 0)]));
    return { xs, layers, totals };
}

// The lowest and highest edges of the layers' bands, {min, max}, both null without any
export function extent(layers) {
    let min = null;
    let max = null;
    for (const layer of layers) {
        for (const value of layer.values) {
            for (const y of [value.y0, value.y1]) {
                min = min === null ? y : Math.min(min, y);
                max = max === null ? y : Math.max(max, y);
            }
        }
    }
    return { min, max };
}
