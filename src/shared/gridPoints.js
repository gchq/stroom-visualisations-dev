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

// The keyboard for a grid of cells that each show one value (Gauge, RAGStatus, TrafficLights,
// TextValue): rather than each cell being a tab stop of its own, the grid is one, the arrow keys
// going from cell to cell (Stroom's stroom.points over the whole visualisation), and its name for
// screen readers says what all its cells show. Each cell owns its one point, whose tooltip and name
// are the cell's.

export class GridPoints {

    // `chart` is the visualisation (a Chart), `selector` finds the cells' points in it, and
    // `summary()` gives the grid's name for screen readers
    constructor(chart, selector, summary) {
        // Each point's cell drawing, which gives its tooltip and name
        this.owners = new WeakMap();
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(chart.element, {
                selector,
                tooltip: point => this.owners.has(point) ? this.owners.get(point).tooltip() : null,
                label: point => this.owners.has(point) ? this.owners.get(point).summary : null,
                summary
            })
            : null;
    }

    // A cell drawing's point: `cell` gives its tooltip (tooltip()) and name (summary)
    own(point, cell) {
        this.owners.set(point, cell);
    }

    // After a cell has drawn: the points are found and named again
    refresh() {
        if (this.points) {
            this.points.refresh();
        }
    }
}
