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

// Working out a chord diagram from rows of [source, target, count]: an arc for each source and
// target name, round a ring, and a ribbon from each source to each target, as wide as their count

import { chordDirected, descending } from "d3";
import { isNumber, isPresent } from "../../shared/data.js";

// The gaps between the names round the ring, at most this share of the whole ring, so that a lot
// of names don't leave no room for their arcs
const MAX_GAPS_SHARE = 0.5;

// The names and counts of some rows of [source, target, count], as {names, matrix, total}: names
// in the order they are first seen, matrix[i][j] the sum of the counts from name i to name j.
// Rows without a source or target, or whose count isn't above zero, are left out
export function flowsOf(rows) {
    const indexes = new Map();
    const names = [];
    const indexOf = name => {
        const key = String(name);
        if (!indexes.has(key)) {
            indexes.set(key, names.length);
            names.push(name);
        }
        return indexes.get(key);
    };
    const counts = [];
    let total = 0;
    for (const row of rows) {
        if (!Array.isArray(row) || !isPresent(row[0]) || !isPresent(row[1])) {
            continue;
        }
        const count = Number(row[2]);
        if (!isNumber(count) || count <= 0) {
            continue;
        }
        counts.push([indexOf(row[0]), indexOf(row[1]), count]);
        total += count;
    }
    const matrix = names.map(() => names.map(() => 0));
    for (const [source, target, count] of counts) {
        matrix[source][target] += count;
    }
    return { names, matrix, total };
}


// The angle, in radians, of the gap between each two names: `padding` hundredths of a radian (the
// Padding setting), but no more than lets the gaps take half the ring
export function padAngleOf(padding, count) {
    const wanted = isNumber(Number(padding)) ? Math.max(0, Number(padding)) / 100 : 0.03;
    return count < 2 ? 0 : Math.min(wanted, MAX_GAPS_SHARE * 2 * Math.PI / count);
}

// The arcs and ribbons of a matrix (see flowsOf), from the top going round clockwise: {groups,
// ribbons}. Each name's arc is as long as its counts out and in, so a name that is only ever a
// target has one too, and each count from one name to another is a ribbon from the source to the
// target, as wide at both ends, with a value and an id. The biggest names come first, and so do
// the widest ribbons, so that narrower ones are drawn over them and can be seen, and the keyboard
// reaches the widest first
export function chordLayout(matrix, padAngle) {
    const layout = chordDirected()
        .padAngle(padAngle)
        .sortGroups(descending)
        .sortSubgroups(descending)(matrix);
    const ribbons = Array.from(layout)
        .map(ribbon => ({
            source: ribbon.source,
            target: ribbon.target,
            value: ribbon.source.value,
            id: ribbon.source.index + "-" + ribbon.target.index
        }))
        .sort((a, b) => b.value - a.value);
    return { groups: layout.groups, ribbons };
}

// The total counts from (out) and to (in) a name
export function nameTotals(index, matrix) {
    let out = 0;
    let into = 0;
    for (let other = 0; other < matrix.length; other++) {
        out += matrix[index][other];
        into += matrix[other][index];
    }
    return { out, in: into };
}

// The biggest count from one name to another, as [from, to, count], or null if there are none
export function largestFlow(matrix) {
    let largest = null;
    matrix.forEach((row, from) => row.forEach((count, to) => {
        if (count > 0 && (largest === null || count > largest[2])) {
            largest = [from, to, count];
        }
    }));
    return largest;
}

// How many counts there are from one name to another, i.e. how many of the matrix's cells aren't 0
export function flowCount(matrix) {
    return matrix.reduce((count, row) => count + row.filter(value => value > 0).length, 0);
}
