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

// Checks the keys a visualisation's selections have: the optional `selection` section of its
// settings, e.g.
//
//   "selection": [
//     { "key": "series", "label": "Series" },
//     { "key": "x", "label": "Time", "type": "DATE_TIME" }
//   ]
//
// Stroom offers each key to dashboards' selection handlers as `${component.<id>.selection.<key>}`
// (or `name` and `value`, if the section is left out). A key's type is left out when its values'
// type depends on the fields chosen. src/shared/selectionItems.test.js checks the keys against what
// the visualisation tells Stroom of a selected item.

import { INPUT_TYPES } from "./inputs.mjs";

// The key each item has to say which it is, which no selection handler can use
const ITEM_KEY = "key";

// Returns the problems with the settings' selection keys, empty if there are none
export function checkSelection(settings) {
    if (settings.selection === undefined) {
        return [];
    }
    if (!Array.isArray(settings.selection)) {
        return ["'selection' must be a list"];
    }
    const problems = [];
    const seen = new Set();
    settings.selection.forEach((selectionKey, index) => {
        const where = "selection[" + index + "]"
                      + (selectionKey && selectionKey.key ? " ('" + selectionKey.key + "')" : "");
        if (selectionKey === null || typeof selectionKey !== "object") {
            problems.push(where + " must be an object");
            return;
        }
        const key = selectionKey.key;
        if (typeof key !== "string" || key === "") {
            problems.push(where + " has no key");
        } else if (/\s/.test(key)) {
            // Stroom leaves such a key out, as no parameter could name it
            problems.push(where + " has a key with a space in it");
        } else if (key === ITEM_KEY) {
            problems.push(where + " is the key that says which item is selected, which no selection "
                          + "handler can use");
        } else if (seen.has(key)) {
            problems.push(where + " repeats a key");
        }
        seen.add(key);
        if (typeof selectionKey.label !== "string" || selectionKey.label === "") {
            problems.push(where + " has no label");
        }
        if (selectionKey.type !== undefined && !INPUT_TYPES.includes(selectionKey.type)) {
            problems.push(where + " has the unknown type '" + selectionKey.type + "' (expected one of "
                          + INPUT_TYPES.join(", ") + ")");
        }
    });
    return problems;
}
