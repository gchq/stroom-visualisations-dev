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

// Pointing at the nearest point: for a chart whose points are too small to point at (e.g. along a
// line), a transparent area over the plot finds the point nearest the mouse and shows it with
// Stroom's stroom.points (show/hide), as if the mouse were over it. A click near a point selects
// it; a click far from every point is left to stroom.points, as a click on nothing.

import { Delaunay, pointer } from "d3";

// How near a point (in pixels) a click is to select it, rather than nothing
const CLICK_DISTANCE = 20;

export class NearestPoint {

    // `plot` is the plot's group (a d3 selection), to which the area is added; `points()` gives
    // Stroom's stroom.points of the chart, or null; `select(point, event)` selects a point, as a
    // click (`event`) asks
    constructor(plot, points, select) {
        this.plot = plot;
        this.points = points;
        this.elements = [];
        this.delaunay = null;
        this.area = plot.append("rect")
            .attr("class", "vis-nearest")
            .on("pointermove", event => this.show(event))
            .on("pointerleave", () => this.hide())
            .on("click", event => {
                const point = this.find(event);
                if (point !== null && this.distance(event, point) <= CLICK_DISTANCE) {
                    // Dealt with here, so not a click on nothing for stroom.points
                    event.preventDefault();
                    select(point, event);
                }
            });
    }

    // How far (in pixels) the mouse is from a point
    distance(event, point) {
        const [x, y] = pointer(event, this.plot.node());
        return Math.hypot(x - point.__data__.x, y - point.__data__.y);
    }

    // After drawing: the plot's size, and the point elements, each with its position in the
    // plot's pixels as its datum's {x, y}. The area is kept on top
    update(width, height, elements) {
        this.area.attr("width", width).attr("height", height).raise();
        this.elements = elements;
        this.delaunay = elements.length > 0
            ? Delaunay.from(elements, element => element.__data__.x, element => element.__data__.y)
            : null;
    }

    // The point nearest the mouse, or null if there are none
    find(event) {
        if (this.delaunay === null) {
            return null;
        }
        const [x, y] = pointer(event, this.plot.node());
        return this.elements[this.delaunay.find(x, y)] || null;
    }

    show(event) {
        const point = this.find(event);
        const points = this.points();
        if (point !== null && points && typeof points.show === "function") {
            points.show(point);
        }
    }

    hide() {
        const points = this.points();
        if (points && typeof points.hide === "function") {
            points.hide();
        }
    }
}
