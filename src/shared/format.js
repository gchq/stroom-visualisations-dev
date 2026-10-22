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

// Formatting values for people to read, in tooltips, labels and screen reader text

import { format } from "d3";
import { DATE_TIME, NUMBER, isNumber } from "./data.js";
import { currentZone } from "./time.js";

const formatInteger = format(",");
const formatDecimal = format(",.3~f");

// A share (0 to 1) as a percentage for people to read, to one decimal place, e.g. '65.6%'
export function formatShare(share) {
    return (Math.round(share * 1000) / 10).toFixed(1) + "%";
}

// A number with thousands separators and at most three decimal places, e.g. 2,140 or 0.333
export function formatNumber(value) {
    if (!isNumber(value)) {
        return value === null || value === undefined ? "" : String(value);
    }
    return Number.isInteger(value) ? formatInteger(value) : formatDecimal(value);
}

// A date (milliseconds since the epoch) in the user's time zone: in a d3 time format if one is given
// (e.g. a setting's '%Y-%m-%d %H:%M'), otherwise in the user's date-time pattern, as the rest of
// Stroom shows dates (see time.js)
export function formatDate(value, pattern) {
    if (!isNumber(value)) {
        return value === null || value === undefined ? "" : String(value);
    }
    const zone = currentZone();
    return pattern ? zone.label(pattern)(value) : zone.format(value);
}

// A value of a field of a type, a date in the pattern if one is given. A number or date may be given
// as its text (e.g. a legend's key, which is text), and is shown as the number or date it is
export function formatValue(value, type, datePattern) {
    if (type === DATE_TIME) {
        return formatDate(numberOf(value), datePattern);
    }
    if (type === NUMBER) {
        return formatNumber(numberOf(value));
    }
    return value === null || value === undefined ? "" : String(value);
}

// A key of a level of the data (e.g. a series name), which is shown as a date if the settings give
// a date pattern for it and it is a number (or the text of one, as keys are)
export function formatKey(key, datePattern) {
    if (datePattern && isNumber(numberOf(key))) {
        return formatDate(numberOf(key), datePattern);
    }
    return key === null || key === undefined ? "" : String(key);
}

// A value as a number if it is the text of one (e.g. '1760256000000'), otherwise as it is
function numberOf(value) {
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
        return Number(value);
    }
    return value;
}
