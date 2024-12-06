# Stroom Entities

Stroom entities are components within Stroom that can be viewed, configured, imported, exported etc. Examples of entities in Stroom include Pipelines, Streams, Data Sources, etc. 

Stroom entities are defined by a .meta document (and possibly also an additional content file) that defines the name and type of the entity along with any attributes of it.

Entities of interest to Stroom Visualisation Development are:

* Visualisation
* Script

## Visualisation Entity

A Visualisation entity is the key component of a visualisation and it defines the name of the visualisation, the settings JSON and a link to the script entity on which it is based.

The following is an example of the visualisation entity meta definition `BarChart.Visualisation.meta`:

```meta
{
  "type" : "Visualisation",
  "uuid" : "547b440d-4bb1-4d3b-86b7-ff2e41b49311",
  "name" : "BarChart",
  "version" : "Example version",
  "description" : "Documentation goes here",
  "functionName" : "visualisations.BarChart",
  "scriptRef" : {
    "type" : "Script",
    "uuid" : "dac25a4c-7a4e-4e7e-b861-74e16edd1b60",
    "name" : "BarChart"
  }
}
```
This XML file is accompanied by a settings file containing the JSON visualisation configuration `BarChart.Visualisation.json`.  The content of this file is described in [Visualisation Settings Structure](visualisationsSettingsStructure.md).

## Script Entity

A Script entity defines the name of the script, the entry point method, links to any other script entities it depends on and the actual script content.

The following is an example of the script entity XML definition `BarChart.Script.meta`.

```meta
{
  "type" : "Script",
  "uuid" : "dac25a4c-7a4e-4e7e-b861-74e16edd1b60",
  "name" : "BarChart",
  "version" : "96cdf990-5d11-41a4-af36-c6f4ec8a65b0",
  "dependencies" : [ {
    "type" : "Script",
    "uuid" : "49a5f46c-f627-49ed-afb9-0066b99e235a",
    "name" : "Common"
  }, {
    "type" : "Script",
    "uuid" : "5d4252d6-6f13-4f24-9481-9e98e038747c",
    "name" : "GenericGrid"
  } ]
}
```

The file contains links to the other scripts that this script depends on.  Those scripts may also have dependencies of their own.

This file is accompanied by a file containing the actual javascript code `BarChart.Visualisation.resource.js`

## File hierarchy (.node documents)

Node documents create a file system heirarchy in Stroom. They are used with Stroom Visualisations Development to compartmentalise the various Script/visualisation entities. An example of a .node document `Barchart.Script.node` is:

``` meta
name=BarChart
path=stroom-content/Visualisations/Version3
type=Script
uuid=dac25a4c-7a4e-4e7e-b861-74e16edd1b60
``` 
