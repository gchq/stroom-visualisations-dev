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
        var svg, radius, partition, arc, visSettings, canvas;
        var width;
        var height;
        var tip;
        var inverseHighlight;
        var delimiter = '/'; // default delimiter
        var baseColor = d3.rgb(0, 139, 139);
        // var baseColorDomain = d3.interpolateRgb("darkcyan","black").domain([0,20]);
        var baseColorDomain = d3.scale.linear().range(["darkcyan", "black"]).domain([1,15]);

        var stroomData;
        var pathToNodeMap;
        var x,y;
        var initialised = false;
        var canvas;
        var lastClickedNode = null;
        var displayDepth = 2; // default depth
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
                        var htmlBuilder = inverseHighlight.htmlBuilder();
                        if (tipData.values.name && tipData.values.name !== "__root") {
                            htmlBuilder.addTipEntry("Name", commonFunctions.autoFormat(tipData.values.name));
                        }

                        var html = htmlBuilder
                            .addTipEntry("Value", commonFunctions.autoFormat(tipData.values.value))
                            .build();
                        
                        return html;
                    });
            }
        };


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
                  context.color = color;
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

        //called by GenericGrid to build/update a visualisation inside a grid cell
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
                    color = context.color;
                }
            }

            if (settings.delimiter) {
                delimiter = settings.delimiter;
            }

            if (settings.displayDepth) {
                displayDepth = settings.displayDepth - 1;
            }
            
            if (settings.baseColor) {
              baseColor = d3.rgb(settings.baseColor);
              if (settings.gradient == "False"){
                baseColorDomain = d3.scale.linear().range([settings.baseColor, settings.baseColor]).domain([1,displayDepth+3]);
              }
              else{
                baseColorDomain = d3.scale.linear().range([settings.baseColor, "black"]).domain([1,displayDepth + 3]);
              }
            }
            else{
              if (settings.gradient == "True"){
                baseColorDomain = d3.scale.linear().range([baseColor, "black"]).domain([1,displayDepth]);
              }
            }

            if (data) {
                stroomData = data;
                let formattedData = arrayToHierarchy(data.values[0].values);
                // console.log(formattedData);
                update(500, formattedData, settings);
            }
        };

        function arrayToHierarchy(arr) {
            pathToNodeMap = new Map();

            // Helper function to recursively create or find a node
            function findOrCreateNode(currentNode, name, value, color, fullPath) {
                let node = currentNode.children.find(child => child.name === name);
                if (!node) {
                    node = {
                        name: name,
                        _parent: currentNode,
                        children: [],
                        value: value,
                        path: fullPath,
                        color: color,
                    };
                    currentNode.children.push(node);
                    pathToNodeMap.set(fullPath, node);
                }
                return node;
            }

            // Extract all root names (first parts of paths)

            root = { name: "__root", children: [], path: "/", depth: 0 };
            pathToNodeMap.set("/", root);
            arr.forEach(([path, value, color]) => {
                const pathParts = path.split(delimiter);
                let currentNode = root;

                // Traverse the path and build the hierarchy
                for (let i = 0; i < pathParts.length; i++) {
                    const part = pathParts[i];
                    const fullPath = delimiter + pathParts.slice(0, i + 1).join(delimiter);


                    currentNode = findOrCreateNode(currentNode, part, value,
                        (i === pathParts.length - 1) ? color : undefined,
                        fullPath);
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

            var nodeToExpand = lastClickedNode ? lastClickedNode : formattedData;

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

            x = d3.scale.linear()
                .range([0, 2 * Math.PI]);

            y = d3.scale.sqrt()
                .range([0, radius]);

            partition = d3.layout.partition()
                .value(function(d) { return d.value; });

            arc = d3.svg.arc()
                .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x))); })
                .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x + d.dx))); })
                .innerRadius(function(d) { return Math.max(0, y(d.y)); })
                .outerRadius(function(d) { return Math.max(0, y(d.y + d.dy)); });

            if (nodeToExpand._parent) {
                nodeToExpand = {
                    name: nodeToExpand._parent.name,
                    children: [nodeToExpand],
                    value: nodeToExpand._parent.value,
                    _parent: nodeToExpand._parent._parent,
                    path: nodeToExpand._parent.path,
                    depth: nodeToExpand._parent.depth
                }
            } else {
                nodeToExpand = formattedData;
            }
            var nodes = partition.nodes(nodeToExpand);

            // Bind data to the paths, and append new paths
            var paths = svg.selectAll("path").data(nodes, (d) => d.path);

            paths.update = paths.transition().duration(750)
                    .attr("d", arc);

            var maxDepth = 0;
            nodes.forEach(function(d) {
                if (d.depth > maxDepth) { 
                    maxDepth = d.depth;
                }
            });

            baseColorDomain = d3.scale.linear().range([baseColor, "black"]).domain([0,maxDepth + 3]);
            paths.enter().append("path")
                .attr("d", arc)
                .style("stroke", "var(--vis__background-color)")
                .style("fill", function(d) {
                    if (d.color) {
                      return d3.rgb(d.color);
                    }
                    if (d.depth === 1) {
                        // return baseColor.darker(1);
                        return baseColorDomain(1);

                    }
                    if (d.depth > 1) {
                        var ancestor = d;
                        while (ancestor.depth > 1) {
                            ancestor = ancestor.parent;
                        }
                        // return d.children ? baseColor.darker(d.depth) : baseColor.brighter(1);
                        return d.children ? baseColorDomain(d.depth) : baseColor.brighter(1);
                    }
                    return baseColor;
                })
                .style("opacity", function(d) {
                    return d.depth > displayDepth ? 0 : 1;  // Initially hide deeper layers
                })
                .on("click", function(d) {
                    if ((visSettings.expand == undefined || commonFunctions.isTrue(visSettings.expand)) && d.children) {

                        if (d.name == "__root"){
                            lastClickedNode = formattedData;
                        } else {
                            lastClickedNode = d;
                        }
                        if (pathToNodeMap.get(d.path)){
                            lastClickedNode = pathToNodeMap.get(d.path);
                        }

                        update(750, lastClickedNode, visSettings);
                    }
                });
            
             paths.style("fill", function(d) {
                    if (d.color) {
                      return d3.rgb(d.color);
                    }
                    if (d.depth === 1) {
                        // return baseColor.darker(1);
                        return baseColorDomain(1);
                    }
                    if (d.depth > 1) {
                        var ancestor = d;
                        while (ancestor.depth > 1) {
                            ancestor = ancestor._parent;
                        }
                        // return d.children ? baseColor.darker(d.depth) : baseColor.brighter(1);
                        return d.children ? baseColorDomain(d.depth) : baseColor.brighter(1);

                    }
                    return baseColor;
             });

            //removed paths
            paths.exit()
                .remove();    

            commonFunctions.addDelegateEvent(svg, "mouseover", "path", inverseHighlight.makeInverseHighlightMouseOverHandler(stroomData.key, stroomData.types, svg, "path"));
            commonFunctions.addDelegateEvent(svg, "mouseout", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
            //as this vis supports scrolling and panning by mousewheel and mousedown we need to remove the tip when the user
            //pans or zooms
            commonFunctions.addDelegateEvent(svg, "mousewheel", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));
            commonFunctions.addDelegateEvent(svg, "mousedown", "path", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "path"));

            expandArc(nodeToExpand);

        };

        var EPSILON = 1e-6;
        var targetDepth;
        function expandArc(data) {
            targetDepth = data.depth + displayDepth;

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
                    };
                })
                .selectAll("path")
                .attrTween("d", function(d) {
                    return function() {
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
                    };
                })
                .each("end", function() {
                    if (!labelsUpdated) {
                        labelsUpdated = true;
                        updateLabels(targetDepth);
                    }
                });
        }

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

                        var textContent = (d.name != null && d.name != "__root") ?
                                             commonFunctions.autoFormat(d.name, visSettings.nameDateFormat) :
                                            commonFunctions.autoFormat(d.series, visSettings.seriesDateFormat);

                        // Create a temporary text element to measure the text width and height
                        var tempText = svg.append("text")
                        .attr("class", "temp-text")
                        .attr("text-anchor", "middle")
                        .style("font-size", fontSize + "px")
                        .style("visibility", "hidden")
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
                                // .style("fill", d3.rgb(0, 0, 0))
                                .text(textContent);

                        }
                    }
                }
            });
        }

        function zoomed() {
            var currentScale = d3.event.scale;

            // Apply translation and scaling to the arcs
            svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

            if (currentScale !== prevScale) {
                updateLabels(targetDepth);
            }

            prevScale = currentScale;
        }

        // Used to provide the visualisation's D3 colour scale to the grid
        this.getColourScale = function() {
            return color;
        };
        
    };

}());


