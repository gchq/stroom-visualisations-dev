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

// What the visualisations of one value's red, amber or green status share (Gauge, RAGStatus and
// TrafficLights): a cell for each Grid Series value showing its first row's value and status, a
// legend that shows or hides the cells of each status (e.g. to show only those that aren't
// green), and the words a cell's tooltip and screen reader name are made of. Stroom gives the data
// nested as grid cell, then a row of [value].

import { Chart } from "./chart.js";
import { isNumber, keyOf } from "./data.js";
import { formatKey, formatNumber } from "./format.js";
import { GridPoints } from "./gridPoints.js";
import { isTrue } from "./settings.js";
import {
    AMBER, GREEN, OUTSIDE, RED, STATUS_COLOURS, rangeWords, statusBandsOf, statusLegendItems, statusOf, statusWords
} from "./status.js";

// Each kind of cell's one point (a gauge's dial, a RAG status's tile, a traffic light)
const CELL_POINTS = ".vis-gauge__dial, .vis-rag__tile, .vis-traffic__light";
// The order the grid's summary counts the statuses in
const STATUS_ORDER = [GREEN, AMBER, RED, OUTSIDE];

export class StatusChart extends Chart {

    // `createCell(body, chart)` makes a cell's drawing, as for Chart; `name` is what a cell is
    // called, e.g. 'Gauge'
    constructor(createCell, name) {
        super(createCell, "gridSeries");
        this.name = name;
        // The grid's keyboard: one tab stop for all its cells (see gridPoints.js)
        this.gridPoints = new GridPoints(this, CELL_POINTS, () => this.gridSummary());
        // The Display Green cells setting last given, which hides or shows the green cells as the
        // legend does when it changes
        this.displayGreens = true;
        // Whether the legend had a green status when last drawn (see redraw)
        this.hadGreen = false;
    }

    setData(context, settings, data) {
        const displayGreens = isTrue((settings || {}).displayGreens, true);
        if (displayGreens !== this.displayGreens) {
            this.displayGreens = displayGreens;
            this.legend.setHidden(GREEN, !displayGreens);
        }
        super.setData(context, settings, data);
    }

    // The status colours on the theme shown
    statusColours() {
        return STATUS_COLOURS[this.isDarkTheme() ? "dark" : "light"];
    }

    // Works out each cell's value and status and draws them. Each cell is {key, label, value,
    // status, bands, statusColours, gridCellCount}: value and status are null without a value, and
    // bands is null when the settings give none
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const bands = statusBandsOf(settings);
        const statusColours = this.statusColours();
        const items = statusLegendItems(bands, statusColours);
        this.legend.setItems(items);
        // The legend forgets a status it no longer has (e.g. while the bands are cleared), so when
        // green comes back it is hidden again if the settings say not to show green cells (but not
        // otherwise, so that the person can still show it from the legend)
        const hasGreen = items.some(item => item.key === GREEN);
        if (hasGreen && !this.hadGreen && !this.displayGreens) {
            this.legend.setHidden(GREEN, true);
        }
        this.hadGreen = hasGreen;

        // Each cell's value, the first row's; those of a status the legend has hidden aren't shown
        const cells = this.data.values
            .filter(cell => Array.isArray(cell.values))
            .map(cell => {
                const row = cell.values.find(Array.isArray);
                const value = row && isNumber(row[0]) ? row[0] : null;
                const status = value === null || bands === null ? null : statusOf(value, bands);
                return { cell, value, status };
            })
            .filter(shown => shown.status === null || !this.legend.isHidden(shown.status));
        // With nothing to show, a cell that says so: that the legend hides every cell, if it does
        const allHidden = cells.length === 0 && this.data.values.some(cell => Array.isArray(cell.values));
        if (cells.length === 0) {
            cells.push({ cell: { key: null }, value: null, status: null });
        }

        this.grid.update(cells.map(({ cell, value, status }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || this.name,
            value,
            status,
            bands,
            statusColours,
            allHidden,
            gridCellCount: cells.length
        })));
    }

    // The grid for a screen reader: a single cell as it says itself, otherwise how many cells there
    // are of each status, e.g. 'Gauge of Queue, 3 cells: 1 Green, 1 Amber, 1 Red'
    gridSummary() {
        const drawn = [...this.cells].filter(drawing => drawing.cell);
        if (drawn.length <= 1) {
            return drawn.length === 1 ? drawn[0].summary : this.name;
        }
        const counts = new Map();
        for (const { cell } of drawn) {
            const words = cell.status === null ? "no data" : cell.status;
            counts.set(words, (counts.get(words) || 0) + 1);
        }
        const order = [...STATUS_ORDER, "no data"];
        const parts = [...counts].sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]))
            .map(([words, count]) => count + " " + words);
        return this.name + " of " + (this.settings.field || "Value") + ", " + drawn.length + " cells: "
               + parts.join(", ");
    }

    // What a cell says instead of its value, if it has none: 'No bands set', 'All hidden by the
    // legend' or 'No data'; or null
    emptyWords(cell) {
        if (cell.bands === null) {
            return "No bands set";
        }
        if (cell.allHidden) {
            return "All hidden by the legend";
        }
        return cell.value === null ? "No data" : null;
    }

    // The tooltip of a cell, or null without a value. `beyond` names what the bands make, e.g. 'dial'
    tooltip(cell, beyond) {
        if (!cell || this.emptyWords(cell) !== null) {
            return null;
        }
        const rows = [
            [this.settings.field || "Value", formatNumber(cell.value)],
            ["Status", statusWords(cell.value, cell.bands, beyond)]
        ];
        const range = rangeWords(cell.status, cell.bands);
        if (range !== null) {
            rows.push(["Range", range]);
        }
        return { title: cell.gridCellCount > 1 ? cell.label : null, rows };
    }

    // A cell for a screen reader, e.g. 'Gauge of Requests, web-01: 4,200, Amber (2,000 to 4,999)'
    describe(cell, beyond) {
        let text = this.name + " of " + (this.settings.field || "Value");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        const empty = this.emptyWords(cell);
        if (empty !== null) {
            return text + ": " + empty.toLowerCase();
        }
        const range = rangeWords(cell.status, cell.bands);
        return text + ": " + formatNumber(cell.value) + ", " + statusWords(cell.value, cell.bands, beyond)
               + (range === null ? "" : " (" + range + ")");
    }
}
