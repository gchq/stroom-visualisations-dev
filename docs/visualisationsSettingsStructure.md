# Visualisation Settings Structure

Each visualisation entity is accompanied by a JSON object that defines how Stroom interacts with the visualisation. Stroom dashboards use this JSON to build a settings dialogue to present to the user to configure their instance of the visualisation.

The following features are defined in the JSON:

* Dashboard dialogue controls
    * Data fields
    * Settings values
* Data structure
    * Nesting (grouping) of data
    * Data fields
    * Data types

## Example Settings File

The following is an example of a JSON settings definition for the Bar Chart:

```json
{
    "tabs": [
        {
            "name": "Data",
            "controls": [
                {
                    "id": "x",
                    "type": "field",
                    "label": "X Axis"
                },
                {
                    "id": "y",
                    "type": "field",
                    "label": "Y Axis"
                },
                {
                    "id": "series",
                    "type": "field",
                    "label": "Series"
                },
                {
                    "id": "gridSeries",
                    "type": "field",
                    "label": "Grid Series"
                }
            ]
        },
        {
            "name": "Bar",
            "controls": [
                {
                    "id": "sortSeries",
                    "type": "selection",
                    "label": "Sort Series",
                    "values": [
                        "",
                        "Ascending",
                        "Descending"
                    ],
                    "defaultValue": "Ascending"
                },
                {
                    "id": "maxSeries",
                    "type": "number",
                    "label": "Max Series",
                    "defaultValue": "100",
                    "max": "10000",
                    "min": "1"
                },
                {
                    "id" : "seriesDateFormat",
                    "type" : "text",
                    "label" : "Series Date Format (opt.)",
                    "defaultValue" : ""
                },
                {
                    "id": "sortGridSeries",
                    "type": "selection",
                    "label": "Sort Grid Series",
                    "values": [
                        "",
                        "Ascending",
                        "Descending"
                    ],
                    "defaultValue": "Ascending"
                },
                {
                    "id": "maxGridSeries",
                    "type": "number",
                    "label": "Max Grid Series",
                    "defaultValue": "20",
                    "max": "36",
                    "min": "1"
                },
                {
                    "id" : "gridSeriesDateFormat",
                    "type" : "text",
                    "label" : "Grid Series Date Format (optional)",
                    "defaultValue" : ""
                },
                {
                    "id": "synchXAxis",
                    "type": "selection",
                    "label": "Synch X Axis",
                    "values": [
                        "True",
                        "False"
                    ],
                    "defaultValue": "True"
                },
                {
                    "id": "displayXAxis",
                    "type": "selection",
                    "label": "Display X Axis",
                    "values": [
                        "True",
                        "False"
                    ],
                    "defaultValue": "True"
                },
                {
                    "id": "synchYAxis",
                    "type": "selection",
                    "label": "Synch Y Axis",
                    "values": [
                        "True",
                        "False"
                    ],
                    "defaultValue": "True"
                },
                {
                    "id": "displayYAxis",
                    "type": "selection",
                    "label": "Display Y Axis",
                    "values": [
                        "True",
                        "False"
                    ],
                    "defaultValue": "True"
                },
                {
                    "id": "synchSeries",
                    "type": "selection",
                    "label": "Synch Series",
                    "values": [
                        "True",
                        "False"
                    ],
                    "defaultValue": "True"
                },
                {
                    "id": "bucketSize",
                    "type": "selection",
                    "label": "Time bucket size",
                    "values": [
                        "",
                        "second",
                        "minute",
                        "hour",
                        "day",
                        "week"
                    ],
                    "defaultValue": ""
                }
            ]
        }
    ],
    "data": {
        "structure": {
            "nest": {
                "key": {
                    "id": "${gridSeries}",
                    "sort": {
                        "direction": "${sortGridSeries}",
                        "enabled": "true"
                    }
                },
                "nest": {
                    "key": {
                        "id": "${series}",
                        "sort": {
                            "direction": "${sortSeries}",
                            "enabled": "true"
                        }
                    },
                    "values": {
                        "fields": [
                            {
                                "id": "${x}",
                                "sort": {
                                    "direction": "Ascending",
                                    "enabled": "true"
                                }
                            },
                            {
                                "id": "${y}"
                            }
                        ]
                    },
                    "limit": {
                        "enabled": "true",
                        "size": "${maxSeries}"
                    }
                },
                "limit": {
                    "enabled": "true",
                    "size": "${maxGridSeries}"
                }
            }
        }
    }
}
```

