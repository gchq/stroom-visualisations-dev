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
visualisations.ChordLabels = function() {
  
  var element = window.document.createElement("div");
  this.element = element;

  var d3 = window.d3;
  var m = [ 10, 15, 30, 15 ];
  var width = element.clientWidth - m[1] - m[3];
  var height = element.clientHeight - m[0] - m[2];
  
  var innerRadius = Math.min(width,height) *0.4;
  var outerRadius = innerRadius *1.1;
  
  var color = d3.scale.category20();
  var data;
  
  var style = ".Chord-chord{" +
  // "fill: none;"+
  "stroke: black;"+
  // "stroke-width: 0.5;"+
   "} "+
   ".Chord-arc {" +
  // "fill: black;"+
  "stroke: black;"+
   "} "+
   ".Chord-text{" +
  "font-weight: 600;"+
   "} "+
   ".Chord {" +
  "pointer-events: all;"+
   "} "+
   ".Chord-fade {" +
  "display: none;"+
   "} "+
  ".Chord-tip {" +
  "position: absolute;" +
  "font-size: 15px;"+
  "fill: red;"+
  "text-rendering: geometricPrecision;"+
   "background-color: rgba(255,255,255,0.6);"+
   "z-index:300;"+
   "} ";
  
  d3.select(element).append("style").text(style);
  
  var zoom = d3.behavior.zoom()
               .scaleExtent([0.1,10])
               .on("zoom", zoomed);
               
  var svg = d3.select(element).append("svg:svg")
                 .attr("class", "Chord");
                 
  var dataArea = svg.append("svg:g")
                    .attr("class","Chord-zoom");
  var initial = true;

 
  
  svg.call(zoom);
  
  var chord = d3.layout.chord()
                .padding(0.05)
                .sortGroups(d3.ascending)
                .sortSubgroups(d3.ascending)
                .sortChords(d3.ascending);

              
  var tip = d3.select(element).append("div")
                  .attr("class","Chord-tip")
                  .style("opacity",0);
                  
  function zoomed() {
    dataArea.attr("transform","translate("+d3.event.translate+")scale("+d3.event.scale+")");
  }
  
  function mouseover(d,i) {
    var other;
    dataArea.selectAll(".Chord-chord").classed("Chord-fade", function (p) {var source = p.source.index != i;
                                                                           var target = p.target.index != i;
                                                                           return source && target});
    dataArea.selectAll(".Chord-text").classed("Chord-fade", function (p) {return p.index != i && p.index != other;});
  }
  
  function mouseout(d,i) {
    dataArea.selectAll(".Chord-chord").classed("Chord-fade", false);
    dataArea.selectAll(".Chord-text").classed("Chord-fade", false);
  
  }


  function textAnchor(d) {
    return ((d.startAngle + d.endAngle)/2) > Math.PI ? "end" : null;
  }


  function textTransform(d) {
    return "rotate("+(((d.startAngle + d.endAngle)/2) *180/Math.PI -90)+")"+"translate("+((height/2)+10)+")"+(((d.startAngle + d.endAngle)/2) > Math.PI ? "rotate(180)" : "");
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
    
    data = makeMatrix(d.values);
    
    update(1000);
  };
  
  var update = function(duration) {
    width = element.clientWidth - m[1] - m[3];
    height = element.clientHeight - m[0] - m[2];
    svg.attr("width", element.clientWidth)
       .attr("height", element.clientHeight);
  
    if (data) {

      if (initial) {
         dataArea.attr("transform","translate("+width/2+","+height/2+")scale(0.9)");
         zoom.translate([width/2,height/2]);
         zoom.scale([0.9]);

         initial = false;
      };
      dataArea.selectAll(".Chord-text , .Chord-arc, .Chord-chord").remove();

      innerRadius = Math.min(width,height) * 0.41;
      outerRadius = innerRadius * 1.1;
      
      zoom.size([width,height]);
      
      chord.matrix(data.matrix);
      
      var chords = chord.chords();
      var groups = chord.groups();
      
      var arcz = dataArea.selectAll(".Chord-text , .Chord-arc")
                      .data(groups, function (d) {return data.labels[d.index];});
                         
      var ge = arcz.enter();

      ge.append("path")
        .attr("class","Chord-arc")
        .attr("fill", function (d) {return color(data.labels[d.index]);})
        .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);

      ge.append("text")
        .attr("class","Chord-text")
        .attr("dy",".35em")
        .text(function (d) {return data.labels[d.index];})
        .attr("text-anchor", textAnchor)
        .attr("transform", textTransform);
                             
      arcz.transition()
          .selectAll(".Chord-arc")
          .duration(duration)
          .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius));

      arcz.transition()
          .selectAll(".Chord-text")
          .duration(duration)
          .text(function (d) {return data.labels[d.index];})
          .attr("text-anchor", textAnchor)
          .attr("transform", textTransform);

      var ae = arcz.exit();
      ae.selectAll(".Chord-text , .Chord-arc")
        .transition()
        .duration(duration)
        .style("opacity",0)
        .remove();

      var chordz = dataArea.selectAll(".Chord-chord")
                           .data(chords, function (d) {return d.source.index+"-"+d.target.index;} );
                       
      chordz.enter()
            .append("path","path")
            .attr("class","Chord-chord")
            .attr("fill", function (d) {return color(data.labels[d.source.index]);});
                         
      chordz.transition().duration(duration)
            .attr("d", d3.svg.chord().radius(innerRadius))
            .style("opacity",1);
      
      chordz.exit()
          .transition().duration(duration)
          .style("opacity",0)
          .remove();
    }
  };
  
  function makeMatrix(d) {
    var matrix = [];
    var labels = d3.map();
    var names = [];
    var idx=0;

    d.forEach( function (data) {

      var source = data[0];
      var target = data[1];
      var counts = data[2];
      
      if (!labels.has(source)) {
        labels.set(source, {label:source,idx:idx++});
      }
      if (!labels.has(target)) {
        labels.set(target, {label:target,idx:idx++});
      }
      
      var row = matrix[labels.get(source).idx];
      if (!row) {
        row=matrix[labels.get(source).idx]=[];
      }
      row[labels.get(target).idx] = Number(counts);
      
      row = matrix[labels.get(target).idx];
      if (!row) {
        row=matrix[labels.get(target).idx]=[];
      }

    });
    
  var i = 0;
  
  labels.forEach(function (key,value) {
    names[value.idx] = key;
  });
  
  for (i=0;i<idx;i++)
  {
   for (var j=0;j<idx;j++)
   {
     if (!matrix[i][j]) {matrix[i][j]=0;} 
   }
  }
  
  return {labels:names, matrix:matrix};
  }
  
};
