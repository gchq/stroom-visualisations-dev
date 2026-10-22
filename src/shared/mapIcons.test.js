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
import { ICONS, ICON_NAMES, iconOf } from "./mapIcons.js";
import { SHAPES } from "./mapMarkers.js";

test("a value names an icon by its name, in any case", () => {
    assert.equal(iconOf("truck"), "truck");
    assert.equal(iconOf("Truck"), "truck");
    assert.equal(iconOf("  PERSON "), "person");
});

test("FontAwesome 4's names, as the legacy maps took, name the same icons", () => {
    assert.equal(iconOf("male"), "person");
    assert.equal(iconOf("ambulance"), "truck");
    assert.equal(iconOf("fa-truck"), "truck");
    assert.equal(iconOf("fa fa-user"), "person");
    assert.equal(iconOf("building-o"), "building");
    assert.equal(iconOf("envelope-o"), "envelope");
    assert.equal(iconOf("map-marker"), "pin");
});

test("a value that names no icon, or no value, has none", () => {
    assert.equal(iconOf("unicorn"), null);
    assert.equal(iconOf(""), null);
    assert.equal(iconOf(null), null);
    assert.equal(iconOf(undefined), null);
    assert.equal(iconOf(42), null);
    // 'constructor' and the like are no icon's names
    assert.equal(iconOf("constructor"), null);
});

test("no icon has a marker shape's name, so that a shape's name still gives that shape", () => {
    for (const shape of SHAPES) {
        assert.equal(iconOf(shape), null, shape);
    }
});

test("each icon is a path on the 16 by 16 grid", () => {
    for (const name of ICON_NAMES) {
        const path = ICONS[name];
        assert.match(path, /^M/, name);
        assert.doesNotMatch(path, /NaN|undefined/, name);
    }
});
