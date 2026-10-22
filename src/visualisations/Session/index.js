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

// Sessions: each session, given by its start and end time, a bar along a time axis, each series on
// a row of its own (see shared/timeline.js). Stroom makes it with `new visualisations.Session()`
// and calls setData(context, settings, data) with data nested as grid cell, then series, then rows
// of [start, end].

import "../../shared/shared.css";
import { sessionsFromSpans } from "../../shared/sessions.js";
import { TimelineChart } from "../../shared/timeline.js";

class Session extends TimelineChart {

    sessionsFor(rows) {
        return sessionsFromSpans(rows);
    }

    // A session given by its start and end has no events to count
    countsEvents() {
        return false;
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.Session = Session;
