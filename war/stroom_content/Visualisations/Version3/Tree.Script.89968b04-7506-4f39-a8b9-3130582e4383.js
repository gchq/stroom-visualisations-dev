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

(function (){

  var d3 = window.d3;
  var commonFunctions = visualisations.commonFunctions;
  var commonConstants = visualisations.commonConstants;
  var margins = commonConstants.margins();

  visualisations.Tree = function(containerNode) {

    var initialised = false;

    if (containerNode){
      var element = containerNode;
    } else {
      var element = window.document.createElement("div");
    }
    this.element = element;

    var grid = new visualisations.GenericGrid(this.element);

    //Called by GenericGrid to create a new instance of the visualisation for each cell.
    this.getInstance = function(containerNode) {
      return new visualisations.Tree(containerNode);
    };

    var width;
    var height;
    var delimiter = '/'; // default delimiter
    var baseColor = d3.rgb(0, 139, 139);
    var color = commonConstants.categoryGoogle();
    var visSettings;
    var svgGroup;
    var canvas;
    var zoom;
    var tip;
    var treeLayout;
    var dataArea;
    var visData;
    var drawDepth = 2; // default drawDepth
    var invisibleBackgroundRect;
    var orientation = "north"; // default Orientation
    var lastorientation = "none";
    var firstTime = true;
    var rectWidth = 200;
    var rectHeight = 30;

    var style = `
                .Tree-node {
                  width: 100px;
                  height: 15px;
                  color: white;
                  overflow: hidden;
                  text-rendering: geometricPrecision;
                  text-overflow: ellipsis;
                  word-wrap: break-word;
                }
                .Tree-link {
                  fill: none;
                  stroke: var(--text-color);
                } 
                .Tree {
                  pointer-events: all;
                }
                .Tree-circle {
                  fill: white;
                  stroke-width: 3;
                }
                .Tree-rect {
                  fill: white;
                  stroke-width: 3;
                  width: ${rectWidth}px;
                  height: ${rectHeight}px;
                  rx: 5px;
                  ry: 5px;
                } 
                .Tree-tip {
                  position: absolute;
                  font-size: 15px;
                  fill: red;
                  text-rendering: geometricPrecision;
                  background-color: rgba(255,255,255,0.6);
                  z-index:300;
                }`;

    // var svg = d3.select(element).append("svg:svg")
    //               .attr("class", "Tree");

    //one off initialisation of all the local variables, including
    //appending various static dom elements
    var initialise = function() {
      initialised = true;

      d3.select(element).append("style").text(style);

      width = commonFunctions.gridAwareWidthFunc(true, containerNode, element);
      height = commonFunctions.gridAwareHeightFunc(true, containerNode, element);

      canvas = d3.select(element).append("svg:svg");

      const basesvg = canvas.append("svg:g");

      dataArea = basesvg.append("svg:g").attr("transform", "translate(0,0)");

     
      zoom = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed);
   
      basesvg.call(zoom);

      //This (invisible) rect ensures there's always a target for the zoom action
      invisibleBackgroundRect = dataArea.append("svg:rect").attr("width", width*2)
        .attr("height", height*2).attr('fill', 'white')
        .attr("transform", "translate(-" + width/2 + " -" + height/2 + ")")
        .attr("opacity", "0.0");

      svgGroup = dataArea.append("svg:g");
      

      // svgGroup.selectAll('g.Tree-node').remove();



      if (typeof(tip) == "undefined") {
        inverseHighlight = commonFunctions.inverseHighlight();

        inverseHighlight.toSelectionItem = function(d) {
          //console.log("selection");
          //console.log(d);
          var selection = {
            key: d.name,
            // series: d.series,
          };
          return selection;
        };

        tip = inverseHighlight.tip()
            .html(function(tipData) {
                var html = inverseHighlight.htmlBuilder()
                    // .addTipEntry("Series",commonFunctions.autoFormat(tipData.values.series, visSettings.seriesDateFormat))
                    .addTipEntry("Name",commonFunctions.autoFormat(tipData.values.id, visSettings.nameDateFormat))
                    .build();
                return html;
            });
      }
    }

    function zoomed(e) {
      dataArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    this.setData = function(context, settings, data) {
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
        grid.buildGrid(context, settings, data, this, commonConstants.transitionDuration, synchedFields);        
        this.resize;
      }
    }

    //called by Stroom to instruct the visualisation to redraw itself in a resized container
    this.resize = function() {
      commonFunctions.resize(grid, update, element, margins, width, height);
    };

    //Public entry point for the Grid to call back in to set the cell level data on the cell level
    //visualisation instance.
    //data will only contain the branch of the tree for this cell
    this.setDataInsideGrid = function(context, settings, data) {
      if (!initialised){
        initialise();
      }

      visSettings = settings;

      if (settings.delimiter) {
        delimiter = settings.delimiter;
      }

      if (settings.baseColor) {
        baseColor = d3.rgb(settings.baseColor);
      }

      if (settings.orientation) {
        orientation = settings.orientation;
      }

      if (settings.drawDepth) {
        drawDepth = settings.drawDepth;
      }

      if (data) {
        data = buildHierarchy(data.values[0].values);
        visData = data;
        filterByDepth(data, drawDepth);
        update(100, data);
      }
    };

    function update(duration, data) {      

      const width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
      const height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
  
      svgGroup.attr("width", width).attr("height", height);
      svgGroup.call(tip);

      invisibleBackgroundRect.attr("width", width*2).attr("height", height*2)
        .attr("transform", "translate(-" + width/2 + " -" + height/2 + ")");
  
      var nodeSize = [rectWidth + 50, rectHeight + 50];

        if ((orientation === "east" || orientation === "west")){
          nodeSize = [rectHeight + 50, rectWidth + 50];
        }

        // if (orientation != lastorientation) {
          treeLayout = d3.layout.tree()
          // .size((orientation === "north" || orientation === "south")?[width, height]:[height, width])
          .nodeSize(nodeSize)
     //     .separation((a, b) => {
            //return a.parent === b.parent ? rectWidth + 20 : 2* (rectWidth + 20);
       //     return (a.parent == b.parent ? 1 : 5) * rectWidth;
      //    })

        // }
        

      const [xScale, yScale] = initializeScales(width, height);
      const nodes = treeLayout.nodes(data);
      const links = treeLayout.links(nodes);
  
      updateScales(xScale, yScale, nodes);
      const { xOffset, yOffset } = calculateOffsets(xScale, yScale, width, height);
  
      updateLinks(links, duration, xScale, yScale, xOffset, yOffset);
      updateNodes(nodes, duration, xScale, yScale, xOffset, yOffset);

      commonFunctions.addDelegateEvent(svgGroup, "mouseover", "rect", inverseHighlight.makeInverseHighlightMouseOverHandler(null, visData.types, svgGroup, "rect"));
      commonFunctions.addDelegateEvent(svgGroup, "mouseout", "rect", inverseHighlight.makeInverseHighlightMouseOutHandler(svgGroup, "rect"));
      commonFunctions.addDelegateEvent(svgGroup, "click","rect", inverseHighlight.makeInverseHighlightMouseClickHandler(svgGroup, "rect"));

      //as this vis supports scrolling and panning by mousewheel and mousedown we need to remove the tip when the user
      //pans or zooms
      // commonFunctions.addDelegateEvent(svg, "mousewheel", "circle", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "circle"));
      // commonFunctions.addDelegateEvent(svg, "mousedown", "circle", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "circle"));

      if (firstTime) {
        firstTime = false;
        const xMin = d3.min(nodes, d => d.x) - rectWidth;
        const xMax = d3.max(nodes, d => d.x) + rectWidth;
        const yMin = d3.min(nodes, d => d.y) - rectHeight;
        const yMax = d3.max(nodes, d => d.y) + rectHeight;
        canvas.attr("viewBox", `${xMin} ${yMin} ${xMax - xMin} ${yMax - yMin}`);
      }
      
      
      // Stash the old positions for transition.
      nodes.forEach(function (d) {
          d.x0 = d.x;
          d.y0 = d.y;
      });
    }

    function buildHierarchy(values) {
      var root = { id: "__root", children: [], _children: [] };
      var all = { "__root": root };
  
      values.forEach(function(value) {
          var path = value[0];
          if (path.startsWith(delimiter)) {
            path = path.substring(1);
          }
          var parts = path.split(delimiter);
          var current = root;
          var fullPath = "";
  
          parts.forEach(function(part, index) {
              fullPath = fullPath ? fullPath + delimiter + part : part;
  
              if (!all[fullPath]) {
                  all[fullPath] = { id: part, children: [], _children: [] };
                  current._children.push(all[fullPath]);
                  current.children.push(all[fullPath]);
              }
  
              current = all[fullPath];
          });
      });
  
      return root;
    }

    function filterByDepth(root, maxDepth) {
      const queue = [{ node: root, depth: 0 }];
      while (queue.length > 0) {
          const { node, depth } = queue.shift();
          if (depth < maxDepth) {
            if (node.children) {
                node.children.forEach(child => queue.push({ node: child, depth: depth + 1 }));
            }
          } else {
            if (node.children) {
                node._children = node.children;
                node.children = null;
            }
          }
      }
    }
    
    function initializeScales(width, height) {
        const xScale = d3.scale.linear().range([0, width]);
        const yScale = d3.scale.linear().range([0, height]);
        return [xScale, yScale];
    }
    
    function updateScales(xScale, yScale, nodes) {
        if (orientation === "north" || orientation === "south") {
            xScale.domain([d3.min(nodes, d => d.x) - rectWidth, d3.max(nodes, d => d.x) + rectWidth]);
            yScale.domain([d3.min(nodes, d => d.y) - rectHeight, d3.max(nodes, d => d.y) + rectHeight]);
        } else if (orientation === "east" || orientation === "west") {
            xScale.domain([d3.min(nodes, d => d.y), d3.max(nodes, d => d.y)]);
            yScale.domain([d3.min(nodes, d => d.x), d3.max(nodes, d => d.x)]);
        }
    }
    
    function calculateOffsets(xScale, yScale, width, height) {
        const xOffset = (width - (xScale.domain()[1] - xScale.domain()[0])) / 100;
        const yOffset = (height - (yScale.domain()[1] - yScale.domain()[0])) / 100;
        return { xOffset, yOffset };
    }
    
    function updateNodes(nodes, duration, xScale, yScale, xOffset, yOffset) {
      
      // svgGroup.selectAll('.Tree-node').remove();

      const node = svgGroup.selectAll(".Tree-node").data(nodes, d => d.id + (d.parent ? d.parent.id : ""));

      
      const radius = 25;
      const fontSize = 12;
  
      const nodeEnter = node.enter().append("g")
          .attr("class", "Tree-node")
          .attr("transform",  (d) => {
            if (!d.parent) {
              return;
            }
            console.log(`${d.id} (parent is ${d.parent.id} Entering at ${d.parent.x}, ${d.parent.y}`);
            return "translate(" + d.parent.x + "," + d.parent.y + ")";
          })
          .on("click", nodeClick);
  
      nodeEnter.filter(d => { return (d.id === "__root")})
          .append("circle")
          .attr("r", "5")
          .style("stroke-width", 3)
          .style("fill", "darkgray");

      nodeEnter.filter(d => { return (d.id != "__root")})
          .append("rect")
          .attr("class", "Tree-rect")
          .attr("transform", `translate(-${rectWidth / 2}, -15)`)
          .style("stroke-width", 2)
          .style("fill", baseColor);
  
      nodeEnter.filter(d => { return (d.id != "__root")})
          .append("text")
          .attr("class", "Tree-label")
          .attr("dy", 4) // Vertically center text
          .attr("text-anchor", "middle")
          .style("pointer-events", "none")
          .style("font-size", fontSize + "px")
          // .style("fill", "#fff")
          .text(d => d.id);  //.substring(0, 6)); // Display first 6 characters
  
      node.transition().duration(750)
          .attr("transform", d => {
            console.log(`Moving ${d.id} from ${d.x},${d.y}`)
              const position = calculateNodePosition(d, xScale, yScale, xOffset, yOffset);
              return position;
          });

      node.exit().transition().duration(750).style("opacity", 0).remove();

       // Transition exiting nodes to the parent's new position.
        // var nodeExit = node.exit().transition()
        //   .duration(duration).attr("transform", function (d) {
        //     if (d.parent) {
        //       return "translate(" + parent.x + "," + parent.y + ")";
        //     }
        //   }).remove();

    }  
  
    
    function calculateNodePosition(d, xScale, yScale, xOffset, yOffset) {
        let x, y;
        switch (orientation) {
            case "north":
              x = d.x;
              y = d.y;
              break;
            case "south":
              x = d.x;
              y = -d.y;
              break;
            case "east":
              x = d.y;
              y = d.x;
                break;
            case "west":
              x = -d.y;
              y = d.x;
              break;
        }
        return `translate(${x},${y})`;
    }
    
    function updateLinks(links, duration, xScale, yScale, xOffset, yOffset) {

        const link = svgGroup.selectAll(".Tree-link").data(links, d => d.source.id + d.target.id);
    
        // link.enter().append("path")
        // .attr("class", "Tree-link")
        // .style("stroke-width", 1)  // Fixed stroke width for lines
        // .attr("d", d => calculateDiagonal(d, xScale, yScale, xOffset, yOffset));

        link.enter().append("path")
            .attr("class", "Tree-link")
            .style("stroke-width", 1)  // Fixed stroke width for lines
            .attr("d", (d) => { 
              const o = {
                x: d.source.x0,
                y: d.source.y0
              };
              

                return calculateDiagonal({source: o, target: o}, xScale, yScale, xOffset, yOffset);
                

            });
    
        link.transition().duration(750)
            .attr("d", d => calculateDiagonal(d, xScale, yScale, xOffset, yOffset));
    
        link.exit().transition().duration(500).style("opacity", 0).remove();
    }


    
    function calculateDiagonal(d, xScale, yScale, xOffset, yOffset) {
      let sourceX, sourceY, targetX, targetY, midX, midY;
      switch (orientation) {
          case "north":
              sourceX = d.source.x; 
              sourceY = d.source.y; 
              targetX = d.target.x; 
              targetY = d.target.y; 
              break;
          case "south":
              sourceX = d.source.x; 
              sourceY = -d.source.y;
              targetX = d.target.x; 
              targetY = -d.target.y;
              break;
          case "east":
              sourceX = d.source.y;
              sourceY = d.source.x; 
              targetX = d.target.y; 
              targetY = d.target.x;
              break;
          case "west":
              sourceX = -d.source.y; 
              sourceY = d.source.x;
              targetX = -d.target.y; 
              targetY = d.target.x; 
              break;
      }

      // Calculate the midpoint
      midX = (sourceX + targetX) / 2;
      midY = (sourceY + targetY) / 2;

      switch (orientation) {
          case "north":
          case "south":
              return `M${sourceX},${sourceY}L${sourceX},${midY}L${targetX},${midY}L${targetX},${targetY}`;
          case "east":
          case "west":
              return `M${sourceX},${sourceY}L${midX},${sourceY}L${midX},${targetY}L${targetX},${targetY}`;
      }
    }

    function nodeClick(d) {
      if (d.children) {
          d.children = null;
      } else {
          d.children = d._children;
          // Filter to ensure only next levels are shown
          filterByDepth(d, drawDepth);
        
      }
      update(100, visData);
    }

    this.getColourScale = function(){
      return color;
    };

  };

}());
