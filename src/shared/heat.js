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

// What the heat maps share (DayWeekHeatMap, HourDayMultiHeatMap): the colours of their values,
// from low to high in a number of equal buckets, and the grids of time they lay values out in, a
// cell for each day of each week, or each hour of each day. Days and hours are a time zone's (the
// user's, see time.js; UTC unless given); values in the same cell are added together, including the
// two hours that are the same hour on the day the clocks go back.

import { format, interpolateInferno, interpolateYlGnBu, quantize, rgb, utcDay, utcFormat, utcHour, utcMonday } from "d3";
import { isNumber } from "./data.js";
import { UTC } from "./time.js";

// How many colours a heat map's values are shown in
export const HEAT_BUCKETS = 9;

// The days of the week, from Monday, as the rows of a day and week heat map
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// The heat colours on a theme, from the lowest values to the highest: on a light theme from a
// pale green (clear of the white background) to a dark blue, on a dark one from a deep violet
// (clear of the dark background) to a bright gold, so that the highest values stand out most
export function heatColours(darkTheme) {
    const colours = darkTheme
        ? quantize(t => interpolateInferno(0.3 + t * 0.67), HEAT_BUCKETS)
        : quantize(t => interpolateYlGnBu(0.3 + t * 0.7), HEAT_BUCKETS);
    return colours.map(colour => rgb(colour).formatHex());
}

// A bucket's value in a key, e.g. 1.25k
const formatShort = format(".3~s");

// A bucket's range in words, e.g. '1.25k to 2.5k'
export function bucketWords(bucket) {
    return bucket.lo === bucket.hi ? formatShort(bucket.lo) : formatShort(bucket.lo) + " to " + formatShort(bucket.hi);
}

// The buckets values from `min` to `max` are coloured in, each {index, lo, hi, colour}, equally
// wide, and `bucketOf(value)` (a bucket, by the value's place between them). With one value there
// is one bucket, in the highest colour; with none, no buckets.
export function heatScale(min, max, colours) {
    if (!isNumber(min) || !isNumber(max)) {
        return { buckets: [], bucketOf: () => null };
    }
    if (max <= min) {
        const only = { index: 0, lo: min, hi: max, colour: colours[colours.length - 1] };
        return { buckets: [only], bucketOf: () => only };
    }
    const size = (max - min) / colours.length;
    const buckets = colours.map((colour, index) => ({
        index,
        lo: min + index * size,
        hi: index === colours.length - 1 ? max : min + (index + 1) * size,
        colour
    }));
    return {
        buckets,
        bucketOf: value => buckets[Math.max(0, Math.min(buckets.length - 1, Math.floor((value - min) / size)))]
    };
}

// The rows of [time, value] with a time and a numeric value, added together by `slotOf(time)`
// (e.g. the start of a time's day): a cell {time, value} for each slot, in time order
export function sumBySlot(rows, slotOf) {
    const sums = new Map();
    for (const row of rows) {
        if (Array.isArray(row) && isNumber(row[0]) && isNumber(row[1])) {
            const slot = slotOf(row[0]);
            sums.set(slot, (sums.get(slot) || 0) + row[1]);
        }
    }
    return [...sums.entries()].sort((a, b) => a[0] - b[0]).map(([time, value]) => ({ time, value }));
}

// A day and week heat map's grid of rows of [time, value]: a column for each week (from Monday),
// from the first week to the last, a row for each day of the week, and a cell for each day with a
// value, {column, row, time, value}, the days and weeks a zone's. Columns and rows are {key,
// label}; a column's key and a cell's time are the instants their week and day start
export function dayWeekGrid(rows, zone = UTC) {
    // By the day's wall clock time (see time.js), so that d3's UTC days are the zone's
    const days = sumBySlot(rows, time => utcDay.floor(new Date(zone.toWall(time))).getTime());
    if (days.length === 0) {
        return { columns: [], rows: [], cells: [] };
    }
    const first = utcMonday.floor(new Date(days[0].time));
    const last = utcMonday.floor(new Date(days[days.length - 1].time));
    const weeks = utcMonday.range(first, utcDay.offset(last, 1));
    const label = utcFormat(weeks[0].getUTCFullYear() === last.getUTCFullYear() ? "%-d %b" : "%-d %b %Y");
    return {
        columns: weeks.map(week => ({ key: String(zone.fromWall(week.getTime())), label: label(week) })),
        rows: WEEKDAYS.map((day, index) => ({ key: String(index), label: day })),
        cells: days.map(day => {
            const date = new Date(day.time);
            return {
                column: String(zone.fromWall(utcMonday.floor(date).getTime())),
                row: String((date.getUTCDay() + 6) % 7),
                time: zone.fromWall(day.time),
                value: day.value
            };
        })
    };
}

// The days from the first to the last (each the instant a day starts) that some times are on, the
// days a zone's
export function daysOf(times, zone = UTC) {
    const valid = times.filter(isNumber);
    if (valid.length === 0) {
        return [];
    }
    const first = utcDay.floor(new Date(zone.toWall(Math.min(...valid))));
    const last = utcDay.floor(new Date(zone.toWall(Math.max(...valid))));
    return utcDay.range(first, utcDay.offset(last, 1)).map(day => zone.fromWall(day.getTime()));
}

// An hour and day heat map's grid of rows of [time, value]: a column for each hour of the day, a
// row for each of the days given (so that heat maps side by side have the same rows), and a cell
// for each hour with a value, {column, row, time, value}, the hours and days a zone's. Columns and
// rows are {key, label}; a row's key and a cell's time are the instants their day and hour start
export function hourDayGrid(rows, days, zone = UTC) {
    // By the hour's wall clock time (see time.js), so that an hour repeated when the clocks go back
    // is one cell
    const hours = sumBySlot(rows, time => utcHour.floor(new Date(zone.toWall(time))).getTime());
    const wallDay = day => new Date(zone.toWall(day));
    const label = days.length > 0 && wallDay(days[0]).getUTCFullYear() !== wallDay(days[days.length - 1]).getUTCFullYear()
        ? utcFormat("%a %-d %b %Y")
        : utcFormat("%a %-d %b");
    return {
        columns: Array.from({ length: 24 }, (unused, hour) => ({ key: String(hour), label: zone.hourLabel(hour) })),
        rows: days.map(day => ({ key: String(day), label: label(wallDay(day)) })),
        cells: hours.map(hour => {
            const date = new Date(hour.time);
            return {
                column: String(date.getUTCHours()),
                row: String(zone.fromWall(utcDay.floor(date).getTime())),
                time: zone.fromWall(hour.time),
                value: hour.value
            };
        })
    };
}
