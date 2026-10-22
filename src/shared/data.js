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

// The data Stroom gives a visualisation: a tree of nodes, each {key, values, min, max, sum},
// nested as the visualisation's settings say (e.g. grid cells, then series), whose leaves'
// values are rows of field values. The root also has `types`, the type of each field of a row.

// The types of a field's values
export const TEXT = "TEXT";
export const NUMBER = "NUMBER";
export const DATE_TIME = "DATE_TIME";
// A field whose type Stroom wasn't told, whose values are text
export const GENERAL = "GENERAL";

// Whether values of a type are categories (text) rather than on a continuous scale
export function isOrdinal(type) {
    return type !== NUMBER && type !== DATE_TIME;
}

// Whether a value is a number that can be plotted
export function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

// Whether a value is given: anything but null, undefined or no text
export function isPresent(value) {
    return value !== null && value !== undefined && value !== "";
}

// A value, a number or the text of one, as a number; null if it isn't given or isn't a number
export function numberFrom(value) {
    if (!isPresent(value)) {
        return null;
    }
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : null;
}

// Whether a value of a field of a type can be placed along an axis: a category (any text but
// none), or a number or time
export function hasValue(value, type) {
    return isOrdinal(type) ? isPresent(value) : isNumber(value);
}

// The distinct values of a list, in the order they first appear
export function distinct(values) {
    return [...new Set(values)];
}

// Whether a node has child nodes (rather than rows)
function hasChildNodes(node) {
    return Array.isArray(node.values) && node.values.length > 0 && !Array.isArray(node.values[0]);
}

// The minimum, maximum and sum of each field of some rows, ignoring values that aren't numbers
export function aggregateRows(rows, fieldCount) {
    const min = new Array(fieldCount).fill(null);
    const max = new Array(fieldCount).fill(null);
    const sum = new Array(fieldCount).fill(null);
    for (const row of rows) {
        for (let i = 0; i < fieldCount; i++) {
            const value = row[i];
            if (isNumber(value)) {
                min[i] = min[i] === null ? value : Math.min(min[i], value);
                max[i] = max[i] === null ? value : Math.max(max[i], value);
                sum[i] = (sum[i] || 0) + value;
            }
        }
    }
    return { min, max, sum };
}

// Every row under a node
export function rowsOf(node) {
    if (!Array.isArray(node.values)) {
        return [];
    }
    if (hasChildNodes(node)) {
        return node.values.flatMap(rowsOf);
    }
    return node.values;
}

// A grid cell's rows: straight under it, or (as the legacy structure gave them) under a level of
// their own
export function cellRows(cell) {
    return (cell.values || []).flatMap(value => Array.isArray(value) ? [value] : (value.values || []).filter(Array.isArray));
}

// Sets the min, max and sum of a node and every node under it from the rows under them
export function aggregate(node, fieldCount) {
    if (hasChildNodes(node)) {
        node.values.forEach(child => aggregate(child, fieldCount));
    }
    Object.assign(node, aggregateRows(rowsOf(node), fieldCount));
    return node;
}

// The distinct values of a field of the rows under a node, in the order they first appear
export function distinctValues(node, fieldIndex) {
    const seen = new Set();
    const values = [];
    for (const row of rowsOf(node)) {
        const value = row[fieldIndex];
        if (value !== null && value !== undefined && !seen.has(value)) {
            seen.add(value);
            values.push(value);
        }
    }
    return values;
}

// A node's key as text. Stroom leaves the key out when a level's field isn't set
export function keyOf(node) {
    return node.key === null || node.key === undefined ? "" : String(node.key);
}

// The number of fields in a row, from the data's types
export function fieldCount(data) {
    return Array.isArray(data.types) ? data.types.length : 0;
}
