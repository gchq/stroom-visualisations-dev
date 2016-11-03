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

/*
 * Visualisation to display a datapoint and some text
 * Data is expected in the form of...
 * 
 */



if (!visualisations) {
    var visualisations = {};
}
visualisations.IFrame= function() {
  var element = window.document.createElement("div");
  this.element = element;
  
  var d3 = window.d3;
  var svg = d3.select(element);
  
  var data;
  var config;
  var width = element.cleintWidth;
  var height = element.cleintHeight;
  this.setData = function(context, settings, d) {
    data = d.values;
    config = settings;
    update(100);
  };
  
  var update = function(duration) {
    if (data) {
      svg.attr("width", element.clientWidth).attr("height", element.clientHeight);


      var g = svg.selectAll(".iframe").data(data);

      g.enter()
        .append("iframe")
        .attr("class","iframe")
        .attr("height",element.clientHeight)
        .attr("width",element.clientWidth)
        .style("border","none")
        .style("padding","0px")
        .style("margin","0px")
        ;
        
      g.exit()
       .transition()
       .duration(duration)
       .style("opacity",0).remove();
       
      g.transition()
       .duration(duration)
       .style("opacity",1);


      g.each(function(d) {
         var iframe = d3.select(this);

         iframe.attr("src", config.URL.replace('@@',d[0]))
               .attr("height",element.clientHeight)
               .attr("width",element.clientWidth);

    });
   };
  };

  this.resize = function() {
    if (width !== element.clientWidth || height !== element.clientHeight)
    {
       width = element.clientWidth;
       height = element.clientHeight;
       update(100);   
    };
  };
};


