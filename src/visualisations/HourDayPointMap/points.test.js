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
import { dayPoints } from "./points.js";

const HOUR = 3600000;
const MONDAY = Date.UTC(2026, 9, 12);

test("an event is on its UTC day, across at its time of day in hours, in time order", () => {
    const points = dayPoints([{ key: "alice", label: "alice", rows: [[MONDAY + 33.5 * HOUR, 2], [MONDAY + 9.25 * HOUR, 1]] }]);
    assert.deepEqual(points.get("alice").map(point => [point.day, point.hour]), [
        [MONDAY, 9.25],
        [MONDAY + 24 * HOUR, 9.5]
    ]);
});

test("two events at the same time are both points, and an event without a time is left out", () => {
    const points = dayPoints([{ key: "bob", label: "bob", rows: [[MONDAY, 1], [MONDAY, 2], [null, 3]] }]);
    assert.deepEqual(points.get("bob").map(point => point.id), ["bob~#~" + MONDAY, "bob~#~" + MONDAY + "~1"]);
});
