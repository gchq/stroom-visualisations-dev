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

// A day and week heat map: a cell for each day, in a column for its week (from Monday) and a row
// for its day of the week, in the heat colour of its value (see shared/heatMap.js). Days are the
// user's days, and the values of the same day are added together. Stroom makes it with
// `new visualisations.DayWeekHeatMap()` and calls setData(context, settings, data) with data as
// rows of [time, value].

import "../../shared/shared.css";
import { dayWeekGrid } from "../../shared/heat.js";
import { HeatChart } from "../../shared/heatMap.js";
import { currentZone } from "../../shared/time.js";

class DayWeekHeatMap extends HeatChart {

    constructor() {
        super(null);
    }

    // The days and weeks are the user's (their time zone, see time.js)
    heatMaps() {
        const rows = this.data.values.filter(Array.isArray);
        const grid = dayWeekGrid(rows, currentZone());
        return grid.cells.length === 0 ? [] : [{ key: "", label: "Heat map", grid }];
    }

    // A day, as the user's time zone has it, e.g. 'Mon 12 Oct 2026'
    timeWords(time) {
        return currentZone().label("%a %-d %b %Y")(time);
    }

    describeName() {
        return "Heat map of " + this.valueName() + " by day and week";
    }

    valueName() {
        return this.settings.values || "Value";
    }

    timeName() {
        return this.settings.days || "Day";
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.DayWeekHeatMap = DayWeekHeatMap;
