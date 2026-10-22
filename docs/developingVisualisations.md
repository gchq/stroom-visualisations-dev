# Developing Visualisations

Each visualisation is a directory in `src/visualisations/`, which the build (`npm run build`)
bundles into an asset-based Visualisation document (see [Stroom Documents](stroomEntities.md)).
Code more than one visualisation needs is in `src/shared/`, and esbuild bundles into each
visualisation only the parts of it (and of d3) that it uses.

## A visualisation's files

| File | What it is |
|---|---|
| `visualisation.json` | Its document: `uuid`, `name` (as Stroom shows it), `folder`, `functionName` (the function Stroom calls to make it, e.g. `visualisations.BarChart`) and `description` |
| `settings.json` | What its settings dialogue offers, the data fields it takes and how Stroom nests its data (see [Visualisation Settings Structure](visualisationsSettingsStructure.md)) |
| `index.js` | The visualisation (see [Structure of a Visualisation](structureOfAVisualisation.md)) |
| `<Name>.css` | Its styles, imported by `index.js` |
| `*.js` beside it | Its own modules, e.g. the working out of its layout, kept apart from the drawing so that they can be unit tested |
| `*.test.js` | Unit tests, run by `npm test` (Node's own test runner) |

To make a new visualisation, copy the directory of the one most like it, give it a new UUID
(`uuidgen`), name and `functionName`, and change it from there. The build checks the documents'
fields and the settings' inputs.

## What Stroom gives a visualisation

Stroom loads the visualisation's `index.html` into a frame on the dashboard, with Stroom's own
`/ui/vis.js`, its host runtime. It makes the visualisation with `new visualisations.<Name>()`, puts
its `element` in the page, calls `setData(context, settings, data)` with the settings and data
(again whenever either changes, e.g. as a query's results come in) and `resize()` when its frame
changes size. The data is as [Data Structure](dataStructure.md) describes.

`vis.js` gives the visualisation `stroom`, through which it uses Stroom's page:

| | |
|---|---|
| `stroom.points(root, options)` | Makes a chart's data points reachable from the keyboard (one tab stop, arrow keys between points), shows their tooltips on Stroom's page, names them for screen readers, and tells the chart when one is selected or the selection is cleared |
| `stroom.showTooltip`, `stroom.hideTooltip`, `stroom.tooltipHtml` | Tooltips drawn by Stroom, so that they aren't cut off by the frame and follow the user's preferences |
| `stroom.setToolbarButtons(buttons, onPress)` | Buttons in Stroom's toolbar above the visualisation, e.g. Show legend |
| `stroom.colours(field, values, callback)` | The dashboard's colour for each value, so that it is the same in every visualisation |
| `stroom.select(items)` | Tells the dashboard what is selected, for its selection handlers |
| `stroom.isDarkTheme()` | Whether the dashboard has the dark theme |
| `stroom.time`, `stroom.onTimeChanged(handler)` | The user's time zone and date-time pattern, and when they change |
| `stroom.link`, `stroom.dashboard`, `stroom.data`, `stroom.annotation`, `stroom.stepping` | Open things in Stroom, as a dashboard table's links do |

A visualisation tests that each of these exists before using it, as an older Stroom may not have it.

## What every visualisation does

These are what the visualisations here have been checked against, and what a new one should do:

* **Shared code** - use the modules in `src/shared/` rather than copying them: e.g. `chart.js`
  (the grid of charts, legend, toolbar, colours and selection), `axis.js`, `format.js`, `time.js`.
* **Toolbar** - controls (a legend, zoom, pause) are buttons in Stroom's toolbar, not drawn on the chart.
* **Tooltips** - through Stroom (`stroom.points`), never drawn in the frame.
* **Keyboard and screen readers** - every data point reachable from the keyboard, with a name, and
  the chart with a summary; text 4.5:1 and shapes 3:1 against the background on both themes; nothing
  told apart by colour alone; motion that stops for someone who has asked for less of it.
* **Forced colours** - it works with a high contrast theme (`@media (forced-colors: active)`).
* **CSS** - every class is BEM, `vis-<block>__<element>--<modifier>`.
* **Colours** - categories in the dashboard's colours (`shared/colours.js`), scales from the shared
  palettes.
* **Typed inputs** - every field control has an input in `settings.json`, with the types it takes.
* **Selection** - a selected point tells the dashboard of it (`shared/selection.js`) with keys
  named the same across visualisations; Ctrl+Click adds to the selection, and a click on nothing or
  Escape clears it.

## Testing

`npm test` runs the unit tests. Stroom's GWT workbench (in the Stroom repository) has stories
for every visualisation that draw it on a dashboard with test data and play through what it does,
on the light and dark themes and with forced colours, and check it with axe. They use the content
pack in `war/stroom_content`, so build it first; see the workbench's README for running them.
