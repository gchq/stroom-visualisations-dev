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

// Where a value is on a gauge's dial, which goes round its red, amber and green bands (see
// shared/status.js)

// The dial goes round 270 degrees, from bottom left (its minimum) to bottom right (its maximum)
export const START_ANGLE = -0.75 * Math.PI;
export const END_ANGLE = 0.75 * Math.PI;

// The angle of a value on the dial, in radians clockwise from the top. A value beyond the dial is
// just past its end, so that the pointer shows it is off the scale
export function angleOf(value, dial) {
    const beyond = (END_ANGLE - START_ANGLE) * 0.03;
    if (value < dial.min) {
        return START_ANGLE - beyond;
    }
    if (value > dial.max) {
        return END_ANGLE + beyond;
    }
    return START_ANGLE + (value - dial.min) / (dial.max - dial.min) * (END_ANGLE - START_ANGLE);
}
