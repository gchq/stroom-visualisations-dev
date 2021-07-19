# FloorMapLocalBuilder

This tool will generate a custom FloorMap visualisation that is useful in some circumstances.

## Overview

It is possible to serve image data as static content dirctly from stroom, simply by copying the
files to the relevant directory, and providing the configuration JSON via the UI 
(remember to escape all double quotes with backslashes!).

Howeger this approach is not suitable for use in all environments and does not allow stroom access controls
to determine which users can access the image data.

In these situations, it is possible to use this tool in order to 
generate a custom FloorMap visualisation that contains image data embedded within it.

## Running

### Local Visualisation Configuration

In order to generate a local floor map visualisation, you will first need to create a configuration file.
This is a JSON format file that is structured as follows:

```
  "Building Group or Campus Name": {
      "Building Name": {
          "Floor Name or Number": {
              ...floor attributes (image path, width and height)
          }
      }
  } 
```

This configuration refers to the image files.

Stroom dashboards will refer to floors using the same literals as 
defined in the configuration file.

It is necessary to define all the following:
* Building Group or Campus - this is a collection of buildings
* Building Name
* Floor Name or Number

The visualiation sorts alphabetically and allows the user to select
between floors for which data is available.

The width and height defined for each floor must be in the same
units of distance that X and Y will be provided by the Stroom dashboard.

An example configuration file `data/example/example.json` is provided.

### Creating a Local Visualisation

A shell script is executed in order to generate the local visualisation
from a configuration file.

```Shell
cd bin
./createLocalFloorMapVis.sh ../data/example/example.json "My Local FloorMap" `uuidgen` `uuidgen`
```

This will create a zip file in `'output/My Local FloorMap/'` that can be imported into Stroom.

Tip: Make a note of the UUIDs that are displayed, in order to update the same visualisation with new images.

### Updating a Local Visualisation

To update the images in your local visualisation, you need to rerun
the tool, supplying the UUIDs that were displayed during the first
run as parameters.


```Shell
cd bin
./createLocalFloorMapVis.sh ../data/example/example.json "My Local FloorMap" <Script UUID> <Visualisation UUID>
```
