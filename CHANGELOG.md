# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).


## [Unreleased]

~~~
DO NOT ADD CHANGES HERE - ADD THEM USING log_change.sh
~~~


## [v3.15.1] - 2025-01-29

* Add gradient to SunBurst.


## [v3.15.0] - 2025-01-28

* Sunburst now displays a gradient.


## [v3.14.0-1] - 2025-01-27

* Put beta release visualisations into separate folder, within Stroom.


## [v3.14.0] - 2025-01-27

* Put beta visualisations into the same zip archive as fully released visualisations, but in separate folder.


## [v3.12-alpha.2] - 2023-05-18

* Changes for refreshed UI.


## [v3.11.0] - 2021-09-28

* gh-55 FloorMap - isOriginTopLeft added to floor config


## [v3.10.0] - 2021-09-14

* FloorMap/Geomap - support colour by event time.


## [v3.9.0] - 2021-09-08

* gh-48 FloorMap - Tags for zones

* Fix gh-53 GeoMap - Markers not updating when display settings change.

* Fix gh-52 FloorMap/GeoMap - Map zooming out when new data arrives


## [v3.8.1] - 2021-09-07

* Fix gh-50 Save button not enabled after rename zone.

* Improve support for analytic tags within zone names.


## [v3.8.0] - 2021-09-06

* Fix gh-47 FloorMap - Zone format incorrect (lat/lng vice x/y)


## [v3.7.1] - 2021-08-27

* Fix gh-44 FloorMap - Apply changed marker settings without having to save.

* Fix gh-45 FloorMap - Update markers when dashboard filters are applied.

* Fix gh-43 FloorMap - Save zones only works once.


## [v3.7.0] - 2021-08-20

* FloorMap - Improve configuration error alerting.

* FloorMap - Fix bug in handling config provided via settings vice js.

* FloorMap - Make zone editing configurable.

* FloorMap/GeoMap - use small circle markers if icon not set in data.


## [v3.6.1-2] - 2021-08-18

* Fix Leaflet and L.draw CSS JS dependencies.


## [v3.6.1-1] - 2021-08-17

* Fix Leaflet and L.draw CSS JS dependencies (attempt).


## [v3.6.1] - 2021-08-17

* Make Leaflet and L.draw CSS into JS dependencies (including image data).


## [v3.6.0] - 2021-08-17

* Fixed CSS dependencies.

* Added Local Visualisation Builders archive to build


## [v3.5.1] - 2021-08-12

* Changed `FloorMap` - Removed unnecessary console output.


## [v3.5.0] - 2021-08-12

* Changed `FloorMap` - user now creates a local vis using a utility

* Changed `FloorMap` - supports creation of zones (requires Leaflet.draw)


## [v3.4.1] - 2021-07-21

* Updated documentation and default settings for GeoMap and FloorMap


## [v3.4.0] - 2021-07-20

* Added `GeoMap` - LeafletJS based mapping visualisation for lat/lon data

* Added `FloorMap` - LeafletJS visualiation for x/y coord data on floorplans


## [v3.3.2] - 2021-05-26

* Fixed time series visualisation name.


## [v3.3.1] - 2021-05-25

* No changes


## [v3.3.0] - 2021-05-25

* Added time series visualisation.

* Improves CSS and added support for stroom themes.


## [v3.2.1] - 2019-02-20

* Fix incorrect sort direction logic in computeUniqueValues.

* Fix accidental lowercasing of whole line in common.js.


## [v3.2.0] - 2019-02-20

* Add release version to Script and Visualisation entity description.

* Issue **#31** - Leave keys and values in original order if no sort has been specified.

* Issue **#33** - Fix problem of LineChart and StackedArea ignoring interpolationMode setting.

* Issue **#32** - Add support for no line interpolation to LineChart and StackedArea.


## [v3.1.0] - 2019-01-03

* Issue **#29** - Add series filtering to Series Session Map.


## [v3.0.8] - 2018-12-19

* Issue **#27** - Add support for Stroom's TEXT data type.

* Refactor hard coded data types to be common constants.


## [v3.0.7] - 2018-12-18

* Issue **#26** - Added various maxXXX and sortXXX properties to the settings of multiple visualisations.

* Fixed typo in common.js.


## [v3.0.6] - 2018-11-28

#


## Changed

* Fixed issue **#24** - Increased cell padding to 14px.

* Added protection from height and width less than or equal to 0.


## [v3.0.5] - 2018-05-03

#


## Changed

* Fix failing visualisations following introduction of Object.values() and Array.values() in Javascript ES 2017


## [v3.0.4] - 2017-02-02

#


## Changed

* Fixed issue **#19** - Removed synchYAxis from SeriesSessionMap as it is redundant and that was causing the x axis to be synched


## [v3.0.3] - 2017-01-24

#


## Changed

* Fixed issue **#15** - SeriesSessionMap now doesn't truncate the end of the rightmost session.

* Added state text and session number to the hover tip in SeriesSessionMap

* Re-worked the sessionisation logic for SeriesSessionMap

* Fixed issue **#12** - Bucketised bar wasn't displaying the last bar


## [v3.0.2] - 2017-01-17

#


## Added

* Added the Gauge visualisation

#


## Changed

* Fixed issue **#10** - Interpolation mode being ignored on stacked area

* Randomised RAG bands in test data for RAG/TrafficLight/Guage

* Fixed issue **#13** - RAG band settings now accept floats


## [v3.0.1] - 2016-11-08

#


## Changed

* Fixed issue **#9** - RAG status and traffic lights now work Red-Green, i.e. where red is a lower value than green.


## v3.0.0 - 2016-11-03

* Intial open source release

[Unreleased]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.15.1...HEAD
[v3.15.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.15.0...v3.15.1
[v3.15.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.14.0-1...v3.15.0
[v3.14.0-1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.14.0...v3.14.0-1
[v3.14.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.12-alpha.2...v3.14.0
[v3.13]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.12-alpha.2...v3.13
[v3.12-alpha.2]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.11.0...v3.12-alpha.2
[v3.11.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.10.0...v3.11.0
[v3.10.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.9.0...v3.10.0
[v3.9.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.8.1...v3.9.0
[v3.8.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.8.0...v3.8.1
[v3.8.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.7.1...v3.8.0
[v3.7.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.7.0...v3.7.1
[v3.7.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.6.1-2...v3.7.0
[v3.6.1-2]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.6.1-1...v3.6.1-2
[v3.6.1-1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.6.1...v3.6.1-1
[v3.6.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.6.0...v3.6.1
[v3.6.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.5.1...v3.6.0
[v3.5.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.5.0...v3.5.1
[v3.5.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.4.1...v3.5.0
[v3.4.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.4.0...v3.4.1
[v3.4.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.3.2...v3.4.0
[v3.3.2]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.3.1...v3.3.2
[v3.3.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.3.0...v3.3.1
[v3.3.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.2.1...v3.3.0
[v3.2.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.2.0...v3.2.1
[v3.2.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.1.0...v3.2.0
[v3.1.0]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.8...v3.1.0
[v3.0.8]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.7...v3.0.8
[v3.0.7]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.6...v3.0.7
[v3.0.6]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.5...v3.0.6
[v3.0.5]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.4...v3.0.5
[v3.0.4]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.3...v3.0.4
[v3.0.3]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.2...v3.0.3
[v3.0.2]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.1...v3.0.2
[v3.0.1]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.0.0...v3.0.1

