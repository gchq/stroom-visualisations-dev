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

// A word cloud: the words of some text, each as big as how often it is seen (or, with a Count
// field, how many times its rows count), the most seen in the middle, in a grid of clouds if a Grid
// Series field is chosen. Stroom makes it with `new visualisations.WordCloud()` and calls
// setData(context, settings, data) with data nested as grid cell, then rows of [text, count].
//
// Each word has a colour of the user's palette for it (by a hash, not from the dashboard's colour
// list), darkened or lightened where it is small so that it reads (4.5:1). The words, the most seen
// first, are reachable from the keyboard (Stroom's stroom.points).

import "../../shared/shared.css";
import "./WordCloud.css";
import { select } from "d3";
import { Chart } from "../../shared/chart.js";
import { DARK_BACKGROUND, LIGHT_BACKGROUND } from "../../shared/colour.js";
import { DATE_TIME, keyOf } from "../../shared/data.js";
import { readableColour } from "../../shared/edges.js";
import { formatKey, formatValue } from "../../shared/format.js";
import { inCell } from "../../shared/selection.js";
import { isTrue } from "../../shared/settings.js";
import { countWords, layoutWords, rotationOf } from "./words.js";

// The room around the cloud
const MARGIN = 6;
// The least font size, and the most as a share of the cloud's height
const MIN_FONT_SIZE = 11;
const MAX_FONT_SHARE = 0.3;
// The words are written in this weight, at which text at least this big is large text, which
// needs only 3:1 contrast (as every dashboard colour has) rather than 4.5:1
const FONT_WEIGHT = 600;
const LARGE_TEXT_SIZE = 18.66;
// Words in the regular font unless the Font setting is one of these
const SERIF_FONTS = new Set(["serif", "Serif"]);

class WordCloud extends Chart {

    constructor() {
        super((body, chart) => new WordCloudCell(body, chart), "words");
        // The words are the categories, too many to list, so there is no legend
        this.toolbar.remove("legend");
        // For measuring words before they are drawn
        this.measuring = document.createElement("canvas").getContext("2d");
    }

    // What a word's count is called, e.g. 'Events', or 'Count' when each row counts once
    countName() {
        return this.settings.count || "Count";
    }

    // Works out what each cell of the grid shows and draws them
    redraw() {
        if (!this.hasData()) {
            this.grid.update([]);
            return;
        }
        const settings = this.settings;
        const options = {
            split: isTrue(settings.splitWords, true),
            skipCommon: isTrue(settings.skipCommonWords, true),
            hasCount: Boolean(settings.count),
            maxWords: Number(settings.maxWords) > 0 ? Number(settings.maxWords) : 100
        };
        // A date field's values are counted as they are shown, in the user's date format, not as their
        // milliseconds
        const type = this.data.types[0];
        const asShown = rows => type !== DATE_TIME
            ? rows
            : rows.map(row => Array.isArray(row) ? [formatValue(row[0], type), ...row.slice(1)] : row);
        const cells = this.data.values.filter(cell => Array.isArray(cell.values))
            .map(cell => ({ cell, words: countWords(asShown(cell.values), options) }));
        if (cells.length === 0) {
            cells.push({ cell: { key: null }, words: [] });
        }

        // Each word has a colour of the user's palette for it, the same each time, but not from the
        // dashboard's colour list: there are too many words, and they'd crowd it for the dashboard's
        // other visualisations
        const colourOf = this.colours.unlisted(settings.words);
        this.grid.update(cells.map(({ cell, words }) => ({
            key: keyOf(cell),
            label: formatKey(cell.key, settings.gridSeriesDateFormat) || "Chart",
            words,
            colourOf,
            gridCellCount: cells.length
        })));
    }

    // The font words are written in: the theme's regular font, or a serif one
    fontFamily(element) {
        return SERIF_FONTS.has(this.settings.font) ? "serif" : getComputedStyle(element).fontFamily;
    }

    // How big a word is written at a size, as {width, ascent, descent}
    measure(text, fontSize, fontFamily) {
        this.measuring.font = FONT_WEIGHT + " " + fontSize + "px " + fontFamily;
        const metrics = this.measuring.measureText(text);
        return {
            width: metrics.width,
            ascent: metrics.actualBoundingBoxAscent,
            descent: metrics.actualBoundingBoxDescent
        };
    }
}

// The cloud in one cell of the grid
class WordCloudCell {

    constructor(body, chart) {
        this.chart = chart;
        chart.cells.add(this);
        this.svg = select(body).append("svg").attr("class", "vis-chart vis-word-cloud");
        this.centre = this.svg.append("g");
        // Said where the words would be when there are none (the description says it too)
        this.emptyText = this.svg.append("text")
            .attr("class", "vis-empty")
            .attr("aria-hidden", "true");
        this.highlighted = null;
        this.summary = "Word cloud";
        this.points = typeof stroom !== "undefined" && typeof stroom.points === "function"
            ? stroom.points(this.svg.node(), {
                selector: ".vis-word-cloud__word",
                tooltip: element => this.tooltip(element.__data__),
                highlight: element => {
                    this.highlighted = element;
                    this.showHighlight();
                },
                select: (element, event) => chart.selection.choose(this.selectionItem(element.__data__), event),
                summary: () => this.summary
            })
            : null;
    }

