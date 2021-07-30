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

const allFloorMapZones = {};
const allFloorMapMaps = {}; //1 map per grid cell

function renameFloormapZone(zoneDictionaryUuid, mapId, elementId, zoneId, campus, building, floor) {
    const textField = window.document.getElementById(elementId);
    const newName = textField.value;

    allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].name = newName;
    allFloorMapMaps[mapId].closePopup();
}

function getFloormapZoneName(zoneDictionaryUuid, campus, building, floor, zoneId) {
    return allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].name;
}

function createPopupForFloormapZone(layer) {
    const span = window.document.createElement('span');

    const textField = window.document.createElement('input');
    textField.setAttribute("type", "text");
    const currentName = getFloormapZoneName(layer.floorMapDetails.zoneDictionaryUuid, layer.floorMapDetails.campusId,
        layer.floorMapDetails.buildingId, layer.floorMapDetails.floorId, layer.floorMapDetails.zoneId);
    textField.value = currentName;
    textField.id = layer.floorMapDetails.renameTextFieldId;
    span.appendChild(textField);

    const button = window.document.createElement('button');
    button.innerHTML = "Rename";
    button.onclick = function () {
        renameFloormapZone(layer.floorMapDetails.zoneDictionaryUuid, layer.floorMapDetails.mapId,
            layer.floorMapDetails.renameTextFieldId, layer.floorMapDetails.zoneId,
            layer.floorMapDetails.campusId,
            layer.floorMapDetails.buildingId, layer.floorMapDetails.floorId)
    };
    span.appendChild(button);

    return span;
}

function floormapZoneCreated (vis, gridName, e) {
    var type = e.layerType,
        layer = e.layer;


    const myLayerId = gridName + "." + vis.currentLayer[gridName];
    
    vis.zoneLayers[myLayerId].addLayer(layer);

    //todo change currentLayer from string into structure, then convert to string as required
    const tokens = vis.currentLayer[gridName].split('.');
    const campusId = tokens[0];
    const buildingId = tokens[1];
    const floorId = tokens[2];

    const zoneDictionaryUuid = vis.config[campusId][buildingId][floorId].zoneDictionaryUuid;

    if (!zoneDictionaryUuid) {
        return;
    }

    //Find the name of the zone
    if (!allFloorMapZones[zoneDictionaryUuid]) {
        allFloorMapZones[zoneDictionaryUuid] = {};
    }

    if (!allFloorMapZones[zoneDictionaryUuid][campusId]) {
        allFloorMapZones[zoneDictionaryUuid][campusId] = {};
    }
    if (!allFloorMapZones[zoneDictionaryUuid][campusId][buildingId]) {
        allFloorMapZones[zoneDictionaryUuid][campusId][buildingId] = {};
    }
    if (!allFloorMapZones[zoneDictionaryUuid][campusId][buildingId][floorId]) {
        allFloorMapZones[zoneDictionaryUuid][campusId][buildingId][floorId] = [];
    }
    
    allFloorMapZones[zoneDictionaryUuid][campusId][buildingId][floorId].push( { name: 'Unnamed Zone', points: layer.getLatLngs() });

    const elementId = "floorMapTextField" + Math.floor((Math.random() * 100000) % 100000);

    layer.floorMapDetails = {};
    layer.floorMapDetails.renameTextFieldId = elementId;
    layer.floorMapDetails.mapId = gridName;
    layer.floorMapDetails.zoneId = allFloorMapZones[zoneDictionaryUuid][campusId][buildingId][floorId].length - 1;
    layer.floorMapDetails.campusId = campusId;
    layer.floorMapDetails.buildingId = buildingId;
    layer.floorMapDetails.floorId = floorId;
    layer.floorMapDetails.zoneDictionaryUuid = zoneDictionaryUuid;

    layer.bindPopup(createPopupForFloormapZone);

}

