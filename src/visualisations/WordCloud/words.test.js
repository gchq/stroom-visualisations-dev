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

import assert from "node:assert/strict";
import { test } from "node:test";
import { countWords, fontSizes, layoutWords, rotationOf, spiralOf, wordsOf } from "./words.js";

// A word is as wide as 0.6 of its font size a character, and as high as its font size
const measure = (text, fontSize) => ({ width: text.length * fontSize * 0.6, ascent: fontSize * 0.75,
    descent: fontSize * 0.25 });
const level = () => 0;

test("text is split at anything but letters, digits, apostrophes, hyphens and underscores", () => {
    assert.deepEqual(wordsOf("Disk full on web-01.example.com: (retry=3) user_name's", false),
        ["disk", "full", "web-01", "example", "com", "retry", "user_name's"]);
    assert.deepEqual(wordsOf("Line one\nline\ttwo", false), ["line", "one", "line", "two"]);
});

test("words of fewer than three characters are left out, and common words if asked", () => {
    assert.deepEqual(wordsOf("The user was not found in the directory", true), ["user", "directory"]);
    assert.deepEqual(wordsOf("The user was not found", false), ["the", "user", "was", "not", "found"]);
});

test("apostrophes and hyphens at the ends of a word go; letters of any language stay", () => {
    assert.deepEqual(wordsOf("'quoted' -dashed- Größe café", false), ["quoted", "dashed", "größe", "café"]);
});

test("each row's words are counted, the most first, then in alphabetical order", () => {
    const words = countWords([["Disk full"], ["disk error"], ["Error: disk"]]);
    assert.deepEqual(words, [{ text: "disk", weight: 3 }, { text: "error", weight: 2 }, { text: "full", weight: 1 }]);
});

test("a word seen once is kept (the legacy cloud left out every word seen only once)", () => {
    assert.deepEqual(countWords([["unique"]]), [{ text: "unique", weight: 1 }]);
});

test("with a count, each row's words count that many times; rows without a count above zero are left out", () => {
    const words = countWords([["disk", 5], ["disk", "2"], ["error", 0], ["full", -1], ["lost", null], ["gone", "x"]],
        { hasCount: true });
    assert.deepEqual(words, [{ text: "disk", weight: 7 }]);
});

test("not split, the whole text is one word, as it is", () => {
    const words = countWords([["Logon failed", 4], ["Logon failed", 1], ["Logoff", 2]],
        { split: false, hasCount: true });
    assert.deepEqual(words, [{ text: "Logon failed", weight: 5 }, { text: "Logoff", weight: 2 }]);
});

test("rows without text are left out, and only so many words are kept", () => {
    assert.deepEqual(countWords([[null], [""], ["  "], "not a row"]), []);
    assert.equal(countWords([["alpha beta gamma delta"]], { maxWords: 2 }).length, 2);
});

test("font sizes go from the least to the most counted, by the square root of the count", () => {
    const sizes = fontSizes([{ weight: 100 }, { weight: 25 }, { weight: 1 }], 10, 100);
    assert.equal(sizes[0], 100);
    assert.equal(sizes[2], 10);
    assert.equal(sizes[1], 10 + 90 * 4 / 9);
    assert.deepEqual(fontSizes([{ weight: 3 }, { weight: 3 }], 10, 40), [40, 40]);
    assert.deepEqual(fontSizes([], 10, 40), []);
});

test("the most counted word is level, and every word is always turned the same way", () => {
    assert.equal(rotationOf("disk", 0, 20), 0);
    assert.ok([-20, 0, 20].includes(rotationOf("error", 1, 20)));
    assert.equal(rotationOf("error", 1, 20), rotationOf("error", 5, 20));
    assert.equal(rotationOf("error", 1, 0), 0);
});

test("both spirals start in the middle and go out", () => {
    for (const kind of ["archimedean", "rectangular"]) {
        const spiral = spiralOf(kind, 200, 100);
        assert.deepEqual(spiral(0), [0, 0]);
        const far = spiral(2000);
        assert.ok(Math.hypot(far[0], far[1]) > 50, kind);
    }
});

test("laid out, no two words overlap and every word is in the box", () => {
    const words = countWords([["alpha alpha alpha beta beta gamma delta epsilon zeta eta theta iota kappa"]]);
    for (const spiral of ["archimedean", "rectangular"]) {
        const result = layoutWords(words, { width: 400, height: 300, measure, rotate: level, spiral, maxSize: 60 });
        assert.equal(result.left, 0);
        assert.equal(result.words.length, words.length);
        const boxes = result.words.map(word => {
            const height = word.ascent + word.descent;
            return { left: word.x - word.width / 2, right: word.x + word.width / 2, top: word.y - height / 2,
                bottom: word.y + height / 2 };
        });
        for (const box of boxes) {
            assert.ok(box.left >= -200 && box.right <= 200 && box.top >= -150 && box.bottom <= 150, spiral);
        }
        for (let i = 0; i < boxes.length; i++) {
            for (let j = i + 1; j < boxes.length; j++) {
                const a = boxes[i];
                const b = boxes[j];
                assert.ok(!(a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom),
                    spiral + ": " + result.words[i].text + " and " + result.words[j].text);
            }
        }
        // The most counted word is in the middle
        assert.equal(result.words[0].text, "alpha");
        assert.deepEqual([result.words[0].x, result.words[0].y], [0, 0]);
    }
});

test("the same words are laid out the same way each time", () => {
    const words = countWords([["one two three four five six seven eight nine ten"]]);
    const options = { width: 300, height: 200, measure, rotate: (text, index) => rotationOf(text, index, 20),
        maxSize: 40 };
    assert.deepEqual(layoutWords(words, options), layoutWords(words, options));
});

test("words too big to fit are made smaller, and a word too long for the box at the least size is left", () => {
    const words = [{ text: "enormous", weight: 10 }, { text: "big", weight: 5 },
        { text: "x".repeat(100), weight: 1 }];
    const result = layoutWords(words, { width: 200, height: 100, measure, rotate: level, maxSize: 400 });
    assert.equal(result.left, 1);
    assert.deepEqual(result.words.map(word => word.text), ["enormous", "big"]);
    assert.ok(result.words[0].fontSize < 400);
});

test("nothing to lay out", () => {
    assert.deepEqual(layoutWords([], { width: 100, height: 100, measure, rotate: level, maxSize: 40 }),
        { words: [], left: 0 });
});
