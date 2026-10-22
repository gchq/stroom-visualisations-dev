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
import { filePrefix, folderUuid, nodeFile, safeFileName, writeProperties } from "./content.mjs";

test("a document's file names use its safe name, type and UUID", () => {
    assert.equal(filePrefix("d3.layout.cloud", "Script", "aadec945-38d1-4ddd-8460-ac1b8ff2f469"),
        "d3_layout_cloud.Script.aadec945-38d1-4ddd-8460-ac1b8ff2f469");
    assert.equal(safeFileName("Bar Chart (v2)"), "Bar_Chart__v2_");
    assert.equal(safeFileName("x".repeat(120)).length, 100);
});

test("folder UUIDs are the same every time and differ by path", () => {
    assert.equal(folderUuid("Visualisations"), folderUuid("Visualisations"));
    assert.notEqual(folderUuid("Visualisations"), folderUuid("Visualisations/Version3"));
    assert.match(folderUuid("Visualisations"), /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test("properties are written as Stroom writes them", () => {
    const properties = { uuid: "u", name: " Odd: name=#!\\", path: "/A/B", type: "Folder" };
    assert.equal(writeProperties(properties), "name=\\ Odd\\: name\\=\\#\\!\\\\\npath=/A/B\ntype=Folder\nuuid=u\n");
    assert.equal(writeProperties({ name: "Café" }), "name=Caf\\u00E9\n");
});

test("a node file says it is version 2", () => {
    assert.equal(nodeFile("BarChart", "Visualisation", "u", "/V/BarChart"),
        "name=BarChart\npath=/V/BarChart\ntype=Visualisation\nuuid=u\nversion=V2\n");
});
