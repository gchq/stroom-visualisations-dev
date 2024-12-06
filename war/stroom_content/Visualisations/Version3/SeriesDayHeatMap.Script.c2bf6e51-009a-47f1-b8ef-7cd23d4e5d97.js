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
visualisations.SeriesDayHeatMap = function() {
    var element = window.document.createElement("div");
    this.element = element;

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    var visSettings;
    var visContext;

    var transitionDuration = 750;

    var legendSpaceWidthFunc = function() {
        return Math.floor(element.clientWidth * 0.07);
    }

    var widthFunc = function() {
        return element.clientWidth - commonConstants.m[1] - commonConstants.m[3] - legendSpaceWidthFunc();
    }

    var heightFunc = function() {
        return element.clientHeight - commonConstants.m[0] - commonConstants.m[2];
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


    var dataPointKeyFunc = function(d) {
        //create a key for the dataItem such that it returns the mills of the hour since epoch
        return d[0] + (d[1] * commonConstants.millisInHour);
    }

    var pointMouseOverHandler = function (d) {

        var rootObj = this;

        d3.select(rootObj)
            .style("opacity", 0.5);
    }


    var pointMouseMoveHandler = function (d) {

        var rootObj = this;

        var highlightedPoint = d3.select(rootObj);
        var highlightedPointSeriesData = d3.select(rootObj.parentNode).datum();
        var highlightedPointData = highlightedPoint.datum();

        var highlightedSeriesName = highlightedPointSeriesData.key;
        var highlightedPointDayMs = d[2];
        var highlightedPointHour = d[0];
        var highlightedPointValue = d[1];

        var xValTxt = new Date(highlightedPointDayMs);
        var yValTxt = Math.round((highlightedPointValue + 0.00001) * 1000) / 1000;

        commonFunctions.addDataPointLabel(element, commonConstants.m, highlightedSeriesName, xValTxt, yValTxt);

        enableHandler = false;

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
    var bucketValues = [];

    this.setData = function(context, settings, d) {


        visContext = context;
        visSettings = settings;

        d.types[0] = "HOUR";

        //		d.values.forEach(function(d) {
        //			console.log("Series: " + d.key + " period start: " + new Date(d.min[0]) + " end: " + new Date(d.max[0]));
        //		});

        var seriesCount = d.values.length;

        for (var j = 0; j < seriesCount; j++){

            var arrLen = d.values[j].values.length;

            for (var i = 0; i < arrLen; i++){
                var eventDate = new Date(d.values[j].values[i][0]);
                var hourOfDay = eventDate.getHours();

                //console.log("time: " + eventDate + " val: " + cellValue + " hour: " + hourOfDay + " day: " + new Date(dayMs));

                //now re-arrange the data points so 0/x=hour, 1/y=cellValue, 2/x=event time in millis
                d.values[j].values[i][0] = hourOfDay; 
                d.values[j].values[i][2] = eventDate.getTime();
                //console.log("hourOfDay: " + hourOfDay + " day: " + new Date(dayMs) + " val: " + cellValue);
            }
        }

        //now build the legendData array based on the static colours array and newData
        bucketValues = commonFunctions.getBucketValues(d.min[1], d.max[1], buckets);

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

            var seriesOnChart = data.values.length;

            //always 24 hours in a day
            gridSizeX = Math.floor(width / 24);
            //work out the number of series in the data
            gridSizeY = Math.min(gridSizeX * 1.5, Math.floor(height / seriesOnChart));

            var legendElementWidth = gridSizeX / 3;
            var legendElementHeight = Math.floor(height / buckets);


            canvas.attr("width", element.clientWidth).attr("height",
                    element.clientHeight);

            svg.attr("transform", "translate(" + commonConstants.m[3] + "," + commonConstants.m[0] + ")");

            xAxisContainer.attr("transform", "translate(0," + height + ")");

            //xLegendContainer.attr("transform", "translate(0," + (height - legendElementHeight) + ")");

            var colourScale = d3.scale.threshold()
                .domain(bucketValues)
                .range(legendData);

            var fillFunc = function(d) { 
                if (d[1] == 0) {
                    return backgroundColour;
                } else {
                    //console.log("d.minute_count: " + d.minute_count + " colourScale(d.minute_count): " + colourScale(d.minute_count));
                    var legendDataPoint = colourScale(d[1]);

                    //we get undefined back if the value is essentially equal to the top of the range, e.g. if
                    //we have values 50,100,150 then d3 treats 150 as an exclusive threshold, so we make it inclusive
                    if (typeof legendDataPoint == 'undefined'){
                        return commonConstants.heatMapColours[buckets - 1];
                    } else {
                        //console.log("d.minute_count: " + d.minute_count + 
                        //      " colourScale(d.minute_count): " + colourScale(d.minute_count) + 
                        //      " colourScale(d.minute_count).rgbValue: " + colourScale(d.minute_count).rgbValue);
                        return colourScale(d[1]).rgbValue; 
                    }
                }
            }			

            var yAxisLength = Math.min(gridSizeY * seriesOnChart, height)

            xSettings = commonFunctions.createAxis(commonConstants.dataTypeNumber, 0, width);
            xScale = xSettings.scale;
            xSettings.setExplicitDomain([0,24]);
            commonFunctions.buildAxis(xAxisContainer, xSettings, "bottom", 24, null, visSettings.displayXAxis);

            ySettings = commonFunctions.createAxis(commonConstants.dataTypeText, height - yAxisLength, height);
            yScale = ySettings.scale;
            ySettings.setExplicitDomain(data.values.map(function(d) { return d.key }));
            commonFunctions.buildAxis(yAxisContainer, ySettings, "left", null, null, visSettings.displayYAxis);

            var g = seriesContainer.selectAll("g").data(data.values,
                    function(d) {
                        return d.key;
                    });
            var series = g.enter().append("svg:g");
            g.exit().transition().attr("opacity", "0").remove();

            g.each(function(d) {
                var e = d3.select(this);

                //use a key function that returns the millis since epoch of each cell so the transitions work correctly
                var series = e.selectAll("rect").data(d.values, function(d) { return d[0]; });

                series.enter().append("svg:rect").attr("class", "symbol")
                    .style("fill-opacity", 1e-6)
                    .attr("opacity", 1e-6);

                series.exit().transition()
                    .duration(transitionDuration)
                    .attr("opacity", "0")
                    .remove();

                series.each(function(point) {

                    var cell = d3.select(this);
                    var x = xScale(point[0]);
                    var y = yScale(d.key);

                    if (isNaN(x) || isNaN(y)) {
                        console.log("NaN - key: " + d.key + " point[0]: " + point[0] + " point[1]: " + point[1]);

                        //dumpPoint(point);
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
            });

            //add delegated mouse events to the series g element so it picks up all the mouse events of its children, i.e. the circles. 
            commonFunctions.addDelegateEvent(g, "mouseover", "rect", pointMouseOverHandler);
            commonFunctions.addDelegateEvent(g, "mousemove", "rect", pointMouseMoveHandler);
            commonFunctions.addDelegateEvent(g, "mouseout", "rect", pointMouseOutHandler);



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



            var xAxisBox = xAxisContainer.node().getBBox();
            var yAxisBox = yAxisContainer.node().getBBox();
            //var xLegendBox = xLegendContainer.node().getBBox();

            var xAxisHeight = Math.max(20, xAxisBox.height + 2);
            var yAxisWidth = Math.max(20, yAxisBox.width + 2);
            //var xLegendHeight = Math.max(20, xLegendBox.height + 2);

            if (commonConstants.m[2] != xAxisHeight || commonConstants.m[3] != yAxisWidth) {
                commonConstants.m[2] = xAxisHeight;
                //commonConstants.m[2] = xAxisHeight + xLegendHeight;
                commonConstants.m[3] = yAxisWidth;
                update();
            }
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