function floormapBaseLayerChanged (vis, gridName, e) {
    const myLayerId = gridName + "." + e.name;
    //todo change currentLayer from string into structure, then convert to string as required
    var tokens = e.name.split('.');
    const campusId = tokens[0];
    const buildingId = tokens[1];
    const floorId = tokens[2];

    const zoneDictionaryUuid = vis.config[campusId][buildingId][floorId].zoneDictionaryUuid;

    var differentFloor = false;
    if (vis.currentLayer[gridName] != e.name) {
        vis.currentLayer[gridName] = e.name;
        differentFloor = true;
        for (zonesForLevel in vis.zoneLayers) {
            if (allFloorMapMaps[gridName].hasLayer(vis.zoneLayers[zonesForLevel])) {
                // < Awesome here, could store the active layer
                console.log("Removing drawing layer");
                allFloorMapMaps[gridName].removeLayer(vis.zoneLayers[zonesForLevel]);
            }
        }
    }

    if (zoneDictionaryUuid) {
        if (!vis.zoneLayers[myLayerId]) {
            vis.zoneLayers[myLayerId] = new L.FeatureGroup();

            vis.zoneLayers[myLayerId].addTo(allFloorMapMaps[gridName]);
        }

        if (differentFloor) {
            console.log("Adding drawing layer " + myLayerId);
            allFloorMapMaps[gridName].addLayer(vis.zoneLayers[myLayerId]);
        }
    }

    if (vis.drawControls[gridName]) {
        allFloorMapMaps[gridName].removeControl(vis.drawControls[gridName]);
    }

    if (zoneDictionaryUuid) {
        //Configure leaflet.draw library for zones rather than generic shapes
        L.drawLocal.draw.toolbar.buttons.polygon = 'Draw new zone';

        L.drawLocal.draw.handlers.polygon.tooltip.start = 'Click to start drawing zone.';
        L.drawLocal.draw.handlers.polygon.tooltip.cont = 'Click to continue drawing zone.';
        L.drawLocal.draw.handlers.polygon.tooltip.end = 'Click first point to close this zone.';
        L.drawLocal.draw.handlers.polygon.error = 'Zones cannot intersect themselves.';
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




        allFloorMapMaps[gridName].addControl(vis.drawControls[gridName]);

    }



    // vis.currentLayer[gridName] = e.name;
    vis.resize();


}

