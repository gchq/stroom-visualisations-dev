/*
 * Copyright 2016-2021 Crown Copyright
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


//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){

    //Indicies of attributes within the data value array
    const floormapIndexName = 0;
    const floormapIndexBuilding = 1;
    const floormapIndexFloor = 2;
    const floormapIndexX = 3;
    const floormapIndexY = 4;
    const floormapIndexIcon = 5;
    const floormapIndexSeries = 6;
    const floormapIndexGridSeries = 7;
    

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;


    var hashString = function(data) {
        input = "" + data;
        var hash = 0, i, chr;
        if (input.length === 0) return hash;
        for (i = 0; i < input.length; i++) {
          chr   = input.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
      };
    var markerColours = ['red', 'darkred', 'orange', 'green', 'darkgreen', 'blue', 'purple', 'darkpurple', 'cadetblue'];
        
    var markerColour = function (seriesNum) {
        return markerColours[seriesNum % markerColours.length];
    }


    visualisations.FloorMap = function() {
        var addCss = function(cssPath) {
            var linkElement = window.document.createElement('link');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('type', 'text/css');
            linkElement.setAttribute('href', cssPath);
           
            window.document.getElementsByTagName('head')[0].appendChild(linkElement);
        }
        var addJs = function(jsPath) {
            var scriptElement = window.document.createElement('script');
            scriptElement.setAttribute('type', 'text/javascript');
            scriptElement.setAttribute('src', jsPath);
           
            window.document.getElementsByTagName('head')[0].appendChild(scriptElement);
        }

          // Create a colour set.
        var color = d3.scale.category20();

        this.element = window.document.createElement("div");
        const mapNum =  Math.floor((Math.random() * 1000) % 1000);
        this.elementName = "leaflet-floormap-" + mapNum;
        this.element.setAttribute("id", this.elementName);
        this.element.style.display = "grid";
        this.element.style.gridTemplateColumns = "auto";
        this.element.style.gridGap = "5px 5px";
        
        this.markers = {};
        this.maps = {}; //1 map per grid cell
        this.layerControls = {};//1 control per map
        this.currentLayer = {}; //1 layer name per map
        this.layers = {}; // 1 layer per floor per map
        this.currentLayer = {};
        this.boundsMap = new Map(); //layer name to bounds

        //Load the library stylesheet
        addCss('leaflet/leaflet.css');
        
        //Load additional resources
        addCss('leaflet/extras/awesome-markers/leaflet.awesome-markers.css');

        addJs('leaflet/extras/awesome-markers/leaflet.awesome-markers.js');
       
        this.start = function() {
            

           
        }

        this.createDataKey = function (val){
            //Just has locations as all markers are identical, so only one at a single location 
            //can be displayed at a time anyway
            return hashString("" + val[floormapIndexBuilding] + val[floormapIndexFloor] 
                + val[floormapIndexX] + val[floormapIndexY]);
        }

        this.createLayerKey = function (gridName, building, floor){
            return gridName + building + floor;
        }

        this.createLayerLabel = function (building, floor){
            return building + "." + floor;
        }

        
        this.setGridCellLevelData = function(gridName, context, settings, data) {
            if (!this.config) {
                if (localFloorMapConfig) {
                    this.config = localFloorMapConfig;
                } else {
                    this.config = JSON.parse(settings.config);
                }
            }
            
            if (data && data !== null) {

                const seriesArray = data.values;

                for (var i = 0; i < seriesArray.length; i++){
                    const series = seriesArray[i];
                    const colour = markerColour (i);
                    const vals = series.values;
                    for (const val of vals) {
                        const buildingId = val[floormapIndexBuilding];
                        const floorId = val[floormapIndexFloor];
                        const layerId = this.createLayerKey(gridName, buildingId, floorId);

                        if (!this.layers[layerId]) {
                            
                            const buildingConfig = this.config[buildingId];
                            if (!buildingConfig) {
                                console.log ('Configuration not found for building "' + buildingId + '"');
                                continue;
                            }
                            const floorConfig = buildingConfig[floorId];
                            if (!buildingConfig) {
                                console.log ('Configuration not found for floor "' + floorId + 
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            if (!floorConfig.width) {
                                console.log ('Property width not defined for floor "' + floorId + 
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            if (!floorConfig.height) {
                                console.log ('Property height not defined for floor "' + floorId + 
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            if (!floorConfig.image) {
                                console.log ('Property image not defined for floor "' + floorId + 
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            const layerLabel = this.createLayerLabel(buildingId, floorId);
                            //Pairs of "lat,lon" (y, x) rather than x,y
                            const bounds = [[0,0], [floorConfig.height, floorConfig.width]];
                            this.boundsMap.set(layerLabel, bounds);
        
                            const imageUrl = floorConfig.image;
                            
              
                            const image = L.imageOverlay(imageUrl, bounds);
                            
                            this.layers[layerId] = L.layerGroup([image]);

                            if (!this.maps[gridName]) {
                            
                                const gridElement = window.document.createElement("div");
                                gridElement.setAttribute("id", gridName);
                                this.element.appendChild(gridElement);
                            
                                this.maps[gridName] = L.map(gridName,
                                    {
                                    crs: L.CRS.Simple,
                                    minZoom: 0
                                    }
                                );

                                this.currentLayer[gridName] = layerLabel;
                                
                                const vis = this; //Allow this to be accessed within closure
                                this.maps[gridName].on('baselayerchange',function (e) {
                                    vis.currentLayer[gridName] = e.name;
                                    vis.resize();
                                  });
                                

                                this.layers[layerId].addTo(this.maps[gridName]);
                                
                                this.layerControls[gridName] = L.control.layers(null, null, {sortLayers: true})
                                    .addTo(this.maps[gridName]);
                                
                            }

                            this.layerControls[gridName].addBaseLayer(this.layers[layerId], layerLabel);
                            
                            
                        }
               
                        const dataKey = this.createDataKey(val);
                        if (!this.markers[gridName]) {
                            this.markers[gridName] = new Map();
                        }

                        if (!this.markers[gridName].has (dataKey)) {
                            var iconName = 'map-marker';
                            if (val.length > floormapIndexIcon && val[floormapIndexIcon]) {
                                iconName = val[floormapIndexIcon];
                            }
    
                            var markerIcon = L.AwesomeMarkers.icon({
                                icon: iconName,
                                prefix: 'fa',
                                markerColor: colour
                            });
    
                            //Position is y,x deriving from latlon
                            var marker = L.marker([parseFloat(val[floormapIndexY]),
                                parseFloat(val[floormapIndexX])], {icon: markerIcon}); 
                            this.layers[layerId].addLayer(marker);
                            this.markers[gridName].set(dataKey, marker);
                        } else {
                            // console.log("Not updating marker " + val[1] + ":" + val[2]);
                        }
                    
                    }
                }
            
            }
        };

        this.gridKeys = {};

        this.removeOldGridCells = function (gridSeriesArray) {

            if (!gridSeriesArray || 
                (gridSeriesArray.length == 1 && !gridSeriesArray[0].key)) {
                return;
            }

            var newGridKeys = {};
            for (const gridSeries of gridSeriesArray) {
                newGridKeys[hashString(gridSeries.key)] = gridSeries.key;
            }

            for (const hashKey in this.gridKeys) {
                if (! newGridKeys[hashKey]) {
                    const elemToRemoveId = this.elementName + "-" + hashKey;

                    //Remove the resources associated with this grid that are not now needed
                    delete this.maps[elemToRemoveId];
                    delete this.markers[elemToRemoveId];
                    delete this.layerControls[elemToRemoveId];
                    delete this.currentLayer[elemToRemoveId];

                    //Remove all layers that are associated with this grid
                    for (const layer in this.layers) {
                        if (layer.startsWith(elemToRemoveId)) {
                            delete this.layers[layer];
                        }
                    }

                    const elemToRemove = document.getElementById(elemToRemoveId);

                    if (elemToRemove) {
                        elemToRemove.remove();
                    }
                }
            }

            this.gridKeys = newGridKeys;
        }
     
        //Public method for setting the data on the visualisation(s) as a whole
        //This is the entry point from Stroom
        this.setData = function(context, settings, data) {
            

            if (data && data !== null) {
                const gridSeriesArray = data.values;

                this.removeOldGridCells(gridSeriesArray);

                this.element.style.gridTemplateColumns = "auto";

                if (gridSeriesArray.length > 2) {
                    this.element.style.gridTemplateColumns = "auto auto";
                }

                if (gridSeriesArray.length > 5) {
                    this.element.style.gridTemplateColumns = "auto auto auto";
                }

                if (gridSeriesArray.length > 9) {
                    this.element.style.gridTemplateColumns = "auto auto auto auto";
                }

                if (gridSeriesArray.length > 16) {
                    this.element.style.gridTemplateColumns = "auto auto auto auto auto";
                }

                for (var i = 0; i < gridSeriesArray.length; i++){
                    const gridSeries = gridSeriesArray[i];

                    var gridMapElementName = this.elementName;
                    if (gridSeriesArray.length > floormapIndexName || gridSeriesArray[floormapIndexName].key){
                        //There is a grid key, so more than one element
                        gridMapElementName = this.elementName + "-" + hashString(gridSeries.key);
                    }
                    
                    this.setGridCellLevelData(gridMapElementName, context, settings, gridSeries);
                }
            
                this.resize();
            }
        };

        this.resize = function() {
            for (const mapName in this.maps){
                this.maps[mapName].fitBounds(this.boundsMap.get(this.currentLayer[mapName]));
                this.maps[mapName].invalidateSize();
            }
        };

        this.getLegendKeyField = function() {
            return 0;
        };
        
    };


}());

