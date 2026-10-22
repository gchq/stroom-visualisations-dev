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

// A traffic light's lamps: red at the top, amber, then green, as on the road, whichever way round
// the settings' bands go. The housing is dark on either theme, as a real one is, so the lamps have
// the dark theme's status colours, and an unlit lamp is its colour dimmed most of the way to the
// housing

import { mix } from "../../shared/colour.js";
import { AMBER, GREEN, RED, STATUS_COLOURS } from "../../shared/status.js";

export const HOUSING = "#262626";
export const LAMPS = [RED, AMBER, GREEN];
// How far an unlit lamp is dimmed towards the housing
const DIMMED = 0.75;

// The colour of a status's lamp, lit or not
export function lampColour(status, lit) {
    const colour = STATUS_COLOURS.dark[status];
    return lit ? colour : mix(colour, HOUSING, DIMMED);
}
