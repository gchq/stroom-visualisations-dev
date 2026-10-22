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

// Where a bar chart's bars go

import { isNumber, isOrdinal } from "../../shared/data.js";

// The share of a number or date axis a value has when there is no step to say how wide it is
const NO_STEP_FRACTION = 0.1;

const BUCKETS = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000
};

// The length of the settings' time bucket (bucketSize) in milliseconds: a name ('hour') or a
// number of milliseconds. Null if there is none.
export function bucketMillis(bucketSize) {
    if (bucketSize === undefined || bucketSize === null || bucketSize === "") {
        return null;
    }
    const named = BUCKETS[String(bucketSize).toLowerCase()];
    if (named) {
        return named;
    }
    const millis = Number(bucketSize);
    return Number.isFinite(millis) && millis > 0 ? millis : null;
}

// The smallest gap between distinct numbers, the width a bar can have without overlapping the next.
// Null if there are fewer than two distinct numbers.
export function smallestStep(values) {
    const sorted = [...new Set(values.filter(isNumber))].sort((a, b) => a - b);
    let step = null;
    for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i] - sorted[i - 1];
        step = step === null ? gap : Math.min(step, gap);
    }
    return step;
}

// The bars of each series, by series key, each {id, seriesKey, seriesLabel, row, x, width, y,
// height} in the plot's pixels. Bars rise from zero, or hang below it for negative values.
//
// Along a text field each category is a band, shared by the series side by side (`subBand`, a band
// scale of the series' keys). Along a number or date field each bar starts at its value and a value
// is `step` wide (the time bucket, or the smallest gap between values), shared by the series, or a
// tenth of the axis without a step (e.g. a single value).
export function barLayout({ series, xType, xScale, yScale, step, subBand }) {
    const zero = yScale(0);
    const bars = new Map();
    const seriesCount = Math.max(1, series.length);
    series.forEach((one, seriesIndex) => {
        bars.set(one.key, one.rows.map(row => {
            let x;
            let width;
            if (isOrdinal(xType)) {
                x = xScale(row[0]) + subBand(one.key);
                width = subBand.bandwidth();
            } else {
                const start = xScale(row[0]);
                const stepWidth = step
                    ? Math.abs(xScale(row[0] + step) - start)
                    : Math.abs(xScale.range()[1] - xScale.range()[0]) * NO_STEP_FRACTION;
                width = Math.max(1, (stepWidth * 0.9) / seriesCount);
                x = start + stepWidth * 0.05 + seriesIndex * width;
            }
            const top = yScale(row[1]);
            return {
                id: one.key + "~#~" + row[0],
                seriesKey: one.key,
                seriesLabel: one.label,
                row,
                x,
                width: Math.max(0, width),
                y: Math.min(zero, top),
                height: Math.abs(zero - top)
            };
        }));
    });
    return bars;
}
