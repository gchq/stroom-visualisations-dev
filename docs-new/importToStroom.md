# Importing into Stroom
Zip stroom_content dir inside war with myVis.js, .node and .meta files inside and then use the import button in Stroom.

## Source files conventions
A visualisation is typically backed by a script with a one-one association.  That script may in turn depend on other scripts, which may also depend on other scripts, etc., etc.  A typical visualisation would consist of the following files:

`stroom-content-source/MyVis.Visualisation.xml` - The entity definition

`stroom-content-source/MyVis.Visualisation.settings.js` - The JSON that describes the data structure and various settings for the visualisation

`stroom-content-source/MyVis.Script.xml` - The entity definition for the script, including any dependencies it has

`war/vis/MyVis.js` - The script itself (this will be copied and renamed to MyVis.Script.resource.js by the shell script)

A typical library script (e.g. d3.js or Common.js) would consist of just the script and the entity definition

`stroom-content-source/Dependencies/D3/D3.Script.xml` - The entity definition for the script, including any dependencies it has

`stroom-content-source/Dependencies/D3/D3.Script.resource.js` - The script itself, which must following the naming convention of EntityName.Script.resource.js

The majority of the dependency scripts (e.g. d3.js, d3-grid.js, etc.) are linked to by symbolic links.  This allows all the files for each library to be stored in one place along with any related files.  It also means we don't have to rename these 3rd party libraries ad can swap from .js to .min.js easily.

## Dependency management
Each visualisation script is loaded as an 'entity' in Stroom and dependencies between each of the script entities can be maintained there.  When a visualisation is used in Stroom, Stroom will 'eval' all of the scripts in the dependency tree, therefore a visualisation JavaScript file contains no reference to any dependencies.

Stroom manages the dependencies between entities using UUIDs. Each entity has a UUID and then any dependencies defined against an entity are defined in terms of those UUIDs.

## CSS
The CSS for the visualisations is located in _war/css/vis.css_.

Currently there is no means of importing a css file into Stroom directly so the script `war/css/makeCssStr.sh` is used by the bundling script to convert vis.css into a JavaScript file that will append the whole of vis.css as a string into the page body.  This is a bit of a hack until a cleaner solution can be built into Stroom.

## Fonts
Currently Stroom supports 'font-awesome' and 'roboto' for its fonts.  Their corresponding css files are included in war/css solely for the purpose of running Stroom Visualisations Development in a browser.  They are not imported into Stroom.  Additional fonts would required changes to Stroom.

## Suggested deployment strategy
todo