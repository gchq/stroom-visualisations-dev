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
import { prefersReducedMotion, transitionMillis } from "./motion.js";

// A window whose system asks, or doesn't ask, for less motion
const view = reduce => ({
    matchMedia: query => ({ matches: reduce && query === "(prefers-reduced-motion: reduce)" })
});

test("transitions take their time unless less motion is asked for", () => {
    assert.equal(transitionMillis(300, view(false)), 300);
    assert.equal(transitionMillis(300, view(true)), 0);
});

test("without a window or matchMedia there is no preference", () => {
    assert.equal(prefersReducedMotion(undefined), false);
    assert.equal(prefersReducedMotion({}), false);
    assert.equal(prefersReducedMotion(view(true)), true);
});
