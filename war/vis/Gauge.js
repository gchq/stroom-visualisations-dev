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
 *  * Visualisation to display a datapoint and some text
 *   * Data is expected in the form of...
 *    * 
 *     */



if (!visualisations) {
    var visualisations = {};
}
visualisations.Gauge = function() {
  var element = window.document.createElement("div");
  this.element = element;
  
  var d3 = window.d3;
  var svg = d3.select(element).append("svg:svg");
  var self = this; // for internal d3 functions

  var pointerLine = d3.svg.line()
                      .x(function(d) { return d.x })
                      .y(function(d) { return d.y })
                      .interpolate("basis");
  
  var data, config,range ;
  this.setData = function(context, settings, d) {
    data = d.values;
    config = settings;
    update(1000);
  };
  
  var update = function(duration) {
    if (data) {
      svg.attr("width", element.clientWidth).attr("height", element.clientHeight);

      var g = svg.selectAll("svg").data(data,(function (d) {return 'X';}));


      range = config.RedHi 

      var ge = g.enter()
       .append("svg:svg");

      ge.append("svg:circle")
    .attr("class", "outer")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 50)
    .style("fill", "#ccc")
    .style("stroke", "#000")
    .style("stroke-width", "0.5px");
                    
      ge.append("svg:circle")
    .attr("class", "inner")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 45)
    .style("fill", "#fff")
    .style("stroke", "#e0e0e0")
    .style("stroke-width", "2px");


      ge.append("svg:text")
        .attr("class","value")
        .attr("x", 0)
        .attr("y", 0)
    .attr("dy", 8)
        .attr("text-anchor", "middle")
    .style("font-size","10px")
    .style("fill", "#333")
    .style("stroke-width", "0px");


      self.drawBand(ge,config.GreenLo,config.GreenHi,"green");
      self.drawBand(ge,config.AmberLo,config.AmberHi,"darkorange");
      self.drawBand(ge,config.RedLo,config.RedHi,"red");

      var majorDelta = (config.RedHi) / 10 ;
      for (var major = 0; major <= 10; major++)
      {
         self.drawMajorTick(ge,majorDelta*major,(majorDelta*major+majorDelta/100),"black");
      }


      var majorDelta = (config.RedHi) / 100 ;
      for (var major = 0; major <= 100; major++)
      {
         self.drawMinorTick(ge,majorDelta*major,(majorDelta*major+majorDelta/10),"black");
      }
            
      var pc = ge.append("svg:g")
                 .attr("class", "pointerContainer");

      pc.append("svg:path")
        .attr("class", "pointer")
//        .attr("d",pointerLine)
        .style("fill", "#dc3912")
    .style("stroke", "#666")
    .style("fill-opacity", 0.7);


      pc.append("svg:circle")
        .attr("class", "pointerCircle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", 0.12 * 45)
    .style("fill", "#4684EE")
    .style("stroke", "#666")
    .style("opacity", 1);;

      g.exit()
       .transition()
       .duration(duration)
       .style("opacity",0).remove();
       
      g.transition()
       .duration(duration)
       .selectAll("circle")
       .style("opacity",1);

      g.transition()
       .duration(0)
       .selectAll(".pointer");



      g.each(function(d) {
          var e = d3.select(this);

          var circleInner = e.select(".inner");
          var circleOuter = e.select(".outer");

          var pointer = e.select(".pointer");
          var pointerCircle = e.select(".pointerCircle");


          var green = e.select(".green");
          var amber = e.select(".darkorange");
          var red = e.select(".red");

          var count = e.select(".value");
          var ticks = e.selectAll(".tick");

          var bbc = circleOuter.node().getBBox();
          var scale = Math.min((element.clientWidth -10) / bbc.width,(element.clientHeight -10) / bbc.height);

          circleOuter.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+")");
          circleInner.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+")");
          pointer.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+")");
          pointerCircle.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+")");
          green.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+") rotate(270)");
          amber.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+") rotate(270)");
          red.attr("transform","translate("+element.clientWidth/2 +","+element.clientHeight/2 +")scale("+scale+") rotate(270)");
          count.attr("transform","translate("+((element.clientWidth/2)-(bbc.width*scale*.07)) +","+(((element.clientHeight/2)+(bbc.height*scale*.25)))+")scale("+scale*0.75+")");
          ticks.each(function (d) {
             var e = d3.select(this);
             e.attr("transform","translate("+element.clientWidth/2 +","+(element.clientHeight/2) +")scale("+scale+")rotate(270)");
          });


          var val = d[0];
          count.text(val);

          if (val > config.RedHi) {
             val = config.RedHi; 
             count.style("fill","red");
             count.attr("text-decoration","underline");
         }
         else {
            count.style("fill","#333");
            count.attr("text-decoration","inherit");
         }
     var pointerPath = buildPointerPath(val);
         var temp = pointerLine(pointerPath);
         pointer.attr("d",temp);
          
 
       });
    }
  };


  this.drawBand = function(g, start, end, color)
    {
        if (0 >= end - start) return;
        
        g.append("svg:path")
                 .attr("class",color)
         .style("fill", color)
         .attr("d", d3.svg.arc()
         .startAngle(this.valueToRadians(start))
         .endAngle(this.valueToRadians(end))
         .innerRadius(0.65 * 50)
         .outerRadius(0.85 * 50))
         .attr("transform", function() { return "translate(" + element.clientWidth/2 + ", " + element.clientHeight/2 + ") rotate(270)" });
    }


  this.drawMajorTick = function(g, start, end, color)
    {
        if (0 >= end - start) return;
        
        g.append("svg:path")
                 .attr("class","tick")
         .style("fill", color)
         .attr("d", d3.svg.arc()
         .startAngle(this.valueToRadians(start))
         .endAngle(this.valueToRadians(end))
         .innerRadius(0.75 * 50)
         .outerRadius(0.85 * 50))
         .attr("transform", function() { return "translate(" + element.clientWidth/2 + ", " + element.clientHeight/2 + ") rotate(270)" });
    }


  this.drawMinorTick = function(g, start, end, color)
    {
        if (0 >= end - start) return;
        
        g.append("svg:path")
                 .attr("class","tick")
         .style("fill", color)
         .attr("d", d3.svg.arc()
         .startAngle(this.valueToRadians(start))
         .endAngle(this.valueToRadians(end))
         .innerRadius(0.80 * 50)
         .outerRadius(0.85 * 50))
         .attr("transform", function() { return "translate(" + element.clientWidth/2 + ", " + element.clientHeight/2 + ") rotate(270)" });
    }


  var buildPointerPath = function(value)
    {

        var delta = range / 9;
        
        var head = valueToPoint(value, 0.85);
        var head1 = valueToPoint(value - delta, 0.12);
        var head2 = valueToPoint(value + delta, 0.12);
        
        var tailValue = value - (range * (1/(270/360)) / 2);
        var tail = valueToPoint(tailValue, 0.28);
        var tail1 = valueToPoint(tailValue - delta, 0.12);
        var tail2 = valueToPoint(tailValue + delta, 0.12);
        
        return [head, head1, tail2, tail, tail1, head2, head];


        function valueToPoint(value, factor)
        {
            var point = self.valueToPoint(value, factor);
            point.x -= 100;
            point.y -= 100;
            return point;
        }
        

    }


   this.valueToDegrees = function(value)
    {

        return value / range * 270 - (0 / range * 270 + 30);
    }
    
   this.valueToRadians = function(value)
    {
        return this.valueToDegrees(value) * Math.PI / 180;
    }
    
   this.valueToPoint = function(value, factor)
    {
        return {        x: 100 - 45 * factor * Math.cos(this.valueToRadians(value)),
                y: 100 - 45 * factor * Math.sin(this.valueToRadians(value))             };
    }

  this.resize = function() {
    update(1000);   
  };
};


