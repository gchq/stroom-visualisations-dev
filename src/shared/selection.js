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

// The data points a person has selected, which Stroom is told of (vis.js's stroom.select) so that
// other components of the dashboard can use them, e.g. to filter a table. A click selects a point
// in place of the others; Ctrl+Click (or Cmd+Click), and Enter or Space on a focused point, add it
// to them or take it out; a click on nothing, or Escape, selects nothing (see choose and clear).

import { DATE_TIME } from "./data.js";

// A value as Stroom is told it in a selection: a time (a DATE_TIME field's milliseconds) in ISO
// 8601, e.g. '2026-10-12T08:00:00.000Z', as the legacy charts told times; any other value as it is
export function selectedValue(value, type) {
    return type === DATE_TIME && typeof value === "number" && Number.isFinite(value)
        ? new Date(value).toISOString()
        : value;
}

// An item selected in one cell of a grid of charts (`cell` having `key`, its grid series value, and
// `gridCellCount`): when there is more than one cell, the item says which (`gridSeries`) and has a
// key of the cell's own, so that the same point in two cells is two items; otherwise it is as it is
export function inCell(item, cell) {
    if (!cell || !(cell.gridCellCount > 1)) {
        return item;
    }
    return { ...item, key: cell.key + "~#~" + item.key, gridSeries: cell.key };
}

// The item of a point of a series at an X (`row` being [x, y]) in a cell of a grid of charts
// (`cell` having `xType`), as the bar, line and stacked area charts select them
export function seriesPointItem(seriesKey, row, cell) {
    const x = selectedValue(row[0], cell.xType);
    return inCell({ key: seriesKey + "~#~" + x, series: seriesKey, x, value: row[1], y: row[1] }, cell);
}

export class Selection {

    // `onChange()` is called when the selection changes, so that the chart can show it
    constructor(onChange) {
        this.onChange = onChange;
        // Each selected item by its key, {key, ...fields Stroom is given}
        this.items = new Map();
        // The keys asked about (has) while the chart draws new data, or null when not noting them
        // (see noteDrawn and keepDrawn)
        this.drawn = null;
    }

    // Selects an item as a person asked to, by a click or a key (`event`, as stroom.points gives
    // it: {ctrlKey, metaKey, keyboard}): with Ctrl (or Cmd), or from the keyboard, it is added to
    // the selection, or taken out if it is in it already; otherwise it is selected in place of the
    // others, or (if it is all that is selected) taken out. `item` is {key, ...}: the key says
    // which point it is and the rest are the fields Stroom's selection handlers can use
    choose(item, event) {
        const adding = Boolean(event && (event.ctrlKey || event.metaKey || event.keyboard));
        if (adding) {
            this.toggle(item);
        } else if (this.items.size === 1 && this.items.has(item.key)) {
            this.clear();
        } else {
            this.items = new Map([[item.key, item]]);
            this.changed();
        }
    }

    // Adds an item, or takes it out if it is already selected (see choose)
    toggle(item) {
        if (this.items.has(item.key)) {
            this.items.delete(item.key);
        } else {
            this.items.set(item.key, item);
        }
        this.changed();
    }

    // Selects nothing, telling Stroom so (an empty selection), if anything was selected
    clear() {
        if (this.items.size > 0) {
            this.items.clear();
            this.changed();
        }
    }

    has(key) {
        if (this.drawn !== null) {
            this.drawn.add(key);
        }
        return this.items.has(key);
    }

    isEmpty() {
        return this.items.size === 0;
    }

    // Starts noting the keys of the points drawn (the chart asks whether each is selected as it
    // shows the selection), before the chart draws new data
    noteDrawn() {
        this.drawn = new Set();
    }

    // Once the chart has drawn new data: takes out of the selection the items whose points are no
    // longer drawn (e.g. the data no longer has them, or the legend hides them), telling Stroom.
    // If no point was drawn at all (e.g. the chart had no room to draw in), nothing can be told,
    // and the selection is kept
    keepDrawn() {
        const drawn = this.drawn;
        this.drawn = null;
        if (drawn === null || drawn.size === 0) {
            return;
        }
        const kept = [...this.items.values()].filter(item => drawn.has(item.key));
        if (kept.length < this.items.size) {
            this.items = new Map(kept.map(item => [item.key, item]));
            this.changed();
        }
    }

    // Tells Stroom the selection, and the chart to show it
    changed() {
        if (typeof stroom !== "undefined" && typeof stroom.select === "function") {
            stroom.select([...this.items.values()]);
        }
        this.onChange();
    }
}
