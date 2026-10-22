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

// Colours made to stand out from the background: a word's colour made readable (4.5:1), and the edge
// that a pale shape (e.g. a heat map's lowest cells, or a deep level of a tree shaded towards the
// background) is given so that it still shows (3:1, WCAG 1.4.11), in a deeper shade of its own colour
// so that its colour still says what it does. Kept apart from colour.js, which is the same as
// Stroom's own colour code.

import { contrast, mix } from "./colour.js";

// The contrast a shape needs against the background to show (WCAG 1.4.11)
export const SHAPE_CONTRAST = 3;

// A colour made dark or light enough (mixed towards black on a light background, white on a dark)
// to have at least `ratio` contrast against the background; colours are '#rrggbb'
export function readableColour(colour, background, ratio) {
    const towards = contrast(background, "#000000") >= contrast(background, "#ffffff") ? "#000000" : "#ffffff";
    for (let amount = 0; amount <= 1; amount += 0.05) {
        const mixed = mix(colour, towards, Math.min(1, amount));
        if (contrast(mixed, background) >= ratio) {
            return mixed;
        }
    }
    return towards;
}

// The edge a shape filled with a colour needs to show against the background: none (null) if the
// colour shows by itself, otherwise a deeper shade of it that does
export function edgeColour(fill, background) {
    if (!fill || contrast(fill, background) >= SHAPE_CONTRAST) {
        return null;
    }
    return readableColour(fill, background, SHAPE_CONTRAST);
}
