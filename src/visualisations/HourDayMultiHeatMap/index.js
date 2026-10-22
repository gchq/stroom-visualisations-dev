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

// Hour and day heat maps: for each series, a cell for each hour, in a column for its hour of the day
// and a row for its day, in the heat colour of its value (see shared/heatMap.js). Every series' map
// has the same days and colours, so that they can be compared. Hours and days are the user's, and the
// values of the same hour are added together. Stroom makes it with
// `new visualisations.HourDayMultiHeatMap()` and calls setData(context, settings, data) with data
// nested as series, then rows of [time, value].

import "../../shared/shared.css";
import { keyOf } from "../../shared/data.js";
import { formatKey } from "../../shared/format.js";
import { daysOf, hourDayGrid } from "../../shared/heat.js";
import { HeatChart } from "../../shared/heatMap.js";
import { currentZone } from "../../shared/time.js";

class HourDayMultiHeatMap extends HeatChart {

    constructor() {
        super("series");
    }

    // The hours and days are the user's (their time zone, see time.js)
    heatMaps() {
        const settings = this.settings;
        const zone = currentZone();
        const series = this.data.values.filter(one => Array.isArray(one.values));
        const rowsOf = one => one.values.filter(Array.isArray);
        const days = daysOf(series.flatMap(one => rowsOf(one).map(row => row[0])), zone);
        return series
            .map(one => ({
                key: keyOf(one),
                label: this.mapLabel(one.key, settings),
                grid: hourDayGrid(rowsOf(one), days, zone)
            }))
            .filter(map => map.grid.cells.length > 0);
    }

    // A series' name, e.g. 'alice', or 'No User' for rows without a value of the series field
    mapLabel(key, settings) {
        const label = formatKey(key, settings.gridSeriesDateFormat);
        if (label !== "") {
            return label;
        }
        return settings.series ? "No " + settings.series : "Heat map";
    }

    // An hour, as the user's time zone has it, e.g. 'Mon 12 Oct 2026, 09:00'
    timeWords(time) {
        return currentZone().label("%a %-d %b %Y, %H:00")(time);
    }

    describeName() {
        return "Heat map of " + this.valueName() + " by hour and day";
    }

    valueName() {
        return this.settings.values || "Value";
    }

    timeName() {
        return this.settings.hours || "Hour";
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.HourDayMultiHeatMap = HourDayMultiHeatMap;