//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function () {

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

    var hashString = function (data) {
        input = "" + data;
        var hash = 0, i, chr;
        if (input.length === 0) return hash;
        for (i = 0; i < input.length; i++) {
            chr = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return Math.abs(hash);
    };



    visualisations.FloorMap = function () {
        var addCss = function (cssPath) {
            var linkElement = window.document.createElement('link');
            linkElement.setAttribute('rel', 'stylesheet');
            linkElement.setAttribute('type', 'text/css');
            linkElement.setAttribute('href', cssPath);

            window.document.getElementsByTagName('head')[0].appendChild(linkElement);
        }
        var addJs = function (jsPath) {
            var scriptElement = window.document.createElement('script');
            scriptElement.setAttribute('type', 'text/javascript');
            scriptElement.setAttribute('src', jsPath);

            window.document.getElementsByTagName('head')[0].appendChild(scriptElement);
        }

        // Create a colour set.
        var color = d3.scale.category20();

        this.element = window.document.createElement("div");
        const mapNum = Math.floor((Math.random() * 1000) % 1000);
        this.elementName = "leaflet-floormap-" + mapNum;
        this.element.setAttribute("id", this.elementName);
        this.element.style.display = "grid";
        this.element.style.gridTemplateColumns = "auto";
        this.element.style.gridGap = "5px 5px";

        this.markers = {};

        this.layerControls = {};//1 control per map
        this.drawControls = {}; // 1 control per map
        this.currentLayer = {}; //1 layer name per map
        this.layers = {}; // 1 layer per floor per map
        this.zoneLayers = {};
        this.boundsMap = new Map(); //layer name to bounds

        //Load the library stylesheet
        addCss('leaflet/leaflet.css');

        //Load additional resources
        addCss('leaflet/leaflet-fontawesome-markers.css');
        addJs('leaflet/plugins/Leaflet.draw/leaflet.draw-src.js');
        addCss('leaflet/plugins/Leaflet.draw/leaflet.draw.css');

        this.start = function () {



        }

        this.createDataKey = function (val) {
            //Just has locations as all markers are identical, so only one at a single location 
            //can be displayed at a time anyway
            return hashString("" + val[floormapIndexCampus] + val[floormapIndexBuilding] + val[floormapIndexFloor]
                + val[floormapIndexX] + val[floormapIndexY]);
        }

        this.createLayerKey = function (gridName, campus, building, floor) {
            return gridName + "." + campus + "." + building + "." + floor;
        }

        this.createLayerLabel = function (campus, building, floor) {
            return campus + "." + building + "." + floor;
        }

        this.zoneDictionaryResourceURL = function(zoneDictionaryUuid) {
            if (zoneDictionaryUuid.startsWith('staticUrl:')) {
                return zoneDictionaryUuid.split(':')[1];

            } else {
                return "../api/dictionary/v1/" + zoneDictionaryUuid;
            }

        }

        this.createPolygonsForLayer = function (gridName, zoneDictionaryUuid, zoneDictionaryContent) {
            for (const campus in zoneDictionaryContent){
                for (const building in zoneDictionaryContent[campus]) {
                    for (const floor in zoneDictionaryContent[campus][building]) {
                        for (const zone of zoneDictionaryContent[campus][building][floor]) {

                            const polygon = L.polygon(zone.points);
                            const elementId = "floorMapTextField" + Math.floor((Math.random() * 100000) % 100000);

                            polygon.floorMapDetails = {};
                            polygon.floorMapDetails.renameTextFieldId = elementId;
                            polygon.floorMapDetails.mapId = gridName;
                            polygon.floorMapDetails.zoneId = allFloorMapZones[zoneDictionaryUuid][campus][building][floor].length - 1;
                            polygon.floorMapDetails.campusId = campus;
                            polygon.floorMapDetails.buildingId = building;
                            polygon.floorMapDetails.floorId = floor;
                            polygon.floorMapDetails.zoneDictionaryUuid = zoneDictionaryUuid;

                            const layerId = this.createLayerKey(gridName, campus, building, floor);                            
                            if (!this.zoneLayers[layerId]) {
                                this.zoneLayers[layerId] = new L.FeatureGroup();

                                // this.zoneLayers[layerId].addTo(allFloorMapMaps[gridName]);
                            }
                            
                            polygon.bindPopup(createPopupForFloormapZone);

                            this.zoneLayers[layerId].addLayer(polygon);

                        }
                    }
                }
            }
        }

        this.initialiseZonesForLayer = function (gridName, campusId, buildingId, floorId) {
            const zoneDictionaryUuid = this.config[campusId][buildingId][floorId].zoneDictionaryUuid;
            
            const layerId = this.createLayerKey(gridName, campusId, buildingId, floorId);
            const layerLabel = this.createLayerLabel(campusId, buildingId, floorId);

            if (zoneDictionaryUuid){
                
                if (allFloorMapZones[zoneDictionaryUuid]) 
                {
                    this.createPolygonsForLayer(gridName, zoneDictionaryUuid, allFloorMapZones[zoneDictionaryUuid]);

                    if (this.currentLayer[gridName] == layerLabel) {
                        if (this.zoneLayers[layerId]) {
                            // console.log ("Adding " + layerId + " to " + gridName + " first time");
                            allFloorMapMaps[gridName].addLayer(this.zoneLayers[layerId]);
                        }
                    
                    }
                }
                else
                {
                    
                    const resource = this.zoneDictionaryResourceURL (zoneDictionaryUuid);

                    fetch(resource).then(response => response.json()).then(content =>
                    {
                        allFloorMapZones[zoneDictionaryUuid] = content;
                
                        this.createPolygonsForLayer(gridName, zoneDictionaryUuid, allFloorMapZones[zoneDictionaryUuid]);

                        if (this.currentLayer[gridName] == layerLabel) {
                            if (this.zoneLayers[layerId]) {
                                // console.log ("Adding " + layerId + " to " + gridName + " next time");
                                allFloorMapMaps[gridName].addLayer(this.zoneLayers[layerId]);
                            }
                        }  
                    });    
                }
                
            }
        }


        this.setGridCellLevelData = function (gridName, context, settings, data) {
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

                for (var i = 0; i < seriesArray.length; i++) {
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
                                console.log('Configuration not found for building group "' + campusId + '"');
                                continue;
                            }

                            const buildingConfig = campusConfig[buildingId];
                            if (!buildingConfig) {
                                console.log('Configuration not found for building "' + buildingId + '"');
                                continue;
                            }
                            const floorConfig = buildingConfig[floorId];
                            if (!buildingConfig) {
                                console.log('Configuration not found for floor "' + floorId +
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            if (!floorConfig.width) {
                                console.log('Property width not defined for floor "' + floorId +
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            if (!floorConfig.height) {
                                console.log('Property height not defined for floor "' + floorId +
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            if (!floorConfig.image) {
                                console.log('Property image not defined for floor "' + floorId +
                                    '" of building "' + buildingId + '"');
                                continue;
                            }

                            const layerLabel = this.createLayerLabel(campusId, buildingId, floorId);
                            //Pairs of "lat,lon" (y, x) rather than x,y
                            const bounds = [[0, 0], [floorConfig.height, floorConfig.width]];
                            this.boundsMap.set(layerLabel, bounds);

                            const imageUrl = floorConfig.image;


                            const image = L.imageOverlay(imageUrl, bounds);

                            this.layers[layerId] = L.layerGroup([image]);

                            if (!allFloorMapMaps[gridName]) { //Init the map

                                const gridElement = window.document.createElement("div");
                                gridElement.setAttribute("id", gridName);
                                this.element.appendChild(gridElement);

                                allFloorMapMaps[gridName] = L.map(gridName,
                                    {
                                        crs: L.CRS.Simple,
                                        minZoom: 0
                                    }
                                );

                                this.currentLayer[gridName] = layerLabel;

                                // allFloorMapMaps[gridName].on('baselayerchange',function (e) {
                                //     vis.currentLayer[gridName] = e.name;
                                //     vis.resize();
                                //   });


                                this.layers[layerId].addTo(allFloorMapMaps[gridName]);

                                this.layerControls[gridName] = L.control.layers(null, null, { sortLayers: true })
                                    .addTo(allFloorMapMaps[gridName]);

                                if (this.config[campusId][buildingId][floorId].zoneDictionaryUuid) {
                                    //Create save zones button
                                    const button = window.document.createElement("button");
                                    gridElement.appendChild(button);
                                    const icon = window.document.createElement("i");
                                    icon.classList.add("fa", "fa-save");
                                    button.style.position = "absolute";
                                    button.style.width = "30px";
                                    button.style.height = "30px";
                                    button.style.bottom = "20px";
                                    button.style.right = "5px";
                                    button.style.zIndex = "1000";
                                    button.classList.add("leaflet-bar");
                                    button.title = "Save all zones";

                                    button.appendChild(icon);
                                }
                                

                                //Register callback for creation of draw layer (zone)
                                allFloorMapMaps[gridName].on(L.Draw.Event.CREATED, function (e) {
                                    floormapZoneCreated(vis, gridName, e);});


                                //Callback for change of base layer (floor)
                                allFloorMapMaps[gridName].on('baselayerchange',  function (e) {
                                    floormapBaseLayerChanged(vis, gridName, e);});


                            }

                            //Load any zone data and create associated zone polygons
                            this.initialiseZonesForLayer(gridName, campusId, buildingId, floorId, layerId);

                            this.layerControls[gridName].addBaseLayer(this.layers[layerId], layerLabel);
                           
                        }

                        const dataKey = this.createDataKey(val);
                        if (!this.markers[gridName]) {
                            this.markers[gridName] = new Map();
                        }

                        if (!this.markers[gridName].has(dataKey)) {
                            var iconName = 'map-marker';
                            if (val.length > floormapIndexIcon && val[floormapIndexIcon]) {
                                iconName = val[floormapIndexIcon];
                            }

                            var colour = color(iconName);
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
                            parseFloat(val[floormapIndexX])], { icon: markerIcon });

                            //Add popup details
                            if (val.length > floormapIndexName && val[floormapIndexName]) {
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
                if (!newGridKeys[hashKey]) {
                    const elemToRemoveId = this.elementName + "-" + hashKey;

                    //Remove the resources associated with this grid that are not now needed
                    delete allFloorMapMaps[elemToRemoveId];
                    delete this.markers[elemToRemoveId];
                    delete this.layerControls[elemToRemoveId];
                    delete this.currentLayer[elemToRemoveId];

                    //Remove all layers that are associated with this grid
                    for (const layer in this.layers) {
                        if (layer.startsWith(elemToRemoveId)) {
                            delete this.layers[layer];
                        }
                    }

                    for (const zoneLayer in this.zoneLayers) {
                        if (zoneLayer.startsWith(elemToRemoveId)) {
                            delete this.layers[zoneLayer];
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
        this.setData = function (context, settings, data) {


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

                for (var i = 0; i < gridSeriesArray.length; i++) {
                    const gridSeries = gridSeriesArray[i];

                    var gridMapElementName = this.elementName;
                    if (gridSeriesArray.length > floormapIndexName || gridSeriesArray[floormapIndexName].key) {
                        //There is a grid key, so more than one element
                        gridMapElementName = this.elementName + "-" + hashString(gridSeries.key);
                    }

                    this.setGridCellLevelData(gridMapElementName, context, settings, gridSeries);
                }

                this.resize();
            }
        };

        this.resize = function () {
            for (const mapName in allFloorMapMaps) {
                allFloorMapMaps[mapName].fitBounds(this.boundsMap.get(this.currentLayer[mapName]));
                allFloorMapMaps[mapName].invalidateSize();
            }
        };

        this.getLegendKeyField = function () {
            return 0;
        };

    };


}());

