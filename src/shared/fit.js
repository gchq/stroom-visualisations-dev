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

// Sizing text to fill a box, as the visualisations of one value (RAGStatus, TextValue) write it as
// big as fits

// A character is about this wide, as a share of the font size, in the regular font, when the text
// can't be measured
export const CHARACTER_WIDTH = 0.6;
// A line is this high, as a share of the font size, when the element's can't be read
export const LINE_HEIGHT = 1.2;

// How the text is drawn, as shares of the font size: {characterWidth, lineHeight}. Measured from
// `text` drawn in `element`'s font, with its letter and word spacing and line height, so that text
// spacing a user sets for themselves (WCAG 1.4.12) and the font itself are allowed for; the
// estimates above where it can't be measured (e.g. the element isn't shown). Never less than the
// estimates, so that text that fits them is drawn as it always was
export function textMetricsIn(element, text) {
    const length = Math.max(1, text.length);
    const probe = element.ownerDocument.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position: absolute; visibility: hidden; white-space: pre; font-size: 100px;";
    probe.textContent = text;
    element.appendChild(probe);
    const width = probe.getBoundingClientRect().width;
    const style = element.ownerDocument.defaultView.getComputedStyle(probe);
    const lineHeight = parseFloat(style.lineHeight) / 100;
    probe.remove();
    return {
        characterWidth: width > 0 ? Math.max(CHARACTER_WIDTH, width / (100 * length)) : CHARACTER_WIDTH,
        lineHeight: lineHeight > 0 ? Math.max(LINE_HEIGHT, lineHeight) : LINE_HEIGHT
    };
}

// The estimates, for text that can't be measured
const ESTIMATED = { characterWidth: CHARACTER_WIDTH, lineHeight: LINE_HEIGHT };

// The font size, in pixels, at which a line of `length` characters fits in a box `width` wide
// with `height` for it, between `min` and `max`, its characters and lines as wide and high as
// `metrics` gives (see textMetricsIn)
export function fitFontSize(length, width, height, min, max, metrics = ESTIMATED) {
    const byWidth = width / (Math.max(1, length) * metrics.characterWidth);
    const byHeight = height / metrics.lineHeight;
    return Math.max(min, Math.min(max, byWidth, byHeight));
}

// Wrapped lines fill only so much of their box, as each breaks before a word that doesn't fit
const WRAPPED_FILL = 0.8;

// How to write some text as big as fits in a box: {fontSize, wraps}, on one line, or wrapped over
// several if that makes it bigger. Wrapped, it is no bigger than its longest word fits across the
// box, so a word is never broken (unless it is too long at the smallest size). Its characters and
// lines are as wide and high as `metrics` gives (see textMetricsIn)
export function fitText(text, width, height, min, max, metrics = ESTIMATED) {
    const { characterWidth, lineHeight } = metrics;
    const oneLine = fitFontSize(text.length, width, height, min, max, metrics);
    const longestWord = Math.max(1, ...text.split(/\s+/).map(word => word.length));
    const byArea = Math.sqrt(width * height / (Math.max(1, text.length) * characterWidth * lineHeight)) * WRAPPED_FILL;
    const wrapped = Math.max(min, Math.min(max, byArea, width / (longestWord * characterWidth), height / lineHeight));
    return wrapped > oneLine ? { fontSize: wrapped, wraps: true } : { fontSize: oneLine, wraps: false };
}

// The scale and translation ({k, x, y}) that fit a box of content (`bounds`, {left, top, right,
// bottom}) in the middle of a space `width` by `height`, no bigger than `maxScale` times its own size
// (1 unless given) and no smaller than `minScale` (so that its words can still be read; the rest is
// reached by panning), as the pannable charts (Tree, Force) fit what they draw
export function fitOf(bounds, width, height, minScale, maxScale = 1) {
    const contentWidth = Math.max(1, bounds.right - bounds.left);
    const contentHeight = Math.max(1, bounds.bottom - bounds.top);
    const k = Math.max(minScale, Math.min(maxScale, width / contentWidth, height / contentHeight));
    return {
        k,
        x: width / 2 - k * (bounds.left + bounds.right) / 2,
        y: height / 2 - k * (bounds.top + bounds.bottom) / 2
    };
}

// Some text no longer than `length` characters, ending in an ellipsis if it had to be shortened,
// or '' if there isn't room for even one character and the ellipsis
export function shortened(text, length) {
    if (text.length <= length) {
        return text;
    }
    return length < 2 ? "" : text.slice(0, length - 1).trimEnd() + "…";
}

// Of labels in a row, left to right, as drawn ({left, right} in pixels), the step that keeps every
// `step`th one (from the first) at least `gap` apart: 1 if they all are, and never more than their
// number, so that labels too wide for their place (a narrow chart, or text a user has spaced wider)
// are thinned evenly rather than run into each other. An empty label (0 wide, or not laid out yet)
// runs into nothing
export function labelStep(boxes, gap) {
    for (let step = 1; step < boxes.length; step++) {
        let last = null;
        let apart = true;
        for (let i = 0; i < boxes.length && apart; i += step) {
            if (boxes[i].right > boxes[i].left) {
                apart = last === null || boxes[i].left >= last.right + gap;
                last = boxes[i];
            }
        }
        if (apart) {
            return step;
        }
    }
    return Math.max(1, boxes.length);
}

// After text is drawn at `fontSize` in `element` (on one line, cut off where it doesn't fit), the
// size it fits at: as it was, or smaller by as much as it runs over, as letters drawn small are
// rounded to whole pixels and so may come out wider than measured (see textMetricsIn). Never less
// than `min`
export function shrunkToFit(element, fontSize, min) {
    const over = element.scrollWidth - element.clientWidth;
    if (over <= 0 || element.scrollWidth <= 0) {
        return fontSize;
    }
    return Math.max(min, Math.floor(fontSize * element.clientWidth / element.scrollWidth * 10) / 10);
}
