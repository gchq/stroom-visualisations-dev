
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
//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){

    var d3 = window.d3;
    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    visualisations.HeatMap = function() {


        this.element = window.document.createElement("div");
        var grid = new visualisations.GenericGrid(this.element);
        var colour;

        //Method to allow the grid to call back in to get new instances for each cell
        this.getInstance = function(containerNode) {
            return new visualisations.HeatMap.Visualisation(containerNode);
        };

        //Public method for setting the data on the visualisation(s) as a whole
        //This is the entry point from Stroom
        this.setData = function(context, settings, data) {

            if (data && data !==null) {
                // If the context already has a colour set then use it, otherwise set it
                // to use this one.
                if (context) {
                    if (context.color) {
                        colour = context.color;
                    } else {
                        colour = createColourScale(settings);
                        context.color = colour;
                    }
                }
                //#########################################################
                //Perform any visualisation specific data manipulation here
                //#########################################################

                if (settings) {

                    settings.requiresLegend = false;

                    //Inspect settings to determine which axes to synch, if any.
                    //Change the settings property(s) used according to the vis
                    var synchedFields = [];

                    //Get grid to construct the grid cells and for each one call back into a 
                    //new instance of this to build the visualisation in the cell
                    //The last array arg allows you to synchronise the scales of fields
                    grid.buildGrid(context, settings, data, this, commonConstants.transitionDuration, synchedFields);
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
    visualisations.HeatMap.Visualisation = function(containerNode) {

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
            .append("svg:svg");

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


            }
        };

        this.getColourScale = function(){
            return null;
        };

        this.teardown = function() {

        };
    };

}());

