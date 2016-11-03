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
visualisations.ZoomableTreeMap = function() {
  
  var element = window.document.createElement("div");
  this.element = element;
  
  var m = [20, 20, 20, 20];

  var d3 = window.d3;
  var width = element.clientWidth - m[1] - m[3];
  var height = element.clientHeight - m[0] - m[2];
  
  var interpolationMode = "step";

  var svg = d3.select(element).append("div");
  
  var style = ".TreeMap-label {" +
   "position: absolute;" +
   "width: 100%;" +
   "height: 15px;" +
   "background-color: #555555;"+
   "color: white;"+
   "overflow: hidden;" +
   "text-rendering: geometricPrecision;"+
   "text-overflow: ellipsis;"+
   "word-wrap: break-word;" +
   "} "+
   ".TreeMap-parent {" +
   "position: absolute;" +
   "font-weight: bold;" +
   "text-align: center;" +
   "border: 1px solid white;" +
   "opacity: 0;"+
   "} "+
   ".TreeMap {" +
   "-webkit-user-select: none;" +
   "} "+
      ".TreeMap-tip {" +
   "position: absolute;" +
   "background-color: rgba(255,255,255,0.6);"+
   "z-index:300;"+
   "} "+
   ".TreeMap-child {" +
   "border: 1px solid white;" +
   "color: black;"+
   "text-overflow: ellipsis;"+
   "opacity: 0;"+
   "}" ;
  
  d3.select(element).append("style").text(style);
  

  var outer = svg.append("div")
            .style("left", m[1]+"px")
            .style("top", m[0]+"px")
            .style("position", "relative");

  var legend = svg.append("div")
                  .attr("opacity","0")
                  .attr("text-anchor", "middle")
                  .attr("dy", ".3em")
                  .style("color","red")
                  .style("background","black")
                  .style("font-size", "20px")
                  .style("text-rendering", "geometricPrecision");
  
  var selectedSeries;
  
  var dataArea = outer.append("div")
     .attr("class", "TreeMap");
     
  var treeMap = d3.layout.treemap()
                         .size([width,height])
                         .padding([15,4,4,4])
                         .mode("squarify")
                         .sticky(false)
                         .value( function(d) {
                           return (d.children) ? d.children.length : 1;
                           
                         });

  var color = d3.scale.category20b();
  
  var xScale = d3.scale.linear().range([0, width]);
  var yScale = d3.scale.linear().range([0, height]);
  
  var data;
  
  var node,root;
  
  var tip = svg.append("div")
               .attr("class","TreeMap-tip")
               .style("opacity",0);
    
  var position = function (d,i) {
    this
    .transition().duration(i)
        .style("opacity",1)
        .style("left",   function(d) {return xScale(d.x) +"px";}) 
        .style("top",    function(d) {return yScale(d.y) +"px";})
        .style("width",  function(d) {return xScale(d.dx) +"px";})
        .style("height", function(d) {return yScale(d.dy) +"px";});

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
    
   if (settings) {
      if (settings.mode) {
        treeMap.mode(settings.mode);
      }
    }

    if (d.values !== null) {
      node = root = data = makeHierarchy(d.values);
    }
    
    update(100);
    unzoom(root,100);
  };
  
  var update = function(duration) {
    if (data) {
      
       width = element.clientWidth - m[1] - m[3];
       height = element.clientHeight - m[0] - m[2];
       svg.attr("width", element.clientWidth).attr("height", element.clientHeight);
       outer.attr("width", width).attr("height", height);
   
         
       xScale = d3.scale.linear().range([0, width]);
       yScale = d3.scale.linear().range([0, height]);
      
       xScale.domain([0, width]);
       yScale.domain([0, height]);
       
       treeMap.size([width,height]);
       
       var nodes = treeMap.nodes(root);
       
       var parents = nodes.filter(function (d) {return d.children;});
       var children = nodes.filter(function (d) {return !d.children;});

       var g = dataArea.selectAll(".TreeMap-parent")
                                .data(parents, function (d) {return d.name;});
       g.enter()
        .append("div")
        .attr("class","TreeMap-parent")
        .style("z-index",1)
        .style("background", function (d) {return color(d.series);})
        .on("click", function(d) {unzoom(d);})
        .append("div")
        .attr("class","TreeMap-label")
        .text(function (d) {return d.name == "root" ? "" : d.name;});
        
      g.exit()
       .transition()
       .duration(duration)
       .style("opacity",0).remove();
       
      g.transition()
       .duration(duration)
       .call(position,100);
       
      g = dataArea.selectAll(".TreeMap-child")
                  .data(children, function (d) {return d.series + d.name;});
      g.enter()
        .append("div")
        .attr("class","TreeMap-child TreeMap-label")
        .style("z-index",2)
        .style("background", function (d) {return color(d.series);})
        .on("click", function(d) {zoom(d);})
        .on("mousemove", function (d) {
          tip.style("left", d3.mouse(svg.node())[0]+20+"px")
             .style("top", d3.mouse(svg.node())[1]+20+"px")
             .html("Series: "+d.series+"<br/>Name: "+d.name+"<br/>Value: "+d.value);
          tip.transition().duration(500)
             .style("opacity",1);
         });
        
      g.exit()
       .transition()
       .duration(duration)
       .style("opacity",0).remove();
       
      g.transition()
       .duration(duration)
       .text(function (d) {return d.name;})
       .call(position,200);

    }
  };
  

  function zoom(d,duration) {
    
    var level = d;
    
    treeMap.nodes(d.parent);
    
    var zoomTransition = dataArea.selectAll(".TreeMap-parent")
                                 .filter(function(d) {
                                   return d === level.parent; 
                                 })
                                // .transition()
                                // .duration(duration)
                                 .style("z-index",199)
                                 .call(position,500); 

    zoomTransition = dataArea.selectAll(".TreeMap-child")
                                 .filter(function(d) {return d.parent === level.parent;})
                                 .style("z-index",200)
                                 .call(position,500)
     
                                 ;
    
 
    node = d;
    

    if (d3.event) {
      d3.event.stopPropagation();
      }
  }
  
    function unzoom(d,duration) {
    
    var level = root;
    
    treeMap.nodes(root);
    
    var zoomTransition = dataArea.selectAll(".TreeMap-parent")
                                 .style("z-index",1)
                                 .call(position,500); 

    zoomTransition = dataArea.selectAll(".TreeMap-child")
                                 .style("z-index",1)
                                 .call(position,500);
                                 
    node = d;

    if (d3.event) {
      d3.event.stopPropagation();
      }
  }

  this.resize = function() {
    var newWidth = element.clientWidth - m[1] - m[3];
    var newHeight = element.clientHeight - m[0] - m[2];
    if (newWidth != width || newHeight != height) {
       update(0);
    }
  };
  

  function makeHierarchy(d) {
    var root = {series:"root", name:"root", children:[]};
    var all = {};
    
    
    all[root] = root;
   
    d.forEach( function (data) {
      all[data[0]] = {series:data[1], name:data[0], children :[]};
    });
   
   d.forEach(function (data) {
     var item = all[data[0]];  
     if (!(data[1] in all)) {
       all[data[1]] = {series:data[3], name:data[1], children:[]};
       root.children.push(all[data[1]]);
     } 
     var p = all[data[1]];
     p.children.push(item);
    
   });
   
  return root;
  }
 
};


