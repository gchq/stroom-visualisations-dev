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

// Where an hour and day point map's events go: each on the row of its day, across at its time of
// day, in a time zone (the user's, see time.js; UTC unless given)

import { isNumber } from "../../shared/data.js";
import { UTC } from "../../shared/time.js";

const HOUR = 3600000;

// The events of each series, by series key, each {id, seriesKey, seriesLabel, row, day, hour}: the
// instant its day starts and its time of day in hours (e.g. 9.5 for 09:30), as a clock in the zone
// shows it, in time order so that the keyboard moves through them in turn. Rows without a time are
// left out. Two events of a series at the same time are both points, each with an id of its own.
export function dayPoints(series, zone = UTC) {
    const points = new Map();
    for (const one of series) {
        const rows = one.rows.filter(row => isNumber(row[0])).sort((a, b) => a[0] - b[0]);
        const seen = new Map();
        points.set(one.key, rows.map(row => {
            const place = one.key + "~#~" + row[0];
            const count = seen.get(place) || 0;
            seen.set(place, count + 1);
            return {
                id: count === 0 ? place : place + "~" + count,
                seriesKey: one.key,
                seriesLabel: one.label,
                row,
                day: zone.dayStart(row[0]),
                hour: zone.timeOfDay(row[0]) / HOUR
            };
        }));
    }
    return points;
}
