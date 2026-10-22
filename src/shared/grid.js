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

// A grid of charts, one for each value of a visualisation's Grid Series field, each with a header
// naming it and a button to zoom in on it (and out again). With one chart there is no header, so
// the chart has all the room.

// The number of columns for some cells, as near square as they can be (as d3-grid lays them out)
export function columnsFor(count) {
    return Math.max(1, Math.ceil(Math.sqrt(count)));
}

const ZOOM_IN_ICON = "<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><path d=\"M2 6V2h4M10 2h4v4M14 10v4h-4M6 "
                     + "14H2v-4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>";
const ZOOM_OUT_ICON = "<svg viewBox=\"0 0 16 16\" aria-hidden=\"true\"><path d=\"M6 2v4H2M14 6h-4V2M10 14v-4h4M2 "
                      + "10h4v4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/></svg>";

export class Grid {

    // `element` is the visualisation's element. `createChart(body)` makes the chart of a cell in
    // its body element, returning {draw(cell), destroy()}.
    constructor(element, createChart) {
        this.createChart = createChart;
        this.container = document.createElement("div");
        this.container.className = "vis-grid";
        element.appendChild(this.container);
        // Each cell by its key, {element, name, zoom, body, chart}
        this.cells = new Map();
        this.zoomedKey = null;
        this.lastCells = [];
    }

    // Lays out the cells, each {key, label, ...} with whatever its chart needs to draw it, and
    // draws each cell's chart (chart.draw(cell)). Cells are kept, by key, from one call to the next.
    update(cells) {
        this.lastCells = cells;
        if (this.zoomedKey !== null && !cells.some(cell => cell.key === this.zoomedKey)) {
            this.zoomedKey = null;
        }
        const shown = this.zoomedKey === null ? cells : cells.filter(cell => cell.key === this.zoomedKey);
        const headed = cells.length > 1;
        this.container.style.gridTemplateColumns = "repeat(" + columnsFor(shown.length) + ", minmax(0, 1fr))";
        this.container.style.gridTemplateRows = "repeat(" + Math.ceil(shown.length / columnsFor(shown.length))
                                                + ", minmax(0, 1fr))";
        this.container.classList.toggle("vis-grid--single", !headed);

        const keys = new Set(shown.map(cell => cell.key));
        for (const [key, cell] of this.cells) {
            if (!keys.has(key)) {
                cell.chart.destroy();
                cell.element.remove();
                this.cells.delete(key);
            }
        }

        shown.forEach((data, index) => {
            let cell = this.cells.get(data.key);
            if (!cell) {
                cell = this.createCell();
                this.cells.set(data.key, cell);
            }
            // In the order given
            if (this.container.children[index] !== cell.element) {
                this.container.insertBefore(cell.element, this.container.children[index] || null);
            }
            cell.header.hidden = !headed;
            cell.name.textContent = data.label;
            cell.name.title = data.label;
            const zoomedIn = this.zoomedKey !== null;
            cell.zoom.innerHTML = zoomedIn ? ZOOM_OUT_ICON : ZOOM_IN_ICON;
            cell.zoom.setAttribute("aria-label", zoomedIn ? "Show all charts" : "Zoom in on " + data.label);
            cell.zoom.title = cell.zoom.getAttribute("aria-label");
            cell.zoom.onclick = () => {
                this.zoomedKey = this.zoomedKey === null ? data.key : null;
                this.update(this.lastCells);
                // The zoom button of the same cell, which is still there either way
                const again = this.cells.get(data.key);
                if (again) {
                    again.zoom.focus();
                }
            };
            // A cell of a grid is a region named by its chart's name. A chart on its own is the
            // whole visualisation, so isn't a region of it (a section without a name isn't one)
            if (headed) {
                cell.element.setAttribute("aria-label", data.label);
            } else {
                cell.element.removeAttribute("aria-label");
            }
        });

        // Drawn once the layout has settled, so that each chart's body has its size
        shown.forEach(data => this.cells.get(data.key).chart.draw(data));
    }

    createCell() {
        const element = document.createElement("section");
        element.className = "vis-grid__cell";
        const header = document.createElement("div");
        header.className = "vis-grid__header";
        const name = document.createElement("span");
        name.className = "vis-grid__name";
        const zoom = document.createElement("button");
        zoom.type = "button";
        zoom.className = "vis-grid__zoom";
        header.append(name, zoom);
        const body = document.createElement("div");
        body.className = "vis-grid__body";
        element.append(header, body);
        return { element, header, name, zoom, body, chart: this.createChart(body) };
    }

    // Redraws every chart at its cell's new size
    resize() {
        this.update(this.lastCells);
    }
}
