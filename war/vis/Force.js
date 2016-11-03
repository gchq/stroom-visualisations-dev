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
visualisations.Force = function() {
 var element = window.document.createElement("div");
  this.element = element;

  var d3 = window.d3;

  var width = element.clientWidth; 
  var height = element.clientHeight;
 
  // Create a colour set.
  var color = d3.scale.category20();

 
  var svg = d3.select(element).append("svg:svg");
  
  var searchBox = d3.select(element).append("div");

  searchBox.attr("style", "position:absolute;right:0px;top:0px;width:200px;height:16px;border:0;font-size:12px;padding:3px");

  
    var keyPressed = function (e){
    freezeNodeMovement();
 
    var keyNum = e.which;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (keyNum == 27) //Esc 
    {
      if (currentSearch)
      {
        currentSearch = "";
        searchBox.style("border", "0");
      }
      else
      {
        searches.pop ();
      }
    }
    else if (keyNum == 13) //Return or enter
    {
      searches.push (currentSearch);
      currentSearch = "";
      searchBox.style("border", "0");
      updateSearchLabels();
    }
    else if (keyNum == 8) //Backspace
    {
      currentSearch = currentSearch.substring(0, currentSearch.length - 2);
    }
    else if (keyNum >= 32)
    {
      currentSearch += String.fromCharCode (keyNum).toLowerCase();
      searchBox.style("border", "solid 1px blue");
    }
    

    searchBox.text (currentSearch);
    

  };
  
  // svg[0][0].onkeyup = keyPressed;
  // document.onkeyup = keyPressed;
  window.onkeyup = keyPressed;
  window.onkeydown = function (evt){
    evt.preventDefault();
    evt.stopPropagation();
  }; 
  window.onkeypress = function (evt){
    evt.preventDefault();
    evt.stopPropagation();
  };

  var linksLayer = svg.append("svg:g");
  var nodesLayer = svg.append("svg:g");
  var zapLayer = svg.append("svg:g");
  var zap = null;
  
  // svg.call(svg_interact, {zoom_speed:1.15});
  
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
  
  var animationIndex = -1;
  
  
    var defs = svg.append("svg:defs");
    
    
   var zoom = d3.behavior.zoom()
               .scaleExtent([0.1,10])
               .on("zoom", zoomed);
    svg.call(zoom);
  
   var freezeTimeout;
   function zoomed () {
    freezeNodeMovement();
    linksLayer.attr("transform","translate("+d3.event.translate+")scale("+d3.event.scale+")");
    nodesLayer.attr("transform","translate("+d3.event.translate+")scale("+d3.event.scale+")");
    zapLayer.attr("transform","translate("+d3.event.translate+")scale("+d3.event.scale+")");
  }
  
  var resumeNodeMovement = function (){
        //Should move drawing stuff outside this next function and only call that to update
    updateForceMap ();
    freezeTimeout = null;
  };
    
  
  var freezeNodeMovement = function (){
        //Pause the force graph
    force.stop();
    if (freezeTimeout)
      window.clearTimeout (freezeTimeout);
    freezeTimeout = window.setTimeout (resumeNodeMovement, 1000);
  };
  


   nodeMovement = true;
   var toggleNodeMovement = function (){        //Pause the force graph
    nodeMovement = !nodeMovement;
    if (nodeMovement)
      updateForceMap ();
    else
      force.stop();
  };

  //Create the gradient fills for the lines
  for (i = 50; i <= 100; i += 10)
  {
    var thisStop = i; 
    
    
    var gradient = defs.append("svg:radialGradient").attr("id", "linkGradientQ0" + i)
    .attr ("cx", "0%").attr ("cy", "0%").attr ("fx", "0%").attr ("fy", "0%").attr ("r", gradientRadius);
  
    gradient.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    gradient.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    gradient.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    gradient.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    gradient.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    gradient.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    
 
    var gradient2 = defs.append("svg:radialGradient").attr("id", "linkGradientQ1" + i)
    .attr ("cx", "100%").attr ("cy", "0%").attr ("fx", "100%").attr ("fy", "0%").attr ("r", gradientRadius);
    gradient2.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    gradient2.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    gradient2.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    gradient2.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    gradient2.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    gradient2.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    

    var gradient3 = defs.append("svg:radialGradient").attr("id", "linkGradientQ2" + i)
    .attr ("cx", "100%").attr ("cy", "100%").attr ("fx", "100%").attr ("fy", "100%").attr ("r", gradientRadius);
    gradient3.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    gradient3.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    gradient3.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    gradient3.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    gradient3.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    gradient3.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    

    var gradient4 = defs.append("svg:radialGradient").attr("id", "linkGradientQ3" + i)
    .attr ("cx", "0%").attr ("cy", "100%").attr ("fx", "0%").attr ("fy", "100%").attr ("r", gradientRadius);
    gradient4.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    gradient4.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    gradient4.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    gradient4.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    gradient4.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    gradient4.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    
    var horizontalGradientPositive = defs.append("svg:linearGradient").attr("id", "linkGradientH+" + i);
    horizontalGradientPositive.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    horizontalGradientPositive.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    horizontalGradientPositive.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    horizontalGradientPositive.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    horizontalGradientPositive.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    horizontalGradientPositive.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    
    var horizontalGradientNegative = defs.append("svg:linearGradient").attr("id", "linkGradientH-" + i)
    .attr("x1", "100%").attr("x2", "0%").attr("y1", "0%").attr("y2", "0%");
    horizontalGradientNegative.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    horizontalGradientNegative.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    horizontalGradientNegative.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    horizontalGradientNegative.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    horizontalGradientNegative.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    horizontalGradientNegative.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    
     var verticalGradientPositive = defs.append("svg:linearGradient").attr("id", "linkGradientV+" + i)
         .attr("x1", "0%").attr("x2", "0%").attr("y1", "0%").attr("y2", "100%");
    verticalGradientPositive.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    verticalGradientPositive.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    verticalGradientPositive.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    verticalGradientPositive.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    verticalGradientPositive.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    verticalGradientPositive.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
    
    var verticalGradientNegative = defs.append("svg:linearGradient").attr("id", "linkGradientV-" + i)
    .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
    verticalGradientNegative.append("svg:stop").attr("offset", "0%").attr("style", "stop-color: " + stopColour0 + ";");
    verticalGradientNegative.append("svg:stop").attr("offset", minGradientStop - 1 + "%").attr("style", "stop-color: " + stopColour1 + ";");
    verticalGradientNegative.append("svg:stop").attr("offset", minGradientStop + "%").attr("style", "stop-color: " + stopColourVariable + ";");
    verticalGradientNegative.append("svg:stop").attr("offset", thisStop -1 +"%").attr("style", "stop-color: "+ stopColourVariable + ";");
    verticalGradientNegative.append("svg:stop").attr("offset", thisStop +"%").attr("style", "stop-color: "+ stopColour100 + ";");
    verticalGradientNegative.append("svg:stop").attr("offset", "100%").attr("style", "stop-color: " + stopColour100 + ";");
  }

  var links = {};
  var nodes = {};
  var linksForForce = [];
  var nodesForForce = [];
  
  var force = d3.layout.force()
      .charge(nodeCharge)
      .distance(linkLength) //Link distance
      .nodes (nodesForForce)
      .links(linksForForce);
      

  var updateSearchLabels = function (){
      var node = nodesLayer.selectAll(".node").data(nodesForForce, function (d) {return createNodeId (d);});
      
        node.each(function(d) {
        var e = d3.select(this);
        e.selectAll("text").remove();
      
    
      var myNodeId =  createNodeId (d).toLowerCase();
      if (currentSearch && myNodeId.startsWith (currentSearch))
      {
        var label = e.append ("text").attr("dx", 12).attr("dy",".35em").text (d.name);
        label.style("stroke","#ff0000");
        
      }
      else
      {
        var text = "";
        searches.forEach (function (term){
        if (myNodeId.startsWith (term))
          text = d.name;
        });
   
        if (text)
        {
          var label2 = e.append ("text").attr("dx", 12).attr("dy",".35em").text (text);
          if (d.group == groupLiteral)
            label2.style("stroke","#0000dd");
          else
            label2.style("stroke","#000000");
        }
      }
    });
        
        
  };

  
  var chooseLinkFill = function (link) {
    var total = link.countForward + link.countReverse;
    var fraction = link.countForward / total;
    var fractionPercentRounded = Math.round (fraction * 10) * 10;
    if (fractionPercentRounded > 40 && fractionPercentRounded < 60)
      return stopColourEqual;
      
    var reverseThePolarity = false;
      
    if (fractionPercentRounded < 50)
    {
      reverseThePolarity = true;
      fractionPercentRounded = 100 - fractionPercentRounded;
    }
    
    if (Math.abs (link.target.y - link.source.y) < 30)
    {
      if (link.target.x < link.source.x)
      {
        if (reverseThePolarity)
          return "url(#linkGradientH-"+ fractionPercentRounded + ")";
        else
          return "url(#linkGradientH+"+ fractionPercentRounded + ")";
      }
      else
      {
        if (reverseThePolarity)
          return "url(#linkGradientH+"+ fractionPercentRounded + ")";
        else
          return "url(#linkGradientH-"+ fractionPercentRounded + ")";
      }
    }
    
    
    if (Math.abs (link.target.x - link.source.x) < 30)
    {
      if (link.target.y < link.source.y)
      {
        if (reverseThePolarity)
          return "url(#linkGradientV-"+ fractionPercentRounded + ")";
        else
          return "url(#linkGradientV+"+ fractionPercentRounded + ")";
      }
      else
      {
        if (reverseThePolarity)
          return "url(#linkGradientV+"+ fractionPercentRounded + ")";
        else
          return "url(#linkGradientV-"+ fractionPercentRounded + ")";
      }
    }
      
    var quartile = "Q";
    
    if (reverseThePolarity)
    {
    //Work out which quartile it is in
    if (link.target.x > link.source.x)
    {
      
      if (link.target.y > link.source.y)
      {

       quartile = "Q0";
      }
      else
      {
       quartile = "Q3";
       
      }
    }
    else
    {
      if (link.target.y > link.source.y)
      {
       quartile = "Q1";
      }
      else
      {

        quartile = "Q2" ; 

      }
    }    
      
    }
 
 else
 {
    //Work out which quartile it is in
    if (link.source.x > link.target.x)
    {
      
      if (link.source.y > link.target.y)
      {

       quartile = "Q0";
      }
      else
      {
       quartile = "Q3";
       
      }
    }
    else
    {
      if (link.source.y > link.target.y)
      {
       quartile = "Q1";
      }
      else
      {

        quartile = "Q2" ; 

      }
    }
 }  
    var retVal = "url(#linkGradient" + quartile + fractionPercentRounded + ")";
    return retVal;
  };




 var explodedGroupLinks = {};
 var explodedGroupNodes = {};
 
 var createNodeId = function (node) {
   return node.name + "(" + node.group + ")";
 };
 
 var createNodeIdFromDetails = function (nodeName, groupName) {
   return nodeName  + "(" + groupName + ")";
 };
 
 var isGroupNodeExploded = function (groupNodeId) {
   return (explodeByDefault?!explodedGroupNodes [groupNodeId] : explodedGroupNodes [groupNodeId]);
 };
 
 var createLinkId = function (endA, endB){
   if (endA > endB)
    return endB + " to " + endA;
  else
    return endA + " to " + endB;
 };
 
 var groupLiteral = "*Group*";
 
 var linkData = null;


 var maxNodes = -1;
 
 var theAnimationInterval = null;
 
/**
 * 
 * Set data follows
 * 
 */
  this.setData = function(context, settings, records) {
    
    if (!records)
      return;
    linkData = records;

  //Take account of new settings, etc.
  if (settings)
  {
    if (settings.expandGroups && settings.expandGroups == "true")
    {
      if (!explodeByDefault)
      {
      //Reset all nodes  
        explodedGroupNodes = {};
      }
      explodeByDefault = true;
      
    }
    else
    {
      if (explodeByDefault)
      {
      //Reset all nodes  
        explodedGroupNodes = {};
      }
      
      explodeByDefault = false;
      
      
    }

    if (!settings.animate || settings.animate == "false")
    {
      animateIndex = -1;
      if (zap)
        zap.style ("opacity", 0.0);
      if (theAnimationInterval)
        clearInterval (theAnimationInterval);
      theAnimationInterval = null;
    }
    
   
    if (settings.animate && settings.animate == "true")
    {
      if (!theAnimationInterval)
        theAnimationInterval = setInterval (animationIntervalTimeout, 1000 * animationInterval);


      animationIndex = 0; //Run the animation.
      if (!zap)
        zap = zapLayer.append ("svg:circle").attr ("r", 2).attr("fill", "#ff0000");
     
      zap.style ("opacity", 1.0);
      
    }
    
    if (settings.maxNodes)
      maxNodes = settings.maxNodes;
      

  }
  
    updateForceMap();
  };


  var searches = [];
  var currentSearch = "";
  



   explodeByDefault = false;
  
  createNodeAndGroups = function (nodeName, nodeId, groupName, groupNodeId, nodesInThisSet, explodeNow) {

    if (!groupName || explodeNow || isGroupNodeExploded (groupNodeId))
    {
      if (!nodes [nodeId])
      {
        nodes[nodeId] = {name: nodeName, group: groupName};
        nodesForForce.push (nodes[nodeId]);
        
        //Try to use position of groupnode
        if (nodes[groupNodeId])
        {
  //        nodes[nodeId].x = nodes[groupNodeId].x;
  //        nodes[nodeId].y = nodes[groupNodeId].y;
  //        nodes[nodeId].px = nodes[groupNodeId].px;
  //        nodes[nodeId].py = nodes[groupNodeId].py;
        }
      }
      
      if (nodesInThisSet[nodeId])
        nodesInThisSet [nodeId]++;
      else
        nodesInThisSet [nodeId] = 1;
    }
    

    
    if (groupName)
    {
      if (nodesInThisSet[groupNodeId])
        nodesInThisSet [groupNodeId]++;
      else
        nodesInThisSet [groupNodeId]= 1;
      
      if (!nodes[groupNodeId])
      {
        nodes[groupNodeId] = {name: groupName, group: groupLiteral};
        nodesForForce.push (nodes[groupNodeId]);
      } 
    
      
      if (explodeNow || isGroupNodeExploded (groupNodeId))
      {
    //  Create link between the node and its group
       var groupToNodeLinkId = createLinkId (nodeId, groupNodeId);
        if (!links [groupToNodeLinkId])
        {
          links [groupToNodeLinkId] = {
        source : nodes[nodeId],
        target : nodes[groupNodeId],
        type : "GroupMembership",
        countForward:1,
        countReverse:0};
    
        linksForForce.push (links[groupToNodeLinkId]);
        }
        else
        {
          links[groupToNodeLinkId].countForward = 1; //This link must be displayed
        }
      }
     }
     
  };
  
  createStandardLink = function (srcId, dstId, count, forward, index){
    var linkObj;

    var linkId = createLinkId (srcId, dstId);
    
    if (links [linkId])
    {
      linkObj = links [linkId];
      if (forward)
        linkObj.countForward += count;
      else
        linkObj.countReverse += count;
    }
    
    else
    {
      linkObj = {
      source : nodes[srcId],
      target : nodes[dstId],
      type : "Standard",
      countForward : forward?count:0,
      countReverse : forward?0:count
      };
      links[linkId] = linkObj;
      
      //Add to the array of links for force
      linksForForce.push (linkObj);
    }
    
    //This link might have changed the role of the nodes (from target to joint or from source to joint)
    if (nodes[srcId].role)
    {
      if (forward && nodes[srcId].role == "target")
      {
        nodes[srcId].role = "joint";
      }
      else if (!forward && nodes[srcId].role == "source")
      {
        nodes[srcId].role = "joint";
      }
    }
    else
    {
      nodes[srcId].role = forward ? "source" : "target";
    }
    
    if (nodes[dstId].role)
    {
      if (forward && nodes[dstId].role == "source")
      {
        nodes[dstId].role = "joint";
      }
      else if (!forward && nodes[dstId].role == "target")
      {
        nodes[dstId].role = "joint";
      }
      
    }
    else
    {
      nodes[dstId].role = forward ? "target" : "source";
    }


    
  };

  updateForceMap = function () {
  if (!nodeMovement)
    return;
  
  //Kill the animation
  if (zap)
    zap.attr ("opacity", 0);
  //zap = null;  
  animationZapProgress = 0;
 
  //Clear out the old counts for links
  linksForForce.forEach (function (link) 
  {
    link.countForward = 0;
    link.countReverse = 0;
  });

  //Keep track of all the nodes that are supplied within this particular call
  var thisSetOfNodes = {};

  var index = 0;
  
  if (linkData)
  {
  linkData.values.forEach (function (link) {
    if (link.length > 1)
    {
      
    var src = link[0];
    var dst = link[1];
    var groupOfSrc = link[2];
    var groupOfDst = link[3];
    
    var count = link[4] || 1;
    
    var forward = true;
    
    //Does this correspond to one of the exploded links?
    var srcId = createNodeIdFromDetails (src, groupOfSrc);
    var dstId = createNodeIdFromDetails (dst, groupOfDst);
    if (srcId > dstId)
    {
      var temp = dstId;
      dstId = srcId; //Swapperoo
      srcId = temp;
      
      temp = dst;
      dst = src;
      src = temp;
      
      temp = groupOfDst;
      groupOfDst = groupOfSrc;
      groupOfSrc = temp;
      
      forward = false;
    }
    var srcGrpId = createNodeIdFromDetails (groupOfSrc, groupLiteral);
    var dstGrpId = createNodeIdFromDetails (groupOfDst, groupLiteral);
    
    groupNodeToGroupNodeLinkId = createLinkId (srcGrpId, dstGrpId);
    var groupLinkExploded = explodedGroupLinks [groupNodeToGroupNodeLinkId];
    
    
      //Rearrange src and dst to ensure only one link between pair of nodes
    createNodeAndGroups (src, srcId, groupOfSrc, srcGrpId, thisSetOfNodes, groupLinkExploded);
    createNodeAndGroups (dst, dstId, groupOfDst, dstGrpId, thisSetOfNodes, groupLinkExploded);
    
    
    //Create the various kinds of link
    if (groupLinkExploded)
    {
      //This link is an exploded group to group link
      createStandardLink (srcId, dstId, count, forward);
    }
    else
    {
    
    var linkFrom = srcGrpId;
    if (!groupOfSrc || isGroupNodeExploded (srcGrpId) || groupLinkExploded)
      linkFrom = srcId;
      
    var linkTo = dstGrpId;
    if (!groupOfDst || isGroupNodeExploded (dstGrpId) || groupLinkExploded)
      linkTo = dstId;
    
    
    createStandardLink (linkFrom, linkTo, count, forward, index++);
    }
    
    
  
    }
    
    //force.start();

  });
  }
  
  var newNodesForForce = [];

  //Remove any nodes that are not in this set of data
  for (var i = 0; i < nodesForForce.length; i++)
  {
    var myNodeId = createNodeId (nodesForForce[i]);
    if ((maxNodes < 0 || newNodesForForce.length < maxNodes) && (thisSetOfNodes[myNodeId] && thisSetOfNodes[myNodeId] > 0))
    {
      newNodesForForce.push (nodes[myNodeId]);
    }
    else
    {
      nodes[myNodeId]=null;
    }
    
  }
  nodesForForce = newNodesForForce;
  
  var newLinksForForce = [];

  //Remove any links that are not in this set of data
  for (var j = 0; j < linksForForce.length; j++)
  {
    var myLinksSrcId = createNodeId (linksForForce[j].source);
    var myLinksDstId = createNodeId (linksForForce[j].target);
    
    var myLinkId = createLinkId (myLinksSrcId, myLinksDstId);

    
    
    if (linksForForce[j].countForward > 0 || linksForForce[j].countReverse > 0)
    {
 //There might be more nodes than permitted (max exceeded) - ignore such links
      if (nodes[myLinksSrcId] && nodes[myLinksDstId])
        newLinksForForce.push (links[myLinkId]);
    }
    else
      links[myLinkId]=null;
    
  }
  linksForForce = newLinksForForce;
  
  
  // zap = zapLayer.append ("svg:circle").attr ("r", 2).attr("fill", "#ff0000");
  
    var link = linksLayer.selectAll("line.link").data(linksForForce, function (d) {
         var srcId = createNodeId (d.source);
        var dstId = createNodeId (d.target);
        return createLinkId (srcId, dstId);
    });
    

  link.enter().append("svg:line")
      .attr("class", "link")
      .on ("mousedown", mouseDownOnSomething)
      .on ("click", mouseUpOnLink);
      // .attr("style", function (d) { return "shape-rendering: auto; stroke: " + 
      //   chooseLinkFill (d) + ";"
      // + " stroke-width: " + Math.sqrt(d.countForward + d.countReverse) + ";"
      // ;})
      // .attr("x1", function(d) { return d.source.x; })
      // .attr("y1", function(d) { return d.source.y; })
      // .attr("x2", function(d) { return d.target.x; })
      // .attr("y2", function(d) { return d.target.y; });
  link.exit().transition().duration(100).attr("opacity", "0").remove();

  var node = nodesLayer.selectAll(".node").data(nodesForForce, function (d) {return createNodeId (d);});
  node.enter().append("svg:g")
      .attr("class", "node")
      .on ("click", mouseUpOnNode)
      .on ("mousedown", mouseDownOnSomething)
      //.call(force.drag)
      .append("svg:title")
      .text(function(d) { return ((d.group == groupLiteral) ? "Group: " + d.name : d.name + (d.group ? " (" + d.group + ")" : "")); });
  node.exit().transition().duration(100).attr("opacity", "0").remove();
  
  
//  node.append ("text").attr("dx", 12).attr("dy",".35em").style("stroke","#888888").text (chooseNodeLabel);
updateSearchLabels();
  
        node.each(function(d) {
        var e = d3.select(this);
        e.selectAll("circle").remove();
        e.selectAll("polygon").remove();

      if (d.role == "target") {
      e.append("svg:polygon")
      .attr("points", function (d) {return ((d.group == groupLiteral) ?
       "0,5 5,10 10,10 10,5 5,0 10,-5 10,-10 5,-10 0,-5 -5,-10 -10,-10 -10,-5 -5,0 -10,5 -10,10 -5,10 0,5" :
      "0,3 3,6 6,6 6,3 3,0 6,-3 6,-6 3,-6 0,-3 -3,-6 -6,-6 -6,-3 -3,0 -6,3 -6,6 -3,6 0,3");})
     
      // .style("stroke", function (d) { return ((d.group == groupLiteral) ? color (d.name) : color (d.group || d.name)); })
      // .style ("stroke", chooseNodeStroke)
      // .style ("fill", chooseNodeFill)
      .style("stroke-width", function (d) { return ((d.group == groupLiteral) ? 3 : null); })
      ;
         
         
      } else if (d.role == "source") {
      e.append("svg:polygon")
      .attr("points", function (d) {return ((d.group == groupLiteral) ?
      "-10,0 0,16 10,0 0,-16" :
      "-5,0 0,8 5,0 0,-8");})
      // .style("fill", function(d) 
      // {
      //   if (d.group == groupLiteral && explodedGroupNodes[createNodeId(d)])
      //     return "#ffffff";
      //   else if (d.group == groupLiteral)
      //   return color (d.name);
      //   else
      //     return color(d.group || d.name); 
        
      // })
      // .style ("stroke", chooseNodeStroke)
      // .style ("fill", chooseNodeFill)
      // .style("stroke", function (d) { return ((d.group == groupLiteral) ? color (d.name) : color (d.group || d.name)); })
      .style("stroke-width", function (d) { return ((d.group == groupLiteral) ? 3 : null); })
      ;
      } else if (d.role == "joint")
      {
      graphic = e.append("svg:circle")
      .attr("r", function (d) {return ((d.group == groupLiteral) ?  10 : 5);})
      // .style("fill", function(d) 
      // {
      //   if (d.group == groupLiteral && explodedGroupNodes[createNodeId(d)])
      //     return "#ffffff";
      //   else if (d.group == groupLiteral)
      //   return color (d.name);
      //   else
      //     return color(d.group || d.name); 
        
      // })
      // // .style("stroke", function (d) { return ((d.group == groupLiteral) ? color (d.name) : color (d.group || d.name)); })
      // .style ("stroke", chooseNodeStroke)
      // .style ("fill", chooseNodeFill)
      .style("stroke-width", function (d) { return ((d.group == groupLiteral) ? 3 : null); })
      ;
      } 
      else //A group without a role (because all contents are exploded out)
      {
      graphic = e.append("svg:polygon")
      .attr("points", function (d) {return "-10,10 10,10 10,-10 -10,-10" ;})
      // .style("fill", "#ffffff")
      // .style("stroke", function (d) {return color(d.name);})
      // .style ("stroke", chooseNodeStroke)
      // .style ("fill", chooseNodeFill)
      .style("stroke-width", 3);
      }
      
      
        e.style ("stroke", chooseNodeStroke);
        e.style ("fill", chooseNodeFill);
        e.style ("opacity", 1.0);

      });

  
      force.on("tick", function() {
        if (freezeTimeout)
          return;
        
        var now = new Date ().getTime();
        
        if (now < lastUpdate + updateInterval * 1000)
          return;
        
        lastUpdate = now;
        
        
        
        //Move the nodes
        node.attr("transform", function(d) { return "translate(" + d.x + ", " + d.y + ")";});
        
        
   
        
        //Draw the lines
         link.attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style("shape-rendering", "auto")
        .style ("stroke", function (d) { 
        return((d.type == "GroupMembership") ? "#dddddd"/*color (d.target.name)*/ : chooseLinkFill (d));})
        .style ("stroke-width", function (d) { 
            return ((Math.log(d.countForward + d.countReverse + 1) + 
          ((d.source.group == groupLiteral && d.target.group == groupLiteral) ? 3 : 0))); })
          ;
        

       
  });
    
    force.nodes (nodesForForce).links (linksForForce);
    
    update (0);
  }; // Close function set data
/**
 * End of set data
 * 
 */
 
 
 var animationZapProgress = 0;
 
 var animationZapSteps = 10;
 
 
 var chooseNodeOpacity = function (d){
   if (!currentSearch)
    return 1.0;
   
   var thisNodeId = createNodeId (d).toLowerCase();
   
   if (thisNodeId.startsWith (currentSearch))
      return 1.0;
  else
    return 0.1;
 };
 

 
 var chooseNodeFill = function (d){
   //All nodes are grey if search is in progress (except matching)
   if (currentSearch)
   {
      var thisNodeId = createNodeId (d).toLowerCase();
   
      if (!thisNodeId.startsWith (currentSearch))
        return "#dddddd";
   }
   
   
        var fillColour;
        if (d.group == groupLiteral && isGroupNodeExploded (createNodeId(d)))
          fillColour = "#ffffff";
        else if (d.group == groupLiteral)
         fillColour = color (d.name);
        else
          fillColour = color (d.group || d.name); 
          
  
        //Fade the nodes (if animating)
        if (animationIndex < 0 || !zap)
          return fillColour;
      
        
          var currentLinkData = linkData.values[animationIndex];
          if (d.group == groupLiteral)
          {
            if (!isGroupNodeExploded (createNodeId (d)))
            {
              
              //At least one end of the animated link is in the group node
              if ((currentLinkData[2] == d.name) && (currentLinkData[3] == d.name))
              {
                 zap.start = d;
                 zap.end = d;
                 fillColour = "#ffff44";
                  
              }
              else
              {
                if (currentLinkData[2] == d.name)
                {
                  //Node is source
                  zap.start = d;
                  fillColour = "#ffee00";
                }
                if (currentLinkData[3] == d.name)
                {
                  
                  //Node us target
                  zap.end = d;
                  fillColour = "#ffffdd";
                
                }
              }
            }
          }
          else
          {
            //This node isn't a group node
            if  (currentLinkData[1] == d.name && currentLinkData[3] == d.group)
            {
              zap.end = d;
              fillColour = "#ffffdd";
            }
            if(currentLinkData[0] == d.name && currentLinkData[2] == d.group)
            {
              zap.start = d;
              fillColour = "#ffee00";
            }

            // if (!explodedGroupNodes [createNodeIdFromDetails(d.name, groupLiteral)])
              // op = 1.0;
              
          }
          return fillColour;
 };
 
 var chooseNodeStroke = function (d){
      //All nodes are grey if search is in progress (except matching)
   if (currentSearch)
   {
      var thisNodeId = createNodeId (d).toLowerCase();
   
      if (!thisNodeId.startsWith (currentSearch))
        return "#dddddd";
   }
   
     var strokeColour = ((d.group == groupLiteral) ? color (d.name) : color (d.group || d.name)); 
    
        //Fade the nodes (if animating)
    if (animationIndex < 0 || !zap)
        return strokeColour;
      
        
    var currentLinkData = linkData.values[animationIndex];
    if (d.group == groupLiteral)
    {
      if (!isGroupNodeExploded (createNodeId (d)))
      {
              
        //At least one end of the animated link is in the group node
        if (currentLinkData[2] == d.name)
        {
            zap.start = d;
            // strokeColour = "#ffcc00";
        }
        if (currentLinkData[3] == d.name)
        {
                
            zap.end = d;
            // strokeColour = "#ffcc00";
              
          }
        }
      }
      else
      {
          //This node isn't a group node
          if(currentLinkData[0] == d.name && currentLinkData[2] == d.group)
          {
            zap.start = d;
            // strokeColour = "#ffcc00";
          }
          if  (currentLinkData[1] == d.name && currentLinkData[3] == d.group)
          {
            zap.end = d;
            // strokeColour = "#ffcc00";
          }
          // if (!explodedGroupNodes [createNodeIdFromDetails(d.name, groupLiteral)])
            // op = 1.0;
              
      }
      return strokeColour;
    
 };
 
 var animationIntervalTimeout = function () {
   
   
   if (!zap || animationZapProgress > animationZapSteps)
   {
     animationZapProgress = 0;
         
    // if (!zap)
    //   zap = zapLayer.append ("svg:circle").attr ("r", 2).attr("fill", "#ff0000");
    // else 
      animationIndex++;

    if (animationIndex >= linkData.values.length)
          animationIndex = 0;
          
  
  var node = nodesLayer.selectAll(".node").data(nodesForForce, function (d) {return createNodeId (d);});
  node.style("stroke", chooseNodeStroke);
  
  
  node.style ("fill", chooseNodeFill);
  
 
  
  var link = linksLayer.selectAll("line.link").data(linksForForce, function (d) {
        var srcId = createNodeId (d.source);
        var dstId = createNodeId (d.target);
        return createLinkId (srcId, dstId);
    });
  // link.style ("opacity", function (d) 
  //         {  
  //           if (animationIndex < 0)
  //             return 1.0;
            
  //           var currentLinkData = linkData.values[animationIndex];
  //           if((currentLinkData[0] == d.source.name && currentLinkData[1] == d.target.name) &&
  //             (currentLinkData[2] == d.source.group && currentLinkData[3] == d.target.group))
  //             {
  //               // zap.start = d.source;
  //               // zap.end = d.target;
              
  //             return 1.0;
  //             }
  //           else if
  //             ((currentLinkData[0] == d.target.name && currentLinkData[1] == d.source.name) &&
  //             (currentLinkData[2] == d.target.group && currentLinkData[3] == d.source.group))
  //             {
  //               // zap.end = d.source;
  //               // zap.start = d.target;
              
  //             return 1.0;
  //             }
  //           else
  //             return 0.3;
            
  //         });
          

   
     
     drawZap ();
   }  
  else
  {
    //Draw the animation point

    
    //Set position of zap
    drawZap();
    
    animationZapProgress++;
  }
    
  
 };
 
 
 var drawZap = function () {
    zap.attr ("opacity", 1.0);
   if (zap.start && zap.end )
   {
  var x = (zap.end.x - zap.start.x) *(animationZapProgress / animationZapSteps) + zap.start.x;
  var y = (zap.end.y - zap.start.y) *(animationZapProgress / animationZapSteps) + zap.start.y;
  zap.attr ("cx", x);
  zap.attr ("cy", y);
   }
 };
 
 var mouseUpOnNode = function (d) {
 panning = null;
   if (d.group != groupLiteral)
   {
    toggleNodeMovement();
    return;
    }
    
    if (d3.event.defaultPrevented) // check that it hasn't been dragged
      return;
      
    if (Math.abs (lastMouseDownX - d3.event.x) > 10 || Math.abs (lastMouseDownY - d3.event.y) > 10 )
      return;
    
    //Toggle explodedness of group nodes
    if (explodedGroupNodes [createNodeId (d)])
      explodedGroupNodes [createNodeId (d)] = null;
    else
      explodedGroupNodes [createNodeId (d)] = true;
    
    updateForceMap ();
 };
 
 
 var lastMouseDownX = null;
 var lastMouseDownY = null;
 
 var mouseDownOnSomething = function (d){
  lastMouseDownX = d3.event.x;
  lastMouseDownY = d3.event.y;
  };
     
 
 
 var mouseUpOnLink = function (d){

      
    if (d3.event.defaultPrevented) // check that it hasn't been dragged
      return;
      
    if ((d.source.group == groupLiteral) && (d.target.group == groupLiteral))
    {
      //Group to group link
      var srcGroupNodeId = createNodeIdFromDetails (d.source.name, groupLiteral);
      var dstGroupNodeId = createNodeIdFromDetails (d.target.name, groupLiteral);
      var groupLinkId = createLinkId (srcGroupNodeId, dstGroupNodeId);
   
      explodedGroupLinks [groupLinkId] = true;
    
    }
    else if ((d.source.group != groupLiteral) && (d.target.group != groupLiteral))
    {
      //Node to node link, remove any associated exploded group to group link
      var srcGroupNodeId2 = createNodeIdFromDetails (d.source.group, groupLiteral);
      var dstGroupNodeId2 = createNodeIdFromDetails (d.target.group, groupLiteral);
      var groupLinkId2 = createLinkId (srcGroupNodeId2, dstGroupNodeId2);
   
      if (explodedGroupLinks [groupLinkId2])
        explodedGroupLinks [groupLinkId2] = null;
      
      
    }
    
   //Do something to update the force map
   updateForceMap ();
 };
 
 var updateInterval = 0; //Seconds
 var lastUpdate = new Date ().getTime();
  
  var animationInterval = 0.5 / animationZapSteps; //Seconds

/*
* Update follows, called by set data and tick
*
*/
  var update = function(duration) {
    
    if (!nodesForForce)
    {
      //Display usage information  
    
      return;
    } 
      
    
  width = element.clientWidth; 
  height = element.clientHeight;
 

  svg.attr("width", width).attr("height", height);


  if (nodeMovement)
    force.size([width, height]).start();


 
  };

  this.resize = function() {
    update(0);
  };


  //update(0);
};