## ID References

In the settings JSON, references to controls or values defined elsewhere in the JSON can be referenced using the `${id}` notation.  For example in the settings JSON above `${maxGridSeries}` refer

## 'tabs' Array

The 'tabs' array contains one value for each tab that needs to be displayed in the settings dialogue in the Stroom dashboard. In this case there are two tabs; 'Data' and 'Bar'.

```json
    "tabs": [
        {
            "name": "Data",
            "controls": [
                ...
            ]
        },
        {
            "name": "Bar",
            "controls": [
                ...
            ]
        }
    ]
```

Each tab object defines the on-screen label for the tab and a `control` array containing all the UI controls that will appear on that tab.

### 'controls' Array

Each item in the `controls` array is a single screen control which has the following properties:

* **id** - The internal name used for this control within the settings JSON and within the settings object passed to the visualisation
* **type** - The type of control, one of:
    * **field** - A data field drop-down, whose value will be selected from the list of table fields available in the dashboard
    * **selection** - A drop down list of statically defined values
    * **number** - A numeric field with value spinner
    * **text** - A free text field
* **label** - The UI label for the control
* **values** - An array of values for the control, used for `selection` type controls
* **defaultValue** - An optional default value for the control
* **min** - The minimum value for `numeric` type controls
* **max** - The maximum value for `numeric` type controls

## 'data' Object

The `data` object contains a `structure` object that defines how the various `field` type controls are mapped into the data object passed to the visualisation (as described in [Data Structure](dataStructure.md)).

For the following description of the `data` object we will use the example of a gridded bar chart visualisation that is showing the number of employees per business function, grouped by site and country.

### 'nest' Object

If the data has some form of grouping, e.g. the grouping by site and country, then a `nest` object is used to define this. The `key` property of the nest object defines the data field that will be used for this nest level. In this example 'country' will be the key for the outer nest and 'site will be the key for the inner nest.

As well as having a `key`, a `nest` will have either have another `nest` object if another level of grouping is required or a `values` object if no more grouping is required. Finally a `limit` object is optionally used to define a limit for the number of nest keys.

The following is an example of a data structure definition with one level of nesting:

```json
"structure": {
    "nest": {
        "key": {
            "id": "${series}",
            "sort": {
                "direction": "${sortSeries}",
                "enabled": "true"
            }
        },
        "values": {
            "fields": [
                {
                    "id": "${x}",
                    "sort": {
                        "direction": "Ascending",
                        "enabled": "true"
                    }
                },
                {
                    "id": "${y}"
                }
            ]
        },
        "limit": {
            "enabled": "true",
            "size": "${maxSeries}"
        }
    }
}
```

#### 'key' Object

The key object defines what data is used for the key value of each group at a nest level. The `id` property is used for this.  It can either be a hard coded value (in which case you would only get one group, or a reference to a data field such as `${series}` which tells it to use the values of the dashboard table field that is associated with the `field` type object defined in the JSON.

The key object can also contain a `sort` property that defines the direction of sort of the values used for the key.

#### 'values' Object

The `values` object defines a flat data structure with a `fields` array that contains all the fields in that flat data set. In the above JSON two fields are defined and they reference the data fields named `x` and `y` respectively.

An optional `sort` can be applied to each `fields` entry to control the order of the values when they are added to the data object that will be passed to the visualisation.



