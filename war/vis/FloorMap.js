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
    const floormapIndexCampus = 1;
    const floormapIndexBuilding = 2;
    const floormapIndexFloor = 3;
    const floormapIndexX = 4;
    const floormapIndexY = 5;
    const floormapIndexIcon = 6;
    const floormapIndexSeries = 7;
    const floormapIndexGridSeries = 8;
    

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
        this.drawControls = {}; // 1 control per map
        this.currentLayer = {}; //1 layer name per map
        this.layers = {}; // 1 layer per floor per map
        this.zoneLayers = {}; 
        this.currentLayer = {};
        this.boundsMap = new Map(); //layer name to bounds

        //Load the library stylesheet
        addCss('leaflet/leaflet.css');
        
        //Load additional resources
        addCss('leaflet/leaflet-fontawesome-markers.css');
        addJs('leaflet/plugins/Leaflet.draw/leaflet.draw-src.js');
        addCss('leaflet/plugins/Leaflet.draw/leaflet.draw.css');
        
        this.start = function() {
            

           
        }

        this.createDataKey = function (val){
            //Just has locations as all markers are identical, so only one at a single location 
            //can be displayed at a time anyway
            return hashString("" + val[floormapIndexCampus] + val[floormapIndexBuilding] + val[floormapIndexFloor] 
                + val[floormapIndexX] + val[floormapIndexY]);
        }

        this.createLayerKey = function (gridName, campus, building, floor){
            return gridName + "." + campus + "." + building + "." + floor;
        }

        this.createLayerLabel = function (campus, building, floor){
            return campus + "." + building + "." + floor;
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
                const vis = this; //Allow this to be accessed within closures

                for (var i = 0; i < seriesArray.length; i++){
                    const series = seriesArray[i];
                    
                    const vals = series.values;
                    for (const val of vals) {
                        const campusId = val[floormapIndexCampus];
                        const buildingId = val[floormapIndexBuilding];
                        const floorId = val[floormapIndexFloor];
                        const layerId = this.createLayerKey(gridName, campusId, buildingId, floorId);

                        if (!this.layers[layerId]) {
                            const campusConfig = this.config[campusId];
                            if (!campusConfig) {
                                console.log ('Configuration not found for building group "' + campusId + '"');
                                continue;
                            }

                            const buildingConfig = campusConfig[buildingId];
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

                            const layerLabel = this.createLayerLabel(campusId, buildingId, floorId);
                            //Pairs of "lat,lon" (y, x) rather than x,y
                            const bounds = [[0,0], [floorConfig.height, floorConfig.width]];
                            this.boundsMap.set(layerLabel, bounds);
        
                            const imageUrl = floorConfig.image;
                            
              
                            const image = L.imageOverlay(imageUrl, bounds);
                            
                            this.layers[layerId] = L.layerGroup([image]);

                            if (!this.maps[gridName]) { //Init the map
                            
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
                                
                                // this.maps[gridName].on('baselayerchange',function (e) {
                                //     vis.currentLayer[gridName] = e.name;
                                //     vis.resize();
                                //   });
                                

                                this.layers[layerId].addTo(this.maps[gridName]);
                                
                                this.layerControls[gridName] = L.control.layers(null, null, {sortLayers: true})
                                    .addTo(this.maps[gridName]);

                            
                                                    
                               this.maps[gridName].on(L.Draw.Event.CREATED, function (e) {
                                   var type = e.layerType,
                                    layer = e.layer;
                           
                                    const myLayerId = gridName + "." + vis.currentLayer[gridName];
                                       console.log('Looking for ' + myLayerId);
                                    //    if (!vis.zoneLayers[myLayerId]) {
                                    //     vis.zoneLayers[myLayerId] = new L.FeatureGroup(); 
                                        
                                    //     console.log('CREATE Created layer ' + myLayerId);
                                    // }
                                       vis.zoneLayers[myLayerId].addLayer(layer);
                               });
                           
                               this.maps[gridName].on(L.Draw.Event.EDITED, function (e) {
                                   var layers = e.layers;
                                   var countOfEditedLayers = 0;
                                   layers.eachLayer(function (layer) {
                                       countOfEditedLayers++;
                                   });
                                   console.log("Edited " + countOfEditedLayers + " layers");
                               });
                           

                               //Callback for change of base layer (floor)
                               this.maps[gridName].on('baselayerchange', function(e) {
                                const myLayerId = gridName + "." + e.name;
                            

                               
                                if (!vis.zoneLayers[myLayerId]) {
                                    vis.zoneLayers[myLayerId] = new L.FeatureGroup(); 
                                    
                                    vis.zoneLayers[myLayerId].addTo(vis.maps[gridName]);
                                    console.log('EDIT Created layer ' + myLayerId);
                                }

                                if (vis.currentLayer[gridName] != e.name) {
                                    vis.currentLayer[gridName] = e.name;
                                    for (zonesForLevel in vis.zoneLayers) {
                                        if (vis.maps[gridName].hasLayer(vis.zoneLayers[zonesForLevel])) {
                                            // < Awesome here, could store the active layer
                                            console.log ("Removing drawing layer");
                                            vis.maps[gridName].removeLayer(vis.zoneLayers[zonesForLevel]);
                                        }
                                    }
                                    
                                    console.log ("Adding drawing layer " + myLayerId);
                                    vis.maps[gridName].addLayer(vis.zoneLayers[myLayerId]);
                                }
                                if (vis.drawControls[gridName])
                                {
                                    vis.maps[gridName].removeControl (vis.drawControls[gridName]);
                                }

                                                                     //Configure leaflet.draw library for zones rather than generic shapes
                               L.drawLocal.draw.toolbar.buttons.polygon = 'Draw new zone';
                            
                               L.drawLocal.draw.handlers.polygon.tooltip.start = 'Click to start drawing zone.';
                               L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Click to continue drawing zone.';
                               L.drawLocal.draw.handlers.polygon.tooltip.end = 'Click first point to close this zone.';
                               L.drawLocal.draw.handlers.polygon.error =  'Zones cannot intersect themselves.';
                               L.drawLocal.edit.toolbar.buttons.edit = 'Edit zones';
                               L.drawLocal.edit.toolbar.buttons.editDisabled = 'No zones to edit';
                               L.drawLocal.edit.toolbar.buttons.remove = 'Delete zones';
                            

                                vis.drawControls[gridName] = new L.Control.Draw({
                                    position: 'bottomleft',
                                    draw: {
                                        polyline: false,
                                        poly: {
                                            
                                            drawError: {
                                                // color: '#e1e100', // Color the shape will turn when intersects
                                                message: 'Zones cannot intersect themselves.' // Message that will show when intersect
                                            },
                                            shapeOptions: {
                                                color: 'green'
                                            },
                                            allowIntersection: false // Restricts shapes to simple polygons
                                        },
                                        polygon: {
                                            
                                            drawError: {
                                                // color: '#e1e100', // Color the shape will turn when intersects
                                                message: 'Zones cannot intersect themselves.' // Message that will show when intersect
                                            },
                                            shapeOptions: {
                                                color: 'green'
                                            },
                                            allowIntersection: false // Restricts shapes to simple polygons
                                        },
                                        circle: false,
                                        marker: false,
                                        circlemarker: false,
                                        rectangle: false
                                    },
                                   
                                    edit: {
                                       
                                        featureGroup: vis.zoneLayers[myLayerId],
                                        remove: true,
                                        poly: {
                                            error: {
                                                // color: '#e1e100', // Color the shape will turn when intersects
                                                message: 'Zones cannot intersect themselves.' // Message that will show when intersect
                                            },
                                            allowIntersection: false
                                        },
                                        polygon: {
                                            error: {
                                                // color: '#e1e100', // Color the shape will turn when intersects
                                                message: 'Zones cannot intersect themselves.' // Message that will show when intersect
                                            },
                                            allowIntersection: false
                                        }
                                    }
                                }); 




                                vis.maps[gridName].addControl(vis.drawControls[gridName]);

                                // vis.currentLayer[gridName] = e.name;
                                vis.resize();

                                  
                                 });
                                
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
    
                            var colour = color (iconName);
                            if (val.length > floormapIndexSeries && val[floormapIndexSeries]) {
                                colour = color(val[floormapIndexSeries]);
                            }

                            var markerHtml = "<div style='background-color:" + colour + "' class='marker-pin'></div><i class='fa fa-"
                              + iconName + " awesome'>";
                                                            
                            var markerIcon = L.divIcon({
                                className: 'custom-div-icon',
                            html: markerHtml,
                            iconSize: [30, 42],
                            iconAnchor: [15, 42]
                            });
                           
                            //Position is y,x deriving from latlon
                            var marker = L.marker([parseFloat(val[floormapIndexY]),
                                parseFloat(val[floormapIndexX])], {icon: markerIcon});

                            //Add popup details
                            if (val.length > floormapIndexName && val[floormapIndexName]){
                                var popupHeading = "Information";
                                if (val.length > floormapIndexSeries && val[floormapIndexSeries]) {
                                    popupHeading = val[floormapIndexSeries];
                                }
                                
                                const popupDetail = val[floormapIndexName];
                                
                                marker.bindPopup('<p><b>' + popupHeading + '</b><br />' + popupDetail + '</p>');
                            }
                            
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

