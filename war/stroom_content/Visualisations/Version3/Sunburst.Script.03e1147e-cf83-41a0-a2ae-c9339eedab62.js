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
        if (containerNode){
        var element = containerNode;
        } else {
        var element = window.document.createElement("div");
        }
        this.element = element;

        var grid = new visualisations.GenericGrid(this.element);
        var svg, width, height, radius, partition, arc, svgGroup, nodes, path, visSettings;
        var tip;
        var inverseHighlight;
        var stroomData;

        var color = commonConstants.categoryGoogle();

        var zoom = d3.behavior.zoom()
            .scaleExtent([0.5, 10])  // Adjust the scale extent as needed
            .on("zoom", zoomed);

        //Called by GenericGrid to create a new instance of the visualisation for each cell.
        this.getInstance = function(containerNode) {
            return new visualisations.Sunburst(containerNode);
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
        
            // If the context already has a colour set then use it
            if (context) {
                visContext = context;
                if (context.color) {
                    colour = context.color;
                }
            }
    
            if (data) {
                stroomData = data;
                update(500, data.values[0], settings);
            }
        };

        // Variable to store the expanded state
        let expandedNode = null;

        // Function to update the visualization
        var update = function(duration, d, settings) {
            visSettings = settings;

            // Calculate dimensions and radius
            width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
            height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
            radius = Math.min(width, height) / 2;

            d3.select(element).select("svg").remove();
            // Append new SVG
            svg = d3.select(element).append("svg")
                .attr("width", width)
                .attr("height", height);

            // Append a g element to the SVG for zoom and pan
            svgGroup = svg.append("g")
                .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

            // Apply zoom behavior to the g element
            svg.call(zoom);
            
            partition = d3.layout.partition()
                .size([2 * Math.PI, radius])
                .value(function(d) { return d.value; });

            arc = d3.svg.arc()
                .startAngle(function(d) { return d.x; })
                .endAngle(function(d) { return d.x + d.dx; })
                .innerRadius(function(d) { return d.y; })
                .outerRadius(function(d) { return d.y + d.dy; });

            // Update nodes based on the expanded state
            if (expandedNode) {
                nodes = partition.nodes(expandedNode);
            } else {
                nodes = partition.nodes(d.values[0]);
            }

            nodes.forEach(function(node) {
                node.visible = true;
            });

            if (typeof(tip) == "undefined") {
                inverseHighlight = commonFunctions.inverseHighlight();
    
                inverseHighlight.toSelectionItem = function(d) {
                //   console.log("selection");
                //   console.log(d);
                  var selection = {
                    key: d.name,
                    // series: d.series,
                    value: d.value,
                  };
                //   console.log(selection);
                  return selection;
                };
    
                tip = inverseHighlight.tip()
                    .html(function(tipData) {
                        var html = inverseHighlight.htmlBuilder()
                            .addTipEntry("Name",commonFunctions.autoFormat(tipData.values.name))
                            .addTipEntry("Value",commonFunctions.autoFormat(tipData.values.value))
                            .build();
                        return html;
                    });
            }

            svg.call(tip);

            path = svgGroup.selectAll("path")
                .data(nodes)
                .enter().append("path")
                .attr("display", null)
                .attr("d", arc)
                .style("stroke", "var(--vis__background-color)")
                .style("fill", function(d) {
                    // d.depth === 0 ? "var(--vis__background-color)" :
                    return color((d.children ? d : d.parent).name);
                })
                .style("fill-rule", "evenodd")
                .each(function(d) { d._current = d; })
                .on("click", function(d) {
                    if (d.depth == 0 && d.parent){
                        expandArc(d.parent);
                        update(500, d, visSettings);
                    }
                    else if (d.children && d.children.length > 0) {
                        expandArc(d);
                        update(500, d, visSettings);
                    }
                });

            updateLabels();


            commonFunctions.addDelegateEvent(svg, "mouseover", "path", inverseHighlight.makeInverseHighlightMouseOverHandler(stroomData.key, stroomData.types, svg, "path"));
            commonFunctions.addDelegateEvent(svg, "mouseout", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));


            //as this vis supports scrolling and panning by mousewheel and mousedown we need to remove the tip when the user
            //pans or zooms
           commonFunctions.addDelegateEvent(svg, "mousewheel", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
           commonFunctions.addDelegateEvent(svg, "mousedown", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
        };

        function updateLabels() {
            svgGroup.selectAll("text.label").remove();
            svgGroup.selectAll("text.explode-button").remove();
            svgGroup.selectAll("text.back-button").remove();

            path.each(function(d) {
                if (d.visible && commonFunctions.isTrue(visSettings.showLabels)) {
                    var centroid = arc.centroid(d);
                    var startAngle = d.x;
                    var endAngle = d.x + d.dx;
                    var innerRadius = d.y;
                    var outerRadius = d.y + d.dy;
                    var arcLength = (endAngle - startAngle) * (outerRadius + innerRadius) / 2;
                    var scale = d3.event && d3.event.scale ? d3.event.scale : 1;
                    var fontSize = 13 / scale;

                    // Create a temporary text element to measure the text width
                    var tempText = svg.append("text")
                        .attr("class", "temp-text")
                        .attr("text-anchor", "middle")
                        .style("font-size", fontSize + "px")
                        .style("visibility", "hidden")
                        .text(function() {
                            if (d.name != null) {
                                return commonFunctions.autoFormat(d.name, visSettings.nameDateFormat);
                            } else {
                                return commonFunctions.autoFormat(d.series, visSettings.seriesDateFormat);
                            }
                        });

                    var textWidth = tempText.node().getComputedTextLength();

                    tempText.remove();

                    if (textWidth < arcLength) {
                        var angle = (startAngle + endAngle) / 2;
                        angle = angle * (180 / Math.PI) + 90; // Convert to degrees

                        // Adjust the angle to keep the text upright
                        if (angle > 90 && angle < 270) {
                            angle += 180;
                        }
                        if (d.depth == 0){
                            angle = 0;
                        }

                        svgGroup.append("text")
                            .attr("class", "label")
                            .attr("transform", "translate(" + centroid[0] + "," + centroid[1] + ") rotate(" + angle + ")")
                            .attr("text-anchor", "middle")
                            .attr("dy", ".35em")
                            .style("pointer-events", "none")
                            .style("font-size", fontSize + "px")
                            .style("text-rendering", "geometricPrecision")
                            .text(function() {
                                if (d.name != null) {
                                    return commonFunctions.autoFormat(d.name, visSettings.nameDateFormat);
                                } else {
                                    return commonFunctions.autoFormat(d.series, visSettings.seriesDateFormat);
                                }
                            });

                        // Has explode and back text links instead of clicking on arc to explode
                        // if (d.children && d.children.length > 0 && d.depth) {
                        //     svgGroup.append("text")
                        //         .attr("class", "explode-button")
                        //         .attr("transform", "translate(" + centroid[0] + "," + (centroid[1] + fontSize) + ") rotate(" + angle + ")")
                        //         .attr("text-anchor", "middle")
                        //         .attr("dy", ".35em")
                        //         .style("cursor", "pointer")
                        //         .style("font-size", fontSize + "px")
                        //         .style("fill", "blue")
                        //         .style("text-decoration", "underline")
                        //         .text("Explode")
                        //         .on("click", function() {
                        //             expandArc(d); // Explode action
                        //         });
                        // }

                        // if (d.depth === 0 && d.parent) {
                        //     svgGroup.append("text")
                        //         .attr("class", "back-button")
                        //         .attr("transform", "translate(" + centroid[0] + "," + (centroid[1] + fontSize) + ") rotate(" + angle + ")")
                        //         .attr("text-anchor", "middle")
                        //         .attr("dy", ".35em")
                        //         .style("cursor", "pointer")
                        //         .style("font-size", fontSize + "px")
                        //         .style("fill", "red")
                        //         .style("text-decoration", "underline")
                        //         .text("Back")
                        //         .on("click", function() {
                        //             expandArc(d.parent); // Collapse action
                        //             update(500, d, visSettings);
                        //         });
                        // }
                    }
                }
            });
        }

        function expandArc(d) {
            expandedNode = d;

            nodes.forEach(function(node) {
                node.visible = false;
            });

            d.visible = true;
            if (d.children) {
                d.children.forEach(function(child) {
                    markVisible(child);
                });
            }

            nodes = partition.nodes(d);

            svgGroup.selectAll("path").remove();

            var newPath = svgGroup.selectAll("path")
                .data(nodes)
                .enter().append("path")
                .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
                .attr("d", arc)
                .style("stroke", "var(--vis__background-color)")
                .style("fill", function(d) { return color((d.children ? d : d.parent).name); })
                .style("fill-rule", "evenodd")
                .each(function(d) { d._current = d; });

            updateLabels();

            newPath.append("title")
                .text(function(d) { return d.name + "\n" + d.value; });
        }

        function markVisible(d) {
            d.visible = true;
            if (d.children) {
                d.children.forEach(markVisible);
            }
        }
            
        function zoomed() {
            // Apply translation and scaling to the arcs
            svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            
            updateLabels();            
        }

        // Used to provide the visualisation's D3 colour scale to the grid
        this.getColourScale = function() {
            return color;
        };

    };

}());