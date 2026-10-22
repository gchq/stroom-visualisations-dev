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

// What the charts of series (bar, line, area, scatter) share: the visualisation Stroom makes with
// `new visualisations.<Name>()` and gives its data with setData(context, settings, data), in a
// grid of charts (a cell for each Grid Series value), with Stroom's toolbar, a legend of the
// series, the dashboard's colours and a selection. A chart extends it with its own redraw(),
// which works out what each cell shows and gives the cells to this.grid.update().

import { Colours } from "./colours.js";
import { formatKey } from "./format.js";
import { Grid } from "./grid.js";
import { Legend } from "./legend.js";
import { Look } from "./look.js";
import { Selection } from "./selection.js";
import { Toolbar } from "./toolbar.js";

export class Chart {

    // `createCell(body, chart)` makes the chart of a grid cell in its body element, returning
    // {draw(cell), showHighlight(), destroy()}; `seriesField` is the id of the setting that names
    // the series field, e.g. 'lineSeries'
    constructor(createCell, seriesField) {
        this.element = document.createElement("div");
        this.settings = {};
        this.data = null;
        this.seriesField = seriesField;
        this.toolbar = new Toolbar();
        // The colours of the series (or categories), shared with the dashboard's other visualisations
        this.colours = new Colours(() => this.isDarkTheme(), () => this.redraw());
        this.look = new Look(this.element);
        this.legend = new Legend(this.element, this.toolbar, () => this.redraw());
        // A selected point's name for screen readers says so (stroom.points reads its --selected
        // class), so the points are named again when the selection changes
        this.selection = new Selection(() => this.cells.forEach(cell => {
            cell.showHighlight();
            if (cell.points) {
                cell.points.refresh();
            }
        }));
        // Escape, or a click on nothing, in a chart selects nothing (stroom.points tells of either)
        this.element.addEventListener("vis-clear-selection", () => this.selection.clear());
        // The cells' charts, which add and remove themselves
        this.cells = new Set();
        this.grid = new Grid(this.element, body => createCell(body, this));

        // Stroom changes the theme by changing the element's class, and the colours depend on it
        new MutationObserver(() => this.redraw()).observe(this.element, { attributes: true, attributeFilter: ["class"] });
        // Times are shown in the user's time zone and date-time pattern, which can change
        if (typeof stroom !== "undefined" && typeof stroom.onTimeChanged === "function") {
            stroom.onTimeChanged(() => this.redraw());
        }
    }

    // The entry point from Stroom
    setData(context, settings, data) {
        this.settings = settings || {};
        this.data = data;
        // Stroom can be told of the toolbar's buttons once it has been in touch
        this.toolbar.resend();
        // What was selected and is no longer drawn (e.g. no longer in the data) is selected no more
        this.selection.noteDrawn();
        this.redraw();
        this.selection.keepDrawn();
    }

    resize() {
        this.grid.resize();
    }

    isDarkTheme() {
        return typeof stroom !== "undefined" && typeof stroom.isDarkTheme === "function"
            ? stroom.isDarkTheme()
            : this.element.classList.contains("stroom-theme-dark");
    }

    // Whether there is data to draw: Stroom's data has its values and their types
    hasData() {
        const data = this.data;
        return Boolean(data) && Array.isArray(data.values) && Array.isArray(data.types);
    }

    // The name of a series, by its key: e.g. 'No Host' for rows without a value of the series
    // field (Host), or '' if there is no series field
    seriesLabel(key) {
        const label = formatKey(key, this.settings.seriesDateFormat);
        const field = this.settings[this.seriesField];
        return label === "" && field ? "No " + field : label;
    }

    // Draws the data; each chart has its own
    redraw() {
        this.grid.update([]);
    }
}
