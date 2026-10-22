# Stroom Visualisations

The visualisations of Stroom's dashboards: charts, maps, networks and status displays that draw
the results of a dashboard's queries. Each one is an asset-based Stroom Visualisation document, a
bundle of an `index.html`, a JavaScript file and a CSS file that Stroom loads into a frame on the
dashboard. The visualisations are built from the source here into a content pack that is imported
into Stroom.

## The visualisations

| Kind | Visualisations |
|---|---|
| Charts of series | BarChart, LineChart, StackedArea, Scatter, Bubble, TimeSeries |
| Parts of a whole and hierarchies | Doughnut, Sunburst, TreeMap, Tree |
| Time grids | DayWeekHeatMap, HourDayMultiHeatMap, HourDayPointMap, HourDaySessionMap, Session, SeriesSessionMap |
| Status | Gauge, RAGStatus, TrafficLights, TextValue |
| Links and words | Force, Force 2D, Force 3D, ChordLabels, WordCloud |
| Maps | GeoMap, FloorMap |

What they have in common:

* A grid of charts, one for each value of a Grid Series field, where a visualisation can draw one.
* A legend of the series (or categories), shown from Stroom's toolbar, that shows and hides them.
* The dashboard's colour for each value, so that a value has the same colour in every visualisation
  of the dashboard, in the palette the user chose, on the light and dark themes.
* Tooltips that Stroom shows on its page, so that they aren't cut off by the visualisation's frame.
* Every data point reachable from the keyboard, named for screen readers, with a summary of the chart.
* Selection: a click selects a point (Ctrl+Click adds to the selection), and the dashboard is told,
  so that other components can use it, e.g. to filter a table.
* Times in the user's time zone and date-time pattern.
* Typed inputs: each data field a visualisation takes is declared, so that Stroom offers only fields
  of the right type.

## Building

You will need Node.js 22.

```bash
npm ci          # Installs the build's dependencies (esbuild, d3, Leaflet, three.js)
npm test        # Runs the unit tests
npm run build   # Writes the content pack to war/stroom_content
npm run watch   # Builds again whenever a source file changes
```

`npm run build` bundles each visualisation in `src/visualisations/` with esbuild and writes the
content pack in Stroom's V2 import format (see [Stroom Documents](./docs/stroomEntities.md)).

The pack in `war/stroom_content` is committed with the source that built it, as Stroom's content
store imports it straight from this repository at a given commit. So run `npm run build` and commit
`war/stroom_content` with every change to `src/`. The build makes the same files from the same
source, and CI fails if the committed pack isn't what the source builds.

## Trying them out

Stroom's GWT workbench (in the Stroom repository, `stroom-gwt/stroom-gwt-workbench`) has a story for
every visualisation, which draws it on a dashboard with test data and checks what it does. The
workbench serves the visualisations from `war/stroom_content`, so build them first.

To use them in Stroom, import the content pack: see [Importing into Stroom](./docs/importToStroom.md).

## Documentation

See the [Documentation](./docs/SUMMARY.md), in particular
[Developing Visualisations](./docs/developingVisualisations.md).

## Building a release

Once you have committed and pushed all changes:

1. Set `version` in `package.json` to the release number (e.g. `4.0.0`), run `npm run build`, and
   commit both: each visualisation's description in the pack says which version it is.
1. Run `log_change.sh` specifying the GitHub issue id (or 0 if there isn't one) and your update comment.
1. Run `tag_release.sh` specifying a new release number of the form `vX.Y.Z`.

When this new tag is pushed to GitHub, the build (`.github/workflows/build_and_release.yml`)
creates a release with the content pack zipped.

Stroom gets the pack in two ways, which should both name the release:

* `content-packs.json` downloads the release's zip
  (`.../releases/download/vX.Y.Z/stroom-visualisations-vX.Y.Z.zip`).
* `content-packs.yml` (the content store) imports `war/stroom_content` from this repository, at the
  `commit` it gives: use the hash of the release's tagged commit.
