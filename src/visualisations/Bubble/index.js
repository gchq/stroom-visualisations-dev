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

// A bubble chart: a bubble for each name, as big as its value, packed together, in a grid of charts
// if a Grid Series field is chosen. With a Series field the bubbles are coloured by series and,
// unless flattened, each series' bubbles are in a bubble of their own; without one each bubble has
// its own colour. Stroom makes it with `new visualisations.Bubble()` and calls
// setData(context, settings, data) with data nested as grid cell, then series, then rows of
// [name, value].
//
// Each bubble is reachable from the keyboard (Stroom's stroom.points). The mouse wheel (or + and −)
// zooms and dragging pans; a double click (or 0) puts it back (shared/panZoom.js).

import "../../shared/shared.css";
import "./Bubble.css";
import { select } from "d3";
import { Chart } from "../../shared/chart.js";
import { textColourOn } from "../../shared/colour.js";
import { distinct, hasValue, keyOf } from "../../shared/data.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { PanZoom } from "../../shared/panZoom.js";
import { inCell, selectedValue } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { packBubbles } from "./bubbles.js";

// How far the mouse wheel zooms out and in
const ZOOM_EXTENT = [0.1, 100];
// The room around the bubbles
const MARGIN = 4;

class Bubble extends Chart {

    constructor() {
        super((body, chart) => new BubbleCell(body, chart), "series");
    }

    // Whether the bubbles are coloured by series (a Series field is chosen), or each by its name
    bySeries() {
        return Boolean(this.settings.series);
    }

    // A bubble's name as shown
    nameOf(value) {
        return formatValue(value, this.data.types[0], this.settings.nameDateFormat);
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const data = this.data;
        const settings = this.settings;
        const nameType = data.types[0];
        const gridCells = data.values.filter(cell => Array.isArray(cell.values));
        const bySeries = this.bySeries();

        // Coloured as the Series field's values are everywhere on the dashboard, or without one the
        // Name field's
        const legendKeys = bySeries
            ? distinct(gridCells.flatMap(cell => cell.values.map(keyOf)))
            : distinct(gridCells.flatMap(cell => cell.values.flatMap(one => (one.values || []).map(row => String(row[0])))));
        const colours = this.colours.of(bySeries ? settings.series : settings.name, legendKeys);
        this.legend.setItems(legendKeys.map(key => ({
            key,
            label: bySeries ? this.seriesLabel(key) || "Series" : this.nameOf(key),
            colour: colours(key)
        })));

        // What is shown of each cell: the series (or names) the legend hasn't hidden. A row without
        // a name has nothing to say what it is
        const shownCells = gridCells.map(cell => ({
            cell,
            series: cell.values
                .filter(one => !bySeries || !this.legend.isHidden(keyOf(one)))
                .map(one => ({
                    key: keyOf(one),
                    label: this.seriesLabel(one.key),
                    rows: (one.values || []).filter(row => hasValue(row[0], nameType)
                        && (bySeries || !this.legend.isHidden(String(row[0]))))
                }))
        }));
        // With nothing to show, a chart that says so
        if (shownCells.length === 0) {
            shownCells.push({ cell: { key: null }, series: [] });
        }

        this.grid.update(shownCells.map(({ cell, series }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
            series,
            colourOf: bubble => colours(bySeries ? bubble.seriesKey : String(bubble.row[0])),
            gridCellCount: shownCells.length
        })));
    }
}

