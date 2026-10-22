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

// The finish the visualisations share: shapes glow in their own colours on the dark theme (with a
// soft shadow on the light theme, where a glow looks muddy, see look.css), and areas fade from
// their colour at the top to almost nothing at the bottom.
//
// It is a hidden <svg> of definitions (the glow filters and fade gradients) in the visualisation's
// element, which any of its charts' SVG can refer to by id, e.g. fill: url(#...).

const SVG_NS = "http://www.w3.org/2000/svg";

// The glow of a group of shapes, its region relative to the group
export const GLOW_ID = "vis-glow";
// The glow of a line, whose region is the whole chart, as a flat line's bounds are too thin for the
// glow to show above and below it
export const LINE_GLOW_ID = "vis-glow-line";

// How strong the glow's tight halo and wide soft layer are (1 being as strong as the shape)
const GLOW_TIGHT_STRENGTH = "0.7";
const GLOW_WIDE_STRENGTH = "0.7";

function svgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
        element.setAttribute(key, value);
    }
    return element;
}

// A filter that glows in the shape's own colour: a tight halo and a wide soft one (each a fainter
// blur of the shape), under the shape
function glowFilter(id, region, tightBlur, wideBlur) {
    const filter = svgElement("filter", { id, "color-interpolation-filters": "sRGB", ...region });
    filter.appendChild(svgElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: tightBlur, result: "tightBlur" }));
    const tight = svgElement("feComponentTransfer", { in: "tightBlur", result: "tight" });
    tight.appendChild(svgElement("feFuncA", { type: "linear", slope: GLOW_TIGHT_STRENGTH }));
    filter.appendChild(tight);
    filter.appendChild(svgElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: wideBlur, result: "wideBlur" }));
    const wide = svgElement("feComponentTransfer", { in: "wideBlur", result: "wide" });
    wide.appendChild(svgElement("feFuncA", { type: "linear", slope: GLOW_WIDE_STRENGTH }));
    filter.appendChild(wide);
    const merge = svgElement("feMerge", {});
    for (const input of ["wide", "tight", "SourceGraphic"]) {
        merge.appendChild(svgElement("feMergeNode", { in: input }));
    }
    filter.appendChild(merge);
    return filter;
}

export class Look {

    // `element` is the visualisation's element, which the definitions are put in
    constructor(element) {
        const svg = svgElement("svg", { class: "vis-look", width: 0, height: 0, "aria-hidden": "true", focusable: "false" });
        this.defs = svgElement("defs", {});
        svg.appendChild(this.defs);
        // A shape's glow: wide for thin bars and tall enough for short ones
        this.defs.appendChild(glowFilter(GLOW_ID, { x: "-100%", y: "-40%", width: "300%", height: "180%" }, 2, 6));
        // A line's glow: the whole chart (userSpaceOnUse percentages are of the chart's size)
        this.defs.appendChild(glowFilter(LINE_GLOW_ID,
            { filterUnits: "userSpaceOnUse", x: "-10%", y: "-10%", width: "120%", height: "120%" }, 1.5, 5));
        element.appendChild(svg);
        this.gradients = new Set();
    }

    // The fill of an area of a colour: a gradient from the colour, faint, at the top to almost
    // nothing at the bottom of the area, under a line of the colour that stands out from it. With
    // `upwards`, for an area that hangs down from its line (e.g. below zero), the other way up
    fadeFill(colour, upwards) {
        const id = "vis-fade-" + (upwards ? "up-" : "") + String(colour).replace(/[^a-zA-Z0-9]/g, "");
        if (!this.gradients.has(id)) {
            const gradient = svgElement("linearGradient", { id, x1: "0", y1: upwards ? "1" : "0", x2: "0", y2: upwards ? "0" : "1" });
            gradient.appendChild(svgElement("stop", { offset: "0", "stop-color": colour, "stop-opacity": "0.45" }));
            gradient.appendChild(svgElement("stop", { offset: "1", "stop-color": colour, "stop-opacity": "0.04" }));
            this.defs.appendChild(gradient);
            this.gradients.add(id);
        }
        return "url(#" + id + ")";
    }

    // The fill of a ring's slice of a colour (e.g. a doughnut's), centred on the ring's centre: from
    // almost nothing at the inner radius to the colour, faint, at the outer, under a line of the
    // colour that stands out from it
    ringFadeFill(colour, innerRadius, outerRadius) {
        const r = Math.max(1, Math.round(outerRadius));
        const inner = Math.max(0, Math.min(1, innerRadius / outerRadius));
        const id = "vis-ring-" + String(colour).replace(/[^a-zA-Z0-9]/g, "") + "-" + r + "-" + Math.round(inner * 100);
        if (!this.gradients.has(id)) {
            const gradient = svgElement("radialGradient", { id, gradientUnits: "userSpaceOnUse", cx: "0", cy: "0", r: String(r) });
            gradient.appendChild(svgElement("stop", { offset: String(inner), "stop-color": colour, "stop-opacity": "0.06" }));
            gradient.appendChild(svgElement("stop", { offset: "1", "stop-color": colour, "stop-opacity": "0.5" }));
            this.defs.appendChild(gradient);
            this.gradients.add(id);
        }
        return "url(#" + id + ")";
    }
}

// Whether the settings choose the Outline fill style ('fillStyle'): each shape a line of its colour
// around a faint fade of it, rather than solid
export function isOutlineStyle(settings) {
    return settings !== null && settings !== undefined && String(settings.fillStyle).toLowerCase() === "outline";
}
