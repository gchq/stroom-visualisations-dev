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

// A series session map: each series' events joined into sessions (shared/sessions.js), each a bar
// along a time axis, each series on a row of its own (see shared/timeline.js). Events closer than
// the threshold are a session, which stays open the threshold after its last event; with a Session
// State field, an event of the start text opens a session that waits for one of the stop text.
// Stroom makes it with `new visualisations.SeriesSessionMap()` and calls
// setData(context, settings, data) with data nested as grid cell, then series, then rows of
// [time, state].

import "../../shared/shared.css";
import { sessionsOf, thresholdOf } from "../../shared/sessions.js";
import { TimelineChart } from "../../shared/timeline.js";

class SeriesSessionMap extends TimelineChart {

    sessionsFor(rows) {
        const settings = this.settings;
        const threshold = thresholdOf(settings.thresholdMs);
        const withStates = Boolean(settings.stateChange);
        return sessionsOf(rows, {
            threshold,
            tail: threshold,
            openText: withStates ? settings.openSessionText || "Start" : null,
            closeText: withStates ? settings.closeSessionText || "Stop" : null
        });
    }
}

// The name Stroom knows the visualisation by (its functionName)
window.visualisations = window.visualisations || {};
window.visualisations.SeriesSessionMap = SeriesSessionMap;
