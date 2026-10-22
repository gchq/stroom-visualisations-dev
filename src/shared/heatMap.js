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

// What the heat maps share (DayWeekHeatMap, HourDayMultiHeatMap): a heat map in each cell of the
// grid, its values in heat colours (shared/heat.js) that are the same in every cell, so that they
// can be compared. The legend shows or hides the cells of each colour, and a key beside each map
// says what its colours are. The highest value is ringed, and the lowest ringed in dashes.
// Each value is reachable from the keyboard (Stroom's stroom.points), along its row and between
// rows.

import "./heatMap.css";
import { scaleBand, select } from "d3";
import { Chart } from "./chart.js";
import { DARK_BACKGROUND, LIGHT_BACKGROUND } from "./colour.js";
import { TEXT } from "./data.js";
import { edgeColour } from "./edges.js";
import { formatNumber } from "./format.js";
import { bucketWords, heatColours, heatScale } from "./heat.js";
import { MARGIN, fitAxes } from "./plot.js";
import { isTrue } from "./settings.js";

// The largest a cell of a heat map is drawn, across and down
const MAX_CELL = 60;
// The room for the key of colours beside a map, which is only drawn if the map is wide enough
const KEY_WIDTH = 76;
const KEY_MIN_CHART_WIDTH = 320;
// How wide a character of an axis label is, roughly, to space the labels so they don't overlap
const LABEL_CHARACTER_WIDTH = 6.5;
const LABEL_HEIGHT = 14;

export class HeatChart extends Chart {

    // `seriesField` is the id of the setting that names the field each heat map is of, if any
    constructor(seriesField) {
        super((body, chart) => new HeatCell(body, chart), seriesField);
    }

    // The heat maps to draw, each {key, label, grid}, a grid being {columns, rows, cells} as
    // shared/heat.js lays them out; each heat map has its own
    heatMaps() {
        return [];
    }

    // A cell's time in words, for its tooltip and name, e.g. 'Mon 12 Oct 2026'; each heat map has
    // its own
    timeWords(time) {
        return String(time);
    }

    // What the heat maps are called, e.g. 'Heat map of Logins by day and week'
    describeName() {
        return "Heat map";
    }

    // The name of the values' field, e.g. 'Logins', and of their times', e.g. 'Day'
    valueName() {
        return "Value";
    }

    timeName() {
        return "Time";
    }

    // Works out the heat maps, their colours and the legend, and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const maps = this.heatMaps();
        const values = maps.flatMap(map => map.grid.cells.map(cell => cell.value));
        const scale = values.length === 0
            ? heatScale(null, null, [])
            : heatScale(Math.min(...values), Math.max(...values), heatColours(this.isDarkTheme()));
        this.legend.setItems(scale.buckets.slice().reverse().map(bucket => ({
            key: String(bucket.index),
            label: bucketWords(bucket),
            colour: bucket.colour
        })));
        // With nothing to show, a heat map that says so
        if (maps.length === 0) {
            maps.push({ key: "", label: "Heat map", grid: { columns: [], rows: [], cells: [] } });
        }
        this.grid.update(maps.map(map => ({
            key: map.key,
            label: map.label,
            grid: map.grid,
            // The cells of the colours the legend hasn't hidden, each with its bucket
            shown: map.grid.cells
                .map(cell => ({ ...cell, mapKey: map.key, bucket: scale.bucketOf(cell.value) }))
                .filter(cell => !this.legend.isHidden(String(cell.bucket.index))),
            buckets: scale.buckets,
            gridCellCount: maps.length
        })));
    }
}

