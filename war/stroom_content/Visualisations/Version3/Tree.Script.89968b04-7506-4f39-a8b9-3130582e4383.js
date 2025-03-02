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
    var firstTime = true;
    const rectWidth = 200;
    const rectHeight = 30;
    const transitionDuration = 750; 
    var currentNodes = {};

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
      
      initialiseTip();
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

        update(data);
      }
    };

    function initialiseTip(){
      // if (typeof(tip) == "undefined") {
        inverseHighlight = commonFunctions.inverseHighlight();

        inverseHighlight.toSelectionItem = function(d) {

          var selection = {
            key: d.id,
            // series: d.series,
          };
          return selection;
        };

        tip = inverseHighlight.tip()
            .html(function(tipData) {
                var html = inverseHighlight.htmlBuilder()
                    // .addTipEntry("Series",commonFunctions.autoFormat(tipData.values.series, visSettings.seriesDateFormat))
                    .addTipEntry("Name",commonFunctions.autoFormat(tipData.values.name, visSettings.nameDateFormat))
                    .build();
                return html;
            });
      // }

    }

    function update(data) {      

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

      treeLayout = d3.layout.tree().nodeSize(nodeSize)
        
      const nodes = treeLayout.nodes(data);
      const links = treeLayout.links(nodes);
  
  

      updateLinks(links);
      updateNodes(nodes);

      commonFunctions.addDelegateEvent(svgGroup, "mouseover", "rect", inverseHighlight.makeInverseHighlightMouseOverHandler(null, visData.types, svgGroup, "rect"));
      commonFunctions.addDelegateEvent(svgGroup, "mouseout", "rect", inverseHighlight.makeInverseHighlightMouseOutHandler(svgGroup, "rect"));
      // commonFunctions.addDelegateEvent(svgGroup, "click","rect", inverseHighlight.makeInverseHighlightMouseClickHandler(svgGroup, "rect"));

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
          var fullPath = "__root";
  
          parts.forEach(function(part, index) {
              fullPath = fullPath ? fullPath + delimiter + part : part;
  
              if (!all[fullPath]) {
                  all[fullPath] = { id: fullPath, name: part, children: [], _children: [] };
                  current._children.push(all[fullPath]);
                  
                  if (currentNodes[current.id] && currentNodes[fullPath]){
                    //Both the node and the child currently exist
                    const existingParent = currentNodes[current.id];
                    const existingChild = currentNodes[fullPath];

                    if (existingParent.children && existingParent.children.includes(existingChild)){ 
                      //Ensure the child stays visible (expanded) if it has been expanded
                      //Make any children visible that have been expanded
                      current.children.push(all[fullPath]); 
                    }
                  } else if (index < drawDepth) {
                    //A new node, should be visible by default if inside the draw depth
                    current.children.push(all[fullPath]);
                  }
                  
              }
  
              current = all[fullPath];
          });
      });
  
      currentNodes = all;

      return root;
    }
    
    function updateNodes(nodes) {
      
      // svgGroup.selectAll('.Tree-node').remove();

      const node = svgGroup.selectAll(".Tree-node").data(nodes, d => d.id);

      
      const radius = 25;
      const fontSize = 12;
  
      const nodeEnter = node.enter().append("g")
          .attr("class", "Tree-node")
          .attr("transform",  (d) => {
            if (!d.parent || !parent.x0) {
              return;
            }
            if (orientation === "north" || orientation === "south") {
              return "translate(" + d.parent.x0 + "," + d.parent.y0 + ")";  
            }
            return "translate(" + d.parent.y0 + "," + d.parent.x0 + ")";
          })
          .style("opacity", 1.0)
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
          .text(d => d.name);  //.substring(0, 6)); // Display first 6 characters
  
      node.transition().duration(transitionDuration)
          .attr("transform", d => {
              const position = calculateNodePosition(d);
              return position;
          });

      node.exit().transition().duration(transitionDuration).style("opacity", 0).remove();

       // Transition exiting nodes to the parent's new position.
        // var nodeExit = node.exit().transition()
        //   .duration(duration).attr("transform", function (d) {
        //     if (d.parent) {
        //       return "translate(" + parent.x + "," + parent.y + ")";
        //     }
        //   }).remove();

    }  
  
    
    function calculateNodePosition(d) {
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
    
    function updateLinks(links) {

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
                x: d.source.x0 ? d.source.x0 : d.source.x,
                y: d.source.y0 ? d.source.y0 : d.source.y
              };
              

                return calculateDiagonal({source: o, target: o});
                

            });
    
        link.transition().duration(transitionDuration)
            .attr("d", d => calculateDiagonal(d));
    
        link.exit().transition().duration(500).style("opacity", 0).remove();
    }


    
    function calculateDiagonal(d) {
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
    //    filterByDepth(d, drawDepth);
     
    }

      
      update(visData);
    }

    this.getColourScale = function(){
      return color;
    };

  };

}());
