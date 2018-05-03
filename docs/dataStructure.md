# Visualisation Data Structure
The data contract for each visualisation is defined in the .Visualisation.settings.js file.  The 'data' object within the JSON file defines the various grouping levels of the data and the fields.  The following shows the data structure for the BarChart visualisation.  Here there are two levels of nesting, the top level grid series and sub series.  Within that sub series there are two value fields.

The limit property is used to instruct Stroom to only supply the first N groups at that level.

```json
...
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
                                    "direction": "ascending",
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
...
```

The following is an example of the data passed to the visualisations setData function.  The data in question has been redacted for brevity and represents a grid of two ordinal bar charts, each with multiple series of data.

```json
{
    "types": [
        "GENERAL",
        "NUMBER"
    ],
    "min": [
        "Val 0 2a4bb8221efbde95",
        0.0015877156984061003
    ],
    "max": [
        "Val 9",
        0.9877399967517704
    ],
    "sum": [
        0,
        30.305376179946222
    ],
    "values": [
        {
            "key": "Grid-series-0 ab5136",
            "types": [
                "GENERAL",
                "NUMBER"
            ],
            "min": [
                "Val 0 2a4bb8221efbde95",
                0.0015877156984061003
            ],
            "max": [
                "Val 9",
                0.9877399967517704
            ],
            "sum": [
                0,
                14.885613397695124
            ],
            "values": [
                {
                    "key": "series-0",
                    "sum": [
                        0,
                        6.5481229540891945
                    ],
                    "max": [
                        "Val 9",
                        0.9877399967517704
                    ],
                    "min": [
                        "Val 0 2a4bb8221efbde95",
                        0.08816188597120345
                    ],
                    "values": [
                        [
                            "Val 0 2a4bb8221efbde95",
                            0.9166667715180665
                        ],
                        ...
                        [
                            "Val 13 bce4d6ec",
                            0.18971160193905234
                        ]
                    ]
                },
                {
                    "key": "series-2",
                    "sum": [
                        0,
                        4.836325331358239
                    ],
                    "max": [
                        "Val 9",
                        0.774495346006006
                    ],
                    "min": [
                        "Val 0 2a4bb8221efbde95",
                        0.13827484124340117
                    ],
                    "values": [
                        [
                            "Val 0 2a4bb8221efbde95",
                            0.430772838415578
                        ],
                        ...
                        [
                            "Val 10",
                            0.20966380485333502
                        ]
                    ]
                },
                {
                    "key": "series-1",
                    "sum": [
                        0,
                        3.5011651122476906
                    ],
                    "max": [
                        "Val 9",
                        0.8228197637945414
                    ],
                    "min": [
                        "Val 0 2a4bb8221efbde95",
                        0.0015877156984061003
                    ],
                    "values": [
                        [
                            "Val 0 2a4bb8221efbde95",
                            0.4968745668884367
                        ],
                        ...
                        [
                            "Val 9",
                            0.18469444988295436
                        ]
                    ]
                }
            ]
        },
        {
            "key": "Grid-series-2 2f8857e984fe6c3c95e75454adeba76d088b16d51eaf8e4f0f5221f",
            "types": [
                "GENERAL",
                "NUMBER"
            ],
            "min": [
                "Val 0 2a4bb8221efbde95",
                0.010093338787555695
            ],
            "max": [
                "Val 9",
                0.9499501497484744
            ],
            "sum": [
                0,
                15.419762782251098
            ],
            "values": [
                {
                    "key": "series-2",
                    "sum": [
                        0,
                        5.827913003973663
                    ],
                    "max": [
                        "Val 9",
                        0.9499501497484744
                    ],
                    "min": [
                        "Val 0 2a4bb8221efbde95",
                        0.018769168760627508
                    ],
                    "values": [
                        [
                            "Val 0 2a4bb8221efbde95",
                            0.07005877327173948
                        ],
                        ...
                        [
                            "Val 13 bce4d6ec",
                            0.8561999252997339
                        ]
                    ]
                },
                {
                    "key": "series-3",
                    "sum": [
                        0,
                        4.664487087132044
                    ],
                    "max": [
                        "Val 8 1b756b",
                        0.9056288893334568
                    ],
                    "min": [
                        "Val 0 2a4bb8221efbde95",
                        0.05621930491179228
                    ],
                    "values": [
                        [
                            "Val 0 2a4bb8221efbde95",
                            0.5917999271769077
                        ],
                        ...
                        [
                            "Val 12 17c35cfd9b977ccf6b",
                            0.0609518566634506
                        ]
                    ]
                },
                {
                    "key": "series-4",
                    "sum": [
                        0,
                        4.92736269114539
                    ],
                    "max": [
                        "Val 9",
                        0.9280988455284387
                    ],
                    "min": [
                        "Val 0 2a4bb8221efbde95",
                        0.010093338787555695
                    ],
                    "values": [
                        [
                            "Val 0 2a4bb8221efbde95",
                            0.4677400551736355
                        ],
                        ...
                        [
                            "Val 10",
                            0.31503862817771733
                        ]
                    ]
                }
            ]
        }
    ]
}
```

Each level of the data tree contains the following properties:

* key (only present for a group level)
* types
* min
* max
* sum
* values

## key
This is a string that provides a unique identifier (with the parent values array) for that group of data, e.g. the name of the grid cell or series within a cell.  This key will typically be used by visualisations as the key in the d3.js data binding.

## types
This contains an array with length equal to the number of value fields as defined in the settings JSON above.  Index 0 contains the type of field 0, etc. 

## min/max/sum
These properties are all arrays that follow a similar pattern to 'types' in that each position represents the value of the aggregate for that field.  E.g. min[0] represents the minimum value of field 0 for all values below this level, i.e. the top level min[0] represents the minimum for all field 0 values across all grid cells and series.

These aggregates can be used by the visualisation for constructing axes.

## values
This can be either an array of objects (conforming the key/types/min/max/sum/values structure) each containing a sub-group of data, or an array of values if this is the lowest level in the tree.
