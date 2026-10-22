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

// A RAG status: a tile in a value's red, amber or green status (its band from the settings), with
// the value and its status written on it, so the status isn't told by colour alone. A value outside
// the bands is a grey tile that says where it is. In a grid of tiles if a Grid Series field is
// chosen; the legend (or the Display Green cells setting) shows or hides the tiles of each status.
// Stroom makes it with `new visualisations.RAGStatus()` and calls setData(context, settings, data)
// with data nested as grid cell, then a row of [value].
//
// Each tile is reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./RAGStatus.css";
import { select } from "d3";
import { textColourOn } from "../../shared/colour.js";
import { fitFontSize } from "../../shared/fit.js";
import { formatNumber } from "../../shared/format.js";
import { isTrue } from "../../shared/settings.js";
import { OUTSIDE, statusWords } from "../../shared/status.js";
import { StatusChart } from "../../shared/statusChart.js";

// The room around a tile, and inside it around its words
const MARGIN = 4;
const PADDING = 8;
// The status is written this much smaller than the value
const STATUS_SCALE = 0.4;

class RAGStatus extends StatusChart {

    constructor() {
        super((body, chart) => new RAGStatusCell(body, chart), "RAG status");
    }
}

// The tile in one cell of the grid
class RAGStatusCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.root = select(body).append("div").attr("class", "vis-chart vis-rag");
        // The tile is the cell's one point; its words are in its name
        this.tile = this.root.append("div").attr("class", "vis-rag__tile");
        this.valueText = this.tile.append("div").attr("class", "vis-rag__value").attr("aria-hidden", "true");
        this.statusText = this.tile.append("div").attr("class", "vis-rag__status").attr("aria-hidden", "true");
        // Said where the tile would be when there is no value (the description says it too)
        this.emptyText = this.root.append("div").attr("class", "vis-rag__empty").attr("aria-hidden", "true");
        // The cell's one point, in the grid's keyboard (see gridPoints.js)
        chart.gridPoints.own(this.tile.node(), this);
        this.summary = "RAG status";
    }

    draw(cell) {
        this.cell = cell;
        const node = this.root.node();
        const width = node.clientWidth;
        const height = node.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        const emptyWords = this.chart.emptyWords(cell);
        this.tile.style("display", emptyWords === null ? null : "none");
        this.emptyText.text(emptyWords || "");
        this.summary = this.chart.describe(cell);
        if (emptyWords === null) {
            const colour = cell.statusColours[cell.status];
            const showValue = isTrue(this.chart.settings.showLabels, true);
            const value = showValue ? formatNumber(cell.value) : "";
            const status = statusWords(cell.value, cell.bands);
            // The value as big as fits, with its status under it
            const innerWidth = width - 2 * (MARGIN + PADDING);
            const innerHeight = height - 2 * (MARGIN + PADDING);
            const valueSize = showValue
                ? fitFontSize(value.length, innerWidth, innerHeight / (1 + STATUS_SCALE), 10, 160)
                : 0;
            // Without the value, the status has the room, but isn't shouted
            const statusSize = fitFontSize(status.length, innerWidth, innerHeight, 10,
                showValue ? Math.max(10, valueSize * STATUS_SCALE) : 48);
            this.tile
                .classed("vis-rag__tile--outside", cell.status === OUTSIDE)
                .style("--vis-rag__colour", colour)
                .style("--vis-rag__text", textColourOn(colour))
                .style("border-radius", Math.min(width, height) / 15 + "px");
            this.valueText
                .style("display", showValue ? null : "none")
                .style("font-size", valueSize + "px")
                .text(value);
            this.statusText
                .style("font-size", statusSize + "px")
                .text(status);
        }

        this.chart.gridPoints.refresh();
    }

    // A tile has nothing to highlight or select
    showHighlight() {
    }

    // The tooltip of the cell's point
    tooltip() {
        return this.chart.tooltip(this.cell);
    }

    destroy() {
        this.chart.cells.delete(this);
        this.root.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.RAGStatus = RAGStatus;
