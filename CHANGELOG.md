# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]


## [v3.2.2] - 2019-02-20

* Fix incorrect sort direction logic in computeUniqueValues.


## [v3.2.1] - 2019-02-20

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

### Changed

* Fixed issue **#24** - Increased cell padding to 14px.

* Added protection from height and width less than or equal to 0.


## [v3.0.5] - 2018-05-03

### Changed

* Fix failing visualisations following introduction of Object.values() and Array.values() in Javascript ES 2017


## [v3.0.4] - 2017-02-02

### Changed

* Fixed issue **#19** - Removed synchYAxis from SeriesSessionMap as it is redundant and that was causing the x axis to be synched


## [v3.0.3] - 2017-01-24

### Changed

* Fixed issue **#15** - SeriesSessionMap now doesn't truncate the end of the rightmost session.
* Added state text and session number to the hover tip in SeriesSessionMap
* Re-worked the sessionisation logic for SeriesSessionMap
* Fixed issue **#12** - Bucketised bar wasn't displaying the last bar


## [v3.0.2] - 2017-01-17

### Added

* Added the Gauge visualisation

### Changed

* Fixed issue **#10** - Interpolation mode being ignored on stacked area
* Randomised RAG bands in test data for RAG/TrafficLight/Guage
* Fixed issue **#13** - RAG band settings now accept floats


## [v3.0.1] - 2016-11-08

### Changed

* Fixed issue **#9** - RAG status and traffic lights now work Red-Green, i.e. where red is a lower value than green.


## v3.0.0 - 2016-11-03

* Intial open source release

[Unreleased]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.2.2...HEAD
[v3.2.2]: https://github.com/gchq/stroom-visualisations-dev/compare/v3.2.1...v3.2.2
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

