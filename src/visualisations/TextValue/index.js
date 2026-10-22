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

// A text value: a value (the first row's) written as big as fits, in a grid of values if a Grid
// Series field is chosen. A number has thousands separators and a date is as Stroom's tables show
// it. Text too long for one line wraps, and what still doesn't fit is in the tooltip. Stroom makes
// it with `new visualisations.TextValue()` and calls setData(context, settings, data) with data
// nested as grid cell, then a row of [value].
//
// Each value is reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./TextValue.css";
import { select } from "d3";
import { Chart } from "../../shared/chart.js";
import { hasValue, keyOf } from "../../shared/data.js";
import { fitText } from "../../shared/fit.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { GridPoints } from "../../shared/gridPoints.js";

// The room around a value
const PADDING = 8;
// The smallest a value is written
const MIN_FONT_SIZE = 12;

class TextValue extends Chart {

    constructor() {
        super((body, chart) => new TextValueCell(body, chart), "gridSeries");
        // A value has no categories, so no legend
        this.toolbar.remove("legend");
        // The grid's keyboard: one tab stop for all its cells (see gridPoints.js)
        this.gridPoints = new GridPoints(this, ".vis-text-value__value", () => this.gridSummary());
    }

    // The grid for a screen reader: a single cell as it says itself, otherwise how many values it
    // shows, e.g. 'Values of Status, 3 cells'
    gridSummary() {
        const drawn = [...this.cells].filter(drawing => drawing.cell);
        if (drawn.length <= 1) {
            return drawn.length === 1 ? drawn[0].summary : "Value";
        }
        return "Values of " + (this.settings.field || "Value") + ", " + drawn.length + " cells";
    }

    // Works out what each cell writes and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const type = this.data.types[0];
        const cells = this.data.values
            .filter(cell => Array.isArray(cell.values))
            .map(cell => {
                const row = cell.values.find(Array.isArray);
                return {
                    key: keyOf(cell),
                    label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Value",
                    text: row && hasValue(row[0], type) ? formatValue(row[0], type) : null
                };
            });
        // With nothing to show, a cell that says so
        if (cells.length === 0) {
            cells.push({ key: "", label: "Value", text: null });
        }
        this.grid.update(cells.map(cell => ({ ...cell, gridCellCount: cells.length })));
    }
}

// The value in one cell of the grid
class TextValueCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.root = select(body).append("div").attr("class", "vis-chart vis-text-value");
        // The value is the cell's one point; its words are in its name
        this.value = this.root.append("div").attr("class", "vis-text-value__value");
        this.emptyText = this.root.append("div").attr("class", "vis-text-value__empty").attr("aria-hidden", "true");
        // The cell's one point, in the grid's keyboard (see gridPoints.js)
        chart.gridPoints.own(this.value.node(), this);
        this.summary = "Value";
    }

    draw(cell) {
        this.cell = cell;
        const node = this.root.node();
        const width = node.clientWidth;
        const height = node.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        const empty = cell.text === null;
        this.value.style("display", empty ? "none" : null);
        this.emptyText.text(empty ? "No data" : "");
        this.summary = this.describe(cell);
        if (!empty) {
            // As big as fits, on one line or wrapped; what still doesn't fit is cut off
            const innerHeight = height - 2 * PADDING;
            const { fontSize, wraps } = fitText(cell.text, width - 2 * PADDING, innerHeight, MIN_FONT_SIZE, 200);
            this.value
                .classed("vis-text-value__value--wrapped", wraps)
                .style("font-size", fontSize + "px")
                .style("-webkit-line-clamp", wraps ? String(Math.max(1, Math.floor(innerHeight / (fontSize * 1.2)))) : null)
                .text(cell.text);
        }

        this.chart.gridPoints.refresh();
    }

    // The tooltip of the value: all of it, as it may not all fit
    tooltip() {
        const cell = this.cell;
        if (!cell || cell.text === null) {
            return null;
        }
        return {
            title: cell.gridCellCount > 1 ? cell.label : null,
            rows: [[this.chart.settings.field || "Value", cell.text]]
        };
    }

    // The value for a screen reader, e.g. 'Status, web-01: Running'
    describe(cell) {
        let text = this.chart.settings.field || "Value";
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        return text + ": " + (cell.text === null ? "no data" : cell.text);
    }

    // A value has nothing to highlight or select
    showHighlight() {
    }

    destroy() {
        this.chart.cells.delete(this);
        this.root.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.TextValue = TextValue;
