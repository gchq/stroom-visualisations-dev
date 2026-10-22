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

// Reading a visualisation's settings, which Stroom gives as text

// Whether a settings value is true, as Stroom's settings give 'True' and 'False', or `otherwise` if
// it isn't set
export function isTrue(value, otherwise) {
    if (value === undefined || value === null || value === "") {
        return otherwise;
    }
    return String(value).toLowerCase() === "true";
}

// A number setting as a number within a range, or `defaultValue` if it isn't one
export function settingNumber(value, defaultValue, min, max) {
    const number = value === null || value === undefined || value === "" ? NaN : Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : defaultValue;
}