// The chart in one cell of the grid
class BubbleCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-bubble");
        // What the mouse wheel zooms and dragging pans
        this.zoomed = this.svg.append("g");
        this.groupsGroup = this.zoomed.append("g").attr("class", "vis-bubble__groups");
        this.bubblesGroup = this.zoomed.append("g").attr("class", "vis-bubble__bubbles vis-glow");
        this.labelsGroup = this.zoomed.append("g").attr("class", "vis-bubble__labels").attr("aria-hidden", "true");
        // Said where the bubbles would be when there are none (the chart's description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // The wheel (or + and −) zooms and dragging pans; a double click (or 0) puts it back, as the
        // bubbles are drawn to fit
        this.panZoom = new PanZoom(this.svg, this.zoomed, {
            fit: () => this.panZoom.apply({ k: 1, x: 0, y: 0 }, true),
            scaleExtent: ZOOM_EXTENT
        });
        this.highlighted = null;
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-bubble__bubble",
                group: bubble => bubble.__data__.seriesKey,
                tooltip: bubble => this.tooltip(bubble.__data__),
                highlight: bubble => {
                    this.highlighted = bubble;
                    // A bubble reached from the keyboard is brought into view, when zoomed in
                    if (bubble !== null && bubble === document.activeElement && this.size) {
                        const data = bubble.__data__;
                        this.panZoom.bringIntoView([data.x, data.y], { x: data.r, y: data.r }, this.size);
                    }
                    this.showHighlight();
                },
                select: (bubble, event) => chart.selection.choose(this.selectionItem(bubble.__data__), event),
                summary: () => this.summary
            })
            : null;
        this.summary = "Bubble chart";
    }

    draw(cell) {
        this.cell = cell;
        const settings = this.chart.settings;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }
        this.size = { width, height };

        const flatten = !this.chart.bySeries() || isTrue(settings.flattenSeries, true);
        const { bubbles, groups } = packBubbles(cell.series, flatten, width - 2 * MARGIN, height - 2 * MARGIN);
        this.groupsGroup.attr("transform", "translate(" + MARGIN + "," + MARGIN + ")");
        this.bubblesGroup.attr("transform", "translate(" + MARGIN + "," + MARGIN + ")");
        this.labelsGroup.attr("transform", "translate(" + MARGIN + "," + MARGIN + ")");
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(bubbles.length === 0 ? "No data" : "");

        // Each series' bubble, around its own
        const colours = this.chart.colours.of(settings.series, groups.map(group => group.key));
        this.groupsGroup.selectAll("circle.vis-bubble__group")
            .data(groups, group => group.key)
            .join("circle")
            .attr("class", "vis-bubble__group")
            .attr("cx", group => group.x)
            .attr("cy", group => group.y)
            .attr("r", group => group.r)
            .style("stroke", group => colours(group.key))
            .style("fill", group => colours(group.key));

        // The bubbles, in their series, so that each series is a group for the keyboard
        const bubbleGroups = this.bubblesGroup.selectAll("g.vis-bubble__series")
            .data(distinct(bubbles.map(bubble => bubble.seriesKey)), key => key)
            .join("g")
            .attr("class", "vis-bubble__series")
            .order();
        bubbleGroups.selectAll("circle.vis-bubble__bubble")
            .data(key => bubbles.filter(bubble => bubble.seriesKey === key), bubble => bubble.id)
            .join("circle")
            .attr("class", "vis-bubble__bubble")
            .attr("cx", bubble => bubble.x)
            .attr("cy", bubble => bubble.y)
            .attr("r", bubble => bubble.r)
            .style("fill", bubble => cell.colourOf(bubble));

        // Each bubble's name, if the settings say, where it fits, in a colour that reads on the bubble
        const labels = this.labelsGroup.selectAll("text.vis-bubble__label")
            .data(isTrue(settings.showLabels, false) ? bubbles : [], bubble => bubble.id)
            .join("text")
            .attr("class", "vis-bubble__label")
            .attr("x", bubble => bubble.x)
            .attr("y", bubble => bubble.y)
            .style("fill", bubble => textColourOn(cell.colourOf(bubble)))
            .text(bubble => this.chart.nameOf(bubble.row[0]));
        labels.each(function(bubble) {
            this.style.display = this.getComputedTextLength() <= 2 * bubble.r - 4 ? "" : "none";
        });

        this.summary = this.describe(cell, bubbles);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a bubble
    tooltip(bubble) {
        const settings = this.chart.settings;
        const title = this.chart.bySeries() ? bubble.seriesLabel : null;
        return {
            title,
            rows: [
                [settings.name || "Name", this.chart.nameOf(bubble.row[0])],
                [settings.value || "Value", formatValue(bubble.row[1], this.chart.data.types[1])]
            ]
        };
    }

    // What Stroom is told of a selected bubble (as the legacy chart told it)
    selectionItem(bubble) {
        return inCell({
            key: bubble.seriesKey + "~#~" + bubble.row[0],
            name: selectedValue(bubble.row[0], this.chart.data.types[0]),
            series: bubble.seriesKey,
            value: bubble.row[1]
        }, this.cell);
    }

    // The chart for a screen reader, e.g. 'Bubble chart of Requests by Status: 12 bubbles in 3
    // series, largest Requests 1,380 (200 OK, db-01)'
    describe(cell, bubbles) {
        const settings = this.chart.settings;
        const nameField = settings.name || "Name";
        const valueField = settings.value || "Value";
        let text = "Bubble chart of " + valueField + " by " + nameField;
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (bubbles.length === 0) {
            return text + ": no data";
        }
        const seriesCount = distinct(bubbles.map(bubble => bubble.seriesKey)).length;
        text += ": " + bubbles.length + (bubbles.length === 1 ? " bubble" : " bubbles");
        if (this.chart.bySeries() && seriesCount > 1) {
            text += " in " + seriesCount + " series";
        }
        const largest = bubbles.reduce((best, bubble) => bubble.row[1] > best.row[1] ? bubble : best);
        const what = [this.chart.nameOf(largest.row[0])];
        if (this.chart.bySeries() && largest.seriesLabel) {
            what.push(largest.seriesLabel);
        }
        return text + ", largest " + valueField + " " + formatValue(largest.row[1], this.chart.data.types[1])
               + " (" + what.join(", ") + ")";
    }

    // Fades every bubble but the one shown and those selected, and their labels with them
    showHighlight() {
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        const fadedIds = new Set();
        this.bubblesGroup.selectAll("circle.vis-bubble__bubble").each((bubble, index, nodes) => {
            const element = nodes[index];
            const selected = selection.has(this.selectionItem(bubble).key);
            const faded = highlighted !== null
                ? element !== highlighted && !selected
                : !selection.isEmpty() && !selected;
            element.classList.toggle("vis-bubble__bubble--faded", faded);
            element.classList.toggle("vis-bubble__bubble--selected", selected);
            if (faded) {
                fadedIds.add(bubble.id);
            }
        });
        this.labelsGroup.selectAll("text.vis-bubble__label").each((bubble, index, nodes) => {
            nodes[index].classList.toggle("vis-bubble__label--faded", fadedIds.has(bubble.id));
        });
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Bubble = Bubble;
