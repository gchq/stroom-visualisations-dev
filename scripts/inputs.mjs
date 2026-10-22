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

// Checks a visualisation's typed inputs: the optional `inputs` section of its settings, which
// declares each data field it takes, e.g.
//
//   "inputs": [
//     { "id": "x", "label": "X axis", "description": "Time of each event",
//       "types": ["DATE_TIME"], "required": true, "multiple": false }
//   ]
//
// Each input describes the `field` control of the same id. Stroom uses them to offer only
// compatible fields, mark required ones and convert values by their declared type.

// The types a field's values can have, as Stroom gives them to visualisations
export const INPUT_TYPES = ["TEXT", "NUMBER", "DATE_TIME"];

// The ids of the settings' `field` controls
function fieldControlIds(settings) {
    const ids = [];
    for (const tab of settings.tabs || []) {
        for (const control of tab.controls || []) {
            if (control.type === "field") {
                ids.push(control.id);
            }
        }
    }
    return ids;
}

// Returns the problems with the settings' inputs, empty if there are none. Settings with no
// inputs section have none, as Stroom treats their fields as untyped.
export function checkInputs(settings) {
    if (settings.inputs === undefined) {
        return [];
    }
    if (!Array.isArray(settings.inputs)) {
        return ["'inputs' must be a list"];
    }
    const problems = [];
    const fields = fieldControlIds(settings);
    const seen = new Set();
    settings.inputs.forEach((input, index) => {
        const where = "inputs[" + index + "]" + (input && input.id ? " ('" + input.id + "')" : "");
        if (input === null || typeof input !== "object") {
            problems.push(where + " must be an object");
            return;
        }
        if (typeof input.id !== "string" || input.id === "") {
            problems.push(where + " has no id");
        } else if (seen.has(input.id)) {
            problems.push(where + " repeats an id");
        } else if (!fields.includes(input.id)) {
            problems.push(where + " has no field control with its id");
        }
        seen.add(input.id);
        if (typeof input.label !== "string" || input.label === "") {
            problems.push(where + " has no label");
        }
        if (input.description !== undefined && typeof input.description !== "string") {
            problems.push(where + " has a description that isn't text");
        }
        if (!Array.isArray(input.types) || input.types.length === 0) {
            problems.push(where + " has no types");
        } else {
            for (const type of input.types) {
                if (!INPUT_TYPES.includes(type)) {
                    problems.push(where + " has the unknown type '" + type + "' (expected one of "
                                  + INPUT_TYPES.join(", ") + ")");
                }
            }
        }
        for (const flag of ["required", "multiple"]) {
            if (input[flag] !== undefined && typeof input[flag] !== "boolean") {
                problems.push(where + " has a '" + flag + "' that isn't true or false");
            }
        }
    });
    for (const id of fields) {
        if (!seen.has(id)) {
            problems.push("the field control '" + id + "' has no input");
        }
    }
    return problems;
}
