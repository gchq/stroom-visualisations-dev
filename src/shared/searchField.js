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

// A Find nodes field, opened and closed by a button in Stroom's toolbar (as the legend is), at the
// top right of the visualisation: what is typed in it highlights the nodes it matches (Force and
// Force 3D, see networkChart.js), fading the rest, and a screen reader is told how many match.
// Enter moves the focus to the first match; Escape clears it and closes it. It takes keys only
// while it has the focus (the legacy network's search took every key on the page, Tab included)

export class SearchField {

    // `chart` has `element`, `toolbar`, `setSearch(text)` and `cells`, each cell having
    // `focusFirstMatch()` and `focusTabStop()`
    constructor(chart) {
        this.chart = chart;
        this.open = false;
        this.panel = document.createElement("div");
        this.panel.className = "vis-search";
        this.panel.hidden = true;
        const label = document.createElement("label");
        label.className = "vis-search__label";
        label.append("Find nodes ");
        this.input = document.createElement("input");
        this.input.type = "search";
        this.input.className = "vis-search__input";
        this.input.autocomplete = "off";
        label.append(this.input);
        this.count = document.createElement("span");
        this.count.className = "vis-search__count";
        this.count.setAttribute("aria-live", "polite");
        this.panel.append(label, this.count);
        chart.element.append(this.panel);

        this.input.addEventListener("input", () => chart.setSearch(this.input.value));
        this.input.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                chart.cells.forEach(cell => cell.focusFirstMatch());
            } else if (event.key === "Escape") {
                event.preventDefault();
                this.input.value = "";
                chart.setSearch("");
                this.setOpen(false);
                chart.cells.forEach(cell => cell.focusTabStop());
            }
        });
        this.updateToolbar();
    }

    setOpen(open) {
        this.open = open;
        this.panel.hidden = !open;
        if (open) {
            this.input.focus();
        }
        this.updateToolbar();
    }

    updateToolbar() {
        this.chart.toolbar.set({ id: "search", title: "Find nodes", icon: "SEARCH", pressed: this.open },
            pressed => this.setOpen(pressed));
    }

    // Says how many nodes match, when something has been typed
    showCount(count) {
        this.count.textContent = this.input.value.trim() === ""
            ? ""
            : count + (count === 1 ? " node matches" : " nodes match");
    }
}
