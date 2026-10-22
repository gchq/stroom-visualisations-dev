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

// Scales and axes for charts, by the type of the field they show

import { axisBottom, axisLeft, format, scaleBand, scaleLinear, scalePow, scaleSqrt, scaleSymlog } from "d3";
import { DATE_TIME, NUMBER, isOrdinal } from "./data.js";
import { formatKey } from "./format.js";
import { currentZone, zonedTimeScale } from "./time.js";

const formatShortNumber = format("~s");

// A scale for a field along a chart, by the field's type: a band for each category of a text field,
// otherwise continuous between `min` and `max` (a date field's in the user's time zone, so that its
// ticks fall on their hours and days, see time.js)
export function fieldScale(type, categories, min, max, range) {
    if (isOrdinal(type)) {
        return scaleBand().domain(categories).range(range).paddingInner(0.15).paddingOuter(0.05);
    }
    const scale = type === DATE_TIME ? zonedTimeScale() : scaleLinear();
    const low = min === null ? 0 : min;
    const high = max === null ? 1 : max;
    // A single value is put in the middle of a small range around it
    const spread = high === low ? (type === DATE_TIME ? 3600000 : Math.max(1, Math.abs(low) * 0.1)) : 0;
    return scale.domain([low - spread, high + spread]).range(range);
}

// A scale for the values bars, areas or lines rise to, from zero (or below it for negative values).
// `kind` is how the values are spread (the settings' scaleYAxis): 'Linear' (the default), or to
// show small values beside large ones, 'Square' (square root), 'Cube' (cube root) or 'Log' (a log
// scale that also takes zero and negative values)
export function valueScale(min, max, range, kind) {
    const low = Math.min(0, min === null ? 0 : min);
    const high = Math.max(0, max === null ? 1 : max);
    return scaleOfKind(kind).domain([low, high === low ? low + 1 : high]).range(range).nice();
}

function scaleOfKind(kind) {
    switch (kind) {
        case "Square":
            return scaleSqrt();
        case "Cube":
            return scalePow().exponent(1 / 3);
        case "Log":
            return scaleSymlog();
        default:
            return scaleLinear();
    }
}

// Cuts text to a number of pixels wide, ending in an ellipsis, by measuring a text element. Gives
// the element a <title> of the whole text when it is cut, so that it can still be read.
function fitText(textElement, text, maxWidth) {
    textElement.textContent = text;
    if (maxWidth <= 0 || textElement.getComputedTextLength() <= maxWidth) {
        return;
    }
    let low = 0;
    let high = text.length;
    while (low < high) {
        const middle = Math.ceil((low + high) / 2);
        textElement.textContent = text.substring(0, middle) + "…";
        if (textElement.getComputedTextLength() <= maxWidth) {
            low = middle;
        } else {
            high = middle - 1;
        }
    }
    textElement.textContent = text.substring(0, low) + "…";
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = text;
    textElement.appendChild(title);
}

// Draws an axis of a scale into an SVG group (a d3 selection), at the bottom or left of a chart.
// `options` are {type, show, datePattern, tickValues, tickFormat}: the field's type, whether the
// axis is shown at all (the settings' displayXAxis/displayYAxis), a d3 time format for a date
// axis's ticks, and optionally which values have ticks and how they are labelled, which a chart
// gives when it knows better (e.g. a heat map's hours and days)
export function drawAxis(group, scale, side, options) {
    // Hidden from screen readers, which would read its labels as a run of words: the chart's
    // description and each data point's name say what they show
    group.attr("class", "vis-axis vis-axis--" + (side === "bottom" ? "x" : "y"))
        .attr("aria-hidden", "true");
    if (options.show === false) {
        group.selectAll("*").remove();
        return;
    }
    const axis = side === "bottom" ? axisBottom(scale) : axisLeft(scale);
    if (isOrdinal(options.type)) {
        axis.tickFormat(value => formatKey(value, options.datePattern));
    } else if (options.type === NUMBER) {
        axis.ticks(side === "bottom" ? 6 : 5).tickFormat(formatShortNumber);
    } else if (options.type === DATE_TIME) {
        // Labelled in the user's time zone, with their 24- or 12-hour clock, or a setting's format
        axis.ticks(6);
        if (options.datePattern) {
            axis.tickFormat(currentZone().label(options.datePattern));
        }
    } else {
        axis.ticks(5).tickFormat(formatShortNumber);
    }
    if (options.tickValues) {
        axis.tickValues(options.tickValues);
    }
    if (options.tickFormat) {
        axis.tickFormat(options.tickFormat);
    }
    group.call(axis);
    group.select(".domain").attr("class", "domain vis-axis__line");
    group.selectAll(".tick line").attr("class", "vis-axis__tick");
    const labels = group.selectAll(".tick text").attr("class", "vis-axis__label");

    // A category's label is cut to the width of its band
    if (side === "bottom" && isOrdinal(options.type) && !options.tickValues) {
        const bandWidth = scale.bandwidth() + scale.step() * scale.paddingInner();
        const label = options.tickFormat || (value => formatKey(value, options.datePattern));
        labels.each(function(value) {
            fitText(this, label(value), bandWidth - 2);
        });
    }
}

// The size an axis takes up beyond the chart, {width, height, overflowRight}, from its drawn
// bounds: overflowRight is how far a bottom axis's last label reaches past the plot's width
export function axisSize(group, plotWidth) {
    const node = group.node();
    if (!node || node.childNodes.length === 0) {
        return { width: 0, height: 0, overflowRight: 0 };
    }
    const box = node.getBBox();
    return {
        width: Math.ceil(box.width),
        height: Math.ceil(box.height),
        overflowRight: plotWidth === undefined ? 0 : Math.max(0, Math.ceil(box.x + box.width - plotWidth))
    };
}
