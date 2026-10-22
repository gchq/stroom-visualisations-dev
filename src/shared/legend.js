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

// A legend of a visualisation's categories (its series, or the values it colours by), each with a
// button that shows or hides that category. It is opened and closed by a 'Show legend' toggle in
// Stroom's toolbar, so it takes no room from the chart until it is wanted.

const LEGEND_BUTTON = "legend";

export class Legend {

    // `element` is the visualisation's element, `toolbar` its Toolbar, and `onChange()` is called
    // when a category is shown or hidden
    constructor(element, toolbar, onChange) {
        this.toolbar = toolbar;
        this.onChange = onChange;
        this.items = [];
        this.hidden = new Set();
        this.open = false;

        this.panel = document.createElement("div");
        this.panel.className = "vis-legend";
        this.panel.setAttribute("role", "group");
        this.panel.setAttribute("aria-label", "Legend");
        this.panel.hidden = true;
        this.panel.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                this.setOpen(false);
            }
        });
        element.insertBefore(this.panel, element.firstChild);
        this.updateToolbar();
    }

    // Sets the categories, each {key, label, colour}, and for a line also its dashes (`dash`, see
    // lines.js lineDash). A category hidden before stays hidden.
    setItems(items) {
        this.items = items;
        const keys = new Set(items.map(item => item.key));
        for (const key of [...this.hidden]) {
            if (!keys.has(key)) {
                this.hidden.delete(key);
            }
        }
        this.render();
    }

    // Whether a category is hidden
    isHidden(key) {
        return this.hidden.has(key);
    }

    // Shows or hides a category, as its button does, e.g. as a setting says
    setHidden(key, hidden) {
        if (hidden) {
            this.hidden.add(key);
        } else {
            this.hidden.delete(key);
        }
        this.render();
    }

    setOpen(open) {
        this.open = open;
        this.panel.hidden = !open;
        this.updateToolbar();
    }

    updateToolbar() {
        this.toolbar.set({ id: LEGEND_BUTTON, title: "Show legend", icon: "TAGS", pressed: this.open },
            pressed => this.setOpen(pressed));
    }

    render() {
        this.panel.replaceChildren(...this.items.map(item => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "vis-legend__item";
            const shown = !this.hidden.has(item.key);
            button.setAttribute("aria-pressed", String(shown));
            button.classList.toggle("vis-legend__item--hidden", !shown);
            button.title = (shown ? "Hide " : "Show ") + item.label;

            // A line's swatch is a short line in its colour and dashes (lines are told apart by both,
            // see lines.js lineDash); any other's a square of its colour
            const swatch = document.createElement("span");
            if (item.dash !== undefined) {
                swatch.className = "vis-legend__swatch vis-legend__swatch--line";
                swatch.innerHTML = "<svg viewBox=\"0 0 24 12\" aria-hidden=\"true\"><line x1=\"0\" y1=\"6\" x2=\"24\" y2=\"6\"/></svg>";
                const line = swatch.querySelector("line");
                line.style.stroke = item.colour;
                if (item.dash) {
                    line.style.strokeDasharray = item.dash;
                }
            } else {
                swatch.className = "vis-legend__swatch";
                swatch.style.backgroundColor = item.colour;
            }
            const label = document.createElement("span");
            label.className = "vis-legend__label";
            label.textContent = item.label;
            button.append(swatch, label);

            button.addEventListener("click", () => {
                if (this.hidden.has(item.key)) {
                    this.hidden.delete(item.key);
                } else {
                    this.hidden.add(item.key);
                }
                this.render();
                // Keep the focus on the same item, which render() replaced
                const again = this.panel.children[this.items.indexOf(item)];
                if (again) {
                    again.focus();
                }
                this.onChange();
            });
            return button;
        }));
    }
}