// The heat map in one cell of the grid
class HeatCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-heat");
        this.plot = this.svg.append("g");
        // Every place a value could be, faintly, so that the gaps show where there are none
        this.slotsGroup = this.plot.append("g").attr("class", "vis-heat__slots").attr("aria-hidden", "true");
        this.cellsGroup = this.plot.append("g").attr("class", "vis-heat__cells");
        // The rings around the highest, lowest and selected cells, just outside them, so that they
        // show against the background whatever the cells' colours
        this.ringsGroup = this.plot.append("g").attr("class", "vis-heat__rings").attr("aria-hidden", "true");
        this.xAxisGroup = this.plot.append("g");
        this.yAxisGroup = this.plot.append("g");
        this.keyGroup = this.svg.append("g").attr("class", "vis-heat__key").attr("aria-hidden", "true");
        // Said where the heat map would be when there are no values (its description says it too)
        this.emptyText = this.plot.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-heat__cell",
                group: element => element.__data__.row,
                tooltip: element => this.tooltip(element.__data__),
                label: element => this.label(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    this.showHighlight();
                },
                select: (element, event) => chart.selection.choose(this.selectionItem(element.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Heat map";
    }

    draw(map) {
        this.map = map;
        const settings = this.chart.settings;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        const { columns, rows } = map.grid;
        const empty = map.grid.cells.length === 0;
        const showKey = !empty && width >= KEY_MIN_CHART_WIDTH;
        const chartWidth = width - (showKey ? KEY_WIDTH : 0);
        // Labels far enough apart not to overlap: every so many columns and rows
        const columnLabelWidth = Math.max(0, ...columns.map(column => column.label.length)) * LABEL_CHARACTER_WIDTH + 8;
        const columnEvery = Math.max(1, Math.ceil(columnLabelWidth / Math.max(1, Math.min(MAX_CELL, chartWidth / Math.max(1, columns.length)))));
        const rowEvery = Math.max(1, Math.ceil(LABEL_HEIGHT / Math.max(1, Math.min(MAX_CELL, height / Math.max(1, rows.length)))));
        const labelOf = items => {
            const labels = new Map(items.map(item => [item.key, item.label]));
            return key => labels.get(key) || "";
        };
        let cellsHeight = 0;
        const { xScale, yScale, left, plotWidth, plotHeight } = fitAxes({
            width: chartWidth,
            height,
            xAxisGroup: this.xAxisGroup,
            yAxisGroup: this.yAxisGroup,
            xScaleFor: range => scaleBand()
                .domain(columns.map(column => column.key))
                .range([0, Math.min(range[1], MAX_CELL * columns.length)]),
            // The cells sit on the bottom axis, however short they are
            yScaleFor: range => {
                cellsHeight = Math.min(range[0], MAX_CELL * rows.length);
                return scaleBand().domain(rows.map(row => row.key)).range([range[0] - cellsHeight, range[0]]);
            },
            x: {
                type: TEXT,
                show: !empty && isTrue(settings.displayXAxis, true),
                tickValues: columns.filter((column, index) => index % columnEvery === 0).map(column => column.key),
                tickFormat: labelOf(columns)
            },
            y: {
                type: TEXT,
                show: !empty && isTrue(settings.displayYAxis, true),
                tickValues: rows.filter((row, index) => index % rowEvery === 0).map(row => row.key),
                tickFormat: labelOf(rows)
            }
        });
        // A map smaller than its room (its cells being no bigger than MAX_CELL) is in the middle of
        // it, with its key beside it
        const cellsWidth = xScale.range()[1];
        const offsetX = empty ? 0 : (plotWidth - cellsWidth) / 2;
        const offsetY = empty ? 0 : -(plotHeight - cellsHeight) / 2;
        this.plot.attr("transform", "translate(" + (left + offsetX) + "," + (MARGIN.top + offsetY) + ")");
        this.emptyText
            .attr("x", plotWidth / 2)
            .attr("y", plotHeight / 2)
            .text(empty ? "No data" : "");

        const cellWidth = xScale.bandwidth();
        const cellHeight = yScale.bandwidth();
        const radius = Math.min(4, cellWidth * 0.1, cellHeight * 0.1);
        // The gap around each cell, of the background, which a ring sits in (narrower between small
        // cells, so that they aren't all gap)
        const inset = Math.min(cellWidth, cellHeight) >= 10 ? 2 : 1;
        const slots = empty ? [] : rows.flatMap(row => columns.map(column => ({ row: row.key, column: column.key })));
        this.slotsGroup.selectAll("rect.vis-heat__slot")
            .data(slots, slot => slot.column + "~" + slot.row)
            .join("rect")
            .attr("class", "vis-heat__slot")
            .attr("x", slot => xScale(slot.column) + inset)
            .attr("y", slot => yScale(slot.row) + inset)
            .attr("width", Math.max(0, cellWidth - 2 * inset))
            .attr("height", Math.max(0, cellHeight - 2 * inset))
            .attr("rx", radius);

        // The highest and lowest of the values shown
        const shownValues = map.shown.map(cell => cell.value);
        const highest = Math.max(...shownValues);
        const lowest = Math.min(...shownValues);
        this.extremes = { highest, lowest, distinct: highest !== lowest };
        this.cellsGroup.selectAll("rect.vis-heat__cell")
            .data(map.shown, cell => cell.column + "~" + cell.row)
            .join("rect")
            .attr("class", "vis-heat__cell")
            .classed("vis-heat__cell--highest", cell => cell.value === highest)
            .classed("vis-heat__cell--lowest", cell => this.extremes.distinct && cell.value === lowest)
            .attr("x", cell => xScale(cell.column) + inset)
            .attr("y", cell => yScale(cell.row) + inset)
            .attr("width", Math.max(0, cellWidth - 2 * inset))
            .attr("height", Math.max(0, cellHeight - 2 * inset))
            .attr("rx", radius)
            .style("fill", cell => cell.bucket.colour)
            .style("--vis-heat__edge", cell => this.edgeOf(cell.bucket.colour));
        this.place = { xScale, yScale, radius };

        this.drawKey(showKey ? map.buckets : [], left + offsetX + cellsWidth,
            MARGIN.top + offsetY + plotHeight - cellsHeight, cellsHeight);
        this.summary = this.describe(map);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The edge of a cell of a colour: a deeper shade of it if the colour is too pale
    // to show against the background by itself (the lowest values), otherwise none (see edges.js)
    edgeOf(colour) {
        return edgeColour(colour, this.chart.isDarkTheme() ? DARK_BACKGROUND : LIGHT_BACKGROUND);
    }

    // The key of the colours, highest at the top, beside the map from `x`, as high as its cells
    drawKey(buckets, x, top, height) {
        const swatchHeight = buckets.length === 0 ? 0 : Math.max(10, Math.min(22, height / buckets.length));
        const keyTop = top + Math.max(0, height - swatchHeight * buckets.length);
        const entries = this.keyGroup.selectAll("g.vis-heat__key-entry")
            .data(buckets.slice().reverse(), bucket => bucket.index)
            .join(enter => {
                const entry = enter.append("g").attr("class", "vis-heat__key-entry");
                entry.append("rect").attr("class", "vis-heat__key-swatch");
                entry.append("text").attr("class", "vis-heat__key-label");
                return entry;
            })
            .attr("transform", (bucket, index) => "translate(" + (x + 8) + "," + (keyTop + index * swatchHeight) + ")");
        entries.select("rect")
            .attr("width", 12)
            .attr("height", Math.max(0, swatchHeight - 2))
            .style("fill", bucket => bucket.colour);
        entries.select("text")
            .attr("x", 17)
            .attr("y", swatchHeight / 2)
            .text(bucket => bucketWords(bucket));
    }

    // A cell's value in words, saying if it is the highest or lowest, e.g. '42 (highest)'
    valueWords(cell) {
        let words = formatNumber(cell.value);
        if (cell.value === this.extremes.highest) {
            words += " (highest)";
        } else if (this.extremes.distinct && cell.value === this.extremes.lowest) {
            words += " (lowest)";
        }
        return words;
    }

    // A cell for a screen reader, e.g. 'Mon 12 Oct 2026: 42 (highest)'
    label(cell) {
        return this.chart.timeWords(cell.time) + ": " + this.valueWords(cell);
    }

    tooltip(cell) {
        const chart = this.chart;
        return {
            title: this.map.gridCellCount > 1 ? this.map.label : null,
            rows: [
                [chart.timeName(), chart.timeWords(cell.time)],
                [chart.valueName(), this.valueWords(cell)]
            ]
        };
    }

    // What Stroom is told of a selected cell
    selectionItem(cell) {
        const time = new Date(cell.time).toISOString();
        return { key: cell.mapKey + "~#~" + time, series: cell.mapKey, x: time, value: cell.value };
    }

    // The heat map for a screen reader, e.g. 'Heat map of Logins by day and week: 30 values,
    // highest 42 on Mon 12 Oct 2026, lowest 1 on Sun 18 Oct 2026'
    describe(map) {
        const chart = this.chart;
        let text = chart.describeName();
        if (map.gridCellCount > 1) {
            text += ", " + map.label;
        }
        const cells = map.shown;
        if (cells.length === 0) {
            return text + ": no data";
        }
        const highest = cells.reduce((best, cell) => cell.value > best.value ? cell : best);
        const lowest = cells.reduce((best, cell) => cell.value < best.value ? cell : best);
        text += ": " + cells.length + (cells.length === 1 ? " value" : " values")
                + ", highest " + formatNumber(highest.value) + " on " + chart.timeWords(highest.time);
        if (lowest.value !== highest.value) {
            text += ", lowest " + formatNumber(lowest.value) + " on " + chart.timeWords(lowest.time);
        }
        return text;
    }

    // Fades every cell but the highlighted one and those selected, and rings the highest, lowest
    // and selected cells
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted;
        const rings = [];
        this.cellsGroup.selectAll("rect.vis-heat__cell").each((cell, index, nodes) => {
            const element = nodes[index];
            const selected = selection.has(this.selectionItem(cell).key);
            let faded;
            if (highlighted !== null && document.contains(highlighted)) {
                faded = element !== highlighted && !selected;
            } else {
                faded = !selection.isEmpty() && !selected;
            }
            element.classList.toggle("vis-heat__cell--faded", faded);
            element.classList.toggle("vis-heat__cell--selected", selected);
            if (selected) {
                rings.push({ cell, kind: "selected" });
            } else if (element.classList.contains("vis-heat__cell--highest")) {
                rings.push({ cell, kind: "highest" });
            } else if (element.classList.contains("vis-heat__cell--lowest")) {
                rings.push({ cell, kind: "lowest" });
            }
        });
        if (!this.place) {
            return;
        }
        const { xScale, yScale, radius } = this.place;
        this.ringsGroup.selectAll("rect.vis-heat__ring")
            .data(rings, ring => ring.cell.column + "~" + ring.cell.row)
            .join("rect")
            .attr("class", ring => "vis-heat__ring vis-heat__ring--" + ring.kind)
            .attr("x", ring => xScale(ring.cell.column))
            .attr("y", ring => yScale(ring.cell.row))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("rx", radius + 1);
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}
