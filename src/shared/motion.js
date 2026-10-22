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

// Animation that respects the system's setting for less motion (prefers-reduced-motion, WCAG 2.3.3)

// Whether the person has asked their system for less motion
export function prefersReducedMotion(view = typeof window === "undefined" ? undefined : window) {
    return Boolean(view && typeof view.matchMedia === "function"
                   && view.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// How long a transition of a chart should take: the length asked for, or none at all for someone
// who has asked for less motion, so that the chart changes at once
export function transitionMillis(millis, view) {
    return prefersReducedMotion(view) ? 0 : millis;
}
