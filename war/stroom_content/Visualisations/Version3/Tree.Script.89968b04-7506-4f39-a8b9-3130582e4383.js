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
  visualisations.Tree = function() {

    var element = window.document.createElement("div");
    this.element = element;

    var d3 = window.d3;
    var m = [10, 15, 30, 15]; // margins
    var width = element.clientWidth - m[1] - m[3];
    var height = element.clientHeight - m[0] - m[2];
    this.delimiter = '/'; // default delimiter
    var color = d3.scale.category20b();

    var style = ".Tree-node {" +
                "width: 100%;" +
                "height: 15px;" +
                "background-color: #555555;" +
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

    d3.select(element).append("style").text(style);

    var svg = d3.select(element).append("svg:svg")
                  .attr("class", "Tree");

    var dataArea = svg.append("svg:g").attr("transform", "translate(0,0)");
    var zoom = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed);
    svg.call(zoom);

    var treeLayout = d3.layout.tree().size([height, width]);
    var diagonal = d3.svg.diagonal().projection(function(d) { return [d.x, d.y]; });
    var tip = d3.select(element).append("div").attr("class", "Tree-tip").style("opacity", 0);

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
      // Merge logic here: add newTree nodes to existingTree
      // This requires an algorithm to merge trees based on their paths
      // For simplicity, assume the new tree is added to existing
      existingTree.children.push.apply(existingTree.children, newTree.children);
      return existingTree;
    }

    this.setData = function(context, settings, d) {
      var data;
      if (context) {
        if (context.color) {
          color = context.color;
        } else {
          context.color = color;
        }
        delimiter = settings.delimiter || this.delimiter; // Use provided delimiter or default
      }

      if (data) {
        data = mergeTrees(data, d.values);
      } else {
        data = buildHierarchy(d.values);
      }

      update(100, data);
    };

    function update(duration, data) {
      width = element.clientWidth - m[1] - m[3];
      height = element.clientHeight - m[0] - m[2];
      svg.attr("width", element.clientWidth).attr("height", element.clientHeight);
  
      // Define scales based on the calculated width and height
      xScale = d3.scale.linear().range([0, width]);
      yScale = d3.scale.linear().range([0, height]);
  
      var nodes = treeLayout.nodes(data);
      var links = treeLayout.links(nodes);
  
      // Update scale domains
      xScale.domain([d3.min(nodes, function(d) { return d.x; }), d3.max(nodes, function(d) { return d.x; })]);
      yScale.domain([d3.min(nodes, function(d) { return d.y; }), d3.max(nodes, function(d) { return d.y; })]);
  
      // Centering calculation
      var xOffset = (width - (xScale.domain()[1] - xScale.domain()[0])) / 2;
      var yOffset = (height - (yScale.domain()[1] - yScale.domain()[0])) / 2;
  
      var node = dataArea.selectAll(".Tree-node").data(nodes, function(d) { return d.id; });
  
      // Enter selection
      node.enter().append("g")
          .attr("class", "Tree-node")
          .attr("transform", function(d) {
              return "translate(" + (xScale(d.x) + xOffset) + "," + (yScale(d.y) + yOffset) + ")";
          })
          .on("click", nodeClick)
          .on("mousemove", function(d) {
              tip.style("left", d3.mouse(svg.node())[0] + 20 + "px")
                  .style("top", d3.mouse(svg.node())[1] + 20 + "px")
                  .html(d.id);
              tip.transition().duration(500).style("opacity", 1);
          })
          .append("circle")
          .attr("class", "Tree-circle")
          .attr("r", 5);
  
      // Update selection
      node.transition().duration(duration)
          .attr("transform", function(d) {
              return "translate(" + (xScale(d.x) + xOffset) + "," + (yScale(d.y) + yOffset) + ")";
          })
          .select(".Tree-circle")
          .style("fill", function(d) { return color(d.id); });
  
      // Exit selection
      node.exit().transition().duration(duration).style("opacity", 0).remove();
  
      // Link selection
      var link = dataArea.selectAll(".Tree-link").data(links, function(d) { return d.source.id + d.target.id; });
  
      link.enter().insert("path", "g")
          .attr("class", "Tree-link")
          .attr("d", function(d) {
              return diagonal({
                  source: { x: xScale(d.source.x) + xOffset, y: yScale(d.source.y) + yOffset },
                  target: { x: xScale(d.target.x) + xOffset, y: yScale(d.target.y) + yOffset }
              });
          });
  
      link.transition().duration(duration)
          .attr("d", function(d) {
              return diagonal({
                  source: { x: xScale(d.source.x) + xOffset, y: yScale(d.source.y) + yOffset },
                  target: { x: xScale(d.target.x) + xOffset, y: yScale(d.target.y) + yOffset }
              });
          });
  
      link.exit().transition().duration(duration).style("opacity", 0).remove();
    }      

    function nodeClick(d) {
      // Node click handling here
    }

    this.resize = function() {
      var newWidth = element.clientWidth - m[1] - m[3];
      var newHeight = element.clientHeight - m[0] - m[2];
      if (newWidth != width || newHeight != height) {
        update();
      }

    };

  };
