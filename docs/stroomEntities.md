# Stroom Entities
Stroom entities are components within Stroom that can be viewed, configured, imported, exported etc. Examples of entities in Stroom include Pipelines, Streams, Data Sources, etc. 

Stroom entities are defined by an XML document (and possibly also an additional content file) that defines the name and type of the entity along with any attributes of it.

The entities of interest to Stroom Visualisation Development are:

* Visualisation
* Script
* System Group

## Visualisation Entity
A Visualisation entity is the key component of a visualisation and it defines the name of the visualisation, the settings JSON and a link to the script entity on which it is based.

The following is an example of the visualisation entity XML definition `BarChart.Visualisation.xml`:

TODO-update this to the new GUID structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<visualisation>
    <description>Git commit: @@GIT_COMMIT@@
Git commit time: @@GIT_COMMIT_TIME@@</description>
    <functionName>visualisations.BarChart</functionName>
    <name>BarChart</name>
    <script>BarChart</script>
</visualisation>
```

This XML file is accompanied by a settings file containing the JSON visualisation configuration `BarChart.Visualisation.settings.json`.  The content of this file is described in [Visualisation Settings Structure](visualisationsSettingsStructure.md).

## Script Entity
A Script entity defines the name of the script, the entry point method, links to any other script entities it depends on and the actual script content.

The following is an example of the script entity XML definition `BarChart.Script.xml`.

TODO-update this to the new GUID structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<script>
    <dependencies>Common</dependencies>
    <dependencies>GenericGrid</dependencies>
    <description>A Bar Chart</description>
    <name>BarChart</name>
</script>
``` 

The file contains links to the other scripts that this script depends on.  Those scripts may also have dependencies of their own.

This file is accompanied by a file containing the actual javascript code `BarChart.Visualisation.resource.js`

## System Group Entity
A system group entity is essentially a folder in the folder heirarchy in Stroom. They are used with Stroom Visualisations Development to compartmentalise the various files. An example of the system group definition `Dependencies.SystemGroup.xml` is:

``` xml
<?xml version="1.0" encoding="UTF-8"?>
<systemGroup>
    <computerAuthorisation>OPTIONAL</computerAuthorisation>
    <description/>
    <global>false</global>
    <name>Dependencies</name>
</systemGroup>
``` 
