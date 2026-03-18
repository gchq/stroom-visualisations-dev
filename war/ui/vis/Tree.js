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
//TODO Needs adding into TestVis.js, including in TestData.js, integrating with the latest version of
//Common.js and GenericGrid.js

if (!visualisations) {
  var visualisations = {};
}
visualisations.Tree = function() {
  
  var element = window.document.createElement("div");
  this.element = element;

  var d3 = window.d3;
  var m = [ 10, 15, 30, 15 ];
  var width = element.clientWidth - m[1] - m[3];
  var height = element.clientHeight - m[0] - m[2];
  
  var color = d3.scale.category20b();
  var data;
  
  var style = ".Tree-node {" +
  // "position: absolute;" +
   "width: 100%;" +
   "height: 15px;" +
   "background-color: #555555;"+
   "color: white;"+
   "overflow: hidden;" +
   "text-rendering: geometricPrecision;"+
   "text-overflow: ellipsis;"+
   "word-wrap: break-word;" +
   "} "+
   ".Tree-link {" +
  "fill: none;"+
  "stroke: black;"+
   "} "+
   ".Tree {" +
  "pointer-events: all;"+
   "} "+
   ".Tree-circle {" +
  "fill: white;"+
  "stroke-width: 3;"+
   "} "+
  ".Tree-tip {" +
  "position: absolute;" +
  "font-size: 15px;"+
  "fill: red;"+
  "text-rendering: geometricPrecision;"+
   "background-color: rgba(255,255,255,0.6);"+
   "z-index:300;"+
   "} ";
  
  d3.select(element).append("style").text(style);
  
  var xScale = d3.scale.linear().range([0, width]);
  var yScale = d3.scale.linear().range([0, height]);
  
  var zoom = d3.behavior.zoom()
               .scaleExtent([0.1,10])
               .on("zoom", zoomed);
               
  var svg = d3.select(element).append("svg:svg")
                 .attr("class", "Tree");
                 
  var dataArea = svg.append("svg:g").attr("transform","translate(0,0)");
  
  svg.call(zoom);
  
  var tree = d3.layout.tree()
              .separation(function(a,b) {return a.parent == b.parent ? 5:20;})
              .nodeSize([5,100]);

              
  var diagonal = d3.svg.diagonal()
                   .projection(function (d) {return [d.x, d.y];});
                   
  var tip = d3.select(element).append("div")
                  .attr("class","Tree-tip")
                  .style("opacity",0);
                  
  function zoomed() {
    dataArea.attr("transform","translate("+d3.event.translate+")scale("+d3.event.scale+")");
  }
  
  function collapse(d) {
   if (d.children) {
     d._children = children;
     d._children.forEach(collapse);
     d.children = null;
   } 
  }
  
  function nodeClick(d) {
    if (d.children) {
      d._children = d.children;
      d.children = null;
    } else {
      d.children = d._children;
      d._children = null;
    }
    update(100);
  }
  
  this.resize = function() {
    var newWidth = element.clientWidth - m[1] - m[3];
    var newHeight = element.clientHeight - m[0] - m[2];
    if (newWidth != width || newHeight != height) {
      update();
    }
  };
  
  this.setData = function(context, settings, d) {
    // If the context already has a colour set then use it, otherwise set it
    // to use this one.
    if (context) {
      if (context.color) {
        color = context.color;
      } else {
        context.color = color;
      }
    }
    
    data = makeHierarchy(d.values);
    
    update(100);
  };
  
  
  var update = function(duration) {
    width = element.clientWidth - m[1] - m[3];
    height = element.clientHeight - m[0] - m[2];
    svg.attr("width", element.clientWidth).attr("height", element.clientHeight);
  
    if (data) {

      xScale = d3.scale.linear().range([0, width]);
      yScale = d3.scale.linear().range([0, height]);
      
      zoom.size([width,height]);
      
      var nodes = tree(data).filter(function(d) {return d.id != "Tree-root";});
      var links = tree.links(nodes);
      
      //nodes.forEach(function (d) {
        //console.log(d.id+" old:"+d.y+" depth:"+d.depth);
        //// if (depthCount[d.depth-1]) {
        ////   d.y = depthCount[d.depth-1]*(d.depth+1);
        //// }
        //d.y = Math.max(d.y,  (d.y+(200*d.depth))) ;
        //console.log("new:"+d.y);
      //});

      var x = function(d) {
        return d.x;
      };
      
      var y = function(d) {
        return d.y;
      };
      
      xScale.domain([d3.min(nodes,x), d3.max(nodes,x)]);
      yScale.domain([d3.min(nodes,y), d3.max(nodes,y)]);
      
      var node = dataArea.selectAll(".Tree-node")
                         .data(nodes, function (d) {return d.id;});
                         
      var nodeEnter = node.enter()
                            .append("g")
                            .attr("class", "Tree-node")
                            .attr("transform",function (d) {return "translate("+d.x+","+d.y+")";})
                            .on("click", nodeClick)
                            .on("mousemove", function (d) {
                              // zoom.event(dataArea);
                              tip.style("left", d3.mouse(svg.node())[0]+20+"px")
                                .style("top", d3.mouse(svg.node())[1]+20+"px")
                                .html(d.id+"<br/>"+d.group);
                              tip.transition().duration(500)
                                 .style("opacity",1);
                             });
                             
      nodeEnter.append("svg:circle")
               .attr("class","Tree-circle")
               .attr("r",5);
               
      node.transition().duration(100)
          .attr("transform",function (d) {return "translate("+d.x+","+d.y+")";})
          .style("stroke",function(d) {return color(d.group);})
          .select(".Tree-circle").style("fill", function (d) { return d._children ? color(d.group):"white";});
          
      node.exit()
          .transition().duration(100)
          .style("opacity",0)
          .remove();
              
      var link = dataArea.selectAll(".Tree-link")
                         .data(links, function (d) {return d.source.id + d.target.id;});
                       
      var linkEnter = link.enter()
                          .insert("path","g")
                          .attr("class","Tree-link")
                          .attr("d", diagonal);
                         
      link.attr("d", diagonal);
      
      link.exit()
          .transition().duration(100)
          .style("opacity",0)
          .remove();
      
    }
 
  };
  
  function makeHierarchy(d) {
    var root = {id:"Tree-root", group:"Tree-group", children:[]};
    var all = {};
   
    d.forEach( function (data) {
      all[data[0]] = {id:data[0], group:data[2], children :[]};
    });
   
   d.forEach(function (data) {
     var item = all[data[0]];  
     if (!(data[1] in all)) {
       all[data[1]] = {id:data[1], group:data[2], children:[]};
       root.children.push(all[data[1]]);
     } 
     var p = all[data[1]];
     p.children.push(item);
    
   });
   
  return root;
  }
  
};
