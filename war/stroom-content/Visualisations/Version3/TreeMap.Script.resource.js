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
visualisations.TreeMap = function() {
  
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
   "word-wrap: break-word;" +
   "} "+
   ".TreeMap-parent {" +
   "position: absolute;" +
   "font-weight: bold;" +
   "text-align: center;" +
   "border: 1px solid white;" +
   "opacity: 0;"+
   "} "+
   ".TreeMap-child {" +
   "border: 1px solid white;" +
   "color: black;"+
   "opacity: 0;"+
   "}" ;
  
  d3.select(element).append("style").text(style);
  

  var outer = svg.append("div")
            .style("left", m[1]+"px")
            .style("top", m[0]+"px")
            .style("position", "relative");

  var legend = svg.append("svg:text")
                  .attr("opacity","0")
                  .attr("text-anchor", "middle")
                  .attr("dy", ".3em")
                  .style("font-size", "20px")
                  .style("text-rendering", "geometricPrecision");
  
  var selectedSeries;
  
  var dataArea = outer.append("div")
     .attr("class", "data");
     
  var treeMap = d3.layout.treemap()
                         .size([width,height])
                         .padding([15,0,0,0])
                         .mode("squarify")
                         .sticky(false);

  var color = d3.scale.category10();
  
  var data;
  
  var area;
  
    
  var position = function () {
    this.style("left",   function(d) {return d.x +"px";}) 
        .style("top",    function(d) {return d.y +"px";})
        .style("width",  function(d) {return d.dx +"px";})
        .style("height", function(d) {return d.dy +"px";});

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
      data = classes(d.values);
    }
    
    update(1000);
  };
  
  var update = function(duration) {
    if (data) {
      
       width = element.clientWidth - m[1] - m[3];
       height = element.clientHeight - m[0] - m[2];
       svg.attr("width", element.clientWidth).attr("height", element.clientHeight);
       outer.attr("width", width).attr("height", height);
       
       treeMap.size([width,height]);
       
       var nodes = treeMap.nodes(data);
       
       var parents = nodes.filter(function (d) {return d.children;});
       var children = nodes.filter(function (d) {return !d.children;});

       var g = dataArea.selectAll(".TreeMap-parent")
                                .data(parents, function (d) {return d.series;});
       g.enter()
        .append("div")
        .attr("class","TreeMap-parent")
        .call(position)
        .style("background", function (d) {return color(d.series);})
        .append("div")
        .attr("class","TreeMap-label")
        .text(function (d) {return d.series == "root" ? "" : d.series;});
        
      g.exit()
       .transition()
       .duration(duration)
       .style("opacity",0).remove();
       
      g.transition()
       .duration(duration)
       .style("opacity",1)
       .call(position);
       
      g = dataArea.selectAll(".TreeMap-child")
                  .data(children, function (d) {return d.series + d.name;});
      g.enter()
        .append("div")
        .attr("class","TreeMap-child TreeMap-label")
        .call(position)
        .style("background", function (d) {return color(d.series);})
        .append("text");
        
      g.exit()
       .transition()
       .duration(duration)
       .style("opacity",0).remove();
       
      g.transition()
       .duration(duration)
       .style("opacity",1)
       .call(position)
       .text(function (d) {return d.area < 2000 ? "..." : d.name+" : "+d.value;});
    }
  };
  
  function zoom(d) {
    treeMap.nodes(d);
  }


  this.resize = function() {
    var newWidth = element.clientWidth - m[1] - m[3];
    var newHeight = element.clientHeight - m[0] - m[2];
    if (newWidth != width || newHeight != height) {
       update(0);
    }
  };
  

 function classes(arr) {
   var par = {parent:null, children: null, name: "root", series: "root", value:null};
   var series = [];
   for (var i=0;i < arr.length; i++)
   {
     var key = arr[i].key;
     var thisSeries = {parent:par, children:null, series:key, name:null, value:null};
     thisSeries.children  = children(arr[i].values,thisSeries,key);
     series.push(thisSeries);
     }
   par.children = series;
   return par;
  }
  
  function children(arr,par,series) {
    var values = [];
    for (var i=0;i < arr.length; i++)
   {
     var name = arr[i][0];
     var value = arr[i][1];
     values.push({parent:par, children:null, series:series, name:name, value:value});
     }
    return values;
  }
 
};


