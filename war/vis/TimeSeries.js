/*
 * Copyright 2016 Crown Copyright
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
if (!visualisations) {
  var visualisations = {};
}
visualisations.TimeSeries = function(containerNode) {

  var commonFunctions = visualisations.commonFunctions;
  var commonConstants = visualisations.commonConstants;

  var initialised = false;

  var visSettings;
  var visContext;

  var d3 = window.d3;

  if (containerNode){
    var element = containerNode;
  } else {
    var element = window.document.createElement("div");
  }
  this.element = element;

  var grid;

  var margins = commonConstants.margins();
  var colour = commonConstants.categoryGoogle();
  var width;
  var height;

  // var canvas;

  var svg;

  var visData;












  this.getInstance = function(containerNode) {
    return new visualisations.TimeSeries(containerNode);
  };







  var initialise = function() {
    initialised = true;



    svg = d3.select(element)
      .append("svg:svg");










  };

  this.setData = function(context, settings, data) {
    if (!initialised){
      initialise();
    }
    visData = data;
    update();

    // if (data && data != null) {
    //   // If the context already has a colour set then use it, otherwise set it
    //   // to use this one.
    //   if (context) {
    //     if (context.color) {
    //       colour = context.color;
    //     }
    //   }

    //   if (settings) {
    //     if (grid == undefined){
    //       //initialise the grid
    //       grid = new visualisations.GenericGrid(element);
    //     }

    //     var synchedFields = [];
    //     if (commonFunctions.isTrue(settings.synchXAxis)){
    //       synchedFields.push(0);
    //     }
    //     if (commonFunctions.isTrue(settings.synchYAxis)){
    //       synchedFields.push(1);
    //     }

    //     if (commonFunctions.isTrue(settings.synchSeries)) {
    //       //series are synched so setup the colour scale domain and add it to the context
    //       //so it can be passed to each grid cell vis
    //       //commonFunctions.setColourDomain(colour, data, 0, "SYNCHED_SERIES");
    //       context.color = colour;
    //     } else {
    //       //ensure there is no colour scale in the context so each grid cel vis can define its own
    //       delete context.color;
    //     }
    //     grid.buildGrid(context, settings, data, this, commonConstants.transitionDuration, synchedFields);
    //   }
    // }







 // width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
    // height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);






























  };

  // this.setDataInsideGrid = function(context, settings, data) {
  //   if (!initialised){
  //     initialise();
  //   }

  //   // // If the context already has a colour set then use it
  //   // if (context) {
  //   //   visContext = context;
  //   //   if (context.color) {
  //   //     colour = context.color;
  //   //   }
  //   // }
  //   // if (settings){
  //   //   visSettings = settings;
  //   // }


  //   // var mode = (settings.synchSeries && settings.synchSeries.toLowerCase() == "true") ? "SYNCHED_SERIES" : "SERIES";
  //   // if (typeof(context) === "undefined" || typeof(context.color) === "undefined") {
  //   //   commonFunctions.setColourDomain(colour, data, 0, mode);
  //   // }

    // visData = data;
    // update();
  // };

























































  var update = function(duration) {
    if (visData) {









      svg.selectAll('*').remove();






        // example data
        var metricName   = "views";
        var metricCount  = [1, 3, 1, 2, 1, 1, 1, 1, 2, 2, 3, 1, 2, 1, 4, 3, 2, 1, 1, 1, 1, 1, 4, 2, 1, 2, 8, 2, 1, 4, 2, 4, 1, 3, 1, 2, 1, 1, 3, 1, 1, 5, 1, 1, 4];
        var metricMonths = ["2018-06", "2013-04", "2015-11", "2012-10", "2014-09", "2014-02", "2016-02", "2016-04", "2016-06", "2014-12", "2013-07", "2017-01", "2015-10", "2012-12", "2013-05", "2018-04", "2015-06", "2017-03", "2014-08",
                            "2017-07", "2013-02", "2012-07", "2016-03", "2017-06", "2018-07", "2014-10", "2013-01", "2013-10", "2017-11", "2014-05", "2012-11", "2015-01", "2018-03", "2015-12", "2015-08", "2016-08", "2014-11", "2014-01",
                            "2013-06", "2012-08", "2015-09", "2016-07", "2013-03", "2012-09", "2016-05"];



        /*
        * ========================================================================
        *  Prepare data
        * ========================================================================
        */

        // Combine the months and count array to make "data"
        var dataset = [];
        for(var i=0; i<metricCount.length; i++){
            var obj = {count: metricCount[i], month: metricMonths[i]};
            dataset.push(obj);
        }

        // format month as a date
        dataset.forEach(function(d) {
            d.month = d3.time.format("%Y-%m").parse(d.month);
        });

        // sort dataset by month
        dataset.sort(function(x, y){
        return d3.ascending(x.month, y.month);
        });





        dataset = [];
        if (visData) {
          var arr = visData.values[0].values[0].values;
          for(var i = 0; i < arr.length; i++) {
            var obj = {count: arr[i][1], month: new Date(arr[i][0])};
            dataset.push(obj);
          }
        }



  /*
   * ========================================================================
   *  sizing
   * ========================================================================
   */

  var optwidth        = 600;
  var optheight       = 370;



  var height_context = 30;

  // width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
  // height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
  fullWidth = commonFunctions.gridAwareWidthFunc(false, containerNode, element, margins);
  fullHeight = commonFunctions.gridAwareHeightFunc(false, containerNode, element, margins);

  /* === Focus chart === */
  var margin	= {top: 20, right: 30, bottom: height_context + 20 + 50, left: 20},
      width	= optwidth - margin.left - margin.right,
      height	= optheight - margin.top - margin.bottom;

  width = fullWidth - margin.left - margin.right,
  height = fullHeight - margin.top - margin.bottom;

  if (width < 100 || height < 100) {
    return;
  }


  /* === Context chart === */
  var margin_context = {top: (fullHeight - height_context - 50), right: 30, bottom: 20, left: 20};



        /*
        * ========================================================================
        *  x and y coordinates
        * ========================================================================
        */

        // the date range of available data:
        var dataXrange = d3.extent(dataset, function(d) { return d.month; });
        var dataYrange = [0, d3.max(dataset, function(d) { return d.count; })];

        // maximum date range allowed to display
        var mindate = dataXrange[0],  // use the range of the data
            maxdate = dataXrange[1];

        var DateFormat	  =  d3.time.format("%b %Y");

        var dynamicDateFormat = timeFormat([
            [d3.time.format("%Y"), function() { return true; }],// <-- how to display when Jan 1 YYYY
            [d3.time.format("%b %Y"), function(d) { return d.getMonth(); }],
            [function(){return "";}, function(d) { return d.getDate() != 1; }]
        ]);

        // var dynamicDateFormat =  timeFormat([
        //     [d3.time.format("%Y"), function() { return true; }],
        //     [d3.time.format("%b"), function(d) { return d.getMonth(); }],
        //     [function(){return "";}, function(d) { return d.getDate() != 1; }]
        // ]);

        /* === Focus Chart === */

        var x = d3.time.scale()
            .range([0, (width)])
            .domain(dataXrange);

        var y = d3.scale.linear()
            .range([height, 0])
            .domain(dataYrange);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
                .tickSize(-(height))
            .ticks(customTickFunction)
            .tickFormat(dynamicDateFormat);

        var yAxis = d3.svg.axis()
            .scale(y)
            .ticks(4)
            .tickSize(-(width))
            .orient("right");

        /* === Context Chart === */

        var x2 = d3.time.scale()
            .range([0, width])
            .domain([mindate, maxdate]);

        var y2 = d3.scale.linear()
            .range([height_context, 0])
            .domain(y.domain());

        var xAxis_context = d3.svg.axis()
            .scale(x2)
            .orient("bottom")
            .ticks(customTickFunction)
            .tickFormat(dynamicDateFormat);

        /*
        * ========================================================================
        *  Plotted line and area variables
        * ========================================================================
        */

        /* === Focus Chart === */

        var line = d3.svg.line()
            .x(function(d) { return x(d.month); })
            .y(function(d) { return y(d.count); });

        var area = d3.svg.area()
        .x(function(d) { return x(d.month); })
        .y0((height))
        .y1(function(d) { return y(d.count); });

        /* === Context Chart === */

        var area_context = d3.svg.area()
            .x(function(d) { return x2(d.month); })
            .y0((height_context))
            .y1(function(d) { return y2(d.count); });

        var line_context = d3.svg.line()
            .x(function(d) { return x2(d.month); })
            .y(function(d) { return y2(d.count); });

        /*
        * ========================================================================
        *  Variables for brushing and zooming behaviour
        * ========================================================================
        */

        var brush = d3.svg.brush()
            .x(x2)
            .on("brush", brushed)
            .on("brushend", brushend);

        var zoom = d3.behavior.zoom()
            .on("zoom", draw)
            .on("zoomend", brushend);

        /*
        * ========================================================================
        *  Define the SVG area ("vis") and append all the layers
        * ========================================================================
        */

        // === the main components === //





        var vis = svg
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .attr("transform", "translate(0, 20)")
            .attr("class", "metric-chart"); // CB -- "line-chart" -- CB //


        vis.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);
            // clipPath is used to keep line and area from moving outside of plot area when user zooms/scrolls/brushes

        var context = vis.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin_context.left + "," + margin_context.top + ")");

        var focus = vis.append("g")
            .attr("class", "focus")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var rect = vis.append("svg:rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(zoom)
            .call(draw);

        // === current date range text & zoom buttons === //

        var display_range_group = vis.append("g")
            .attr("id", "buttons_group")
            .attr("transform", "translate(" + 0 + ","+ 0 +")");

        var expl_text = display_range_group.append("text")
            .text("Showing data from: ")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 0 + ","+ 10 +")");

        display_range_group.append("text")
            .attr("id", "displayDates")
            .text(DateFormat(dataXrange[0]) + " - " + DateFormat(dataXrange[1]))
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 82 + ","+ 10 +")");

        var expl_text = display_range_group.append("text")
            .text("Zoom to: ")
            .style("text-anchor", "start")
            .attr("transform", "translate(" + 180 + ","+ 10 +")");

        // === the zooming/scaling buttons === //

        var button_width = 40;
        var button_height = 14;

        // don't show year button if < 1 year of data
        var dateRange  = dataXrange[1] - dataXrange[0],
            ms_in_year = 31540000000;

        if (dateRange < ms_in_year)   {
            var button_data =["month","data"];
        } else {
            var button_data =["year","month","data"];
        };

        var button = display_range_group.selectAll("g")
            .data(button_data)
            .enter().append("g")
            .attr("class", "scale_button")
            .attr("transform", function(d, i) { return "translate(" + (220 + i*button_width + i*10) + ",0)"; })
            .on("click", scaleDate);

        button.append("rect")
            .attr("width", button_width)
            .attr("height", button_height)
            .attr("rx", 1)
            .attr("ry", 1);

        button.append("text")
            .attr("dy", (button_height/2 + 3))
            .attr("dx", button_width/2)
            .style("text-anchor", "middle")
            .text(function(d) { return d; });

        /* === focus chart === */

        focus.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .attr("transform", "translate(" + (width) + ", 0)");

        focus.append("path")
            .datum(dataset)
            .attr("class", "area")
            .attr("d", area);

        focus.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        focus.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line);

        /* === context chart === */

        context.append("path")
            .datum(dataset)
            .attr("class", "area")
            .attr("d", area_context);

        context.append("path")
            .datum(dataset)
            .attr("class", "line")
            .attr("d", line_context);

        context.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height_context + ")")
            .call(xAxis_context);

        /* === brush (part of context chart)  === */

        var brushg = context.append("g")
            .attr("class", "x brush")
            .call(brush);

        brushg.selectAll(".extent")
        .attr("y", -6)
        .attr("height", height_context + 8);
        // .extent is the actual window/rectangle showing what's in focus

        brushg.selectAll(".resize")
            .append("rect")
            .attr("class", "handle")
            .attr("transform", "translate(0," +  -3 + ")")
            .attr('rx', 2)
            .attr('ry', 2)
            .attr("height", height_context + 6)
            .attr("width", 3);

        brushg.selectAll(".resize")
            .append("rect")
            .attr("class", "handle-mini")
            .attr("transform", "translate(-2,8)")
            .attr('rx', 3)
            .attr('ry', 3)
            .attr("height", (height_context/2))
            .attr("width", 7);
            // .resize are the handles on either size
            // of the 'window' (each is made of a set of rectangles)

        /* === y axis title === */

        vis.append("text")
            .attr("class", "y axis title")
            .text("Monthly " + this.metricName)
            .attr("x", (-(height/2)))
            .attr("y", 0)
            .attr("dy", "1em")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle");

        // allows zooming before any brush action
        zoom.x(x);


       /*
        * ========================================================================
        *  Functions
        * ========================================================================
        */

        // === tick/date formatting functions ===
        // from: https://stackoverflow.com/questions/20010864/d3-axis-labels-become-too-fine-grained-when-zoomed-in

        function timeFormat(formats) {
        return function(date) {
            var i = formats.length - 1, f = formats[i];
            while (!f[1](date)) f = formats[--i];
            return f[0](date);
        };
        };

        function customTickFunction(t0, t1, dt)  {
            var labelSize = 42; //
            var maxTotalLabels = Math.floor(width / labelSize);

            function step(date, offset)
            {
                date.setMonth(date.getMonth() + offset);
            }

            var time = d3.time.month.ceil(t0), times = [], monthFactors = [1,3,4,12];

            while (time < t1) times.push(new Date(+time)), step(time, 1);
            var timesCopy = times;
            var i;
            for(i=0 ; times.length > maxTotalLabels ; i++)
                times = _.filter(timesCopy, function(d){
                    return (d.getMonth()) % monthFactors[i] == 0;
                });

            return times;
        };

        // === brush and zoom functions ===

        function brushed() {

            x.domain(brush.empty() ? x2.domain() : brush.extent());
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            // Reset zoom scale's domain
            zoom.x(x);
            updateDisplayDates();
            setYdomain();

        };

        function draw() {
            setYdomain();
            focus.select(".area").attr("d", area);
            focus.select(".line").attr("d", line);
            focus.select(".x.axis").call(xAxis);
            //focus.select(".y.axis").call(yAxis);
            // Force changing brush range
            brush.extent(x.domain());
            vis.select(".brush").call(brush);
            // and update the text showing range of dates.
            updateDisplayDates();
        };

        function brushend() {
        // when brush stops moving:

            // check whether chart was scrolled out of bounds and fix,
            var b = brush.extent();
            var out_of_bounds = brush.extent().some(function(e) { return e < mindate | e > maxdate; });
            if (out_of_bounds){ b = moveInBounds(b) };

        };

        function updateDisplayDates() {
            var b = brush.extent();

            // update the text that shows the range of displayed dates
            var minTime = brush.empty() ? dataXrange[0] : b[0],
                maxTime = brush.empty() ? dataXrange[1] : b[1];

            var localBrushDateStart = DateFormat(minTime),
                localBrushDateEnd   = DateFormat(maxTime);

            var selection = [{ minTime: minTime.toISOString(), maxTime: maxTime.toISOString() }];
            stroom.select(selection);

            // Update start and end dates in upper right-hand corner
            d3.select("#displayDates")
                .text(localBrushDateStart == localBrushDateEnd ? localBrushDateStart : localBrushDateStart + " - " + localBrushDateEnd);
        };

        function moveInBounds(b) {
        // move back to boundaries if user pans outside min and max date.

            var ms_in_year = 31536000000,
                brush_start_new,
                brush_end_new;

            if       (b[0] < mindate)   { brush_start_new = mindate; }
            else if  (b[0] > maxdate)   { brush_start_new = new Date(maxdate.getTime() - ms_in_year); }
            else                        { brush_start_new = b[0]; };

            if       (b[1] > maxdate)   { brush_end_new = maxdate; }
            else if  (b[1] < mindate)   { brush_end_new = new Date(mindate.getTime() + ms_in_year); }
            else                        { brush_end_new = b[1]; };

            brush.extent([brush_start_new, brush_end_new]);

            brush(d3.select(".brush").transition());
            brushed();
            draw();

            return(brush.extent())
        };

        function setYdomain(){
        // this function dynamically changes the y-axis to fit the data in focus

            // get the min and max date in focus
            var xleft = new Date(x.domain()[0]);
            var xright = new Date(x.domain()[1]);

            // a function that finds the nearest point to the right of a point
            var bisectDate = d3.bisector(function(d) { return d.month; }).right;

            // get the y value of the line at the left edge of view port:
            var iL = bisectDate(dataset, xleft);

            if (dataset[iL] !== undefined && dataset[iL-1] !== undefined) {

                var left_dateBefore = dataset[iL-1].month,
                    left_dateAfter = dataset[iL].month;

                var intfun = d3.interpolateNumber(dataset[iL-1].count, dataset[iL].count);
                var yleft = intfun((xleft-left_dateBefore)/(left_dateAfter-left_dateBefore));
            } else {
                var yleft = 0;
            }

            // get the x value of the line at the right edge of view port:
            var iR = bisectDate(dataset, xright);

            if (dataset[iR] !== undefined && dataset[iR-1] !== undefined) {

                var right_dateBefore = dataset[iR-1].month,
                    right_dateAfter = dataset[iR].month;

                var intfun = d3.interpolateNumber(dataset[iR-1].count, dataset[iR].count);
                var yright = intfun((xright-right_dateBefore)/(right_dateAfter-right_dateBefore));
            } else {
                var yright = 0;
            }

            // get the y values of all the actual data points that are in view
            var dataSubset = dataset.filter(function(d){ return d.month >= xleft && d.month <= xright; });
            var countSubset = [];
            dataSubset.map(function(d) {countSubset.push(d.count);});

            // add the edge values of the line to the array of counts in view, get the max y;
            countSubset.push(yleft);
            countSubset.push(yright);
            var ymax_new = d3.max(countSubset);

            if(ymax_new == 0){
                ymax_new = dataYrange[1];
            }

            // reset and redraw the yaxis
            y.domain([0, ymax_new*1.05]);
            focus.select(".y.axis").call(yAxis);

        };

        function scaleDate(d,i) {
        // action for buttons that scale focus to certain time interval

            var b = brush.extent(),
                interval_ms,
                brush_end_new,
                brush_start_new;

            if      (d == "year")   { interval_ms = 31536000000}
            else if (d == "month")  { interval_ms = 2592000000 };

            if ( d == "year" | d == "month" )  {

                if((maxdate.getTime() - b[1].getTime()) < interval_ms){
                // if brush is too far to the right that increasing the right-hand brush boundary would make the chart go out of bounds....
                    brush_start_new = new Date(maxdate.getTime() - interval_ms); // ...then decrease the left-hand brush boundary...
                    brush_end_new = maxdate; //...and set the right-hand brush boundary to the maxiumum limit.
                } else {
                // otherwise, increase the right-hand brush boundary.
                    brush_start_new = b[0];
                    brush_end_new = new Date(b[0].getTime() + interval_ms);
                };

            } else if ( d == "data")  {
                brush_start_new = dataXrange[0];
                brush_end_new = dataXrange[1]
            } else {
                brush_start_new = b[0];
                brush_end_new = b[1];
            };

            brush.extent([brush_start_new, brush_end_new]);

            // now draw the brush to match our extent
            brush(d3.select(".brush").transition());
            // now fire the brushstart, brushmove, and brushend events
            brush.event(d3.select(".brush").transition());
        };


































    }
  };

  this.resize = function() {
    update();
    // commonFunctions.resize(grid, update, element, margins, width, height);
  };

  this.teardown = function() {
    // if (typeof(tip) != "undefined"){
    //   tip.destroy();
    // }
  };

  this.getColourScale = function(){
    return colour;
  };

  //The position in the vaules array that will be used for the legend key, null
  //means it is series based
  this.getLegendKeyField = function() {
    return null;
  };
};