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
import { treemapDice, treemapSquarify } from "d3";
import { HEADER_HEIGHT, layoutBoxes, tilingFor } from "./boxes.js";

const SERIES = [
    { key: "web-01", label: "web-01", rows: [["404", 100], ["200 OK", 300]] },
    { key: "db-01", label: "db-01", rows: [["200 OK", 600]] }
];
const area = box => (box.x1 - box.x0) * (box.y1 - box.y0);

test("the settings' modes are d3 7's tilings, squarify if not one", () => {
    assert.equal(tilingFor("dice"), treemapDice);
    assert.equal(tilingFor("squarify"), treemapSquarify);
    assert.equal(tilingFor(undefined), treemapSquarify);
});

test("each series is a block with a header, holding its boxes, biggest first, sized by value", () => {
    const { blocks, boxes } = layoutBoxes(SERIES, true, "squarify", 400, 300);
    assert.deepEqual(blocks.map(block => block.key), ["db-01", "web-01"]);
    const webBoxes = boxes.filter(box => box.seriesKey === "web-01");
    assert.deepEqual(webBoxes.map(box => [box.row[0], box.rank, box.of]), [["200 OK", 0, 2], ["404", 1, 2]]);
    assert.ok(Math.abs(area(webBoxes[0]) / area(webBoxes[1]) - 3) < 0.01);
    const web = blocks.find(block => block.key === "web-01");
    for (const box of webBoxes) {
        assert.ok(box.y0 >= web.y0 + HEADER_HEIGHT - 0.01 && box.x0 >= web.x0 && box.x1 <= web.x1 && box.y1 <= web.y1);
    }
});

test("without blocks, every box shares the space, ranked together", () => {
    const { blocks, boxes } = layoutBoxes(SERIES, false, "squarify", 400, 300);
    assert.deepEqual(blocks, []);
    assert.deepEqual(boxes.map(box => [box.seriesKey, box.rank]), [["db-01", 0], ["web-01", 1], ["web-01", 2]]);
});

test("only values above zero, with a name, are boxes", () => {
    const { boxes } = layoutBoxes([{ key: "", label: "", rows: [["a", 0], ["b", -1], ["c", null], [null, 2], ["d", 5]] }],
        false, "squarify", 100, 100);
    assert.deepEqual(boxes.map(box => box.row[0]), ["d"]);
});

test("two rows of a series with the same name are both boxes, with ids of their own", () => {
    const { boxes } = layoutBoxes([{ key: "s", label: "S", rows: [["a", 1], ["a", 1]] }], true, "squarify", 100, 100);
    assert.deepEqual(boxes.map(box => box.id), ["s~#~a", "s~#~a~1"]);
});

test("nothing to lay out", () => {
    assert.deepEqual(layoutBoxes([], true, "squarify", 100, 100), { blocks: [], boxes: [] });
    assert.deepEqual(layoutBoxes(SERIES, true, "squarify", 0, 100), { blocks: [], boxes: [] });
});
