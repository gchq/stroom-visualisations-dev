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
visualisations.Scatter = function(containerNode) {
    var style = `
        .data-point{
            stroke-width: 1px;
            fill-opacity: 0.6;
            opacity: 0;
        }`

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

    var grid = new visualisations.GenericGrid(element);

    var margins = commonConstants.margins();
    var colour = commonConstants.categoryGoogle();
    var width;
    var height;

    var xSettings;
    var ySettings;
    var xScale;
    var yScale;
    var xAxis;
    var yAxis;
    var highlightedPath;

    var canvas ;

    var svg;
    var tip;
    var inverseHighlight;

    // Add the series data.
    var seriesContainer ;

    // Add the x-axis.
    var xAxisContainer ;

    // Add the y-axis.
    var yAxisContainer ;

    // Add a label to show information relating to the point marked
    // on the line.
    var label ;
    var labelX ;
    var labelY ;

    var visData;

    var initialise = function() {
        initialised = true;

        width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
        height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);

        canvas = d3.select(element).append("svg:svg");

        svg = canvas.append("svg:g");
        
        if (typeof(tip) == "undefined") {
            inverseHighlight = commonFunctions.inverseHighlight();

            inverseHighlight.toSelectionItem = function(d) {
                const selectedItem =  {
                     key: `${d[2]}~#~${d[0]},${d[1]}`,
                    series: d[2],
                    x: d[0],
                    y: d[1],
                };
                return selectedItem;
              }
              
            tip = inverseHighlight.tip()
                .html(function(tipData) {

                    var x = tipData.values[0];
                    if (tipData.types[0] == commonConstants.dataTypeDateTime){
                        if (visSettings.seriesDateFormat){
                            x = commonFunctions.autoFormat(x, visSettings.seriesDateFormat);
                        } else {
                            x = new Date(x).toISOString();
                        }

                    }
                    var html = inverseHighlight.htmlBuilder()
                        .addTipEntry("Series", commonFunctions.autoFormat(tipData.key, visSettings.seriesDateFormat))
                        .addTipEntry("x",commonFunctions.autoFormat(xSettings.getValue(x)))
                        .addTipEntry("y",commonFunctions.autoFormat(ySettings.getValue(tipData.values[1])))
                        .build();
                    return html;
                });
        }

        // Add the series data.
        seriesContainer = svg.append("svg:g")
            .attr("class", "vis-series");

        // Add the x-axis.
        xAxisContainer = svg.append("svg:g").attr("class", "vis-axis" + " xAxis");

        // Add the y-axis.
        yAxisContainer = svg.append("svg:g").attr("class", "vis-axis" + " yAxis");
    };

    this.getInstance = function(containerNode) {
        return new visualisations.Scatter(containerNode);
    };

    this.setData = function(context, settings, data) {

        if (data && data != null) {
            // If the context already has a colour set then use it, otherwise set it
            // to use this one.
            if (context) {
                if (context.color) {
                    colour = context.color;
                } 
            }

            if (settings) {

                var synchedFields = [];
                if (commonFunctions.isTrue(settings.synchXAxis)){
                    synchedFields.push(0);
                }
                if (commonFunctions.isTrue(settings.synchYAxis)){
                    synchedFields.push(1);
                }

                if (commonFunctions.isTrue(settings.synchSeries)) {
                    //series are synched so setup the colour scale domain and add it to the context
                    //so it can be passed to each grid cell vis
                    //commonFunctions.setColourDomain(colour, data, 0, "SYNCHED_SERIES");
                    context.color = colour;
                } else {
                    //ensure there is no colour scale in the context so each grid cel vis can define its own
                    delete context.color;
                }
                grid.buildGrid(context, settings, data, this, commonConstants.transitionDuration, synchedFields);
            }
        }
    };

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

        var mode = (settings.synchSeries && settings.synchSeries.toLowerCase() == "true") ? "SYNCHED_SERIES" : "SERIES";
        if (typeof(context) === "undefined" || typeof(context.color) === "undefined") {
            commonFunctions.setColourDomain(colour, data, 0, mode);
        }

        visData = data;
        update(commonConstants.transitionDuration);
    };

    var update = function(duration) {
        if (visData) {
            var visibleValues = visData.visibleValues();
            //console.log('update called series: ' + visData.key + ' valueCount:' + visibleValues.length);

            width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
            height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
            fullWidth = commonFunctions.gridAwareWidthFunc(false, containerNode, element, margins);
            fullHeight = commonFunctions.gridAwareHeightFunc(false, containerNode, element, margins);

            canvas.attr("width", fullWidth).attr("height",
                fullHeight);

            svg.attr("transform", "translate(" + margins.left + "," + margins.top + ")");
            xAxisContainer.attr("transform", "translate(0," + height + ")");

            xSettings = commonFunctions.createAxis(visData.types[0], 0, width);
            xScale = xSettings.scale;
            xSettings.setRangeDomain(visData.types[0], visData, 0);
            commonFunctions.buildAxis(xAxisContainer, xSettings, "bottom", null, null, visSettings.displayXAxis);

            ySettings = commonFunctions.createScaledAxis(visSettings.scaleYAxis, visData.types[1], height, 0);
            yScale = ySettings.scale;
            ySettings.setRangeDomain(visData.types[1], visData, 1);
            commonFunctions.buildAxis(yAxisContainer, ySettings, "left", null, null, visSettings.displayYAxis);

            if (commonFunctions.resizeMargins(margins, xAxisContainer, yAxisContainer) == true) {
                update();
            } else {

                //initialise the hover tip
                seriesContainer.call(tip);

                const data = visibleValues.map(function(d) {
                    const mappedData = d.values.map(function(v){
                        return [v[0], v[1], d.key];
                    });
                    const seriesData = {
                        key: d.key,
                        values: mappedData,
                    };
                    return seriesData;
                    
                });


                var g = seriesContainer
                    .selectAll("g")
                    .data(data, function(d) {
                        return d.key;
                    });

                var series = g.enter()
                    .append("svg:g")
                    .attr("id", function(d) { 
                        return d.key; 
                    });

                g.exit()
                    .transition()
                    .duration(duration)
                    .attr("opacity", "0")
                    .remove();

                g.each(function(seriesData) {
                    var seriesGroup = d3.select(this);
                    var seriesPoints = seriesGroup.selectAll("circle")
                        .data(seriesData.values, function(pointData) {
                            //console.log(seriesData.key + "~#~" + pointData[0]);
                            return seriesData.key + "~#~" + pointData[0] + "," + pointData[1];
                        });

                    var fillFunc = function(d){
                        return colour(seriesData.key);
                    };
                    var legendKeyFunc = function(d){
                        return seriesData.key;
                    };

                    const pointSize = visSettings && visSettings.pointSize?visSettings.pointSize:"4" +"px";
                    //Add new points
                    seriesPoints.enter()
                        .append("svg:circle")
                        .attr("stroke-width", "1px")
                        .style( "fill-opacity", 0.6)
                        .attr("r", pointSize)
                        .attr("opacity", "0")
                        .on("click", (d) =>{
                            console.log(`clicked on ${d} ${seriesData.key}`);
                        });

                    //Update new and existing points
                    seriesPoints
                        .attr("class", commonFunctions.makeColouredElementClassStringFunc(legendKeyFunc))
                        .attr("stroke", fillFunc(seriesData))
                        .attr("fill", fillFunc(seriesData))
                        .attr("r", pointSize)
                        .attr("cx", function(dataPoint) {
                            var xVal = xScale(dataPoint[0]);
                            // console.log("dataPoint[0]: " + dataPoint[0] + " xVal: " + xVal);
                            return xVal + "px";
                        })
                        .attr("cy", function(dataPoint) {
                            var yVal = yScale(dataPoint[1]);
                            if (!yVal){
                                yVal = dataPoint[1];
                            }
                            // console.log("dataPoint[1]: " + dataPoint[1] + "yVal: " + yVal);
                            return yVal + "px";
                        })
                        .transition() //TODO having transition before cx and cy seems to break it in grid mode, not sure why
                        .duration(duration)
                        .attr("opacity", ".8");

                    //remove redundant points
                    seriesPoints.exit()
                        .transition()
                        .duration(duration)
                        .attr("opacity", "0")
                        .remove();

                    commonFunctions.addDelegateEvent(
                        seriesGroup, 
                        "mouseover", 
                        ".vis-coloured-element", 
                        inverseHighlight.makeInverseHighlightMouseOverHandler(seriesData.key, visData.types, seriesContainer, ".vis-coloured-element"));
                    commonFunctions.addDelegateEvent(
                        seriesGroup, 
                        "mouseout", 
                        ".vis-coloured-element", 
                        inverseHighlight.makeInverseHighlightMouseOutHandler(seriesContainer, ".vis-coloured-element"));

                    commonFunctions.addDelegateEvent(seriesGroup, 
                        "click", ".vis-coloured-element", 
                        inverseHighlight.makeInverseHighlightMouseClickHandler(seriesContainer, ".vis-coloured-element"));
                });
            }
        }
    };

    this.resize = function() {
        commonFunctions.resize(grid, update, element, margins, width, height);
    }; 

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


