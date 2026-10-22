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

// A gauge: a dial with red, amber and green bands (from the settings) and a pointer to a value, in
// a grid of gauges if a Grid Series field is chosen. The value and its status are written under the
// pointer, so the status isn't told by colour alone. The legend shows or hides the gauges of each
// status, e.g. to show only those that aren't green. Stroom makes it with
// `new visualisations.Gauge()` and calls setData(context, settings, data) with data nested as grid
// cell, then a row of [value].
//
// Each gauge is reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./Gauge.css";
import { arc, select } from "d3";
import { formatNumber } from "../../shared/format.js";
import { isTrue } from "../../shared/settings.js";
import { OUTSIDE, statusWords } from "../../shared/status.js";
import { StatusChart } from "../../shared/statusChart.js";
import { END_ANGLE, START_ANGLE, angleOf } from "./gauge.js";

// The room around a dial
const MARGIN = 6;
// The dial's 270 degrees reach this far below its centre, as a share of its radius
const BELOW_CENTRE = 0.75;
// The room under the dial for the labels of its ends
const END_LABEL_ROOM = 14;
// How many ticks the dial has, from its minimum to its maximum
const TICKS = 11;

class Gauge extends StatusChart {

    constructor() {
        super((body, chart) => new GaugeCell(body, chart), "Gauge");
    }
}

// The gauge in one cell of the grid
class GaugeCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-gauge");
        // The whole dial is the gauge's one point
        this.dialGroup = this.svg.append("g").attr("class", "vis-gauge__dial");
        this.track = this.dialGroup.append("path").attr("class", "vis-gauge__track");
        this.bandsGroup = this.dialGroup.append("g").attr("class", "vis-gauge__bands");
        this.ticksGroup = this.dialGroup.append("g").attr("class", "vis-gauge__ticks").attr("aria-hidden", "true");
        this.pointer = this.dialGroup.append("path").attr("class", "vis-gauge__pointer");
        this.hub = this.dialGroup.append("circle").attr("class", "vis-gauge__hub");
        this.valueText = this.dialGroup.append("text").attr("class", "vis-gauge__value").attr("aria-hidden", "true");
        this.statusText = this.dialGroup.append("text").attr("class", "vis-gauge__status").attr("aria-hidden", "true");
        // Said where the dial would be when there is no value (the description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        // The cell's one point, in the grid's keyboard (see gridPoints.js)
        chart.gridPoints.own(this.dialGroup.node(), this);
        this.summary = "Gauge";
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

        const emptyWords = this.chart.emptyWords(cell);
        const empty = emptyWords !== null;
        this.dialGroup.style("display", empty ? "none" : null);
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(emptyWords || "");
        this.summary = this.chart.describe(cell, "dial");
        if (empty) {
            this.chart.gridPoints.refresh();
            return;
        }

        // As big as fits, in the middle: the dial is a circle less the quarter at its bottom, with
        // the labels of its ends under it
        const radius = Math.max(10, Math.min((width - 2 * MARGIN) / 2,
            (height - 2 * MARGIN - END_LABEL_ROOM) / (1 + BELOW_CENTRE)));
        const top = Math.max(MARGIN, (height - radius * (1 + BELOW_CENTRE) - END_LABEL_ROOM) / 2);
        this.dialGroup.attr("transform", "translate(" + width / 2 + "," + (top + radius) + ")");
        const dial = cell.bands;
        const ring = (lo, hi, inner, outer) => arc()
            .innerRadius(inner * radius)
            .outerRadius(outer * radius)
            .startAngle(angleOf(lo, dial))
            .endAngle(angleOf(hi, dial))();

        this.track.attr("d", arc().innerRadius(0.8 * radius).outerRadius(0.9 * radius)
            .startAngle(START_ANGLE).endAngle(END_ANGLE)());
        // The band the value is in is wider
        this.bandsGroup.selectAll("path.vis-gauge__band")
            .data(dial.bands, band => band.status)
            .join("path")
            .attr("class", "vis-gauge__band")
            .classed("vis-gauge__band--active", band => band.status === cell.status)
            .attr("d", band => ring(band.lo, band.hi, band.status === cell.status ? 0.68 : 0.8, 0.9))
            .style("fill", band => cell.statusColours[band.status]);

        // The ticks, with the dial's ends labelled under them
        const ticks = Array.from({ length: TICKS }, (unused, index) => dial.min + index * (dial.max - dial.min) / (TICKS - 1));
        this.ticksGroup.selectAll("line.vis-gauge__tick")
            .data(ticks)
            .join("line")
            .attr("class", "vis-gauge__tick")
            .each(function(value) {
                const angle = angleOf(value, dial);
                select(this)
                    .attr("x1", Math.sin(angle) * 0.92 * radius).attr("y1", -Math.cos(angle) * 0.92 * radius)
                    .attr("x2", Math.sin(angle) * 0.99 * radius).attr("y2", -Math.cos(angle) * 0.99 * radius);
            });
        const showLabels = isTrue(settings.showLabels, true);
        this.ticksGroup.selectAll("text.vis-gauge__end")
            .data(showLabels ? [dial.min, dial.max] : [])
            .join("text")
            .attr("class", "vis-gauge__end")
            .attr("x", value => Math.sin(angleOf(value, dial)) * 0.85 * radius)
            .attr("y", value => -Math.cos(angleOf(value, dial)) * 0.85 * radius + END_LABEL_ROOM)
            .text(value => formatNumber(value));

        // The pointer, a narrow triangle from the hub out to the value
        const angle = angleOf(cell.value, dial);
        const tip = 0.85 * radius;
        const base = 0.05 * radius;
        this.pointer.attr("d", "M" + (-base) + ",0L0," + (-tip) + "L" + base + ",0Z")
            .attr("transform", "rotate(" + angle * 180 / Math.PI + ")");
        this.hub.attr("r", 0.08 * radius);

        // The value and its status under the hub
        const fontSize = Math.max(10, Math.min(28, radius * 0.22));
        this.valueText
            .attr("y", 0.42 * radius)
            .style("font-size", fontSize + "px")
            .classed("vis-gauge__value--outside", cell.status === OUTSIDE)
            .text(showLabels ? formatNumber(cell.value) : "");
        // The status is always in words, so that it isn't told by the band's colour alone (Show Value
        // hides only the value), in the value's place when it is hidden
        this.statusText
            .attr("y", showLabels ? 0.42 * radius + fontSize : 0.42 * radius)
            .style("font-size", Math.max(10, fontSize * 0.5) + "px")
            .text(statusWords(cell.value, dial, "dial"));

        this.chart.gridPoints.refresh();
    }

    // A gauge has nothing to highlight or select
    showHighlight() {
    }

    // The tooltip of the cell's point
    tooltip() {
        return this.chart.tooltip(this.cell, "dial");
    }

    destroy() {
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Gauge = Gauge;
