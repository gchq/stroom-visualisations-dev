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
visualisations.GriddedVisExample = function(containerNode) {

	var commonFunctions = visualisations.commonFunctions;
	var commonConstants = visualisations.commonConstants;

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

	var d3 = window.d3;
	var m = commonConstants.m;
	var width;
	var height;

	var xSettings;
	var ySettings;
	var xScale;
	var yScale;
	var xAxis;
	var yAxis;

	var canvas ;

	var svg ;
	var tip;
	var inverseHighlight;

	// Create a colour set.
	var colour ;

	// Add the series data.
	var seriesContainer ;

	// Add the x-axis.
	var xAxisContainer ;

	// Add the y-axis.
	var yAxisContainer ;

	var visData;

	//one off initialisation of all the local variables, including
	//appending various static dom elements
	var initialise = function() {
		initialised = true;

		width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
		height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);

		canvas = d3.select(element).append("svg:svg");

		svg = canvas.append("svg:g");

		if (typeof(tip) == "undefined") {
			inverseHighlight = commonFunctions.inverseHighlight();
			tip = inverseHighlight.tip();

			//optionally call methods on tip such as .direction, .offset, .html to customise it
		}

		// Create a colour set.
		colour = commonConstants.categoryGoogle();

		// Add the series data.
		seriesContainer = svg.append("svg:g").attr("class", "vis-series");

		// Add the x-axis.
		xAxisContainer = svg.append("svg:g").attr("class", "vis-axis" + " xAxis");

		// Add the y-axis.
		yAxisContainer = svg.append("svg:g").attr("class", "vis-axis" + " yAxis");
	}


	//Method to allow the grid to call back in to get new instances for each cell
	this.getInstance = function(containerNode) {
		return new visualisations.INSERT_VIS_NAME_HERE(containerNode);
	}
	
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
					context.color = colour;
				}
			}
			
			//#########################################################
			//Perform any visualisation specific data manipulation here
			//#########################################################

			if (settings) {
                            //Inspect settings to determine which axes to synch, if any.
                            //Change the settings property(s) used according to the vis
                            var synchedFields = [];
                            if (settings.synchXAxis && settings.synchXAxis.toLowerCase() == "true"){
                                synchedFields.push(0);
                            }

                            if (settings.synchYAxis && settings.synchYAxis.toLowerCase() == "true"){
                                synchedFields.push(1);
                            }

                            if (settings.synchSeries && settings.synchSeries.toLowerCase() == "true") {
                                //series are synched so setup the colour scale domain and add it to the context
                                //so it can be passed to each grid cell vis
                                commonFunctions.setColourDomain(colour, data, 0, "SYNCHED_SERIES");
                                context.color = colour;
                            } else {
                                //ensure there is no colour scale in the context so each grid cel vis can define its own
                                delete context.color;
                            }

                            //Get grid to construct the grid cells and for each one call back into a 
                            //new instance of this to build the visualisation in the cell
                            //The last array arg allows you to synchronise the scales of fields
                            grid.buildGrid(context, settings, data, this, commonConstants.transitionDuration, synchedFields);
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

		if (context) {
                        visContext = context;
                        //do stuff based on context here if you need to 
		}
		if (settings){
                        visSettings = settings;
                        //do stuff based on settings here if you need to 
		}

		visData = data;
		update(0);
	};

	var update = function(duration) {
		if (visData) {
			width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
			height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);
			fullWidth = commonFunctions.gridAwareWidthFunc(false, containerNode, element);
			fullHeight = commonFunctions.gridAwareHeightFunc(false, containerNode, element);

			canvas.attr("width", fullWidth).attr("height",
					fullHeight);
			svg.attr("transform", "translate(" + m[3] + "," + m[0] + ")");
			xAxisContainer.attr("transform", "translate(0," + height + ")");

                        xSettings = commonFunctions.createAxis(visData.types[0], 0, width);
                        xScale = xSettings.scale;
                        xSettings.setDomain(visData, visData.values[0].values, 0);
                        commonFunctions.buildAxis(xAxisContainer, xSettings, "bottom", null, null, visSettings.displayXAxis);

                        ySettings = commonFunctions.createAxis(visData.types[1], height, 0);
                        yScale = ySettings.scale;
                        ySettings.setDomain(visData, visData.values[0].values, 1);
                        commonFunctions.buildAxis(yAxisContainer, ySettings, "left", null, null, visSettings.displayYAxis);


                        //once the axis are fully built check if we need to resize to accomodate them
                        if (commonFunctions.resizeMargins(m, xAxisContainer, yAxisContainer) == true) {
                                update();
                        } else {
                            seriesContainer.call(tip);

                            //##################
                            //Build you vis here
                            //##################

                            /*
                               Use something like the following to had the mouse event handlers for hover tips

                               var cssSelector = ".myHoverableElement";
                               commonFunctions.addDelegateEvent(
                               seriesContainer, 
                               "mouseover",
                               cssSelector, 
                               inverseHighlight.makeInverseHighlightMouseOverHandler(seriesData.key, visData.types, seriesContainer,cssSelector));
                               commonFunctions.addDelegateEvent(
                               seriesContainer,
                               "mouseout",
                               cssSelector,
                               inverseHighlight.makeInverseHighlightMouseOutHandler(seriesContainer,cssSelector));
                               */
                        }

		}
	};

	this.resize = function() {
            commonFunctions.resize(grid, update, element, m, width, height);
	};

	this.teardown = function() {
		if (typeof(tip) != "undefined"){
			tip.destroy();
		}
	};

	this.getColourScale = function(){
		return colour;
	};
};
