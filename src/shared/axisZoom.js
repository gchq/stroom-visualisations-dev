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

// A chart's X axis that zooms (Scatter, LineChart): dragging along the axis chooses the span of it
// the chart shows (a window, see window.js), double-clicking it shows all of it again, and from the
// keyboard the axis is a slider, moved and resized with the keys TimeSeries's overview has
// (windowForKey). While zoomed, a note at the top of the plot says what is shown. Only a number or
// time axis zooms. The chart keeps the windows (window.js's ZoomWindows) and draws with them.

import "./axisZoom.css";
import { brushX } from "d3";
import { axisSize } from "./axis.js";
import { windowForKey } from "./window.js";

// The least height of the strip along the axis that is dragged, e.g. when the axis isn't shown
const MIN_STRIP_HEIGHT = 14;
// A drag narrower than this (in pixels) is taken for a click, and chooses nothing
const MIN_DRAG = 3;

export class AxisZoom {

    // `plot` is the chart's plot group (the axis's group is in it, at the plot's bottom), and
    // `onChoose(window)` is called with the window chosen, null for all of the axis
    constructor(plot, onChoose) {
        this.onChoose = onChoose;
        this.state = null;
        this.note = plot.append("text").attr("class", "vis-axis-zoom__note").attr("aria-hidden", "true");
        this.group = plot.append("g")
            .attr("class", "vis-axis-zoom")
            .attr("role", "slider")
            .on("keydown", event => this.onKey(event));
        this.frame = this.group.append("rect").attr("class", "vis-axis-zoom__frame");
        this.brush = brushX().on("end", event => this.onBrushEnd(event));
        this.brushGroup = this.group.append("g").attr("class", "vis-axis-zoom__brush").attr("aria-hidden", "true");
        this.brushGroup.on("dblclick", () => this.onChoose(null));
    }

    // Places the axis's strip and says what it shows. `extent` is all of the axis ([min, max]), or
    // null if it doesn't zoom (an axis of text, or no data); `window` the part shown, or null for
    // all of it; `scale` the X scale drawn; `axisGroup` the axis's group; `name` the axis's name
    // (e.g. 'Duration'); and `words(value)` a value of the axis in words
    update({ extent, window, scale, axisGroup, plotWidth, plotHeight, name, words }) {
        const zooms = extent !== null && extent[1] > extent[0];
        this.state = zooms ? { extent, window, scale } : null;
        this.group
            .style("display", zooms ? null : "none")
            .attr("tabindex", zooms ? 0 : null)
            .attr("aria-label", name + " axis zoom");
        const shown = window || extent;
        this.note
            .attr("x", plotWidth)
            .attr("y", 0)
            .text(zooms && window !== null ? "Zoomed: " + words(shown[0]) + " to " + words(shown[1]) : "");
        if (!zooms) {
            return;
        }
        const stripHeight = Math.max(MIN_STRIP_HEIGHT, axisSize(axisGroup, plotWidth).height);
        this.frame
            .attr("y", plotHeight)
            .attr("width", plotWidth)
            .attr("height", stripHeight);
        this.brush.extent([[0, plotHeight], [plotWidth, plotHeight + stripHeight]]);
        this.brushGroup.call(this.brush);
        this.brushGroup.call(this.brush.clear);
        const where = window === null
            ? "Showing all, " + words(shown[0]) + " to " + words(shown[1]) + ". Up zooms in"
            : "Showing " + words(shown[0]) + " to " + words(shown[1])
              + ". Arrow keys move it, Up and Down zoom in and out, Escape shows all";
        this.group
            .attr("aria-valuemin", extent[0])
            .attr("aria-valuemax", extent[1])
            .attr("aria-valuenow", shown[0])
            .attr("aria-valuetext", where);
    }

    // A drag along the axis ended: the chart shows the span dragged over
    onBrushEnd(event) {
        if (!event.sourceEvent || !event.selection || this.state === null) {
            return;
        }
        const [x0, x1] = event.selection;
        this.brushGroup.call(this.brush.clear);
        if (x1 - x0 < MIN_DRAG) {
            return;
        }
        const scale = this.state.scale;
        this.onChoose([+scale.invert(x0), +scale.invert(x1)]);
    }

    // A key on the axis moves or resizes the window (Escape only when zoomed, so that otherwise it
    // does what it would anyway)
    onKey(event) {
        if (this.state === null) {
            return;
        }
        const { extent, window } = this.state;
        if (event.key === "Escape" && window === null) {
            return;
        }
        const next = windowForKey(event.key, window, extent);
        if (next === null) {
            return;
        }
        event.preventDefault();
        this.onChoose(next);
    }
}
