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

// The buttons a visualisation shows in Stroom's toolbar above it (vis.js's
// stroom.setToolbarButtons), gathered from the parts of the visualisation that want one, e.g. the
// legend's 'Show legend' toggle

// Whether this Stroom can show a visualisation's buttons in its toolbar
export function hasHostToolbar() {
    return typeof stroom !== "undefined" && typeof stroom.setToolbarButtons === "function";
}

export class Toolbar {

    constructor() {
        // Each button by its id, {button: {id, title, icon, pressed, enabled}, onPress}, in the order added
        this.buttons = new Map();
        this.lastSent = null;
    }

    // Adds a button, or changes one with the same id. `button` is {id, title, icon, pressed,
    // enabled} (pressed only for a toggle; enabled false for one that can't be pressed for now) and `onPress(pressed)` is called when it is pressed.
    set(button, onPress) {
        this.buttons.set(button.id, { button, onPress });
        this.send();
    }

    // Removes a button
    remove(id) {
        if (this.buttons.delete(id)) {
            this.send();
        }
    }

    // Tells Stroom the buttons, if they have changed since it was last told
    send() {
        if (!hasHostToolbar()) {
            return;
        }
        const buttons = [...this.buttons.values()].map(entry => entry.button);
        const json = JSON.stringify(buttons);
        if (json === this.lastSent) {
            return;
        }
        this.lastSent = json;
        stroom.setToolbarButtons(buttons, (id, pressed) => {
            const entry = this.buttons.get(id);
            if (entry) {
                entry.onPress(pressed);
            }
        });
    }

    // Tells Stroom again, e.g. once it has been in touch (vis.js only knows where it is then)
    resend() {
        this.lastSent = null;
        this.send();
    }
}
