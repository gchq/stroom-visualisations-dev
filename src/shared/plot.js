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

// Where a chart's plot goes inside its axes

import { axisSize, drawAxis } from "./axis.js";

// The room around a chart's plot, besides its axes
export const MARGIN = { top: 10, right: 14, bottom: 4, left: 4 };

// Draws a chart's axes and works out the plot they leave room for, drawing them twice: once to
// measure how much room they need, then again to fit. `width` and `height` are the chart's size;
// `xScaleFor(range)` and `yScaleFor(range)` make the scales for a range of pixels; `x` and `y` are
// the axes' options for drawAxis ({type, show, datePattern}). Returns {xScale, yScale, left,
// plotWidth, plotHeight}, `left` being where the plot starts (its top is MARGIN.top).
export function fitAxes({ width, height, xAxisGroup, yAxisGroup, xScaleFor, yScaleFor, x, y }) {
    let left = MARGIN.left;
    let bottom = MARGIN.bottom;
    let right = MARGIN.right;
    let fitted = null;
    for (let pass = 0; pass < 2; pass++) {
        const plotWidth = Math.max(1, width - left - right);
        const plotHeight = Math.max(1, height - MARGIN.top - bottom);
        const xScale = xScaleFor([0, plotWidth]);
        const yScale = yScaleFor([plotHeight, 0]);
        yAxisGroup.attr("transform", null);
        drawAxis(yAxisGroup, yScale, "left", y);
        xAxisGroup.attr("transform", "translate(0," + plotHeight + ")");
        drawAxis(xAxisGroup, xScale, "bottom", x);
        fitted = { xScale, yScale, left, plotWidth, plotHeight };
        const xAxis = axisSize(xAxisGroup, plotWidth);
        left = MARGIN.left + axisSize(yAxisGroup).width;
        bottom = MARGIN.bottom + xAxis.height;
        // Room for the last label of the bottom axis, which is centred on its tick
        right = Math.max(MARGIN.right, xAxis.overflowRight + 2);
    }
    return fitted;
}
