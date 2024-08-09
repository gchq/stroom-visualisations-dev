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
      return new visualisations.MyVisualisation.Visualisation(containerNode);
    };

    // var d3 = window.d3;
    var m = [10, 15, 30, 15];
    var width = element.clientWidth - m[1] - m[3];
    var height = element.clientHeight - m[0] - m[2];
    this.delimiter = '/'; // default delimiter
    var color = d3.scale.category20b();
    var svg;
    var canvas;
    var zoom;
    var tip;
    var treeLayout;
    var dataArea;

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
                "stroke: black;" +
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

      treeLayout = d3.layout.tree().size([height, width]);
      tip = d3.select(element).append("div").attr("class", "Tree-tip").style("opacity", 0);
    }

    function zoomed() {
      dataArea.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function buildHierarchy(paths) {
      var root = { id: "root", children: [] };
      var all = {};

      paths.forEach(function(path) {
        var parts = path[0].split(this.delimiter);
        var current = root;

        parts.forEach(function(part, index) {
          if (!all[part]) {
            all[part] = { id: part, children: [] };
            current.children.push(all[part]);
          }
          current = all[part];
        });
      });

      return root;
    }

    function mergeTrees(existingTree, newPaths) {
      var newTree = buildHierarchy(newPaths);
      existingTree.children.push.apply(existingTree.children, newTree.children);
      return existingTree;
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

    var drawDepth;
    var orientation;

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
      
    };

    //Public entry point for the Grid to call back in to set the cell level data on the cell level
    //visualisation instance.
    //data will only contain the branch of the tree for this cell
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
        data = mergeTrees(data, d.values);
      } else {
          data = buildHierarchy(data.values);
      }
    
      // Filter the data to only show up to 3 levels initially
      orientation = settings.orientation;
      delimiter = settings.delimiter || this.delimiter;
      drawDepth = settings.drawDepth || 2;
      filterByDepth(data, drawDepth);
    
      update(100, data);
    };
    

    function update(duration, data) {
      const width = element.clientWidth - m[1] - m[3];
      const height = element.clientHeight - m[0] - m[2];

      svg.attr("width", element.clientWidth).attr("height", element.clientHeight);

      const [xScale, yScale] = initializeScales(width, height);
      const nodes = treeLayout.nodes(data);
      const links = treeLayout.links(nodes);

      updateScales(xScale, yScale, nodes);
      const { xOffset, yOffset } = calculateOffsets(xScale, yScale, width, height);

      updateNodes(nodes, duration, xScale, yScale, xOffset, yOffset);
      updateLinks(links, duration, xScale, yScale, xOffset, yOffset);
  }

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
      const xOffset = (width - (xScale.domain()[1] - xScale.domain()[0])) / 2;
      const yOffset = (height - (yScale.domain()[1] - yScale.domain()[0])) / 2;
      return { xOffset, yOffset };
  }

  function updateNodes(nodes, duration, xScale, yScale, xOffset, yOffset) {
      const node = dataArea.selectAll(".Tree-node").data(nodes, d => d.id);

      node.enter().append("g")
          .attr("class", "Tree-node")
          .attr("transform", d => calculateNodePosition(d, xScale, yScale, xOffset, yOffset))
          .on("click", nodeClick)
          .on("mousemove", function(d) {
              tip.style("left", (d3.event.pageX + 20) + "px")
                  .style("top", (d3.event.pageY + 20) + "px")
                  .html(d.id);
              tip.transition().duration(500).style("opacity", 1);
          })
          .append("circle")
          .attr("class", "Tree-circle")
          .attr("r", 5);

      node.transition().duration(duration)
          .attr("transform", d => calculateNodePosition(d, xScale, yScale, xOffset, yOffset))
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
          .attr("d", d => calculateDiagonal(d, xScale, yScale, xOffset, yOffset));

      link.transition().duration(duration)
          .attr("d", d => calculateDiagonal(d, xScale, yScale, xOffset, yOffset));

      link.exit().transition().duration(duration).style("opacity", 0).remove();
  }

  function calculateDiagonal(d, xScale, yScale, xOffset, yOffset) {
      let sourceX, sourceY, targetX, targetY;
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

      switch (orientation) {
          case "north":
          case "south":
              return `M${sourceX},${sourceY}C${sourceX},${(sourceY + targetY) / 2} ${targetX},${(sourceY + targetY) / 2} ${targetX},${targetY}`;
          case "east":
          case "west":
              return `M${sourceX},${sourceY}C${(sourceX + targetX) / 2},${sourceY} ${(sourceX + targetX) / 2},${targetY} ${targetX},${targetY}`;
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
      update(100, data);
    }

    this.resize = function() {
      var newWidth = element.clientWidth - m[1] - m[3];
      var newHeight = element.clientHeight - m[0] - m[2];
      if (newWidth != width || newHeight != height) {
        update();
      }

    };

  };

}());
