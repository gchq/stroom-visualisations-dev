# Importing into Stroom

The visualisations are imported into Stroom as a content pack.

A release's content pack is the zip on its GitHub release page. To make one from the source, build
it (`npm ci` then `npm run build`) and zip what is in `war/stroom_content`:

```bash
cd war/stroom_content && zip -r ../../stroom-visualisations.zip .
```

Stroom's content store can also import the pack straight from this repository: it imports
`war/stroom_content` at the commit its `content-packs.yml` names.

Then import the zip from Stroom's Import screen. The visualisations go in the
`Visualisations/Version3` folder.

The pack is in Stroom's V2 import format, which carries each visualisation's files (its path
assets), so it needs a Stroom that has asset-based visualisations. An existing Stroom keeps the
documents an earlier pack imported: the legacy Script documents (d3 3, Common and the rest) are no
longer in the pack, but importing it doesn't remove them.
