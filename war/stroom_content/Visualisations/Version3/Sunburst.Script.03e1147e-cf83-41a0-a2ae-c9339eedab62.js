if (!visualisations) {
    var visualisations = {};
}

//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){
    var d3 = window.d3;
    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;
    var margins = commonConstants.margins();

    //Instantiated by Stroom
    visualisations.Sunburst = function(containerNode) {

        //Stroom creates a new iFrame for each visualisation so
        //create a div for the gridded visualisation to be built in
        var initialised = false;
        if (containerNode){
        var element = containerNode;
        } else {
        var element = window.document.createElement("div");
        }
        this.element = element;

        var grid = new visualisations.GenericGrid(this.element);
        var color, canvas, svg, width, height, radius, partition, arc;

        //Called by GenericGrid to create a new instance of the visualisation for each cell.
        this.getInstance = function(containerNode) {
            return new visualisations.Sunburst(containerNode);
        };

        //one off initialisation of all the local variables, including
        //appending various static dom elements
        var initialise = function() {
            initialised = true;
    
            width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
            height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
            radius = Math.min(width, height) / 2;
    
            canvas = d3.select(element).append("svg")
                .attr("width", width)
                .attr("height", height);
    
            svg = canvas.append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            
            color = d3.scale.category20c();
            partition = d3.layout.partition()
                .size([2 * Math.PI, radius])
                .value(function(d) { return d.value; });
    
            arc = d3.svg.arc()
                .startAngle(function(d) { return d.x; })
                .endAngle(function(d) { return d.x + d.dx; })
                .innerRadius(function(d) { return d.y; })
                .outerRadius(function(d) { return d.y + d.dy; });
        };

        //called by Stroom to pass snapshots of the data as it gathers the query results
        //context - an object containing any shared context between Stroom and the visualisation,
        //          e.g. a common colour scale could be used between multiple visualisations
        //settings - the object containing all the user configurable settings for the visualisation,
        //           e.g. showLabels, displayXAxis, etc.
        //d - the object tree containing all the data. Always contains all data currently available
        //    for a query.
        this.setData = function(context, settings, d) {
            if (context) {
                if (context.color) {
                  color = context.color;
                } else {
                  context.color = color;
                }
            }
      
            if (settings){
              //Inspect settings to determine which axes to synch, if any.
              //Change the settings property(s) used according to the vis
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
                  context.color = colour;
              } else {
                  //ensure there is no colour scale in the context so each grid cel vis can define its own
                  delete context.color;
              }
            
              //Get grid to construct the grid cells and for each one call back into a
              //new instance of this to build the visualisation in the cell
              //The last array arg allows you to synchronise the scales of fields
              grid.buildGrid(context, settings, d, this, commonConstants.transitionDuration, synchedFields);
            }
        }

        //called by Stroom to instruct the visualisation to redraw itself in a resized container
        this.resize = function() {
            commonFunctions.resize(grid, update, element, margins, width, height);
        };

        //Called by GenericGrid to establish which position in the values array
        //(or null if it is the series key) is used for the legend.
        this.getLegendKeyField = function() {
            return null;
        };
    

        //called by GenercGrid to build/update a visualisation inside a grid cell
        //context - an object containing any shared context between Stroom and the visualisation,
        //          e.g. a common colour scale could be used between multiple visualisations.
        //          Also can be used by the grid to pass state down to each cell
        //settings - the object containing all the user configurable settings for the visualisation,
        //           e.g. showLabels, displayXAxis, etc.
        //data - the object tree containing all the data for that grid cell. Always contains all data 
        //       currently available for a query.
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
    
            if (data) {
                update(500, data.values[0], settings);
            }
        };

        var update = function(duration, d, visSettings) {

            width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
            height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
            radius = Math.min(width, height) / 2;

            svg.selectAll("*").remove();
            var nodes = partition.nodes(d.values[0]);

            canvas = d3.select(element).append("svg")
                .attr("width", width)
                .attr("height", height);
    
            svg = canvas.append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
            
            color = d3.scale.category20c();
            partition = d3.layout.partition()
                .size([2 * Math.PI, radius])
                .value(function(d) { return d.value; });
    
            arc = d3.svg.arc()
                .startAngle(function(d) { return d.x; })
                .endAngle(function(d) { return d.x + d.dx; })
                .innerRadius(function(d) { return d.y; })
                .outerRadius(function(d) { return d.y + d.dy; });

            var path = svg.selectAll("path")
                .data(nodes)
                .enter().append("path")
                .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
                .attr("d", arc)
                .style("stroke", "#fff")
                .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
                .style("fill-rule", "evenodd")
                .each(function(d) { d._current = d; }) // store the initial angles
                .on("click", click);

            // Append labels to each slice conditionally based on fit
            path.each(function(d) {
                var pathNode = d3.select(this);

                if (commonFunctions.isTrue(visSettings.showLabels)) {
                    // Calculate the centroid and available arc width
                    var centroid = arc.centroid(d);
                    var startAngle = d.x;
                    var endAngle = d.x + d.dx;
                    var innerRadius = d.y;
                    var outerRadius = d.y + d.dy;
                    var arcLength = (endAngle - startAngle) * (outerRadius + innerRadius) / 2;

                    // Create a temporary text element to measure the text width
                    var tempText = svg.append("text")
                        .attr("class", "temp-text")
                        .attr("text-anchor", "middle")
                        .style("font-size", "20px")
                        .style("visibility", "hidden")
                        .text(function() {
                            if (d.name != null) {
                                return commonFunctions.autoFormat(d.name, visSettings.nameDateFormat);
                            } else {
                                return commonFunctions.autoFormat(d.series, visSettings.seriesDateFormat);
                            }
                        });

                    var textWidth = tempText.node().getComputedTextLength();

                    // Remove the temporary text element
                    tempText.remove();

                    // Render the label only if it fits within the arc
                    if (textWidth < arcLength) {
                        svg.append("text")
                            .attr("transform", "translate(" + centroid[0] + "," + centroid[1] + ")")
                            .attr("text-anchor", "middle")
                            .attr("dy", ".35em")
                            .style("pointer-events", "none")
                            .style("font-size", "20px")
                            .style("text-rendering", "geometricPrecision")
                            .text(function() {
                                if (d.name != null) {
                                    return commonFunctions.autoFormat(d.name, visSettings.nameDateFormat);
                                } else {
                                    return commonFunctions.autoFormat(d.series, visSettings.seriesDateFormat);
                                }
                            });
                    }
                }
            });

            path.append("title")
                .text(function(d) { return d.name + "\n" + d.value; });

            function click(d) {
                svg.transition()
                    .duration(duration)
                    .tween("scale", function() {
                        var xd = d3.interpolate(svg.x.domain(), [d.x, d.x + d.dx]),
                            yd = d3.interpolate(svg.y.domain(), [d.y, 1]),
                            yr = d3.interpolate(svg.y.range(), [d.y ? 20 : 0, radius]);
                        return function(t) { svg.x.domain(xd(t)); svg.y.domain(yd(t)).range(yr(t)); };
                    })
                    .selectAll("path")
                    .attrTween("d", function(d) { return function() { return arc(d); }; });
            }

            // commonFunctions.addDelegateEvent(svg, "mouseover", "path", inverseHighlight.makeInverseHighlightMouseOverHandler(null, nodes.types, svg, "path"));
            // commonFunctions.addDelegateEvent(svg, "mouseout", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
            // commonFunctions.addDelegateEvent(svg, "click", "path", inverseHighlight.makeInverseHighlightMouseClickHandler(svg, "path"));

            // commonFunctions.addDelegateEvent(svg, "mousewheel", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
            // commonFunctions.addDelegateEvent(svg, "mousedown", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
        };

        // Used to provide the visualisation's D3 colour scale to the grid
        this.getColourScale = function() {
            return color;
        };

    };

}());