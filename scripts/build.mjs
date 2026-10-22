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

// Builds the content pack into war/stroom_content, in Stroom's V2 import/export format:
//
// each asset-based visualisation in src/visualisations/<Name>/ is bundled by esbuild (its own code,
// the shared code in src/shared/ and the parts of d3 it uses) into the path assets of its
// Visualisation document (index.html, <Name>.js and <Name>.css), with the folders it is in.
//
// The pack is committed with the source that built it, so that any commit can be imported into
// Stroom from git (its content store points at war/stroom_content). The build gives the same files
// from the same source, so CI can check that the committed pack is up to date.
//
// Usage: node scripts/build.mjs [--watch]

import * as esbuild from "esbuild";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
    PATH_ASSETS_SUFFIX,
    filePrefix,
    folderUuid,
    nodeFile
} from "./content.mjs";
import { checkInputs } from "./inputs.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const VISUALISATIONS_SOURCE = path.join(ROOT, "src", "visualisations");
const OUTPUT = path.join(ROOT, "war", "stroom_content");

const VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version;

// Reads the asset-based visualisations' definitions
function readAssetVisualisations() {
    if (!fs.existsSync(VISUALISATIONS_SOURCE)) {
        return [];
    }
    return fs.readdirSync(VISUALISATIONS_SOURCE, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => {
            const dir = path.join(VISUALISATIONS_SOURCE, entry.name);
            const doc = JSON.parse(fs.readFileSync(path.join(dir, "visualisation.json"), "utf8"));
            const settingsText = fs.readFileSync(path.join(dir, "settings.json"), "utf8");
            for (const key of ["uuid", "name", "folder", "functionName"]) {
                if (!doc[key]) {
                    throw new Error(dir + "/visualisation.json has no '" + key + "'");
                }
            }
            const problems = checkInputs(JSON.parse(settingsText));
            if (problems.length > 0) {
                throw new Error(dir + "/settings.json:\n  " + problems.join("\n  "));
            }
            return { dir, doc, settingsText };
        });
}

// The directory of a folder path in the output, making the folders' .node files on the way
function folderDir(folderPath, madeFolders) {
    let dir = OUTPUT;
    let soFar = "";
    for (const name of folderPath.split("/").filter(part => part !== "")) {
        soFar = soFar === "" ? name : soFar + "/" + name;
        const uuid = folderUuid(soFar);
        const prefix = filePrefix(name, "Folder", uuid);
        if (!madeFolders.has(soFar)) {
            fs.writeFileSync(path.join(dir, prefix + ".node"), nodeFile(name, "Folder", uuid, "/" + soFar));
            fs.mkdirSync(path.join(dir, prefix), { recursive: true });
            madeFolders.add(soFar);
        }
        dir = path.join(dir, prefix);
    }
    return dir;
}

// The index.html that Stroom loads into an asset-based visualisation's frame. Stroom's vis.js
// talks to the dashboard, and its vis.css gives the theme's colours and fonts. Stroom's moment.js
// (with time zones) lets vis.js show times as the rest of Stroom does (stroom.time); Stroom's own
// page loads the same files, so they are usually cached. `title` is the document's name and
// `assetName` what its JS and CSS files are called.
function indexHtml(title, assetName) {
    return "<!DOCTYPE html>\n"
           + "<html lang=\"en\">\n"
           + "<head>\n"
           + "    <meta charset=\"utf-8\">\n"
           + "    <title>" + title + "</title>\n"
           + "    <link rel=\"stylesheet\" href=\"/ui/css/vis.css\">\n"
           + "    <link rel=\"stylesheet\" href=\"" + assetName + ".css\">\n"
           + "    <script src=\"/ui/script/moment/moment.min.js\"></script>\n"
           + "    <script src=\"/ui/script/moment/moment-timezone-with-data.min.js\"></script>\n"
           + "    <script src=\"/ui/vis.js\"></script>\n"
           + "    <script src=\"" + assetName + ".js\"></script>\n"
           + "</head>\n"
           + "<body></body>\n"
           + "</html>\n";
}

// A UUID-shaped hash of some text, used as a document's version so that it only changes when the
// document does
function versionOf(text) {
    const hex = createHash("sha1").update(text).digest("hex");
    return hex.substring(0, 8) + "-" + hex.substring(8, 12) + "-" + hex.substring(12, 16) + "-"
           + hex.substring(16, 20) + "-" + hex.substring(20, 32);
}

// Bundles an asset-based visualisation and writes its document
async function buildAssetVisualisation(vis, madeFolders) {
    const { dir, doc, settingsText } = vis;
    const outDir = folderDir(doc.folder, madeFolders);
    const prefix = filePrefix(doc.name, "Visualisation", doc.uuid);
    const assetsDir = path.join(outDir, prefix + PATH_ASSETS_SUFFIX);
    fs.mkdirSync(assetsDir, { recursive: true });
    // The JS and CSS are named after the source's directory, which has no spaces (e.g. Force3D for
    // 'Force 3D'), so that their URLs need none
    const assetName = path.basename(dir);

    await esbuild.build({
        entryPoints: { [assetName]: path.join(dir, "index.js") },
        bundle: true,
        format: "iife",
        target: "es2020",
        outdir: assetsDir,
        legalComments: "eof",
        // Images a library's CSS uses (e.g. Leaflet's) are put in the CSS, so it needs no other files
        loader: { ".png": "dataurl", ".svg": "dataurl" },
        logLevel: "warning"
    });
    // A visualisation with no CSS of its own still gets the file its index.html asks for
    const cssPath = path.join(assetsDir, assetName + ".css");
    if (!fs.existsSync(cssPath)) {
        fs.writeFileSync(cssPath, "");
    }
    fs.writeFileSync(path.join(assetsDir, "index.html"), indexHtml(doc.name, assetName));

    const assetsText = ["index.html", assetName + ".js", assetName + ".css"]
        .map(file => fs.readFileSync(path.join(assetsDir, file), "utf8"))
        .join("\n");
    const meta = {
        type: "Visualisation",
        uuid: doc.uuid,
        name: doc.name,
        version: versionOf(settingsText + assetsText),
        description: (doc.description ? doc.description + "\n" : "") + "Version: " + VERSION,
        functionName: doc.functionName
    };
    fs.writeFileSync(path.join(outDir, prefix + ".meta"), JSON.stringify(meta, null, 2) + "\n");
    fs.writeFileSync(path.join(outDir, prefix + ".json"), settingsText);
    fs.writeFileSync(path.join(outDir, prefix + ".node"),
        nodeFile(doc.name, "Visualisation", doc.uuid, "/" + doc.folder + "/" + doc.name));
}

async function build() {
    const started = Date.now();
    fs.rmSync(OUTPUT, { recursive: true, force: true });
    fs.mkdirSync(OUTPUT, { recursive: true });

    const assetVisualisations = readAssetVisualisations();
    const madeFolders = new Set();
    for (const vis of assetVisualisations) {
        await buildAssetVisualisation(vis, madeFolders);
    }
    console.log("Built " + path.relative(ROOT, OUTPUT) + ": " + assetVisualisations.length
                + " visualisation(s) in " + (Date.now() - started) + "ms");
}

async function main() {
    await build();
    if (process.argv.includes("--watch")) {
        console.log("Watching src/ for changes");
        let timer = null;
        const rebuild = () => {
            clearTimeout(timer);
            timer = setTimeout(() => build().catch(error => console.error(error.message)), 200);
        };
        fs.watch(path.join(ROOT, "src"), { recursive: true }, rebuild);
    }
}

main().catch(error => {
    console.error(error.message);
    process.exit(1);
});
