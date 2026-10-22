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

// Helpers for writing a Stroom content pack in Stroom's V2 import/export format, which is the
// only format that carries a document's path assets (the files of an asset-based
// visualisation). They follow Stroom's own ImportExportSerializerImplV2,
// ImportExportFileNameUtil and PropertiesSerialiser.

import { createHash } from "node:crypto";

// The directory beside a document's files that holds its path assets
export const PATH_ASSETS_SUFFIX = "-path-assets";

// Writes an object as a Java properties file's text, keys sorted, as Stroom's
// PropertiesSerialiser does
export function writeProperties(properties) {
    return Object.keys(properties)
        .filter(key => properties[key] !== undefined && properties[key] !== null)
        .sort()
        .map(key => escapeProperty(key, true) + "=" + escapeProperty(String(properties[key]), false))
        .join("\n") + "\n";
}

function escapeProperty(string, escapeSpace) {
    let out = "";
    for (let i = 0; i < string.length; i++) {
        const c = string[i];
        const code = string.charCodeAt(i);
        if (c === "\\") {
            out += "\\\\";
        } else if (c === " ") {
            out += (i === 0 || escapeSpace) ? "\\ " : " ";
        } else if (c === "\t") {
            out += "\\t";
        } else if (c === "\n") {
            out += "\\n";
        } else if (c === "\r") {
            out += "\\r";
        } else if (c === "\f") {
            out += "\\f";
        } else if (c === "=" || c === ":" || c === "#" || c === "!") {
            out += "\\" + c;
        } else if (code < 0x20 || code > 0x7e) {
            out += "\\u" + code.toString(16).toUpperCase().padStart(4, "0");
        } else {
            out += c;
        }
    }
    return out;
}

// A document's name as Stroom puts it in file names: anything but letters and digits becomes
// '_', and it is cut to 100 characters
export function safeFileName(name) {
    return name.replace(/[^A-Za-z0-9]/g, "_").substring(0, 100);
}

// The start of the names of a document's files, '<name>.<type>.<uuid>'
export function filePrefix(name, type, uuid) {
    return safeFileName(name) + "." + type + "." + uuid;
}

// A folder's UUID, made from its path so that it is the same every build. (Stroom finds an
// existing folder by its name when the UUID differs, so installs that imported the pack before it
// had folder UUIDs keep their folders.)
export function folderUuid(path) {
    const hash = createHash("sha1").update("stroom-visualisations:folder:" + path).digest();
    // Shaped as a name-based (version 5) UUID
    hash[6] = (hash[6] & 0x0f) | 0x50;
    hash[8] = (hash[8] & 0x3f) | 0x80;
    const hex = hash.subarray(0, 16).toString("hex");
    return hex.substring(0, 8) + "-" + hex.substring(8, 12) + "-" + hex.substring(12, 16) + "-"
           + hex.substring(16, 20) + "-" + hex.substring(20, 32);
}

// The text of a V2 .node file
export function nodeFile(name, type, uuid, path) {
    return writeProperties({
        name: name,
        path: path,
        type: type,
        uuid: uuid,
        version: "V2"
    });
}
