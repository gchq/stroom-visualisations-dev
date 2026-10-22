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

// A character is about this wide, as a share of the font size, in the regular font
const CHARACTER_WIDTH = 0.6;
// A line is this high, as a share of the font size
const LINE_HEIGHT = 1.2;

// The font size, in pixels, at which a line of `length` characters fits in a box `width` wide
// with `height` for it, between `min` and `max`
export function fitFontSize(length, width, height, min, max) {
    const byWidth = width / (Math.max(1, length) * CHARACTER_WIDTH);
    const byHeight = height / LINE_HEIGHT;
    return Math.max(min, Math.min(max, byWidth, byHeight));
}

// Wrapped lines fill only so much of their box, as each breaks before a word that doesn't fit
const WRAPPED_FILL = 0.8;

// How to write some text as big as fits in a box: {fontSize, wraps}, on one line, or wrapped over
// several if that makes it bigger. Wrapped, it is no bigger than its longest word fits across the
// box, so a word is never broken (unless it is too long at the smallest size)
export function fitText(text, width, height, min, max) {
    const oneLine = fitFontSize(text.length, width, height, min, max);
    const longestWord = Math.max(1, ...text.split(/\s+/).map(word => word.length));
    const byArea = Math.sqrt(width * height / (Math.max(1, text.length) * CHARACTER_WIDTH * LINE_HEIGHT)) * WRAPPED_FILL;
    const wrapped = Math.max(min, Math.min(max, byArea, width / (longestWord * CHARACTER_WIDTH), height / LINE_HEIGHT));
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
