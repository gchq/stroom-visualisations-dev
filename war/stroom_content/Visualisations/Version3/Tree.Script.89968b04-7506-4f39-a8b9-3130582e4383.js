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
    var svg;
    var canvas;
    var zoom;
    var tip;
    var treeLayout;
    var dataArea;
    var visData;
    var invisibleBackgroundRect;
    
    // Could be nice to have drawdepth
    // var drawDepth;
    var orientation;

    var style = ".Tree-node {" +
                "width: 100%;" +
                "height: 15px;" +
                // "background-color: #555555;" +
                "color: white;" +
                "overflow: hidden;" +
                "text-rendering: geometricPrecision;" +
                "text-overflow: ellipsis;" +
                "word-wrap: break-word;" +
                "} "+
                ".Tree-link {" +
                "fill: none;" +
                "stroke: var(--text-color);" +
                "} "+
                ".Tree {" +
                "pointer-events: all;" +
                "} "+
                ".Tree-circle {" +
                "fill: white;" +
                "stroke-width: 3;" +
                "} "+
                ".Tree-tip {" +
                "position: absolute;" +
                "font-size: 15px;" +
                "fill: red;" +
                "text-rendering: geometricPrecision;" +
                "background-color: rgba(255,255,255,0.6);" +
                "z-index:300;" +
                "} ";

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

      svg = canvas.append("svg:g");

      dataArea = svg.append("svg:g").attr("transform", "translate(0,0)");

     
      zoom = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed);
   
      svg.call(zoom);

      //This (invisible) rect ensures there's always a target for the zoom action
      invisibleBackgroundRect = dataArea.append("svg:rect").attr("width", width*2)
        .attr("height", height*2).attr('fill', 'white')
        .attr("transform", "translate(-" + width/2 + " -" + height/2 + ")")
        .attr("opacity", "0.0");


      treeLayout = d3.layout.tree().size([height, width]);

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
      visData = data;

      if (settings.delimiter) {
        delimiter = settings.delimiter;
      }

      if (settings.baseColor) {
        baseColor = d3.rgb(settings.baseColor);
      }

      if (settings.orientation) {
        orientation = settings.orientation;
      }

      update(100, data);
    };

    function update(duration, data) {

      if (data) {
        data = buildHierarchy(data.values[0].values);
      }

      const width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
      const height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);
  
      svg.attr("width", width).attr("height", height);
      svg.call(tip);

      invisibleBackgroundRect.attr("width", width*2).attr("height", height*2)
        .attr("transform", "translate(-" + width/2 + " -" + height/2 + ")");
  
      const [xScale, yScale] = initializeScales(width, height);
      const nodes = treeLayout.nodes(data);
      const links = treeLayout.links(nodes);
  
      updateScales(xScale, yScale, nodes);
      const { xOffset, yOffset } = calculateOffsets(xScale, yScale, width, height);
  
      updateLinks(links, duration, xScale, yScale, xOffset, yOffset);
      updateNodes(nodes, duration, xScale, yScale, xOffset, yOffset);

      commonFunctions.addDelegateEvent(svg, "mouseover", "circle", inverseHighlight.makeInverseHighlightMouseOverHandler(null, visData.types, svg, "circle"));
      commonFunctions.addDelegateEvent(svg, "mouseout", "circle", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "circle"));
      commonFunctions.addDelegateEvent(svg, "click","circle", inverseHighlight.makeInverseHighlightMouseClickHandler(svg, "circle"));

      //as this vis supports scrolling and panning by mousewheel and mousedown we need to remove the tip when the user
      //pans or zooms
      // commonFunctions.addDelegateEvent(svg, "mousewheel", "circle", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "circle"));
      // commonFunctions.addDelegateEvent(svg, "mousedown", "circle", inverseHighlight.makeInverseHighlightMouseOutHandler(svg, "circle"));
        
    }

    function buildHierarchy(paths) {
      var root = { id: "root", children: [] };
      var all = { "root": root };
  
      paths.forEach(function(path) {
          var parts = path[0].split(delimiter);
          var current = root;
          var fullPath = "";
  
          parts.forEach(function(part, index) {
              fullPath = fullPath ? fullPath + delimiter + part : part;
  
              if (!all[fullPath]) {
                  all[fullPath] = { id: part, children: [] };
                  current.children.push(all[fullPath]);
              }
  
              current = all[fullPath];
          });
      });
  
      return root;
  }
  

    // function filterByDepth(root, maxDepth) {
    //   const queue = [{ node: root, depth: 0 }];
    //   while (queue.length > 0) {
    //       const { node, depth } = queue.shift();
    //       if (depth < maxDepth) {
    //         if (node.children) {
    //             node.children.forEach(child => queue.push({ node: child, depth: depth + 1 }));
    //         }
    //       } else {
    //         if (node.children) {
    //             node._children = node.children;
    //             node.children = null;
    //         }
    //       }
    //   }
    // }
    
    function initializeScales(width, height) {
        const xScale = d3.scale.linear().range([0, width]);
        const yScale = d3.scale.linear().range([0, height]);
        return [xScale, yScale];
    }
    
    function updateScales(xScale, yScale, nodes) {
        if (orientation === "north" || orientation === "south") {
            xScale.domain([d3.min(nodes, d => d.x), d3.max(nodes, d => d.x)]);
            yScale.domain([d3.min(nodes, d => d.y), d3.max(nodes, d => d.y)]);
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
        const node = dataArea.selectAll(".Tree-node").data(nodes, d => d.id);
    
        node.enter().append("g")
            .attr("class", "Tree-node")
            .attr("transform", d => {
                const position = calculateNodePosition(d, xScale, yScale, xOffset, yOffset);
                return position;
            })
            .on("click", nodeClick)
            .append("circle")
            .attr("class", "Tree-circle")
            .attr("r", 3)
            .style("stroke-width", 1);
    
        node.transition().duration(duration)
            .attr("transform", d => {
                const position = calculateNodePosition(d, xScale, yScale, xOffset, yOffset);
                return position;
            })
            .select(".Tree-circle")
            .style("fill", d => color(d.id));
    
        node.exit().transition().duration(duration).style("opacity", 0).remove();
    }
    
    function calculateNodePosition(d, xScale, yScale, xOffset, yOffset) {
        let x, y;
        switch (orientation) {
            case "north":
                x = xScale(d.x) + xOffset;
                y = yScale(d.y) + yOffset;
                break;
            case "south":
                x = xScale(d.x) + xOffset;
                y = height - yScale(d.y) - yOffset;
                break;
            case "east":
                x = yScale(d.y) + xOffset;
                y = xScale(d.x) + yOffset;
                break;
            case "west":
                x = height - yScale(d.y) - xOffset;
                y = xScale(d.x) + yOffset;
                break;
        }
        return `translate(${x},${y})`;
    }
    
    function updateLinks(links, duration, xScale, yScale, xOffset, yOffset) {
        const link = dataArea.selectAll(".Tree-link").data(links, d => d.source.id + d.target.id);
    
        link.enter().append("path")
            .attr("class", "Tree-link")
            .style("stroke-width", 1)  // Fixed stroke width for lines
            .attr("d", d => calculateDiagonal(d, xScale, yScale, xOffset, yOffset));
    
        link.transition().duration(duration)
            .attr("d", d => calculateDiagonal(d, xScale, yScale, xOffset, yOffset));
    
        link.exit().transition().duration(duration).style("opacity", 0).remove();
    }
    
    function calculateDiagonal(d, xScale, yScale, xOffset, yOffset) {
      let sourceX, sourceY, targetX, targetY, midX, midY;
      switch (orientation) {
          case "north":
              sourceX = xScale(d.source.x) + xOffset;
              sourceY = yScale(d.source.y) + yOffset;
              targetX = xScale(d.target.x) + xOffset;
              targetY = yScale(d.target.y) + yOffset;
              break;
          case "south":
              sourceX = xScale(d.source.x) + xOffset;
              sourceY = height - yScale(d.source.y) - yOffset;
              targetX = xScale(d.target.x) + xOffset;
              targetY = height - yScale(d.target.y) - yOffset;
              break;
          case "east":
              sourceX = yScale(d.source.y) + xOffset;
              sourceY = xScale(d.source.x) + yOffset;
              targetX = yScale(d.target.y) + xOffset;
              targetY = xScale(d.target.x) + yOffset;
              break;
          case "west":
              sourceX = height - yScale(d.source.y) - xOffset;
              sourceY = xScale(d.source.x) + yOffset;
              targetX = height - yScale(d.target.y) - xOffset;
              targetY = xScale(d.target.x) + yOffset;
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
          d._children = d.children;
          d.children = null;
      } else {
          if (d._children) {
            d.children = d._children;
            d._children = null;
            // Filter to ensure only next levels are shown
            filterByDepth(d, drawDepth);
          }
      }
      update(100, visData);
    }

    this.getColourScale = function(){
      return color;
    };

  };

}());
