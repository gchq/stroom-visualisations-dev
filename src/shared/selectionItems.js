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

// What each visualisation tells Stroom of a selected item (see Selection): `key` says which item
// it is, and the rest are the fields Stroom's selection handlers can use, as
// `${component.<id>.selection.<field>}`. Each visualisation declares those fields in the
// `selection` section of its settings, which selectionItems.test.js checks against these.

import { inCell, isoTime, selectedValue } from "./selection.js";

// A session of a series (`session` having `start` and `end` times), as the session maps and the
// timelines select them
export function sessionItem(seriesKey, session, cell) {
    const start = isoTime(session.start);
    return inCell({
        key: seriesKey + "~#~" + start,
        series: seriesKey,
        x: start,
        end: isoTime(session.end)
    }, cell);
}

// A cell of a heat map (`heatCell` having `mapKey`, `time` and `value`)
export function heatCellItem(heatCell) {
    const time = isoTime(heatCell.time);
    return { key: heatCell.mapKey + "~#~" + time, series: heatCell.mapKey, x: time, value: heatCell.value };
}

// A node of a network, or a group of nodes (`node` having `name`, `group` and `isGroup`)
export function networkNodeItem(node, cell) {
    // A group is told as its name (the legacy network told only its key, which no selection
    // handler could use), and a node without a group as just its name (rather than 'null')
    if (node.isGroup) {
        return inCell({ key: "Group: " + node.name, name: node.name, group: node.name }, cell);
    }
    const item = { key: node.name + " (" + node.group + ")", name: node.name };
    if (node.group !== null && node.group !== undefined) {
        item.group = node.group;
    }
    return inCell(item, cell);
}

// A slice of a doughnut: its name (of type `nameType`) and value
export function sliceItem(name, value, nameType, cell) {
    return inCell({ key: name, name: selectedValue(name, nameType), value }, cell);
}

// A bubble of a series (`row` being [name, value], the name of type `nameType`)
export function bubbleItem(seriesKey, row, nameType, cell) {
    return inCell({
        key: seriesKey + "~#~" + row[0],
        name: selectedValue(row[0], nameType),
        series: seriesKey,
        value: row[1]
    }, cell);
}

// A box of a tree map's series (`row` being [name, value], the name of type `nameType`)
export function boxItem(seriesKey, row, nameType) {
    return {
        key: seriesKey + "~#~" + row[0],
        name: selectedValue(row[0], nameType),
        series: seriesKey,
        value: row[1]
    };
}

// A point of a series at a time of day (`row` being [time, value])
export function timePointItem(seriesKey, row, cell) {
    const time = isoTime(row[0]);
    return inCell({ key: seriesKey + "~#~" + time, series: seriesKey, x: time, value: row[1] }, cell);
}

// A point of a scatter's series (`row` being [x, y], `cell` having `xType`)
export function scatterPointItem(seriesKey, row, cell) {
    return inCell({
        key: seriesKey + "~#~" + row[0] + "," + row[1],
        series: seriesKey,
        x: selectedValue(row[0], cell.xType),
        y: row[1]
    }, cell);
}

// A node of a sunburst: its path, name and total
export function sunburstNodeItem(path, name, value, cell) {
    return inCell({ key: path, value, name, path }, cell);
}

// The keys a tree's item has of its own, which the name its settings give values can't take
const TREE_ITEM_KEYS = ["key", "path", "name", "value", "gridSeries"];

// A node of a tree: its path, name and values (of type `valueType`, told joined), its value also
// under the name the settings give values (`valueName`, 'Value' if none), unless that is one of the
// item's own keys
export function treeNodeItem(path, name, values, valueType, valueName, cell) {
    const told = values.map(one => selectedValue(one, valueType));
    const value = told.length === 0 ? undefined : told.length === 1 ? told[0] : told.join(", ");
    const item = { key: path, path, name, value };
    const extraKey = valueName || "Value";
    if (!TREE_ITEM_KEYS.includes(extraKey)) {
        item[extraKey] = value;
    }
    return inCell(item, cell);
}

// A word of a word cloud
export function wordItem(text, cell) {
    return inCell({ key: text, name: text }, cell);
}

// A name of a chord diagram
export function chordNameItem(name, cell) {
    return inCell({ key: String(name), name }, cell);
}

// A flow of a chord diagram, from its source name to its target
export function chordFlowItem(source, target, cell) {
    return inCell({ key: JSON.stringify([String(source), String(target)]), source, target }, cell);
}

// A marker of a map (`marker` having `key`, `name`, `series`, `icon`, `time` and perhaps
// `gridSeries`) at its place (`place`, e.g. {lat, lon}, or a floor's {x, y, campus, building, floor})
export function markerItem(marker, place) {
    const item = { key: marker.key, ...place };
    if (marker.name !== null && marker.name !== "") {
        item.name = marker.name;
    }
    if (marker.series !== null && marker.series !== "") {
        item.series = marker.series;
    }
    if (marker.icon !== null) {
        item.icon = marker.icon;
    }
    if (marker.gridSeries !== undefined) {
        item.gridSeries = marker.gridSeries;
    }
    if (marker.time !== null) {
        item.eventTime = isoTime(marker.time);
    }
    return item;
}

// A window of time (from `min` to `max`, in milliseconds), as the time series tells it
export function timeWindowItem(min, max) {
    return { minTime: isoTime(min), maxTime: isoTime(max) };
}
