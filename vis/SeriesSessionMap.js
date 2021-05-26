/*
 * copyright 2016 crown copyright
 *
 * licensed under the apache license, version 2.0 (the "license");
 * you may not use this file except in compliance with the license.
 * you may obtain a copy of the license at
 *
 *     http://www.apache.org/licenses/license-2.0
 *
 * unless required by applicable law or agreed to in writing, software
 * distributed under the license is distributed on an "as is" basis,
 * without warranties or conditions of any kind, either express or implied.
 * see the license for the specific language governing permissions and
 * limitations under the license.
 */
/*
 * visulisation to display a day/hour map of sessionised events for multiple series.
 * it has the following dimensions:
 * x -           the time range of the session
 * y -           the day
 * cell colour - the series
 * 
 * data is expected in the form of two dimensions per series, an exact 
 * millisecond time value (values[0]) and the value at that time 
 * (values[1]), which may just be one for events with no value.  
 *
 * the data will be sessionised based on a threshold time period.  e.g. if 
 * the threshold is 5mins then any event within 5mins of another is deemed to be 
 * part of the same session and will be linked into one data 'bar'.
 * 
 */


if (!visualisations) {
  var visualisations = {};
}
visualisations.SeriesSessionMap = function(containerNode) {

  var commonFunctions = visualisations.commonFunctions;
  var commonConstants = visualisations.commonConstants;

  var defaultSessionThresholdMillis = 1000 * 60 * 5;

  var initialised = false;

  var visSettings;
  var visContext;

  if (containerNode){
    var element = containerNode;
  } else {
    var element = window.document.createElement("div");
  }
  this.element = element;

  var grid = new visualisations.GenericGrid(element);

  //ensure we have the correct instance of d3
  var d3 = window.d3;

  //top, right, bottom, left
  var margins = commonConstants.margins();

  //var highlightTransitionDuration = 500;

  // Create a colour set.
  var colour = commonConstants.categoryGoogle();

  var fillFunc = function(d) { 
    return colour(d.key);
  }	

  var width;
  var height;

  var xSettings;
  var xSettingsTime;
  var ySettingsOrdinal;
  var ySeriesSubSettings;
  var xScale;
  var xScaleTime;
  var yScaleOrdinal;
  var yScaleData;
  var ySeriesSubScale;
  var xAxis;
  var yAxis;
  var highlightedPath;

  var visData;
  var maxVal;

  var canvas;

  var svg;

  var tip;
  var inverseHighlight;

  // Add the series data.
  var seriesContainer;

  // Add the x-axis.
  var xAxisContainer;

  // Add the y-axis.
  var yAxisContainer;

  //if we have one series then colour by value (if GENERAL) otherwise
  //colour by series
  var makeValueFillFunc = function(key) {
    var valueFillFunc = function(d,i) {
      return colour(d[0]);
    }
    return valueFillFunc;
  };

  var makeSeriesFillFunc = function(key) {
    var key = key;
    //console.log("key: " + key + " colour: " + colour(key) + " domain: " + colour.domain());
    var seriesFillFunc = function() {
      return colour(key);
    }
    return seriesFillFunc;
  };

  var defaultOpenSessionText = "IN";
  var defaultCloseSessionText = "OUT";
  var closeSessionText = null;

  var makeSeriesFilterFunc = function(settings) {
    if (settings && settings.seriesFilter == "Non-contiguous Only") {
      // We only want series with breaks in it, i.e. more than one session block
      return function(sessionisedSeriesData) {
        return result = sessionisedSeriesData.length > 1;
      }
    } else if (settings && settings.seriesFilter == "Contiguous Only") { 
      // We only want series with no breaks in it, i.e. only one session block
      return function(sessionisedSeriesData) {
        return result = sessionisedSeriesData.length == 1;
      }
    } else {
      // We want all series
      return function(sessionisedSeriesData) {
        return true;
      }
    }
  }

  //Sessionise the data to reduce the point events into a number of sessions,
  //each with a start and end time.  Sessionisation is based on events being within
  //a certain time of each other to be included in the same session
  var sessioniseInputData = function(data, settings){

    var sessionThresholdMillis;
    if (settings && settings.thresholdMs && typeof(parseInt(settings.thresholdMs, 10) == "number")){
      sessionThresholdMillis = parseInt(settings.thresholdMs);
    } else {
      sessionThresholdMillis = defaultSessionThresholdMillis;
    }

    if (settings && settings.stateChange)
    {
      closeSessionText = settings.closeSessionText || defaultCloseSessionText;
      openSessionText = settings.openSessionText || defaultOpenSessionText;
    }

    var seriesCount = data.values.length;

    //Determine if the event represents a new session or not
    var isNewSession = function(
      lastEventTime, eventTime, lastSessionText, sessionText) {

      if (lastEventTime != null) {
        var timeDiff = (eventTime - lastEventTime)
      }

      if (sessionText && !lastSessionText) {
        //No previos session text so assume a new session
        return true;
      } else if (sessionText && sessionText === openSessionText 
        && lastSessionText && lastSessionText === closeSessionText) {
        //OPEN after a CLOSE
        return true;
      } else if (sessionText && sessionText === closeSessionText 
        && lastSessionText && lastSessionText === closeSessionText) {
        //CLOSE after a CLOSE
        return true;
      } else if (!lastSessionText && sessionText) {
        //explicit session start/ends but no previous value so assume new session
        return true;
      } else if (!sessionText && !lastEventTime) {
        //time based sessionisation and no last event time so assume new session
        return true;
      } else if (!sessionText && timeDiff && timeDiff >= sessionThresholdMillis) {
        //time based sessionisation and event is outside the threshold
        //console.log("timeDiff: " + timeDiff + " +/-: " + (timeDiff - sessionThresholdMillis))
        return true;
      } else {
        return false;
      }
    };

    //console.log("Series count: " + seriesCount);

    var visibleSeriesIdx = 0;
    var seriesFilterFunc = makeSeriesFilterFunc(settings);
    var sessionisedData = [];

    // loop through each series
    for (var j = 0; j < seriesCount; j++){

      //console.log("########Series: " + data.values[j].key);

      var arrLen = data.values[j].values.length;
      var sessionId = -1;
      var lastEventTime = null;
      var lastSessionText = "";
      var sessionisedSeriesData = [];

      // loop through all the values for the series and convert them into
      // session blocks with a start/end time
      for (var i = 0; i < arrLen; i++){

        var eventTime = data.values[j].values[i][0];
        var sessionText = data.values[j].values[i][1];

        if (isNewSession(lastEventTime, eventTime, lastSessionText, sessionText)) {
          sessionId++;
          sessionisedSeriesData[sessionId] = [];
          sessionisedSeriesData[sessionId][0] = eventTime;
          // Add on the session threshold time until we know otherwise, 
          // unless it is an explicit close
          if (sessionText && sessionText === closeSessionText) {
            sessionisedSeriesData[sessionId][1] = eventTime;
          } else {
            sessionisedSeriesData[sessionId][1] = eventTime 
              + sessionThresholdMillis;
          }
          sessionisedSeriesData[sessionId][2] = 0;
          sessionisedSeriesData[sessionId][3] = sessionId;
          sessionisedSeriesData[sessionId][4] = "";
        } else if (sessionText && sessionText === closeSessionText) {
          // explicit close of an existing session so set the end time to the 
          // close event
          sessionisedSeriesData[sessionId][1] = eventTime;
        } else {
          // continuation of a session so update the end time with the event 
          // time plus the timeout period
          sessionisedSeriesData[sessionId][1] = eventTime 
            + sessionThresholdMillis;
        }

        if (sessionId > 0 && sessionisedSeriesData[sessionId - 1][1] > eventTime) {
          // the end of the timeout period of the last session has overlapped 
          // this this one so truncate the previous one to butt up against 
          // this one
          sessionisedSeriesData[sessionId - 1][1] = eventTime - 1;
        } 

        //increment the event count
        sessionisedSeriesData[sessionId][2]++;

        //Build a string of the first n state values up to a max char length
        if (!sessionisedSeriesData[sessionId][4].endsWith("...")) {
          if (sessionText && sessionisedSeriesData[sessionId][4].length < 40){
            sessionisedSeriesData[sessionId][4] = sessionisedSeriesData[sessionId][4] 
              + sessionText + " ";
          } else {
            sessionisedSeriesData[sessionId][4] = sessionisedSeriesData[sessionId][4] 
              + "...";
          }
        }

        lastEventTime = eventTime;
        lastSessionText = sessionText;
      }

      if (seriesFilterFunc(sessionisedSeriesData)) {
        // This series is visble so add it to our array
        // First copy the whole of the original series, not just the values
        sessionisedData[visibleSeriesIdx] = data.values[j];
        // Now overwrite the values with the sessionised form
        sessionisedData[visibleSeriesIdx].values = sessionisedSeriesData;
        visibleSeriesIdx++
      }
    }
    // Now replace our input data with the visible (filtered) sessionised data
    // (which may well be empty)
    data.values = sessionisedData;
  };

  var initialise = function() {
    initialised = true;

    width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
    height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);

    canvas = d3.select(element).append("svg:svg");

    svg = canvas.append("svg:g");

    if (typeof(tip) == "undefined") {
      inverseHighlight = commonFunctions.inverseHighlight();
      tip = inverseHighlight.tip()
        .html(function(tipData) { 
          var htmlBuilder = inverseHighlight.htmlBuilder()
            .addTipEntry(
              "Series", commonFunctions.autoFormat(
                tipData.key, 
                visSettings.seriesDateFormat))
            .addTipEntry("Start", new Date(tipData.values[0]))
            .addTipEntry("End", new Date(tipData.values[1]))
            .addTipEntry("Count",commonFunctions.autoFormat(tipData.values[2]))
            .addTipEntry("Session No.",commonFunctions.autoFormat(tipData.values[3]));

          if (tipData.values[4].length > 0){
            htmlBuilder.addTipEntry("States",commonFunctions.autoFormat(tipData.values[4]));
          }
          return htmlBuilder.build();
        })
        .direction(commonFunctions.d3TipNorthSouthDirectionFunc);
    }

    // Add the series data.
    seriesContainer = svg.append("svg:g").attr("class", "vis-series");

    // Add the x-axis.
    xAxisContainer = svg.append("svg:g").attr("class",
      "vis-axis" + " xAxis");

    // Add the y-axis.
    yAxisContainer = svg.append("svg:g").attr("class",
      "vis-axis" + " yAxis");

    seriesContainer.call(tip);
  }


  //Method to allow the grid to call back in to get new instances for each cell
  this.getInstance = function(containerNode) {
    return new visualisations.SeriesSessionMap(containerNode);
  }

  //var ySwimLaneData = [];

  //Public method for setting the data on the visualisation(s) as a whole
  //This is the entry point from Stroom
  this.setData = function(context, settings, data) {

    if (data && data !==null) {
      // If the context already has a colour set then use it, otherwise set it
      // to use this one.
      if (context) {
        if (context.color) {
          colour = context.color;
        }
      }

      //#########################################################
      //Perform any visualisation specific data manipulation here
      //#########################################################

      //find all the unique nesting keys so we can synch series if needs be
      //commonFunctions.computeUniqueKeys(data);

      //TODO This should really be done inside setDataInsideGrid
      //sessionise the data for each nested data set (if there is no grid series then there
      //will only be one nested set)
      data.values.forEach(function (d,i) {
        sessioniseInputData(d, settings);
      });

      if (settings) {
        //Inspect settings to determine which axes to synch, if any.
        //Change the settings property(s) used according to the vis
        var synchedFields = [];
        if (settings.synchXAxis && settings.synchXAxis.toLowerCase() == "true"){
          synchedFields.push(0);
        }

        if (settings.synchSeries && settings.synchSeries.toLowerCase() == "true") {
          //series are synched so setup the colour scale domain and add it to the context
          //so it can be passed to each grid cell vis
          //commonFunctions.setColourDomain(colour, data, 0, "SYNCHED_SERIES");
          context.color = colour;
          //ySettingsOrdinal.setDomain(data.uniqueKeys.map(function(d) { return d;}));
          //context.yDomain = data.uniqueKeys;

        } else {
          //ensure there is no colour scale in the context so each grid cel vis can define its own
          delete context.color;
          //delete context.yDomain;
        }

        //Get grid to construct the grid cells and for each one call back into a 
        //new instance of this to build the visualisation in the cell
        //The last array arg allows you to synchronise the scales of fields
        grid.buildGrid(
          context, 
          settings, 
          data, 
          this, 
          commonConstants.transitionDuration, 
          synchedFields);
      }
    }
  };

  //Public entry point for the Grid to call back in to set the cell level data on the cell level 
  //visualisation instance.
  //data will only contain the branch of the tree for this cell
  this.setDataInsideGrid = function(context, settings, data) {

    if (!initialised){
      initialise();
    }

    // If the context already has a colour set then use it
    if (context) {
      visContext = context;
      if (context.color) {
        colour = context.color;
      }
    }
    if (settings){
      visSettings = settings;
    }

    //colour scale and fill function depend on whether the series are synched, whether the values
    //are ordinal or not and how many series we have 
    //if (!settings.gridSeries || !settings.synchSeries || settings.synchSeries.toLowerCase() == "false"){
    if (!settings.synchSeries || settings.synchSeries.toLowerCase() == "false"){
      if (typeof(context) === "undefined" || typeof(context.color) === "undefined") {
        commonFunctions.setColourDomain(colour, data, 0, "SERIES");
      }
      yScaleData = data.values.map(function(d) { return d.key; });
    } 

    visData = data;		
    update(0);
  }


  function dumpPoint(d){
    console.log(
      "hourOfDay: " + d[0] 
      + " dayMs: " + d[1] 
      + " day: " + new Date(d[1]) 
      + " val: " + d[2]);
  }

  var update = function(duration) {
    if (visData && visData != null) {
      var visibleValues = visData.visibleValues();

      //console.log("min: " + visData.min[2] + " max: " + visData.max[2]);

      width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
      height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
      fullWidth = commonFunctions.gridAwareWidthFunc(false, containerNode, element, margins);
      fullHeight = commonFunctions.gridAwareHeightFunc(false, containerNode, element, margins);

      var yScaleData = colour.domain();
      var seriesCount = yScaleData.length;

      blockHeight = height / seriesCount;

      //padding between the outer most point and a swimlane
      var yPadding = Math.max(Math.round(blockHeight * 0.1),1);

      canvas
        .attr("width", fullWidth)
        .attr("height", fullHeight);

      svg.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

      xAxisContainer.attr("transform", "translate(0," + height + ")");

      xSettingsTime = commonFunctions.createAxis(visData.types[0], 0, width);
      xScaleTime = xSettingsTime.scale;
      // Custom data object as min[0] is the lowest of all the session start 
      // times and max[1] is the highest of all the session end times

      var xScaleData = {
        min: [visData.min[0]],
        max: [visData.max[1]]
      };
      xSettingsTime.setRangeDomain(visData.types[0], xScaleData, 0);
      commonFunctions.buildAxis(
        xAxisContainer, 
        xSettingsTime, 
        "bottom", 
        null, 
        null, 
        visSettings.displayXAxis);

      // if a custom date format has been provided then create a format 
      // function for the axis to use for its ticks
      var yTickFormat;
      if (visSettings.seriesDateFormat) {
        yTickFormat = function(val) {
          return commonFunctions.dateToStr(val, visSettings.seriesDateFormat);
        };
      }

      ySettingsOrdinal = commonFunctions.createAxis(
        commonConstants.dataTypeText, 
        height , 
        0, 
        yTickFormat);

      yScaleOrdinal = ySettingsOrdinal.scale;
      ySettingsOrdinal.setExplicitDomain(yScaleData);

      commonFunctions.buildAxis(
        yAxisContainer, 
        ySettingsOrdinal, 
        "left", 
        null, 
        null, 
        visSettings.displayYAxis);

      if (commonFunctions.resizeMargins(margins, xAxisContainer, yAxisContainer) 
        == true) {
        update();
      } else {
        var g = seriesContainer.selectAll("g")
          .data(visibleValues, function(d) {
            return d.key;
          });

        var series = g.enter()
          .append("svg:g");

        g.exit().transition()
          .duration(commonConstants.transitionDuration)
          .attr("opacity", "0")
          .remove();

        g.each(function(seriesData, i) {
          var e = d3.select(this);

          // use a key function that returns the series name concatenated to 
          // the session start time 
          var series = e.selectAll("rect")
            .data(seriesData.values, function(d) { 
              return d.key + "~~~" + d[0]; 
            });

          var fillFunc = function(d) {
            return colour(seriesData.key);
          };

          var legendKeyFunc = function(d) {
            return seriesData.key;
          };

          //console.log("Series i: " + i); 
          //console.log("Series: " + seriesData.key + " blockHeight: " + blockHeight + " padding: " + yPadding);

          series.enter()
            .append("svg:rect")
            .attr("class", "sessionBlock")
            .style("fill-opacity", 1e-6)
            .attr("opacity", 1e-6);

          series.exit().transition()
            .duration(commonConstants.transitionDuration)
            .attr("opacity", "0")
            .remove();

          series.each(function(dataPoint) {

            var graphPoint = d3.select(this);

            var x = xScaleTime(dataPoint[0]);
            var width = Math.max(1,xScaleTime(dataPoint[1]) - x);


            //use the string version of the day axis
            var y = yScaleOrdinal(seriesData.key) + yPadding;
            var height = yScaleOrdinal(seriesData.key) + blockHeight - yPadding - y;

            if (isNaN(x) || isNaN(y)) {
              dumpPoint(dataPoint);
            }

            graphPoint.transition()
              .duration(commonConstants.transitionDuration)
              .attr(
                "class", 
                commonFunctions.makeColouredElementClassStringFunc(legendKeyFunc))
              .attr("opacity", "1")
              .attr("x", x)
              .attr("y", y)
              .attr("width", width)
              .attr("height", height)
            //.style("stroke-linecap", "round")
              .style("stroke-opacity", 1)
              .style("fill", fillFunc)
              .style("fill-opacity", 1)
              .style("stroke", fillFunc)
              .style("stroke-width", "1px");
          });

          //var cssSelector = ".sessionBlock";
          var cssSelector = ".vis-coloured-element";
          commonFunctions.addDelegateEvent(
            e, 
            "mouseover",
            cssSelector, 
            inverseHighlight.makeInverseHighlightMouseOverHandler(
              seriesData.key, visData.types, seriesContainer,cssSelector));

          commonFunctions.addDelegateEvent(
            e,
            "mouseout",
            cssSelector,
            inverseHighlight.makeInverseHighlightMouseOutHandler(
              seriesContainer,cssSelector));
        });
      }
    }
  }

  this.resize = function() {
    commonFunctions.resize(grid, update, element, margins, width, height);
  }

  this.teardown = function() {
    if (typeof(tip) != "undefined"){
      tip.destroy();
    }
  };

  this.getColourScale = function(){
    return colour;
  };

  //The position in the vaules array that will be used for the legend key
  this.getLegendKeyField = function() {
    return null;
  };
};

