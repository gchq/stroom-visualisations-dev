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

// The curves lines and areas take between their points (the settings' Interpolation Mode)

import {
    curveBasis,
    curveBasisClosed,
    curveBasisOpen,
    curveBundle,
    curveCardinal,
    curveCardinalClosed,
    curveCardinalOpen,
    curveLinear,
    curveLinearClosed,
    curveMonotoneX,
    curveStep,
    curveStepAfter,
    curveStepBefore
} from "d3";

// d3 7's curves by the names of d3 3's interpolation modes, which the settings (interpolationMode)
// use. No mode (the settings' blank choice) is straight lines, as it was
const CURVES = {
    "": curveLinear,
    "linear": curveLinear,
    "linear-closed": curveLinearClosed,
    "step": curveStep,
    "step-before": curveStepBefore,
    "step-after": curveStepAfter,
    "basis": curveBasis,
    "basis-open": curveBasisOpen,
    "basis-closed": curveBasisClosed,
    "bundle": curveBundle,
    "cardinal": curveCardinal,
    "cardinal-open": curveCardinalOpen,
    "cardinal-closed": curveCardinalClosed,
    "monotone": curveMonotoneX
};

// The d3 curve of an interpolation mode, or that of `fallback` (a mode) if it isn't set or isn't
// one
export function curveFor(mode, fallback) {
    if (mode === undefined || mode === null || !CURVES[mode]) {
        return CURVES[fallback] || curveLinear;
    }
    return CURVES[mode];
}
