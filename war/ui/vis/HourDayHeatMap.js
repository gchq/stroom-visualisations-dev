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
/*
 * Visulisation to display a day/hour heat map with the following dimensions:
 * x -           the hour of the day
 * y -           the day
 * cell colour - the value for that hour
 * 
 * Data is expected in the form of two dimensions, a millisecond time value truncated to the last hour (e.g. 23:00:00.000) (0) and the value at that time (1).  It
 * does not support multiple entries with the same time value.  Data should be truncated and aggregated before being passed to this visualisation.
 * 
 */



if (!visualisations) {
    var visualisations = {};
}
visualisations.HourDayHeatMap = function() {
    var element = window.document.createElement("div");
    this.element = element;

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    var visSettings;
    var visContext;

    var margins = commonConstants.margins();

    //ensure we have the correct instance of d3
    var d3 = window.d3;

    var transitionDuration = 750;

    var legendSpaceWidthFunc = function() {
        return Math.floor(element.clientWidth * 0.07);
    }

    var widthFunc = function() {
        return element.clientWidth - margins.right - margins.left - legendSpaceWidthFunc();
    }

    var heightFunc = function() {
        return element.clientHeight - margins.top - margins.bottom;
    }

    var legendXPosFunc = function() {
        return width + (legendSpaceWidthFunc() * 0.1);
    }

    var cellRadiusFunc = function(gridSizeX) {
        return Math.round(gridSizeX * 0.2);
    }

    var highlightedStrokeWidthFunc = function(gridSizeX) {
        return Math.max(1, Math.round(gridSizeX * 0.06)) + "px";
    }


    var width = widthFunc();
    var height = heightFunc();


    var buckets = 9; 
    var backgroundColour = "#ffffff";
    var cellStrokeColour = "#ffffff";
    var cellStrokeColourHighlighted = "#000000";
    var cellStrokeWidth = "1px";


    var xSettings;
    var zSettings;
    var xScale;
    var yScale;
    var xAxis;
    var yAxis;
    var highlightedPath;

    var canvas = d3.select(element).append("svg:svg");

    var svg = canvas.append("svg:g");

    // Create a colour set.
    var colour = d3.scale.category20();

    // Add the series data.
    var seriesContainer = svg.append("svg:g").attr("class", "vis-series");

    // Add the x-axis.
    var xAxisContainer = svg.append("svg:g").attr("class",
            "vis-axis" + " xAxis");

    // Add the y-axis.
    var yAxisContainer = svg.append("svg:g").attr("class",
            "vis-axis" + " yAxis");

    // Add the y-axis.
    var xLegendContainer = svg.append("svg:g").attr("class",
            "vis-legend" + " xLegend");

    var minMaxContainer = svg.append("svg:g").attr("class",
            "vis-min-max");

    var dataPointKeyFunc = function(d) {
        //create a key for the dataItem such that it returns the mills of the hour since epoch
        return d[0] + (d[1] * commonConstants.millisInHour);
    }  

    var pointMouseOverHandler = function (d) {

        var rootObj = this;

        d3.select(rootObj)
            .style("opacity", 0.5);
    };	

    var pointMouseMoveHandler = function (d) {

        var rootObj = this;		

        var highlightedPoint = d3.select(rootObj);
        var highlightedPointData = highlightedPoint.datum();

        var highlightedPointDayMs;
        var highlightedPointHour;
        var highlightedPointValue;

        if (d.hasOwnProperty('type')){
            //dealing with a highlighted cell
            highlightedPointDayMs = d.values[1];
            highlightedPointHour = d.values[0];
            highlightedPointValue = d.values[2];
        }else {
            highlightedPointDayMs = d[1];
            highlightedPointHour = d[0];
            highlightedPointValue = d[2];
        }

        var xValTxt = new Date(highlightedPointDayMs + (highlightedPointHour * commonConstants.millisInHour));
        var yValTxt = Math.round((highlightedPointValue + 0.00001) * 1000) / 1000;

        commonFunctions.addDataPointLabel(element, margins, null, xValTxt, yValTxt);
    };	

    var pointMouseOutHandler = function (d) {
        var rootObj = this; 
        d3.select(rootObj)
            .style("opacity", 1);

        d3.select(element).select("div.vis-label").remove();    	
    };    

    var data;
    var legendData = [];
    var maxVal;
    var minMaxData = [];
    var bucketValues = [];
    var yAxisData = [];

    this.setData = function(context, settings, d) {

        visContext = context;
        visSettings = settings;

        //console.log("period start: " + new Date(d.min[0]) + " end: " + new Date(d.max[0]));

        /*
         * This is what we are trying to build
         * 
         * 0=x (hour), 1=y (day), 2=z (cell value), 3=y as a string
         * 
         * min
         * --0,1,2
         * max
         * --0,1,2
         * types
         * --0,1,2
         * values
         * --0
         * ----0,1,2,3
         * --1
         * ----0,1,2,3
         */

        //work out the new min and max values
        var minX = 0;
        var minY = commonFunctions.truncateToStartOfDay(d.min[0]);
        var minZ = d.min[1];

        var maxX = 23;
        var maxY = commonFunctions.truncateToStartOfDay(d.max[0]);
        var maxZ = d.max[1];

        //clear the array
        minMaxData = [];
        yAxisData = [];

        var arrLen = d.values.length;

        for (var i = 0; i < arrLen; i++){
            var cellValue = d.values[i][1];
            var eventDate = new Date(d.values[i][0]);
            //var hourOfDay = commonFunctions.pad(eventDate.getHours(),2);
            var hourOfDay = eventDate.getHours();
            var dayMs = commonFunctions.truncateToStartOfDay(eventDate.getTime());
            var dayStr = new Date(dayMs).toDateString();

            //console.log("time: " + eventDate + " val: " + cellValue + " hour: " + hourOfDay + " day: " + new Date(dayMs));

            //now re-arrange the data points so 0/x=hour, 1/y=day, 2/z=cellValue
            d.values[i][0] = hourOfDay; 
            d.values[i][1] = dayMs;
            d.values[i][2] = cellValue;
            d.values[i][3] = dayStr;
            //console.log("hourOfDay: " + hourOfDay + " day: " + new Date(dayMs) + " val: " + cellValue);

            //capture the min and max values in a separate array object
            if (cellValue == minZ){
                minMaxData.push({type: "MIN", values: d.values[i]});
            } else if (cellValue == maxZ){
                minMaxData.push({type: "MAX", values: d.values[i]});
            }
        }

        //console.log(yAxisData);

        //build a contiguous ordered array of days for our y axis
        yAxisData = commonFunctions.generateContiguousTimeArray(
                minY,
                maxY,
                commonConstants.millisInDay,
                function(d) {return new Date(d).toDateString();  }
                );

        //re-arrange the types
        d.types[0] = "HOUR";
        d.types[1] = "DAY";
        d.types[2] = commonConstants.dataTypeNumber;

        d.min[0] = minX;
        d.min[1] = minY;
        d.min[2] = minZ;

        d.max[0] = maxX;
        d.max[1] = maxY;
        d.max[2] = maxZ;

        maxVal = maxZ;
        //console.log(d);

        //now build the legendData array based on the static colours array and newData
        bucketValues = commonFunctions.getBucketValues(minZ, maxZ, buckets);

        legendData = commonFunctions.buildHeatMapLegendData(bucketValues);

        data = d;		
        update();
    }


    var legendKeyFunc = function(d) {
        //return the array position in the colours array
        return d.bucket;
    }


    function dumpPoint(d){
        console.log("hourOfDay: " + d[0] + " dayMs: " + d[1] + " day: " + new Date(d[1]) + " val: " + d[2]);
    }

    var update = function() {
        if (data != null) {

            //console.log("min: " + data.min[2] + " max: " + data.max[2]);

            width = widthFunc();
            height = heightFunc();

            var daysOnChart = ((data.max[1] - data.min[1]) / commonConstants.millisInDay) + 1;

            //always 24 hours in a day
            gridSizeX = Math.floor(width / 24);
            //work out the number of days in the data and add one so we have a cell for the max entry
            gridSizeY = Math.min(gridSizeX * 1.5, Math.floor(height / daysOnChart));

            var legendElementWidth = gridSizeX / 3;
            var legendElementHeight = Math.floor(height / buckets);

            canvas
                .attr("width", element.clientWidth)
                .attr("height",element.clientHeight);

            svg.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

            xAxisContainer.attr("transform", "translate(0," + height + ")");

            //xLegendContainer.attr("transform", "translate(0," + (height - legendElementHeight) + ")");

            var colourScale = d3.scale.threshold()
                .domain(bucketValues)
                .range(legendData);

            var fillFunc = function(d) { 
                if (d[2] == 0) {
                    return backgroundColour;
                } else {
                    //console.log("d.minute_count: " + d.minute_count + " colourScale(d.minute_count): " + colourScale(d.minute_count));
                    var legendDataPoint = colourScale(d[2]);

                    //we get undefined back if the value is essentially equal to the top of the range, e.g. if
                    //we have values 50,100,150 then d3 treats 150 as an exclusive threshold, so we make it inclusive
                    if (typeof legendDataPoint == 'undefined'){
                        return commonConstants.heatMapColours[buckets - 1];
                    } else {
                        //console.log("d.minute_count: " + d.minute_count + 
                        //      " colourScale(d.minute_count): " + colourScale(d.minute_count) + 
                        //      " colourScale(d.minute_count).rgbValue: " + colourScale(d.minute_count).rgbValue);
                        return colourScale(d[2]).rgbValue; 
                    }
                }
            }			

            var yAxisLength = Math.min(gridSizeY * daysOnChart, height)

                xSettings = commonFunctions.createAxis(commonConstants.dataTypeNumber, 0, width);
            xScale = xSettings.scale;
            xSettings.setExplicitDomain([0,24]);
            commonFunctions.buildAxis(xAxisContainer, xSettings, "bottom", 24, null, visSettings.displayXAxis);

            ySettings = commonFunctions.createAxis(data.types[1], height - yAxisLength, height);
            yScale = ySettings.scale;
            ySettings.setExplicitDomain(yAxisData);
            commonFunctions.buildAxis(yAxisContainer, ySettings, "left", null, null, visSettings.displayYAxis);

            ////call the y axis and make the weekday labels bold
            yAxisContainer.transition()
                .duration(transitionDuration)
                .selectAll("text")
                .style("font-weight", function(d) {
                    if (d.indexOf("Sun") == 0 || d.indexOf("Sat") == 0){
                        return "normal";
                    }else{this
                        return "bold";	
                    }
                });
            if (commonFunctions.resizeMargins(margins, xAxisContainer, yAxisContainer) == true) {
                update();
            } else {

                //use a key function that returns the millis since epoch of each cell so the transitions work correctly
                var dataPoints = seriesContainer.selectAll("rect")
                    .data(
                            data.values, 
                            function(d) { 
                                //return the absolute millis of the hour of the cell
                                return d[1] + (d[0] * commonConstants.millisInHour); 
                            });		

                dataPoints.enter().append("svg:rect")
                    .attr("class", "symbol")
                    .style("fill-opacity", 1e-6)
                    .attr("opacity", 1e-6);

                dataPoints.exit().transition()
                    .duration(transitionDuration)
                    .attr("opacity", "0")
                    .remove();

                dataPoints.each(function(point) {

                    var cell = d3.select(this);
                    var x = xScale(point[0]);

                    //use the string version of the day axis
                    var y = yScale(point[3]);

                    if (isNaN(x) || isNaN(y)) {
                        dumpPoint(point);
                    }

                    cell.transition()
                        .duration(transitionDuration)
                        .attr("opacity", "1")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("rx", cellRadiusFunc(gridSizeX))
                        .attr("ry", cellRadiusFunc(gridSizeX))
                        .attr("width", gridSizeX)
                        .attr("height", gridSizeY)
                        .style("stroke-opacity", 1)
                        .style("fill", fillFunc(point))
                        .style("fill-opacity", 1)
                        .style("stroke", cellStrokeColour)
                        .style("stroke-width", cellStrokeWidth);
                });


                //handle the min and max cell highlighting

                var minMaxCells = minMaxContainer.selectAll("rect").data(minMaxData,
                        function(d) {
                            return (d.values[0] + (d.values[1] * commonConstants.millisInHour)) + "_" + d.type;
                        });

                minMaxCells.enter()
                    .append("svg:rect")
                    .attr("class", function(d) {return d.type.toLowerCase(); })
                    .style("fill-opacity", 0)
                    .attr("opacity", 1e-6);

                minMaxCells.exit().transition()
                    .duration(0)
                    .attr("opacity", "0")
                    .style("stroke-opacity", 0)
                    .remove();

                minMaxCells.transition()
                    .duration(transitionDuration * 2)  
                    .attr("opacity", "1")
                    .attr("x", function(d) {return xScale(d.values[0]); })
                    .attr("y", function(d) {return yScale(d.values[3]); })
                    .attr("rx", cellRadiusFunc(gridSizeX))
                    .attr("ry", cellRadiusFunc(gridSizeX))
                    .attr("width", gridSizeX)
                    .attr("height", gridSizeY)
                    .style("stroke-opacity", 1)
                    .style("stroke", function(d) {
                        return d.type == "MIN" ? "#00ff00" : "#ff0000"; 
                    })
                .style("stroke-width", highlightedStrokeWidthFunc(gridSizeX) );
                //.style("stroke-width", "10px" );


                //add delegated mouse events to the series container and minMax container so it picks up all the mouse events of its children, i.e. the rects. 
                commonFunctions.addDelegateEvent(seriesContainer, "mouseover", "rect", pointMouseOverHandler);
                commonFunctions.addDelegateEvent(seriesContainer, "mousemove", "rect", pointMouseMoveHandler);
                commonFunctions.addDelegateEvent(seriesContainer, "mouseout", "rect", pointMouseOutHandler);

                commonFunctions.addDelegateEvent(minMaxContainer, "mouseover", "rect", pointMouseOverHandler);
                commonFunctions.addDelegateEvent(minMaxContainer, "mousemove", "rect", pointMouseMoveHandler);
                commonFunctions.addDelegateEvent(minMaxContainer, "mouseout", "rect", pointMouseOutHandler);

                //display the legend blocks
                var legend = xLegendContainer.selectAll("rect").data(legendData,legendKeyFunc);

                legend.enter()
                    .append("rect")
                    .attr("class", "legendRect")
                    .style("stroke", "#444444")
                    .style("stroke-width", "1px");

                legend.transition()
                    .duration(transitionDuration)
                    .attr("x", width + (legendSpaceWidthFunc() * 0.05) )
                    .attr("y", function(d, i) { 
                        return height + (legendElementHeight * (-i - 1)) - 1; 
                    })
                .attr("width", legendElementWidth)
                    .attr("height", legendElementHeight)
                    .style("fill", function(d, i) { 
                        return commonConstants.heatMapColours[i]; 
                    });

                //now the legend text
                var legendText = xLegendContainer.selectAll("text").data(legendData,legendKeyFunc);

                legendText.enter()
                    .append("text")
                    .attr("class", "legendText mono");

                var legendTextValueFunction = function(d) { 
                    //console.log(d);
                    //console.log("d.thresholdValue; " + d.thresholdValue);
                    var val = d.thresholdValue;
                    var result = "";

                    if (val == 0) {
                        result = "> 0";
                    } else {
                        result = "<= " + commonFunctions.toSiUnits(val,3);
                    }

                    return result;
                }

                legendText.transition()
                    .duration(transitionDuration)
                    .text(legendTextValueFunction)
                    .attr("x", legendXPosFunc() + Math.floor(legendElementWidth * 1.1))
                    .attr("y", function(d, i) { 
                        return height + (legendElementHeight * -i) - Math.floor(legendElementHeight / 2) - 1; 
                    });

            }

            //var xAxisBox = xAxisContainer.node().getBBox();
            //var yAxisBox = yAxisContainer.node().getBBox();
            ////var xLegendBox = xLegendContainer.node().getBBox();

            //var xAxisHeight = Math.max(20, xAxisBox.height + 2);
            //var yAxisWidth = Math.max(20, yAxisBox.width + 2);
            ////var xLegendHeight = Math.max(20, xLegendBox.height + 2);

            //if (commonConstants.m[2] != xAxisHeight || commonConstants.m[3] != yAxisWidth) {
            //commonConstants.m[2] = xAxisHeight;
            ////commonConstants.m[2] = xAxisHeight + xLegendHeight;
            //commonConstants.m[3] = yAxisWidth;
            //update();
            //}
        }
    }

    this.resize = function() {
        var newWidth = element.clientWidth - commonConstants.m[1] - commonConstants.m[3];
        var newHeight = element.clientHeight - commonConstants.m[0] - commonConstants.m[2];

        if (newWidth != width || newHeight != height) {
            update();
        }
    }
}
