<<<<<<< HEAD
/*
 * Copyright 2024 Crown Copyright
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

=======
>>>>>>> 7.2
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
<<<<<<< HEAD
        var svg, radius, partition, arc, visSettings, canvas;
        var width;
        var height;
        var tip;
        var inverseHighlight;
        var delimiter = '/'; // default delimiter
        var stroomData;
        var x,y;
        var initialised = false;
        var canvas;
        var lastClickedNode = null;
        var initialDepth = 2; // default depth
        var color = commonConstants.categoryGoogle();
        var prevScale = 1;

        //one off initialisation of all the local variables, including
        //appending various static dom elements
        var initialise = function() {
            initialised = true;

            width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
            height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);

            canvas = d3.select(element).append("svg:svg");

            svg = canvas.append("svg:g");

            //Ideally it would be good to reset the mousewheel zoom when we zoom in/out of a grid cell
            zoom = d3.behavior.zoom()
                .scaleExtent([0.1,100])
                .on("zoom", zoomed);
                
            zoom.translate([width / 2, height / 2]);

            canvas.call(zoom);
            //Set up the bar highlighting and hover tip
            if (typeof(tip) == "undefined") {
                inverseHighlight = commonFunctions.inverseHighlight();

                inverseHighlight.toSelectionItem = function(d) {
                //console.log("selection");
                //console.log(d);
                var selection = {
                    key: d.name,
                    series: d.series,
                    value: d.value,
                };
                //console.log(selection);
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
        };

=======
        var svg, radius, partition, arc, svgGroup, nodes, path, visSettings;
        var width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
        var height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
        var tip;
        var inverseHighlight;
        var stroomData;
        var x,y;

        var color = commonConstants.categoryGoogle();

        var zoom = d3.behavior.zoom()
            .scaleExtent([0.1, 10])  // Adjust the scale extent as needed
            .on("zoom", zoomed);
        zoom.translate([width / 2, height / 2]);
>>>>>>> 7.2

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
<<<<<<< HEAD
                  context.color = color;
=======
                  context.color = colour;
>>>>>>> 7.2
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
<<<<<<< HEAD
            if (!initialised){
                initialise();
            }
=======
        
>>>>>>> 7.2
            // If the context already has a colour set then use it
            if (context) {
                visContext = context;
                if (context.color) {
<<<<<<< HEAD
                    color = context.color;
                }
            }

            if (settings.delimiter) {
                delimiter = settings.delimiter;
            }

            if (settings.initialDepth) {
                initialDepth = settings.initialDepth;
            }
    
            if (data) {
                stroomData = data;
                let formattedData = arrayToHierarchy(data.values[0].values);
                // console.log(formattedData);
                update(500, formattedData, settings);
            }
        };

        function arrayToHierarchy(arr) {
            // Helper function to recursively create or find a node
            function findOrCreateNode(children, name) {
              let node = children.find(child => child.name === name);
              if (!node) {
                node = { name: name, children: [] };
                children.push(node);
              }
              return node;
            }
            // console.log(arr);
            const rootName = arr[0][0].split(delimiter)[0];
            let root = { name: rootName, children: [] };
                    
            arr.forEach(([path, value]) => {

              const pathParts = path.split(delimiter);
              let currentNode = root;
          
              for (let i = 1; i < pathParts.length; i++) {
                const part = pathParts[i];
                
                if (i === pathParts.length - 1) {
                  currentNode.children.push({ name: part, value: value });
                } else {
                  currentNode = findOrCreateNode(currentNode.children, part);
                }
              }
            });
          
            // Helper function to recursively calculate sums for non-leaf nodes
            function calculateSums(node) {
              if (node.children && node.children.length > 0) {
                node.value = node.children.reduce((sum, child) => {
                  return sum + calculateSums(child);
                }, 0);
              }
              return node.value || 0;
            }
          
            // Calculate sums for non-leaf nodes
            calculateSums(root);
          
            return root;
        }

        // Function to update the visualization
        var update = function(duration, formattedData, settings) {
            visSettings = settings;

            
            // Calculate dimensions and radius
            width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
            height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
            fullWidth = commonFunctions.gridAwareWidthFunc(false, containerNode, element, margins);
            fullHeight = commonFunctions.gridAwareHeightFunc(false, containerNode, element, margins);

            if (width > 0 && height > 0) {
                canvas
                    .attr("width", fullWidth)
                    .attr("height", fullHeight);
            }

            radius = Math.min(width, height) / 2;

            svg.call(tip);

            // Append new SVG
            svg.attr("transform", "translate(" + width / 2 + "," + (height / 2) + ")");
=======
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
>>>>>>> 7.2

            x = d3.scale.linear()
                .range([0, 2 * Math.PI]);

            y = d3.scale.sqrt()
                .range([0, radius]);
            
            partition = d3.layout.partition()
<<<<<<< HEAD
                .value(function(d) { return d.value; });

            arc = d3.svg.arc()
                .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
                .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
                .innerRadius(function(d) { return Math.max(0, y(d.y)); })
                .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

            // Get all nodes, but initially hide those deeper than initialDepth
            var nodes = partition.nodes(formattedData);

            // Bind data to the paths, and append new paths
            var paths = svg.selectAll("path").data(nodes);
            
            paths.enter().append("path")
                .attr("d", arc)
                .style("stroke", "var(--vis__background-color)")
                .style("fill", function(d) {
                    // Depth 1, assign a unique color
                    if (d.depth === 1) {
                        var baseColor = color(d.name);
                        return d3.rgb(baseColor);
                    }
                    if (d.depth > 1) {
                        var ancestor = d;
                        while (ancestor.depth > 1) {
                            ancestor = ancestor.parent;
                        }
                        var ancestorColor = color(ancestor.name); // use depth-1 ancestor color
                        return d.children ? d3.rgb(ancestorColor) : d3.rgb(ancestorColor).brighter(1);
                    }
                    return color(d.name);
                })                              
                .style("fill-rule", "evenodd")
                .style("opacity", function(d) {
                    return d.depth > initialDepth ? 0 : 1;  // Initially hide deeper layers
                })
                .on("click", function(d) {
                    if (d.children) {
                        lastClickedNode = d;
                        expandArc(d);  // Expand more layers on click
                    }
                });

            commonFunctions.addDelegateEvent(svg, "mouseover", "path", inverseHighlight.makeInverseHighlightMouseOverHandler(stroomData.key, stroomData.types, svg, "path"));
            commonFunctions.addDelegateEvent(svg, "mouseout", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
            //as this vis supports scrolling and panning by mousewheel and mousedown we need to remove the tip when the user
            //pans or zooms
            commonFunctions.addDelegateEvent(svg, "mousewheel", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
            commonFunctions.addDelegateEvent(svg, "mousedown", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));

            var nodeToExpand = lastClickedNode || formattedData;
            expandArc(nodeToExpand);

        };

        var EPSILON = 1e-6;
        var targetDepth;
        function expandArc(data) {
            targetDepth = data.depth + initialDepth;

            svg.selectAll("text.label").remove();
            let labelsUpdated = false;
            svg.transition()
                .duration(750)
                .tween("scale", function() {
                    var xd = d3.interpolate(x.domain(), [data.x, data.x + data.dx]),
                        yd = d3.interpolate(y.domain(), [data.y, 1]),
                        yr = d3.interpolate(y.range(), [data.y ? 20 : 0, radius]);

                    return function(t) {
                        x.domain(xd(t));
                        y.domain(yd(t)).range(yr(t));
=======
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
                    // If the node has children or is the root node, expand and animate
                    if (d.depth == 0 && d.parent) {
                        expandArc(d.parent);
                       // animation(d, duration);
                    } else if (d.children && d.children.length > 0) {
                        expandArc(d);
                       // animation(d, duration);
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

        function animation(d, duration) {
            console.log("Starting animation for node:", d); // Print the node being clicked
        
            // Flag to ensure updateLabels is called only once
            let labelsUpdated = false;
        
            svg.transition()
                .duration(duration)
                .tween("scale", function() {
                    // x domain should move from [0, 1] to the clicked arc's full range
                    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]);
        
                    // Adjust y domain based on node depth to create a zoom effect
                    var yd = d3.interpolate(y.domain(), [d.y, d.y + d.dy]);  // d.dy gives better zoom depth
        
                    // Keep the range static if necessary
                    var yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        
                    return function(t) {
                        x.domain(xd(t));
                        y.domain(yd(t)).range(yr(t));
                        console.log("Interpolated t:", t, "Updated x domain:", x.domain(), "Updated y domain:", y.domain(), "Updated y range:", y.range());
>>>>>>> 7.2
                    };
                })
                .selectAll("path")
                .attrTween("d", function(d) {
                    return function() {
<<<<<<< HEAD
                        if (d.depth <= targetDepth) {
                            var startAngle = Math.max(0, Math.min(2 * Math.PI, x(d.x)));
                            var endAngle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
            
                            if (Math.abs(endAngle - startAngle) < EPSILON) {
                                return "";
                            }

                            return arc(d);
                        } else {
                            return "";
                        }
=======
                        console.log("Updating arc for node:", d);
                        return arc(d);  // Update the arc path during animation
>>>>>>> 7.2
                    };
                })
                .each("end", function() {
                    if (!labelsUpdated) {
<<<<<<< HEAD
                        labelsUpdated = true;
                        updateLabels(targetDepth);
=======
                        labelsUpdated = true;  // Set flag to true to avoid future calls
                        updateLabels();  // Call updateLabels once when animation ends
>>>>>>> 7.2
                    }
                });
        }
        
<<<<<<< HEAD
        function updateLabels(targetDepth) {
            svg.selectAll("text.label").remove();
            svg.selectAll("path").each(function(d) {
                if (d.depth <= targetDepth) {
                    // Apply scaling from the current x and y domains (after transition/zoom)
                    var startAngle = Math.max(0, Math.min(2 * Math.PI, x(d.x)));
                    var endAngle = Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx)));
                    var innerRadius = Math.max(0, y(d.y));
                    var outerRadius = Math.max(0, y(d.y + d.dy));

                    if (commonFunctions.isTrue(visSettings.showLabels)) {
                        var centroid = arc.centroid(d);
                        var arcLength = (endAngle - startAngle) * (outerRadius + innerRadius) / 2;
                        var radDiff = outerRadius - innerRadius;
                        var scale = d3.event && d3.event.scale ? d3.event.scale : 1;
                        var fontSize = 13 / scale;

                        var textContent = d.name != null ? commonFunctions.autoFormat(d.name, visSettings.nameDateFormat) :
                                            commonFunctions.autoFormat(d.series, visSettings.seriesDateFormat);

                        // Create a temporary text element to measure the text width and height
                        var tempText = svg.append("text")
=======
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
>>>>>>> 7.2
                        .attr("class", "temp-text")
                        .attr("text-anchor", "middle")
                        .style("font-size", fontSize + "px")
                        .style("visibility", "hidden")
<<<<<<< HEAD
                        .text(textContent);

                        // Measure the width and height using the bounding box
                        var bbox = tempText.node().getBBox();
                        var textWidth = bbox.width;
                        var textHeight = bbox.height;

                        // Remove the temporary text element
                        tempText.remove();

                        if (textWidth < radDiff && textHeight < arcLength) {
                            var angle = (startAngle + endAngle) / 2;
                            angle = angle * (180 / Math.PI) + 90; // Convert to degrees
                            if (angle > 90 && angle < 270) {
                                angle += 180;
                            }
                            if (d.depth == 0){
                                centroid = [0, 0];
                            }
                            if (Math.abs(angle - 90) < 0.1 || Math.abs(angle - 270) < 0.1) {
                                angle = 0;
                            }        
                            svg.append("text")
                                .attr("class", "label")
                                .attr("transform", "translate(" + centroid[0] + "," + centroid[1] + ") rotate(" + angle + ")")
                                .attr("text-anchor", "middle")
                                .attr("dy", ".35em")
                                .style("pointer-events", "none")
                                .style("font-size", fontSize + "px")
                                .style("text-rendering", "geometricPrecision")
                                .text(textContent);

                        }
=======
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
>>>>>>> 7.2
                    }
                }
            });
        }

<<<<<<< HEAD
        function zoomed() {
            var currentScale = d3.event.scale;

            // Apply translation and scaling to the arcs
            svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            
            if (currentScale !== prevScale) {
                updateLabels(targetDepth);
            }
            
            prevScale = currentScale;
=======
        function expandArc(d) {
            console.log("Expanding arc:", d);
            expandedNode = d;
        
            nodes.forEach(function(node) {
                node.visible = false;
                // console.log("Hiding node:", node);
            });
        
            d.visible = true;
            if (d.children) {
                d.children.forEach(function(child) {
                    markVisible(child);
                    // console.log("Marking child visible:", child);
                });
            }
        
            nodes = partition.nodes(d);
            // console.log("Updated nodes:", nodes);
        
            let labelsUpdated = false;
        
            // svgGroup.selectAll("path").remove();
        
            // Apply transition to the arcs
            svgGroup.selectAll("path")
                .data(nodes)
                .transition()
                .duration(750)
                .tween("scale", function(d) {
                    var xd = d3.interpolate(x.domain(), [d.x, d.x + d.dx]);
                    var yd = d3.interpolate(y.domain(), [d.y, 1]);
                    var yr = d3.interpolate(y.range(), [d.y ? 20 : 0, radius]);
        
                    console.log("Interpolating scales:", xd, yd, yr);  // Log the interpolators
        
                    return function(t) {
                        var xDomain = xd(t);
                        var yDomain = yd(t);
                        var yRange = yr(t);

                        console.log("Interpolated x.domain at t=" + t + ":", xDomain);
                        console.log("Interpolated y.domain at t=" + t + ":", yDomain);
                        console.log("Interpolated y.range at t=" + t + ":", yRange);

                        x.domain(xDomain);
                        y.domain(yDomain).range(yRange);
                    };
                })
                .attrTween("d", function(d) {
                    return function() {
                        var pathData = arc(d);
                        console.log("Arc path data:", pathData);  // Log the path data
                        return pathData;
                    };
                })
                .each("end", function() {
                    // Ensure updateLabels is called only once after the transition ends
                    if (!labelsUpdated) {
                        labelsUpdated = true;
                        console.log("Transition ended. Calling updateLabels.");  // Log when transition ends
                        updateLabels(); // Call once when all transitions end
                    }
                });
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
>>>>>>> 7.2
        }

        // Used to provide the visualisation's D3 colour scale to the grid
        this.getColourScale = function() {
            return color;
        };
<<<<<<< HEAD
        
=======

>>>>>>> 7.2
    };

}());