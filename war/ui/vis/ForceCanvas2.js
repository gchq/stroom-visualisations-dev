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
  
  var ctx = canvas.getContext('2d');

  // ======================================================
  // START: ADD MOUSE LISTENERS
  // ======================================================
  var lastX=canvas.width/2, lastY=canvas.height/2;
  var dragStart,dragged;
  canvas.addEventListener('mousedown',function(evt){
    document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
    lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
    lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
    dragStart = ctx.transformedPoint(lastX,lastY);
    dragged = false;
  },false);
  canvas.addEventListener('mousemove',function(evt){
    lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
    lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
    dragged = true;
    if (dragStart){
      var pt = ctx.transformedPoint(lastX,lastY);
      ctx.translate(pt.x-dragStart.x,pt.y-dragStart.y);
//      redraw();
    }
  },false);
  canvas.addEventListener('mouseup',function(evt){
    dragStart = null;
    if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
  },false);

  var scaleFactor = 1.1;
  var zoom = function(clicks){
    var pt = ctx.transformedPoint(lastX,lastY);
    ctx.translate(pt.x,pt.y);
    var factor = Math.pow(scaleFactor,clicks);
    ctx.scale(factor,factor);
    ctx.translate(-pt.x,-pt.y);
//    redraw();
  }

  var handleScroll = function(evt){
    var delta = evt.wheelDelta ? evt.wheelDelta/40 : evt.detail ? -evt.detail : 0;
    if (delta) zoom(delta);
    return evt.preventDefault() && false;
  };
  canvas.addEventListener('DOMMouseScroll',handleScroll,false);
  canvas.addEventListener('mousewheel',handleScroll,false);
  
  // ======================================================
  // END: ADD MOUSE LISTENERS
  // ======================================================
  
  
  
  // ======================================================
  // START: ADD CONTEXT TRANSFORM TRACKING
  // ======================================================
  function trackTransforms(ctx){
    var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    var xform = svg.createSVGMatrix();
    ctx.getTransform = function(){ return xform; };
    
    var savedTransforms = [];
    var save = ctx.save;
    ctx.save = function(){
      savedTransforms.push(xform.translate(0,0));
      return save.call(ctx);
    };
    var restore = ctx.restore;
    ctx.restore = function(){
      xform = savedTransforms.pop();
      return restore.call(ctx);
    };

    var scale = ctx.scale;
    ctx.scale = function(sx,sy){
      xform = xform.scaleNonUniform(sx,sy);
      return scale.call(ctx,sx,sy);
    };
    var rotate = ctx.rotate;
    ctx.rotate = function(radians){
      xform = xform.rotate(radians*180/Math.PI);
      return rotate.call(ctx,radians);
    };
    var translate = ctx.translate;
    ctx.translate = function(dx,dy){
      xform = xform.translate(dx,dy);
      return translate.call(ctx,dx,dy);
    };
    var transform = ctx.transform;
    ctx.transform = function(a,b,c,d,e,f){
      var m2 = svg.createSVGMatrix();
      m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
      xform = xform.multiply(m2);
      return transform.call(ctx,a,b,c,d,e,f);
    };
    var setTransform = ctx.setTransform;
    ctx.setTransform = function(a,b,c,d,e,f){
      xform.a = a;
      xform.b = b;
      xform.c = c;
      xform.d = d;
      xform.e = e;
      xform.f = f;
      return setTransform.call(ctx,a,b,c,d,e,f);
    };
    var pt  = svg.createSVGPoint();
    ctx.transformedPoint = function(x,y){
      pt.x=x; pt.y=y;
      return pt.matrixTransform(xform.inverse());
    }
  }
  
  // Add tracking.
  trackTransforms(ctx);
  
  // ======================================================
  // END: ADD CONTEXT TRANSFORM TRACKING
  // ======================================================
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  



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
    var radius = 10;

    // Clear the entire canvas
    var p1 = ctx.transformedPoint(0,0);
    var p2 = ctx.transformedPoint(canvas.width,canvas.height);
    ctx.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);

    // Alternatively:
//     ctx.save();
//     ctx.setTransform(1,0,0,1,0,0);
//     ctx.clearRect(0,0,canvas.width,canvas.height);
//     ctx.restore();

    // Draw all of the links.
    linksForForce.forEach(function(d) {
        ctx.beginPath();
        ctx.moveTo(d.source.x, d.source.y);
        ctx.lineTo(d.target.x, d.target.y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'grey';
        ctx.stroke();
    });

    // Draw all of the nodes.
    nodesForForce.forEach(function(d) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'green';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'black';
        ctx.stroke();
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
    force.size([ width, height ]).start();
//    update(0);
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