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

// Panning and zooming what a chart draws (Tree, Force, Bubble, ChordLabels), with the mouse and the
// keyboard alike: the wheel zooms and dragging pans; + and − zoom in and out about the middle, and a
// double click or 0 fits it again. The keys work wherever the focus is in the chart (on its points,
// which don't use them), and a screen reader is told them.

import { zoom, zoomIdentity, zoomTransform } from "d3";
import { transitionMillis } from "./motion.js";

// How much + and − zoom by
const KEY_ZOOM = 1.25;
const TRANSITION_MILLIS = 400;
// What a screen reader is told of the keys
const KEYS_DESCRIPTION = "Plus and minus zoom in and out, and 0 fits it to the visualisation";

// Whether a key press is one of these, whichever keyboard layout gives it
const isZoomIn = event => event.key === "+" || event.key === "=";
const isZoomOut = event => event.key === "-" || event.key === "_" || event.key === "−";
const isFit = event => event.key === "0";

export class PanZoom {

    // `svg` is the chart's svg (a d3 selection), whose `content` (a d3 selection of a g in it) is
    // panned and zoomed; `fit()` fits the content to the chart again, as the chart sees fit (e.g.
    // the identity, or a scale and translation that fit what it drew), and `scaleExtent` is the
    // least and most it can be zoomed
    constructor(svg, content, { fit, scaleExtent = [0.1, 4] }) {
        this.svg = svg;
        this.fitContent = fit;
        this.zoom = zoom()
            .scaleExtent(scaleExtent)
            .on("zoom", event => content.attr("transform", event.transform));
        svg.call(this.zoom)
            // A double click fits the content again, rather than zooming in
            .on("dblclick.zoom", null)
            .on("dblclick.panzoom", () => this.fitContent(true))
            .on("keydown.panzoom", event => this.onKey(event))
            .attr("aria-description", KEYS_DESCRIPTION)
            // What is zoomed in or panned past the edges is cut off there, rather than drawn over the
            // grid's other cells (a chart's svg otherwise lets its axes' labels run over, see
            // shared.css)
            .style("overflow", "hidden");
    }

    onKey(event) {
        if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) {
            return;
        }
        if (isZoomIn(event)) {
            this.svg.transition().duration(transitionMillis(TRANSITION_MILLIS) / 2).call(this.zoom.scaleBy, KEY_ZOOM);
        } else if (isZoomOut(event)) {
            this.svg.transition().duration(transitionMillis(TRANSITION_MILLIS) / 2).call(this.zoom.scaleBy, 1 / KEY_ZOOM);
        } else if (isFit(event)) {
            this.fitContent(true);
        } else {
            return;
        }
        event.preventDefault();
    }

    // The scale and translation now
    transform() {
        return zoomTransform(this.svg.node());
    }

    // Sets the scale and translation ({k, x, y}), moving smoothly to it if asked (and the person
    // hasn't asked for less motion)
    apply({ k, x, y }, smoothly) {
        const transform = zoomIdentity.translate(x, y).scale(k);
        if (smoothly) {
            this.svg.transition().duration(transitionMillis(TRANSITION_MILLIS)).call(this.zoom.transform, transform);
        } else {
            this.svg.call(this.zoom.transform, transform);
        }
    }

    // Pans a point of the content ([x, y], with `reach` {x, y} of it to keep in view either side)
    // into the middle if it is out of the `size` {width, height} of the chart, e.g. a point
    // reached from the keyboard
    bringIntoView([x, y], reach, size) {
        const transform = this.transform();
        const screenX = transform.applyX(x);
        const screenY = transform.applyY(y);
        const halfWidth = transform.k * reach.x;
        const halfHeight = transform.k * reach.y;
        if (screenX - halfWidth < 0 || screenX + halfWidth > size.width
            || screenY - halfHeight < 0 || screenY + halfHeight > size.height) {
            this.svg.call(this.zoom.translateTo, x, y);
        }
    }
}
