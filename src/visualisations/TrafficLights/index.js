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

// Traffic lights: a traffic light with the lamp of a value's status lit (its red, amber or green
// band from the settings), and the value and its status written under it, so the status isn't told
// by colour alone (nor only by which lamp is lit). A value outside the bands lights no lamp. In a
// grid of lights if a Grid Series field is chosen; the legend shows or hides the lights of each
// status. Stroom makes it with `new visualisations.TrafficLights()` and calls
// setData(context, settings, data) with data nested as grid cell, then a row of [value].
//
// Each light is reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./TrafficLights.css";
import { select } from "d3";
import { fitFontSize } from "../../shared/fit.js";
import { formatNumber } from "../../shared/format.js";
import { isTrue } from "../../shared/settings.js";
import { OUTSIDE, statusWords } from "../../shared/status.js";
import { StatusChart } from "../../shared/statusChart.js";
import { HOUSING, LAMPS, lampColour } from "./lamps.js";

// The room around a light
const MARGIN = 6;
// A light's housing is this many times as high as it is wide
const HOUSING_RATIO = 2.6;
// A lamp's radius, as a share of the housing's width
const LAMP_RADIUS = 0.34;

class TrafficLights extends StatusChart {

    constructor() {
        super((body, chart) => new TrafficLightCell(body, chart), "Traffic light");
    }
}

// The traffic light in one cell of the grid
class TrafficLightCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-traffic");
        // The whole light is the cell's one point
        this.light = this.svg.append("g").attr("class", "vis-traffic__light");
        this.housing = this.light.append("rect").attr("class", "vis-traffic__housing").style("fill", HOUSING);
        this.lamps = this.light.selectAll("circle.vis-traffic__lamp")
            .data(LAMPS)
            .join("circle")
            .attr("class", "vis-traffic__lamp");
        this.valueText = this.light.append("text").attr("class", "vis-traffic__value").attr("aria-hidden", "true");
        this.statusText = this.light.append("text").attr("class", "vis-traffic__status").attr("aria-hidden", "true");
        // Said where the light would be when there is no value (the description says it too)
        this.emptyText = this.svg.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");
        // The cell's one point, in the grid's keyboard (see gridPoints.js)
        chart.gridPoints.own(this.light.node(), this);
        this.summary = "Traffic light";
    }

    draw(cell) {
        this.cell = cell;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }

        const emptyWords = this.chart.emptyWords(cell);
        this.light.style("display", emptyWords === null ? null : "none");
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(emptyWords || "");
        this.summary = this.chart.describe(cell);
        if (emptyWords === null) {
            const showValue = isTrue(this.chart.settings.ShowValue, true);
            // The words under the light: the value, if shown, and its status, as big as the cell's
            // height allows, but no wider than the cell (e.g. 'Above the bands' in a narrow cell)
            const valueWords = showValue ? formatNumber(cell.value) : "";
            const longest = Math.max(valueWords.length, statusWords(cell.value, cell.bands).length);
            const fontSize = fitFontSize(longest, width - 2 * MARGIN, height * 0.08 * 1.2, 10, 24);
            const wordsRoom = fontSize * (showValue ? 2.6 : 1.5);
            // The housing as big as fits above them, in the middle
            const housingHeight = Math.max(30, Math.min(height - 2 * MARGIN - wordsRoom,
                (width - 2 * MARGIN) * HOUSING_RATIO));
            const housingWidth = housingHeight / HOUSING_RATIO;
            const top = Math.max(MARGIN, (height - housingHeight - wordsRoom) / 2);
            this.housing
                .attr("x", (width - housingWidth) / 2)
                .attr("y", top)
                .attr("width", housingWidth)
                .attr("height", housingHeight)
                .attr("rx", housingWidth * 0.2);
            this.lamps
                .classed("vis-traffic__lamp--lit", status => status === cell.status)
                .attr("cx", width / 2)
                .attr("cy", (status, index) => top + housingHeight * (2 * index + 1) / 6)
                .attr("r", housingWidth * LAMP_RADIUS)
                .style("fill", status => lampColour(status, status === cell.status));

            const wordsTop = top + housingHeight + fontSize * 1.2;
            this.valueText
                .attr("x", width / 2)
                .attr("y", wordsTop)
                .style("font-size", fontSize + "px")
                .classed("vis-traffic__value--outside", cell.status === OUTSIDE)
                .text(valueWords);
            this.statusText
                .attr("x", width / 2)
                .attr("y", showValue ? wordsTop + fontSize * 1.1 : wordsTop)
                .style("font-size", (showValue ? Math.max(10, fontSize * 0.7) : fontSize) + "px")
                .text(statusWords(cell.value, cell.bands));
        }

        this.chart.gridPoints.refresh();
    }

    // A light has nothing to highlight or select
    showHighlight() {
    }

    // The tooltip of the cell's point
    tooltip() {
        return this.chart.tooltip(this.cell);
    }

    destroy() {
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.TrafficLights = TrafficLights;
