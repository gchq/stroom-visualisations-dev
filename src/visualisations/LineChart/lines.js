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

// A line chart's state counting

// State counting (the Counting tab): a series' rows, whose Y values are text saying a state was
// entered (`openText`, e.g. 'Increment') or left (`closeText`), as rows of how many are open after
// each one, in order of X (a number or time; text X is kept in the data's order, as it has no order
// of its own to sort by). Other text leaves the count as it was.
export function stateCounts(rows, openText, closeText) {
    let count = 0;
    const numeric = rows.every(row => typeof row[0] === "number");
    return [...rows]
        .sort((a, b) => numeric ? a[0] - b[0] : 0)
        .map(row => {
            const state = row[1] === null || row[1] === undefined ? "" : String(row[1]);
            if (state === openText) {
                count++;
            } else if (state === closeText) {
                count--;
            }
            return [row[0], count];
        });
}
