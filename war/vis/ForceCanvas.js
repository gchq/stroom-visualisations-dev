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
if (!visualisations) {
  var visualisations = {};
}
visualisations.ForceCanvas = function() {
  var element = window.document.createElement("div");
  this.element = element;

  var d3 = window.d3;

  var width = element.clientWidth;
  var height = element.clientHeight;

  // Create a colour set.
  var color = d3.scale.category20();

  var canvas = window.document.createElement("canvas");
  element.appendChild(canvas);

  // Add mouse listeners
  var mousedown = false;
  var mousepos = {
    x : 0,
    y : 0
  };
  var pan = {
    x : 0,
    y : 0
  };
  var zoom = 1.0;
  canvas.addEventListener("mousedown", function(e) {
    mousedown = true;
  });
  canvas.addEventListener("mouseup", function(e) {
    mousedown = false;
  });
  canvas.addEventListener("mousemove", function(e) {
    if (mousedown) {
      pan.x += e.clientX - mousepos.x;
      pan.y += e.clientY - mousepos.y;
    }

    mousepos.x = e.clientX;
    mousepos.y = e.clientY;
  });
  canvas.addEventListener("mousewheel", function(e) {
    var delta = 0;
    if (e.wheelDelta) {
      delta = e.wheelDelta / 1200;
    }

    var newZoom = zoom - delta;
    newZoom = newZoom > 0.1 ? newZoom : 0.1;
    
    if (newZoom !== zoom) {
//      pan.x -= (mousepos.x / 2) * delta;
//      var dx =  mousepos.x / width;
//      var dy = mousepos.y / height;
//      
//      if (delta > 0) {
//        pan.x -= delta * mousepos.x;
//        pan.y -= delta * mousepos.y;
//      } else {
//        pan.x += delta * mousepos.x;
//        pan.y += delta * mousepos.y;        
//      }
      
      zoom = newZoom;
    }
  });

  //  
  // /* Zoom with mousewheel - keeping mouse position in same location*/
  // var zoom = 1.0;
  // var x = 0;
  // var y = 0;
  //  
  //
  // function wheel(event) {
  // var delta = 0;
  // if (!event) event = window.event;
  // if (event.wheelDelta) {
  // delta = event.wheelDelta/1200;
  // } else if (event.detail) {
  // delta = -event.detail/3;
  // }
  // var move = (delta<0) ? -delta * zoom_speed : 1/(delta*zoom_speed);
  // zoom = zoom - delta;
  // zoom = zoom > 0.1 ? zoom : 0.1;
  //  
  // var mousex = current_mouse[0];
  // var mousey = current_mouse[1];
  //
  // //To do use mouse in zoom
  //      
  // viewBox.height = height * zoom;
  // viewBox.width = width * zoom;
  //      
  // viewBox.x= width > viewBox.width ? (width - viewBox.width )/ 2 : -
  // (viewBox.width - width) / 2;
  // viewBox.y= height > viewBox.height? (height - viewBox.height) /2 : -
  // (viewBox.height - height) / 2;
  //      
  // //console.log("Mouse " + mousex + ", " + mousey);
  // var e = d3.event;
  //
  //
  // // if (e)
  // // {
  // // e.preventDefault();
  // // e.stopPropagation();
  //
  // // }
  // }

  var ctx = canvas.getContext('2d');

  var linkLength = 30;
  var nodeCharge = -200;
  var gradientRadius = 1.35;

  var minGradientStop = 30;
  var maxGradientStop = 100;

  var stopColour0 = "#ff8888";
  var stopColour1 = "#8888ff";
  var stopColourVariable = "#aaccee";
  var stopColour100 = "#eeeeee";
  var stopColourEqual = stopColourVariable;

  var links = {};
  var nodes = {};
  var linksForForce = [];
  var nodesForForce = [];

  var force = d3.layout.force().charge(nodeCharge).distance(linkLength).nodes(
      nodesForForce).links(linksForForce);

  var render = function() {
    var radius = 10 * zoom;
    var lineWidth = 2 * zoom;

    // Clear the canvas.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all of the links.
    ctx.strokeStyle = 'grey';
    linksForForce.forEach(function(d) {
      var source = {
        x : (d.source.x + pan.x) * zoom,
        y : (d.source.y + pan.y) * zoom
      };
      var target = {
        x : (d.target.x + pan.x) * zoom,
        y : (d.target.y + pan.y) * zoom
      };

      // Don't bother drawing links that would be off screen.
      if (source.x > -radius || source.x < canvas.width + radius
          || source.y > -radius || source.y < canvas.height + radius
          || target.x > -radius || target.x < canvas.width + radius
          || target.y > -radius || target.y < canvas.height + radius) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });

    // Draw all of the nodes.
    ctx.fillStyle = 'green';
    ctx.strokeStyle = 'black';
    nodesForForce.forEach(function(d) {
      var pos = {
        x : (d.x + pan.x) * zoom,
        y : (d.y + pan.y) * zoom
      };
      
      // Don't bother drawing nodes that would be off screen.
      if (pos.x > -radius || pos.x < canvas.width + radius || pos.y > -radius
          || pos.y < canvas.height + radius) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
    });

    window.requestAnimationFrame(render);
  }

  window.requestAnimationFrame(render);

  /**
   * 
   * Set data follows
   * 
   */
  this.setData = function(context, settings, data) {
    if (!data)
      return;

    // Clear out the old counts for links
    linksForForce.forEach(function(link) {
      link.countForward = 0;
      link.countReverse = 0;
    });

    // Keep track of all the nodes that are supplied within this particular call
    var thisSetOfNodes = {};

    var index = 0;
    data.values.forEach(function(link) {
      if (link.length > 1) {
        var src = link[0];
        var dst = link[1];
        var groupOfSrc = link[2];
        var groupOfDst = link[3];

        var count = link[4] || 1;

        var forward = true;
        // Rearrange src and dst to ensure only one link between pair of nodes
        var srcId = src + "(" + groupOfSrc + ")";
        var dstId = dst + "(" + groupOfDst + ")";

        if (srcId > dstId) {
          var temp = dstId;
          dstId = srcId; // Swapperoo
          srcId = temp;

          temp = dst;
          dst = src;
          src = temp;

          temp = groupOfDst;
          groupOfDst = groupOfSrc;
          groupOfSrc = temp;

          forward = false;
        }

        // Remember the nodes delivered in this batch
        thisSetOfNodes[srcId] = true;
        thisSetOfNodes[dstId] = true;

        // Create new nodes if needed
        if (!nodes[srcId]) {
          nodes[srcId] = {
            name : src,
            group : groupOfSrc
          };

          // Add to the array of nodes for force map
          nodesForForce.push(nodes[srcId]);
        }
        if (!nodes[dstId]) {
          nodes[dstId] = {
            name : dst,
            group : groupOfDst
          };

          // Add to the array of nodes for force map
          nodesForForce.push(nodes[dstId]);
        }

        var linkObj;

        var linkId = srcId + "*-*" + dstId;

        if (links[linkId]) {
          linkObj = links[linkId];
          if (forward)
            linkObj.countForward += count;
          else
            linkObj.countReverse += count;
        }

        else {
          linkObj = {
            source : nodes[srcId],
            target : nodes[dstId],
            countForward : forward ? count : 0,
            countReverse : forward ? 0 : count
          };
          links[linkId] = linkObj;

          // Add to the array of links for force
          linksForForce.push(linkObj);
        }

        // This link might have changed the role of the nodes (from target to
        // joint or from source to joint)
        if (nodes[srcId].role) {
          if (forward && nodes[srcId].role == "target") {
            nodes[srcId].role = "joint";
          } else if (!forward && nodes[srcId].role == "source") {
            nodes[srcId].role = "joint";
          }
        } else {
          nodes[srcId].role = forward ? "source" : "target";
        }

        if (nodes[dstId].role) {
          if (forward && nodes[dstId].role == "source") {
            nodes[dstId].role = "joint";
          } else if (!forward && nodes[dstId].role == "target") {
            nodes[dstId].role = "joint";
          }

        } else {
          nodes[dstId].role = forward ? "target" : "source";
        }
      }
    });

    var newNodesForForce = [];

    // Remove any nodes that are not in this set of data
    for (var i = 0; i < nodesForForce.length; i++) {
      var myNodeId = nodesForForce[i].name + "(" + nodesForForce[i].group + ")";
      if (thisSetOfNodes[myNodeId])
        newNodesForForce.push(nodes[myNodeId]);
      else
        nodes[myNodeId] = null;

    }
    nodesForForce = newNodesForForce;

    var newLinksForForce = [];

    // Remove any links that are not in this set of data
    for (var j = 0; j < linksForForce.length; j++) {
      var myLinksSrcId = linksForForce[j].source.name + "("
          + linksForForce[j].source.group + ")";
      var myLinksDstId = linksForForce[j].target.name + "("
          + linksForForce[j].target.group + ")";

      var myLinkId;
      if (myLinksSrcId > myLinksDstId)
        myLinkId = myLinksDstId + "*-*" + myLinksSrcId;
      else
        myLinkId = myLinksSrcId + "*-*" + myLinksDstId;

      if (linksForForce[j].countForward > 0
          || linksForForce[j].countReverse > 0)
        newLinksForForce.push(links[myLinkId]);
      else
        links[myLinkId] = null;

    }
    linksForForce = newLinksForForce;

    // var link = linksLayer.selectAll("line.link").data(linksForForce,
    // function(d) {
    // var srcId = d.source.name + "(" + d.source.group + ")";
    // var dstId = d.target.name + "(" + d.target.group + ")";
    // if (srcId > dstId)
    // return dstId + "*-*" + srcId;
    // else
    // return srcId + "*-*" + dstId;
    // });
    // link.enter().append("svg:line").attr("class", "link").attr(
    // "style",
    // function(d) {
    // return "shape-rendering: auto; stroke: " + chooseLinkFill(d) + ";"
    // + " stroke-width: " + Math.sqrt(d.countForward + d.countReverse)
    // + ";";
    // }).attr("x1", function(d) {
    // return d.source.x;
    // }).attr("y1", function(d) {
    // return d.source.y;
    // }).attr("x2", function(d) {
    // return d.target.x;
    // }).attr("y2", function(d) {
    // return d.target.y;
    // });
    // link.exit().transition().duration(100).attr("opacity", "0").remove();
    //
    // var node = nodesLayer.selectAll(".node").data(nodesForForce, function(d)
    // {
    // return d.name + "(" + d.group + ")";
    // });
    // node.enter().append("svg:g").attr("class",
    // "node").call(force.drag).append(
    // "svg:title").text(function(d) {
    // return d.name + d.group ? " (" + d.group + ")" : "";
    // });
    // node.exit().transition().duration(100).attr("opacity", "0").remove();
    //
    // node
    // .each(function(d) {
    // var e = d3.select(this);
    // e.selectAll("circle").remove();
    // e.selectAll("polygon").remove();
    //
    // if (d.role == "joint") {
    // e.append("svg:circle").attr("r", function(d) {
    // return 5;
    // }).style("fill", function(d) {
    // return color(d.group || d.name);
    // });
    // } else if (d.role == "target") {
    // e
    // .append("svg:polygon")
    // //
    // .attr(
    // "points",
    // function(d) {
    // return "0,3 3,6 6,6 6,3 3,0 6,-3 6,-6 3,-6 0,-3 -3,-6 -6,-6 -6,-3 -3,0
    // -6,3 -6,6 -3,6 0,3";
    // }).style("fill", function(d) {
    // return color(d.group || d.name);
    // });
    //
    // } else if (d.role == "source") {
    // e.append("svg:polygon")
    // // .attr("points", function (d) {return "-10,0 0,5 10,0 0,-5";})
    // .attr("points", function(d) {
    // return "-5,0 0,8 5,0 0,-8";
    // }).style("fill", function(d) {
    // return color(d.group || d.name);
    // });
    //
    // }
    // });

    // force.on("tick", function() {
    // var radius = 10;
    //      
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    //      
    // nodesForForce.forEach(function(d) {
    // ctx.beginPath();
    // ctx.arc(d.x, d.y, radius, 0, 2 * Math.PI, false);
    // ctx.fillStyle = 'green';
    // ctx.fill();
    // ctx.lineWidth = 2;
    // ctx.strokeStyle = 'black';
    // ctx.stroke();
    // });

    // // node.attr("transform", function(d) {
    // // return "translate(" + d.x + ", " + d.y + ")";
    // // });
    // // link.attr("x1", function(d) {
    // // return d.source.x;
    // // }).attr("y1", function(d) {
    // // return d.source.y;
    // // }).attr("x2", function(d) {
    // // return d.target.x;
    // // }).attr("y2", function(d) {
    // // return d.target.y;
    // // }).attr(
    // // "style",
    // // function(d) {
    // // return "shape-rendering: auto; stroke: " + chooseLinkFill(d) + ";"
    // // + " stroke-width: "
    // // + Math.log(d.countForward + d.countReverse + 1) + ";";
    // // });
    // });

    force.nodes(nodesForForce).links(linksForForce);

    update(0);
  }; // Close function set data
  /**
   * End of set data
   * 
   */

  /*
   * Update follows, called by set data and tick
   * 
   */
  var update = function(duration) {
    if (!nodesForForce) {
      // Display usage information

      return;
    }

    width = element.clientWidth;
    height = element.clientHeight;

    canvas.width = width;
    canvas.height = height;
    force.size([ width, height ]).start();
  };

  this.resize = function() {
    update(0);
  };
};