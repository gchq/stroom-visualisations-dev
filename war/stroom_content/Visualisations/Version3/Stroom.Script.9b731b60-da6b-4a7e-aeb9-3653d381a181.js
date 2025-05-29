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
 * Produces a grid of 'stroom' logos using each of the colours in the
 * categoryGoogle colour range.
 */

if (!visualisations) {
    var visualisations = {};
}
//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    visualisations.Stroom = function() {


        var d3 = window.d3;
        this.element = window.document.createElement("div");
        var grid = new visualisations.GenericGrid(this.element);

        this.start = function() {
            //TODO do we need this?
            svg.selectAll(".text-value")
                .remove();
        }

        //Method to allow the grid to call back in to get new instances for each cell
        this.getInstance = function(containerNode) {
            return new visualisations.Stroom.Visualisation(containerNode);
        };

        //Public method for setting the data on the visualisation(s) as a whole
        //This is the entry point from Stroom
        this.setData = function(context, settings, data) {

            if (data && data !==null) {
                //#########################################################
                //Perform any visualisation specific data manipulation here
                //#########################################################

                if (settings) {

                    settings.requiresLegend = false;

                    //Inspect settings to determine which axes to synch, if any.
                    //Change the settings property(s) used according to the vis
                    var synchedFields = [];
                    var visSpecificState = {};

                    //Get grid to construct the grid cells and for each one call back into a 
                    //new instance of this to build the visualisation in the cell
                    //The last array arg allows you to synchronise the scales of fields
                    grid.buildGrid(context, settings, data, this, commonConstants.transitionDuration, synchedFields, visSpecificState);
                }
            }
        };

        this.resize = function() {
            grid.resize();
        };

        this.getLegendKeyField = function() {
            return 0;
        };

    };

    //This is the content of the visualisation inside the containerNode
    //One instance will be created per grid cell
    visualisations.Stroom.Visualisation = function(containerNode) {

        var element = containerNode;
        var margins = commonConstants.margins();

        var width;
        var height;
        var canvas;
        var svg ;
        // Add the series data.
        var seriesContainer;
        var visData;
        var visSettings;
        var visContext;

        canvas = d3.select(element)
            .append("svg:svg")
            .attr("width", "31.623142in")
            .attr("height", "8.5767975in")
            .attr("viewBox", "0 0 2276.8645 617.52817");

        svg = canvas.append("svg:g");


        // Add the series data.
        seriesContainer = svg.append("svg:g")
            .attr("class", "vis-series");

        //Public entry point for the Grid to call back in to set the cell level data on the cell level 
        //visualisation instance.
        //data will only contain the branch of the tree for this cell
        this.setDataInsideGrid = function(context, settings, data) {
            visData = data;
            visContext = context;
            visSettings = settings;
            update(0);
        };

        var update = function(duration) {
            if (visData) {
                width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
                height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);
                fullWidth = commonFunctions.gridAwareWidthFunc(false, containerNode, element);
                fullHeight = commonFunctions.gridAwareHeightFunc(false, containerNode, element);

                canvas
                    .attr("width", fullWidth)
                    .attr("height", fullHeight);

                svg.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

                var fillColour = visData.values[0][0];

                var g = seriesContainer.selectAll(".stroom-word")
                    .data(visData.values);

                var wordGroup = g.enter()
                    .append("svg:g")
                    .attr("class","stroom-word")

                wordGroup
                    .append("svg:path")
                    .attr("d", "m 919.46444,205.40846 c 35.3,-0.13 64.3,9 84.49996,17.91 -26.30996,14.4 -47.96146,31.6101 -68.97646,60.79156 -88.2345,-5.75375 -143.5235,56.29844 -143.5235,127.29844 l 0,206 -78,0 0,-206 c 0,-114 93,-206 206,-206");

                wordGroup
                    .append("svg:path")
                    .attr("d", "m 1238.4644,411.40846 c 0,-71 -58,-129 -129,-129 -71,0 -128.99996,58 -128.99996,129 0,71 57.99996,128 128.99996,128 71,0 129,-57 129,-128 z m 77,0 c 0,113 -92,206 -206,206 -113.99996,0 -205.99996,-93 -205.99996,-206 0,-114 92,-206 205.99996,-206 114,0 206,92 206,206 z");

                wordGroup
                    .append("svg:path")
                    .attr("d", "m 1573.4644,411.40846 c 0,-71 -58,-129 -129,-129 -71,0 -129,58 -129,129 0,71 58,128 129,128 71,0 129,-57 129,-128 z m 77,0 c 0,113 -92,206 -206,206 -114,0 -206,-93 -206,-206 0,-114 92,-206 206,-206 114,0 206,92 206,206 z");

                wordGroup
                    .append("svg:path")
                    .attr("d", "m 1736.8644,617.40846 -78,0 0,-238 c 0,-96 78,-174 174,-174 55,0 103,25 135,65 32,-40 81,-65 136,-65 96,0 173,78 173,174 l 0,238 -77,0 0,-238 c 0,-53 -43,-97 -96,-97 -54,0 -97,44 -97,97 l 0,238 -77,0 0,-238 c 0,-53 -44,-97 -97,-97 -53,0 -96,44 -96,97 z");

                wordGroup
                    .append("svg:path")
                    .attr("d", "M 290.03,617.52814 0,617.48814 c 56.07819,-69.59882 128.96454,-76.70637 163.62084,-77.98 l 126.37916,0 c 25,0 45,-20 45,-45 0,-24 -20,-45 -45,-45 l -168,0 c -67,0 -122,-54.99998 -122,-121.99998 0,-68 55,-122 122,-122 l 333.66036,0 c -48.65449,15.41342 -80.63379,40.47448 -108.66772,76.65254 L 122,282.50816 c -25,0 -45,20 -45,45 0,25 20,45 45,45 l 168,0 c 67,0 122.00002,54.99998 122.00002,121.99998 0,68 -55.00002,123 -122.00002,123");
                
                wordGroup
                    .append("svg:path")
                    .attr("d", "m 524.46447,617.40846 77,0 m -240.05027,-335.02 c 26.96999,-33.73756 81.50696,-77.22295 162.41485,-76.7769 l 0.63542,-0.2031 0,-145.383322 c 26.58442,-34.83492 54.32953,-47.76208 77,-60.02587042125 l 0,205.40919242125 252.81997,0.01 c -36.0588,10.88698 -75.6717,32.13302 -109.3345,77.13 l -143.48859,-0.13688 0.003,334.99688 -77,0 0,-335 z");

                //Set the fill for all the letters
                wordGroup.selectAll("path")
                    .style("fill", fillColour);

            }
        };

        this.getColourScale = function(){
            return null;
        };

        this.teardown = function() {

        };
    };

}());

