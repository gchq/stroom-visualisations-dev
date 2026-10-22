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

// Working out a word cloud: counting the words of some text, sizing each by its count and laying
// them out round the middle, each where it overlaps no other. The layout has no randomness, so the
// same words are always in the same places

import { hash } from "../../shared/colour.js";
import { isNumber } from "../../shared/data.js";

// Words too common to say anything, left out when the words of some text are counted (as the
// legacy word cloud left them out)
const COMMON_WORDS = new Set(("a about after against all also although among an and are as at be became because "
    + "been between but by can come did do does during each early for form found from had has have he her "
    + "his however i'll i'm in include including into is it it's its late later made many may me more most "
    + "near no non not of on only or other over several she some such than that the their then there these "
    + "they this through to under until use was we were when where which who with you").split(" "));

// A word is at least this long, when text is split into words
const MIN_WORD_LENGTH = 3;

// What words are split at: anything but letters, digits, apostrophes, hyphens and underscores
const WORD_BREAK = /[^\p{L}\p{N}'’_-]+/u;

// The words of some text, in lower case: each at least three characters, without apostrophes or
// hyphens at its ends, and without common words if `skipCommon`
export function wordsOf(text, skipCommon) {
    return String(text).toLowerCase().split(WORD_BREAK)
        .map(word => word.replace(/^['’_-]+|['’_-]+$/g, ""))
        .filter(word => word.length >= MIN_WORD_LENGTH && !(skipCommon && COMMON_WORDS.has(word)));
}

// The words of some rows of [text, count] and how many of each, as [{text, weight}], the most first
// (then in alphabetical order), at most `maxWords` of them. Without a count (`hasCount` false) each
// row counts once. With `split`, each word of the text is counted; otherwise the whole text is one
// word. Rows without text, or with a count that isn't above zero, are left out
export function countWords(rows, { split = true, skipCommon = true, hasCount = false, maxWords = 100 } = {}) {
    const weights = new Map();
    for (const row of rows) {
        if (!Array.isArray(row) || row[0] === null || row[0] === undefined || String(row[0]).trim() === "") {
            continue;
        }
        const count = hasCount ? Number(row[1]) : 1;
        if (hasCount && (row[1] === null || row[1] === "" || !isNumber(count) || count <= 0)) {
            continue;
        }
        const words = split ? wordsOf(row[0], skipCommon) : [String(row[0]).trim()];
        for (const word of words) {
            weights.set(word, (weights.get(word) || 0) + count);
        }
    }
    return [...weights].map(([text, weight]) => ({ text, weight }))
        .sort((a, b) => b.weight - a.weight || (a.text < b.text ? -1 : a.text > b.text ? 1 : 0))
        .slice(0, Math.max(1, maxWords));
}

// The font size of each word, from `min` for the least counted to `max` for the most, by the square
// root of their counts, so that a word's area goes with its count. All the same count, all are `max`
export function fontSizes(words, min, max) {
    if (words.length === 0) {
        return [];
    }
    const most = words[0].weight;
    const least = words[words.length - 1].weight;
    if (most === least) {
        return words.map(() => max);
    }
    const range = Math.sqrt(most) - Math.sqrt(least);
    return words.map(word => min + (max - min) * (Math.sqrt(word.weight) - Math.sqrt(least)) / range);
}

// How a word is turned, in degrees: the most counted (the first) is level, the rest by a step of
// `angle` either way or none, by a hash of the word, so a word is always turned the same way
export function rotationOf(text, index, angle) {
    if (index === 0 || !(angle > 0)) {
        return 0;
    }
    return ((hash(text) % 3) - 1) * angle;
}

// The places to try a word, going out from the middle, as a function from step (0, 1, ...) to
// [x, y]: an Archimedean spiral (round) or a rectangular one, stretched to the shape of the box
export function spiralOf(kind, width, height) {
    const aspect = width / Math.max(1, height);
    if (kind === "rectangular") {
        const dy = 4;
        const dx = dy * aspect;
        let x = 0;
        let y = 0;
        let last = 0;
        return step => {
            // Each step in turn, from where the last one was
            for (; last < step; last++) {
                switch ((Math.sqrt(1 + 4 * last) - 1) & 3) {
                    case 0:
                        x += dx;
                        break;
                    case 1:
                        y += dy;
                        break;
                    case 2:
                        x -= dx;
                        break;
                    default:
                        y -= dy;
                }
            }
            return [x, y];
        };
    }
    return step => {
        const t = step * 0.1;
        return [aspect * t * Math.cos(t), t * Math.sin(t)];
    };
}

// The box of a word `width` wide and `height` high turned by `rotate` degrees, as its width and
// height when level
function turnedSize(width, height, rotate) {
    const radians = rotate * Math.PI / 180;
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    return { width: width * cos + height * sin, height: width * sin + height * cos };
}

// Placed boxes, kept in buckets of a grid, so that only those near a box need be checked for overlaps
class Boxes {

    constructor(size) {
        this.size = size;
        this.buckets = new Map();
    }

    keysOf(box) {
        const keys = [];
        for (let i = Math.floor(box.left / this.size); i <= Math.floor(box.right / this.size); i++) {
            for (let j = Math.floor(box.top / this.size); j <= Math.floor(box.bottom / this.size); j++) {
                keys.push(i + "," + j);
            }
        }
        return keys;
    }

    overlaps(box) {
        for (const key of this.keysOf(box)) {
            for (const other of this.buckets.get(key) || []) {
                if (box.left < other.right && other.left < box.right && box.top < other.bottom && other.top < box.bottom) {
                    return true;
                }
            }
        }
        return false;
    }

    add(box) {
        for (const key of this.keysOf(box)) {
            if (!this.buckets.has(key)) {
                this.buckets.set(key, []);
            }
            this.buckets.get(key).push(box);
        }
    }
}

// Lays out words (from countWords) in a box `width` by `height`, with the middle at 0,0: each at the
// first place on the spiral where it is in the box and overlaps no word before it. `measure(text,
// fontSize)` gives {width, ascent, descent} of a word written at a size, `rotate(text, index)` its
// turn. If not every word fits, the sizes are made smaller and it is tried again, a few times, the
// sizes never below `minSize`. Returns {words: [{text, weight, fontSize, rotate, x, y, ascent,
// descent, width}], left} where `left` is how many words had no room
export function layoutWords(words, { width, height, measure, rotate, spiral = "archimedean", padding = 2,
                                     minSize = 11, maxSize }) {
    let biggest = Math.max(minSize, maxSize);
    // No bigger than lets the most counted word fit across the box, and in its height
    if (words.length > 0) {
        const metrics = measure(words[0].text, 100);
        const across = (width - 2 * padding) * 100 / Math.max(1, metrics.width);
        const down = (height - 2 * padding) * 100 / Math.max(1, metrics.ascent + metrics.descent);
        biggest = Math.max(minSize, Math.min(biggest, across, down));
    }
    let best = null;
    for (let attempt = 0; attempt < 8; attempt++) {
        const result = placeAll(words, fontSizes(words, minSize, biggest), { width, height, measure, rotate, spiral,
            padding });
        if (best === null || result.words.length > best.words.length) {
            best = result;
        }
        if (result.left === 0 || biggest <= minSize) {
            break;
        }
        biggest = Math.max(minSize, biggest * 0.8);
    }
    return best;
}

function placeAll(words, sizes, { width, height, measure, rotate, spiral, padding }) {
    const boxes = new Boxes(32);
    const placed = [];
    words.forEach((word, index) => {
        const fontSize = sizes[index];
        const metrics = measure(word.text, fontSize);
        const turn = rotate(word.text, index);
        const size = turnedSize(metrics.width + 2 * padding, metrics.ascent + metrics.descent + 2 * padding, turn);
        if (size.width > width || size.height > height) {
            return;
        }
        const tryAt = spiralOf(spiral, width, height);
        for (let step = 0; ; step++) {
            const [x, y] = tryAt(step);
            // Both spirals come to a corner each time round, so once one is past the box both ways
            // there is nowhere left in it to try
            if (Math.abs(x) > width && Math.abs(y) > height) {
                return;
            }
            const box = { left: x - size.width / 2, right: x + size.width / 2, top: y - size.height / 2,
                bottom: y + size.height / 2 };
            if (box.left < -width / 2 || box.right > width / 2 || box.top < -height / 2 || box.bottom > height / 2
                || boxes.overlaps(box)) {
                continue;
            }
            boxes.add(box);
            placed.push({ ...word, fontSize, rotate: turn, x, y, width: metrics.width, ascent: metrics.ascent,
                descent: metrics.descent });
            return;
        }
    });
    return { words: placed, left: words.length - placed.length };
}