    draw(cell) {
        this.cell = cell;
        const chart = this.chart;
        const settings = chart.settings;
        const node = this.svg.node();
        const width = node.clientWidth || node.parentNode.clientWidth;
        const height = node.clientHeight || node.parentNode.clientHeight;
        if (width <= 0 || height <= 0) {
            return;
        }
        this.centre.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
        this.emptyText
            .attr("x", width / 2)
            .attr("y", height / 2)
            .text(cell.words.length === 0 ? "No data" : "");

        const fontFamily = chart.fontFamily(node);
        const angle = Number(settings.angle);
        const padding = Number(settings.padding);
        const layout = layoutWords(cell.words, {
            width: Math.max(0, width - 2 * MARGIN),
            height: Math.max(0, height - 2 * MARGIN),
            measure: (text, fontSize) => chart.measure(text, fontSize, fontFamily),
            rotate: (text, index) => rotationOf(text, index, angle),
            spiral: settings.spiral === "rectangular" ? "rectangular" : "archimedean",
            padding: padding >= 0 ? padding : 2,
            minSize: MIN_FONT_SIZE,
            maxSize: height * MAX_FONT_SHARE
        });
        this.layout = layout;

        // Each word in its colour, made to read where it isn't large text
        const background = chart.isDarkTheme() ? DARK_BACKGROUND : LIGHT_BACKGROUND;
        const colourOf = word => word.fontSize >= LARGE_TEXT_SIZE
            ? cell.colourOf(word.text)
            : readableColour(cell.colourOf(word.text), background, 4.5);
        const words = this.centre.selectAll("g.vis-word-cloud__item")
            .data(layout.words, word => word.text)
            .join(enter => {
                const item = enter.append("g").attr("class", "vis-word-cloud__item");
                item.append("rect").attr("class", "vis-word-cloud__mark");
                item.append("rect").attr("class", "vis-word-cloud__focus");
                item.append("text").attr("class", "vis-word-cloud__word").attr("text-anchor", "middle");
                return item;
            })
            .attr("transform", word => "translate(" + word.x + "," + word.y + ")rotate(" + word.rotate + ")");
        // The selection's frame, and the focus ring outside it, both round the word's own letters
        // (as measured) and turned with it; the browser's outline would go round the text's line box
        const frame = (selection, gap) => selection
            .attr("x", word => -word.width / 2 - gap)
            .attr("y", word => -(word.ascent + word.descent) / 2 - gap)
            .attr("width", word => word.width + 2 * gap)
            .attr("height", word => word.ascent + word.descent + 2 * gap);
        words.select(".vis-word-cloud__mark").call(frame, 3);
        words.select(".vis-word-cloud__focus").call(frame, 6);
        // The text's baseline, so that the word is in the middle of its box
        words.select("text")
            .attr("y", word => (word.ascent - word.descent) / 2)
            .style("font-size", word => word.fontSize + "px")
            .style("font-family", fontFamily)
            .style("font-weight", FONT_WEIGHT)
            .style("fill", colourOf)
            .text(word => word.text);

        this.summary = this.describe(cell, layout);
        this.showHighlight();
        if (this.points) {
            this.points.refresh();
        }
    }

    // The tooltip of a word, e.g. 'disk', 'Count: 12'
    tooltip(word) {
        const types = this.chart.data.types;
        return {
            title: word.text,
            rows: [[this.chart.countName(), formatValue(word.weight, this.chart.settings.count ? types[1] : "NUMBER")]]
        };
    }

    // What Stroom is told of a selected word
    selectionItem(word) {
        return inCell({ key: word.text, name: word.text }, this.cell);
    }

    // The cloud for a screen reader, e.g. 'Word cloud of Message: 24 words, most seen disk 12', and
    // how many of them had no room, if any
    describe(cell, layout) {
        const settings = this.chart.settings;
        let text = "Word cloud of " + (settings.words || "Text");
        if (cell.gridCellCount > 1) {
            text += ", " + cell.label;
        }
        if (cell.words.length === 0) {
            return text + ": no data";
        }
        const top = cell.words[0];
        const count = settings.count ? this.chart.data.types[1] : "NUMBER";
        text += ": " + cell.words.length + (cell.words.length === 1 ? " word" : " words")
                + ", most " + (settings.count ? "counted " : "seen ") + top.text + " " + formatValue(top.weight, count);
        if (layout.left > 0) {
            text += ", " + layout.left + " with no room to show";
        }
        return text;
    }

    // Marks the selected words, and underlines the word shown (hovered or focused). Words never
    // fade, as faded text doesn't read
    showHighlight() {
        if (!this.cell) {
            return;
        }
        const selection = this.chart.selection;
        const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
        this.centre.selectAll("g.vis-word-cloud__item").each((word, index, nodes) => {
            const item = nodes[index];
            const selected = selection.has(this.selectionItem(word).key);
            item.classList.toggle("vis-word-cloud__item--selected", selected);
            item.classList.toggle("vis-word-cloud__item--shown", item.contains(highlighted));
            // The word is the point stroom.points names, which says it is selected by its class
            const text = item.querySelector(".vis-word-cloud__word");
            if (text) {
                text.classList.toggle("vis-word-cloud__word--selected", selected);
            }
        });
    }

    destroy() {
        if (this.points) {
            this.points.destroy();
        }
        this.chart.cells.delete(this);
        this.svg.remove();
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.WordCloud = WordCloud;
