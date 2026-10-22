# Stroom Documents

Stroom keeps its content (pipelines, dashboards, dictionaries and so on) as documents, each with a
type, a name and a UUID, in a tree of folders. A content pack is a set of documents to import, in
Stroom's import format: a file tree with a few files for each document, named after it.

The content pack built here (`npm run build`, into `war/stroom_content`) has a Visualisation
document for each visualisation, and the folders they are in. It is in Stroom's **V2** format, the
one that carries a document's path assets (its files).

## Visualisation document

A visualisation's document is made from its source in `src/visualisations/<Name>/` (see
[Developing Visualisations](developingVisualisations.md)). Each one has these files, named
`<Name>.Visualisation.<uuid>` and then:

* `.node` - where it is in Stroom's tree of folders, e.g.

  ```
  name=BarChart
  path=/Visualisations/Version3/BarChart
  type=Visualisation
  uuid=547b440d-4bb1-4d3b-86b7-ff2e41b49311
  version=V2
  ```

* `.meta` - the document itself: its type, UUID, name, version (a hash of its content, so that it
  only changes when the visualisation does), description and the JavaScript function Stroom calls
  to make it, e.g. `visualisations.BarChart`.

* `.json` - its settings: what the settings dialogue offers, what data it takes and how Stroom
  nests the data it gives it (see [Visualisation Settings Structure](visualisationsSettingsStructure.md)).

* `-path-assets/` - its files, which Stroom serves at `/assets/<uuid>/<file>`:
    * `index.html` - the page Stroom loads into the visualisation's frame. It loads Stroom's own
      `/ui/vis.js` (the host runtime, which talks to the dashboard) and `/ui/css/vis.css` (the
      theme's colours and fonts), then the visualisation's own JavaScript and CSS.
    * `<Source>.js` - the visualisation, with the parts of d3 (and any other library) it uses
      bundled in, named after its source's directory (so without spaces, e.g. `Force3D.js` for
      Force 3D).
    * `<Source>.css` - its styles.

A visualisation's document keeps its UUID from release to release, so that dashboards that use it
keep working. The visualisations that replaced the legacy ones kept the legacy documents' UUIDs.

## Folder document

Each folder has a `.node` file named `<Name>.Folder.<uuid>.node`, beside a directory of the same
name holding what is in it. Stroom matches an imported folder with an existing one by its
path, so the folders' UUIDs are made from their paths.

## Legacy Script documents

Before visualisations had path assets, a visualisation's JavaScript was a Script document (with the
scripts it depended on, e.g. d3 3 and a common library, as Script documents of their own), and
Stroom loaded the scripts into the frame one by one. Stroom still supports such visualisations, but
this content pack no longer has any: importing it doesn't remove the Script documents an earlier
pack imported, so a visualisation of your own that uses them keeps working.
