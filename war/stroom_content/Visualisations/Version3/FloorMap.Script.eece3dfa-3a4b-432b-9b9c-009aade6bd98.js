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

const modifiedZoneUuidMap = new Map();
const allFloorMapZones = {};
const allFloorMapZoneDictionaryObjects = {}; //As fetched from Stroom
const allFloorMapMaps = {}; //1 map per grid cell


function colorByEpochMilli (eventTime, minTime, maxTime) {
    if (!eventTime) {
        return undefined;
    }

    const midTime = (maxTime + minTime) / 2;
    const halfDuration = (maxTime - minTime) / 2;
    var rgbString;
    if (eventTime < midTime) {
        rgbString = "rgb(0, 255, " + Math.floor(((eventTime - minTime) * 255 / halfDuration))
            + ")";
    } else {
        rgbString = "rgb(0, " + Math.floor(((maxTime -eventTime) * 255 / halfDuration))
            + ", 255)";
    }

    return rgbString;
}

function isZoneDictionaryResourceStatic (zoneDictionaryUuid) {
    return zoneDictionaryUuid.startsWith('staticUrl:');
}

function zoneDictionaryResourceURL (zoneDictionaryUuid) {
    if (isZoneDictionaryResourceStatic(zoneDictionaryUuid)) {
        return zoneDictionaryUuid.split(':')[1];

    } else {
        return "../api/dictionary/v1/" + zoneDictionaryUuid;
    }

}

function renameFloormapZone(zoneDictionaryUuid, mapId, elementId, zoneId, campus, building, floor) {
    const textField = window.document.getElementById(elementId);
    const newName = textField.value.split("#");

    allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].name = newName[0];
    allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].tags = [];
    for (t = 1; t < newName.length; t++) {
        allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].tags.push(newName[t].trim());
    }

    allFloorMapMaps[mapId].closePopup();

    modifiedZoneUuidMap.set(zoneDictionaryUuid, true);

    enableSaveButtons();
}

function getFloormapZoneName(zoneDictionaryUuid, campus, building, floor, zoneId) {
    return allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].name;
}

function getFloormapZoneNameWithTags(zoneDictionaryUuid, campus, building, floor, zoneId) {
    var result = allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].name;
    
    if (!allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].tags) {
        return result;
    }

    for (const tag of allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].tags) {
        result += " #" + tag;
    }

    return result;
}

function getFloormapZoneTags(zoneDictionaryUuid, campus, building, floor, zoneId) {
    tags = allFloorMapZones[zoneDictionaryUuid][campus][building][floor][zoneId].tags;
    if (tags) {
        return tags;
    }

    return [];
}

//Clone the zones, but don't clone any marked deleted
function copyZonesWithoutDeleted(originalZones){
    var result = {};

    for (const campus in originalZones){
        for (const building in originalZones[campus]) {
            for (const floor in originalZones[campus][building]) {
                for (var zoneId = 0; zoneId < originalZones[campus][building][floor].length; zoneId++) {
                    const zone =  originalZones[campus][building][floor][zoneId];
                    if (zone.deleted) {
                        continue; //tombstone
                    }
                    if (!zone.points instanceof Array) {
                        continue;
                    }

                    if (!result[campus]) {
                        result[campus] = {};
                    }
                    if (!result[campus][building]) {
                        result[campus][building] = {};
                    }
                    if (!result[campus][building][floor]) {
                        result[campus][building][floor] = [];
                    }
                    result[campus][building][floor].push(zone);
                }
            }
        }
    }

    return result;
}

function saveZones (){
    disableSaveButtons();

    // console.log ("Saving zones");

    for (const zoneDictionaryUuid of modifiedZoneUuidMap.keys()) {

        const resource = zoneDictionaryResourceURL (zoneDictionaryUuid);
        var toSave;
        if (isZoneDictionaryResourceStatic(zoneDictionaryUuid)) {
            toSave = copyZonesWithoutDeleted(allFloorMapZones[zoneDictionaryUuid]);
        } else {
            toSave = allFloorMapZoneDictionaryObjects[zoneDictionaryUuid];
            toSave.data = JSON.stringify(copyZonesWithoutDeleted(allFloorMapZones[zoneDictionaryUuid]), null, 2);
        }

        if (modifiedZoneUuidMap.get(zoneDictionaryUuid) == true) {
            if (isZoneDictionaryResourceStatic(zoneDictionaryUuid)) {
                console.log ("Would save " + JSON.stringify(toSave));
            } else {
                fetch(resource, {method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(toSave),
                }).then(response => {
                    if (response.ok) {
                        response.json().then(content =>
                            {
                                //Pick up the updated version of the zone to future updates.
                                allFloorMapZoneDictionaryObjects[zoneDictionaryUuid] = content;

                                alert ("Zones saved successfully");
                            });
                    } else {
                        response.text().then(content => alert("Error saving zones!\n" + content));
                    }
                });
            }
        }
    }

    for (const modifiedZoneDictionaryUuid of modifiedZoneUuidMap.keys()) {
        modifiedZoneUuidMap.delete(modifiedZoneDictionaryUuid);
    }
}

function getFloormapZonePopupHtml(zoneDictionaryUuid, campus, building, floor, zoneId, isShowTagsEnabled) {
    const zoneName = getFloormapZoneName(zoneDictionaryUuid, campus, building, floor, zoneId);
    const zoneTags = getFloormapZoneTags(zoneDictionaryUuid, campus, building, floor, zoneId);
    
    //First Line is bold, tags below
    var html = "<b>" + zoneName + "</b>";

    if (isShowTagsEnabled) {
        for (var i = 0; i < zoneTags.length; i++) {
            html +=  "<br/>" + "#" + zoneTags[i];
        }    
    }
    
    return html;
}

function createPopupForFloormapZone(layer) {
    const div = window.document.createElement('div');

    const span = window.document.createElement('span');

    const textField = window.document.createElement('input');
    textField.setAttribute("type", "text");
    const currentName = getFloormapZoneNameWithTags(layer.floorMapDetails.zoneDictionaryUuid, layer.floorMapDetails.campusId,
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

    div.appendChild(span);

    const text =  window.document.createElement('p');
    text.innerText = "Note: Analytic #tags follow visible name.";
    div.appendChild(text);

    return div;
}


function enableSaveButtons() {
    const elements = window.document.getElementsByClassName("floormap-save-zone-button");
    for (const element of elements){
        element.disabled = false;
    }
}

function disableSaveButtons() {
    const elements = window.document.getElementsByClassName("floormap-save-zone-button");
    for (const element of elements){
        element.disabled = true;
    }
}

function floormapZoneEdited (vis, gridName, e) {
    const myLayerId = gridName + "." + vis.currentLayer[gridName];

    e.layers.eachLayer(function (updatedZone) {
        if (!updatedZone.floorMapDetails) {
            console.error("No layer details found for edited zone");
        }

        let height = 0;
        let isOriginTopLeft = false;
   
        if (vis.config[updatedZone.floorMapDetails.campusId] && 
            vis.config[updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId] && 
            vis.config[updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId][updatedZone.floorMapDetails.floorId]) {
            height = vis.config[updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId][updatedZone.floorMapDetails.floorId].height;
            if (vis.config[updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId][updatedZone.floorMapDetails.floorId].isOriginTopLeft) {
                isOriginTopLeft = vis.config[updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId][updatedZone.floorMapDetails.floorId].isOriginTopLeft;
            }
        }
        if (height == 0) {
            alert ("Height not defined for " + updatedZone.floorMapDetails.campusId + "." +
              updatedZone.floorMapDetails.buildingId + "." + updatedZone.floorMapDetails.floorId);
        }

        const latLngs = updatedZone.getLatLngs()[0];

        allFloorMapZones[updatedZone.floorMapDetails.zoneDictionaryUuid][updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId]
            [updatedZone.floorMapDetails.floorId][updatedZone.floorMapDetails.zoneId].points =
                latLngs.map(latLng => { 
                    return ({x: latLng.lng,
                         y: (isOriginTopLeft ? (height - latLng.lat) : latLng.lat)}); 
                });

        modifiedZoneUuidMap.set(updatedZone.floorMapDetails.zoneDictionaryUuid, true);

        updateZonePolygonInAllLayers (vis, updatedZone);
    });

    
    enableSaveButtons();

}


function floormapZoneDeleted(vis, gridName, e) {
    const myLayerId = gridName + "." + vis.currentLayer[gridName];

    e.layers.eachLayer(function (updatedZone) {
        if (!updatedZone.floorMapDetails) {
            console.error("No layer details found for deleted zone");
        }
        allFloorMapZones[updatedZone.floorMapDetails.zoneDictionaryUuid][updatedZone.floorMapDetails.campusId][updatedZone.floorMapDetails.buildingId]
            [updatedZone.floorMapDetails.floorId][updatedZone.floorMapDetails.zoneId].deleted = true;

        modifiedZoneUuidMap.set(updatedZone.floorMapDetails.zoneDictionaryUuid, true);

        deleteZonePolygonInAllLayers (vis, updatedZone);
    });

    
    enableSaveButtons();

}

function updateZonePolygonInAllLayers(vis, updatedZonePolygon){
    for (const zoneLayerId in vis.zoneLayers) {
        const zoneLayer = vis.zoneLayers[zoneLayerId];

        zoneLayer.getLayers().forEach(function (zone){
            if (zone !== updatedZonePolygon && 
                zone.floorMapDetails.campusId == updatedZonePolygon.floorMapDetails.campusId &&
                zone.floorMapDetails.buildingId == updatedZonePolygon.floorMapDetails.buildingId &&
                zone.floorMapDetails.floorId == updatedZonePolygon.floorMapDetails.floorId &&
                zone.floorMapDetails.zoneId == updatedZonePolygon.floorMapDetails.zoneId) {
                zone.setLatLngs (updatedZonePolygon.getLatLngs());
            }
        });
    }
}

function deleteZonePolygonInAllLayers(vis, deletedZonePolygon){
    for (const zoneLayerId in vis.zoneLayers) {
        const zoneLayer = vis.zoneLayers[zoneLayerId];

        zoneLayer.getLayers().forEach(function (zone){
            if (zone !== deletedZonePolygon && 
                zone.floorMapDetails.campusId == deletedZonePolygon.floorMapDetails.campusId &&
                zone.floorMapDetails.buildingId == deletedZonePolygon.floorMapDetails.buildingId &&
                zone.floorMapDetails.floorId == deletedZonePolygon.floorMapDetails.floorId &&
                zone.floorMapDetails.zoneId == deletedZonePolygon.floorMapDetails.zoneId) {
            zoneLayer.removeLayer(zone);
            }
        });
    }
}


function floormapZoneCreated (vis, gridName, e) {
    const layer = e.layer;

    //todo change currentLayer from string into structure, then convert to string as required
    const tokens = vis.currentLayer[gridName].split('.');
    const campusId = tokens[0];
    const buildingId = tokens[1];
    const floorId = tokens[2];

    const zoneDictionaryUuid = vis.config[campusId][buildingId][floorId].zoneDictionaryUuid;

    if (!zoneDictionaryUuid) {
        return;
    }

    //Mark as dirty (need save)
    modifiedZoneUuidMap.set(zoneDictionaryUuid, true);

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

    let height = 0;
    let isOriginTopLeft = false;
    
    if (vis.config[campusId] && vis.config[campusId][buildingId] && vis.config[campusId][buildingId][floorId]) {
        height = vis.config[campusId][buildingId][floorId].height;
        if (vis.config[campusId][buildingId][floorId].isOriginTopLeft) {
            isOriginTopLeft = vis.config[campusId][buildingId][floorId].isOriginTopLeft;
        }
    }
    if (height == 0) {
        alert ("Height not defined for " + campusId + "." + buildingId + "." + floorId);
    }
    
    allFloorMapZones[zoneDictionaryUuid][campusId][buildingId][floorId].push( { name: 'Unnamed Zone', 
        points: layer.getLatLngs()[0].map(latLng => { return ({x: latLng.lng, 
            y: (isOriginTopLeft ? (height - latLng.lat) : latLng.lat)}); })});

    const currentLayerId = vis.currentLayer[gridName];

    //Add a copy of the zone to appropriate floor of each grid
    for (const zoneLayer in vis.zoneLayers) {
        if (zoneLayer.endsWith(currentLayerId)) {
            const polygon = L.polygon(layer.getLatLngs());

            const elementId = "floorMapTextField" + Math.floor((Math.random() * 100000) % 100000);
            const zoneId = allFloorMapZones[zoneDictionaryUuid][campusId][buildingId][floorId].length - 1;

            polygon.floorMapDetails = {};
            polygon.floorMapDetails.renameTextFieldId = elementId;
            polygon.floorMapDetails.mapId = gridName;
            polygon.floorMapDetails.zoneId = zoneId;
            polygon.floorMapDetails.campusId = campusId;
            polygon.floorMapDetails.buildingId = buildingId;
            polygon.floorMapDetails.floorId = floorId;
            polygon.floorMapDetails.zoneDictionaryUuid = zoneDictionaryUuid;
            
            if (vis.isEditZoneModeEnabled) {
                polygon.bindPopup(createPopupForFloormapZone);
            } else {
                polygon.bindPopup(getFloormapZonePopupHtml(zoneDictionaryUuid, campusId, 
                    buildingId, floorId, zoneId, vis.isShowTagsEnabled));
            }
            

            vis.zoneLayers[zoneLayer].addLayer(polygon); 
        }   
    }

    enableSaveButtons();

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
                allFloorMapMaps[gridName].removeLayer(vis.zoneLayers[zonesForLevel]);
            }
        }
        for (markersForLevel in vis.markerLayers) {
            if (allFloorMapMaps[gridName].hasLayer(vis.markerLayers[markersForLevel])) {
                // < Awesome here, could store the active layer
                allFloorMapMaps[gridName].removeLayer(vis.markerLayers[markersForLevel]);
            }
        }
    }

    allFloorMapMaps[gridName].addLayer(vis.markerLayers[myLayerId]);

    if (zoneDictionaryUuid) {
        if (differentFloor) {
            allFloorMapMaps[gridName].addLayer(vis.zoneLayers[myLayerId]);
        }
    }

    if (vis.drawControls[gridName]) {
        allFloorMapMaps[gridName].removeControl(vis.drawControls[gridName]);
    }

    if (vis.isEditZoneModeEnabled && zoneDictionaryUuid) {
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
    const floormapIndexEventTime = 6;
    const floormapIndexIcon = 7;
    const floormapIndexSeries = 8;
    const floormapIndexGridSeries = 9;


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

        //Whether to allow zones to be edited.
        this.isEditZoneModeEnabled = false;

        //Whether to hide tags in zone names
        this.isShowTagsEnabled = false;

        //Whether to colour the markers by event time.
        this.colourByTimestamp = true;

        this.gridCount = 0;
        this.element = window.document.createElement("div");
        const mapNum = Math.floor((Math.random() * 1000) % 1000);
        this.elementName = "leaflet-floormap-" + mapNum;
        this.element.setAttribute("id", this.elementName);
        this.element.style.display = "grid";
        this.element.style.gridTemplateColumns = "auto";
        this.element.style.gridGap = "5px 5px";

        this.markerLayers = {};//1 layer per floor per map
        this.layerControls = {};//1 control per map
        this.drawControls = {}; // 1 control per map
        this.currentLayer = {}; //1 layer name per map
        this.layers = {}; // 1 layer per floor per map
        this.zoneLayers = {};
        this.zonesInitialisedForMap = {} // Property for each initialised map
        this.boundsMap = new Map(); //layer name to bounds
        this.oneTimeAlerts = new Map(); //Alerts that have been raised already
  
        
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

        this.createPolygonsForLayer = function (gridName, zoneDictionaryUuid, zoneDictionaryContent) {
            
            if (this.zonesInitialisedForMap[gridName]) {
                //Only initialise the zones once
                return;
            }

            this.zonesInitialisedForMap[gridName] = true;

            for (const campus in zoneDictionaryContent){
                for (const building in zoneDictionaryContent[campus]) {
                    for (const floor in zoneDictionaryContent[campus][building]) {
                        let height = 0;
                        let isOriginTopLeft = false;
                        if (this.config[campus] && this.config[campus][building] && this.config[campus][building][floor]) {
                            height = this.config[campus][building][floor].height;
                            if (this.config[campus][building][floor].isOriginTopLeft) {
                                isOriginTopLeft = this.config[campus][building][floor].isOriginTopLeft;
                            }
                        }
                        if (height == 0) {
                            alert ("Height not defined for " + campus + "." + building + "." + floor);
                        }

                        for (var zoneId = 0; zoneId < zoneDictionaryContent[campus][building][floor].length; zoneId++) {
                            const zone =  zoneDictionaryContent[campus][building][floor][zoneId];
                            if (zone.deleted) {
                                continue; //tombstone
                            }
                            if (!zone.points instanceof Array) {
                                continue;
                            }
                            const points = zone.points.map(point => [(isOriginTopLeft) ? (height - point.y) : point.y, point.x]);
                            const polygon = L.polygon(points);
                            const elementId = "floorMapTextField" + Math.floor((Math.random() * 100000) % 100000);

                            polygon.floorMapDetails = {};
                            polygon.floorMapDetails.renameTextFieldId = elementId;
                            polygon.floorMapDetails.mapId = gridName;
                            polygon.floorMapDetails.zoneId = zoneId;
                            polygon.floorMapDetails.campusId = campus;
                            polygon.floorMapDetails.buildingId = building;
                            polygon.floorMapDetails.floorId = floor;
                            polygon.floorMapDetails.zoneDictionaryUuid = zoneDictionaryUuid;

                            const layerId = this.createLayerKey(gridName, campus, building, floor);                            
                            if (!this.zoneLayers[layerId]) {
                                this.zoneLayers[layerId] = new L.FeatureGroup();
                            }
                            
                            if (this.isEditZoneModeEnabled) {
                                polygon.bindPopup(createPopupForFloormapZone);
                            } else {
                                polygon.bindPopup(getFloormapZonePopupHtml(zoneDictionaryUuid, campus, building, 
                                    floor, zoneId, this.isShowTagsEnabled));
                            }

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
                            allFloorMapMaps[gridName].addLayer(this.zoneLayers[layerId]);
                        }
                    
                    }
                }
                else
                {
                    const vis = this;
                    const resource = zoneDictionaryResourceURL (zoneDictionaryUuid);

                    setTimeout (function () {
                        if (!allFloorMapZones[zoneDictionaryUuid]) 
                        {
                            fetch(resource).then(response => response.json()).then(content =>
                                {   
                                    if (isZoneDictionaryResourceStatic(zoneDictionaryUuid)) {
                                        allFloorMapZones[zoneDictionaryUuid] = content;
                                    } else {
                                        allFloorMapZoneDictionaryObjects[zoneDictionaryUuid] = content;
                                        allFloorMapZones[zoneDictionaryUuid] = JSON.parse(content.data);
                                    }
                                    
                                    vis.createPolygonsForLayer(gridName, zoneDictionaryUuid, allFloorMapZones[zoneDictionaryUuid]);
                                
                                    if (vis.currentLayer[gridName] == layerLabel) {
                                        if (vis.zoneLayers[layerId]) {
                                            allFloorMapMaps[gridName].addLayer(vis.zoneLayers[layerId]);
                                        }
                                    }  
                                });
                        } else {
                            vis.createPolygonsForLayer(gridName, zoneDictionaryUuid, allFloorMapZones[zoneDictionaryUuid]);
                                
                            if (vis.currentLayer[gridName] == layerLabel) {
                                if (vis.zoneLayers[layerId]) {
                                    allFloorMapMaps[gridName].addLayer(vis.zoneLayers[layerId]);
                                }
                            }  
                        }
                        
                    },  Math.floor((Math.random() * 200) % 200));    
                }
                
            }
        }


        this.setGridCellLevelData = function (gridName, context, settings, data) {
            var dateFormat = settings.dateFormat;
            if (!dateFormat || dateFormat.length < 3) {
                dateFormat = undefined;
            }

            if (data && data !== null) {
                //Clear all marker layers associated with this map
                for (markerLayerId in this.markerLayers) {
                    if (markerLayerId.startsWith(gridName)){
                        this.markerLayers[markerLayerId].clearLayers();
                    }
                }

                const minEpochDate = data.min[floormapIndexEventTime];
                const maxEpochDate = data.max[floormapIndexEventTime];
                
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
                                const msg = 'Error: Configuration not found for building group "' + campusId + '"';
                                if (!this.oneTimeAlerts.get(msg)) {
                                    alert (msg);
                                    this.oneTimeAlerts.set(msg, true);
                                }

                                continue;
                            }

                            const buildingConfig = campusConfig[buildingId];
                            if (!buildingConfig) {
                                const msg = 'Error: Configuration not found for building "' + buildingId + '"'
                                    + " of building group " + '"' + campusId + '"';
                                if (!this.oneTimeAlerts.get(msg)) {
                                    alert (msg);
                                    this.oneTimeAlerts.set(msg, true);
                                }

                                continue;
                            }
                            const floorConfig = buildingConfig[floorId];
                            if (!floorConfig) {
                                const msg = 'Error: Configuration not found for floor "' + floorId +
                                    '" of building "' + buildingId + '"'
                                    + " of building group " + '"' + campusId + '"';
                                if (!this.oneTimeAlerts.get(msg)) {
                                    alert (msg);
                                    this.oneTimeAlerts.set(msg, true);
                                }

                                continue;
                            }

                            if (!floorConfig.width) {
                                const msg = 'Error: Property width not defined for floor "' + floorId +
                                    '" of building "' + buildingId + '"'
                                    + " of building group " + '"' + campusId + '"';
                                if (!this.oneTimeAlerts.get(msg)) {
                                    alert (msg);
                                    this.oneTimeAlerts.set(msg, true);
                                }

                                continue;
                            }

                            if (!floorConfig.height) {
                                const msg = 'Error: Property height not defined for floor "' + floorId +
                                    '" of building "' + buildingId + '"'
                                    + " of building group " + '"' + campusId + '"';
                                if (!this.oneTimeAlerts.get(msg)) {
                                    alert (msg);
                                    this.oneTimeAlerts.set(msg, true);
                                }

                                continue;
                            }

                            if (!floorConfig.image) {
                                const msg = 'Error: Property image not defined for floor "' + floorId +
                                    '" of building "' + buildingId + '"'
                                    + " of building group " + '"' + campusId + '"';
                                if (!this.oneTimeAlerts.get(msg)) {
                                    alert (msg);
                                    this.oneTimeAlerts.set(msg, true);
                                }

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

                                this.layers[layerId].addTo(allFloorMapMaps[gridName]);

                                this.layerControls[gridName] = L.control.layers(null, null, { sortLayers: true })
                                    .addTo(allFloorMapMaps[gridName]);

                                if (this.isEditZoneModeEnabled ) {
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
                                    button.classList.add("floormap-save-zone-button");
                                    button.addEventListener("click", ()=>saveZones());

                                    const zoneDictionaryUuid = this.config[campusId][buildingId][floorId].zoneDictionaryUuid;

                                    button.disabled = true;
                                    if (zoneDictionaryUuid && modifiedZoneUuidMap.get(zoneDictionaryUuid)) {
                                        button.disabled = false;
                                    }

                                    button.appendChild(icon);
                                }
                                

                                //Register callback for creation of draw layer (zone)
                                allFloorMapMaps[gridName].on('draw:created', function (e) {
                                    floormapZoneCreated(vis, gridName, e);});

                                    //Register callback for edit of draw layer (zone)
                                allFloorMapMaps[gridName].on('draw:edited', function (e) {
                                    floormapZoneEdited(vis, gridName, e);});

                                //Register callback for deletion of draw layer (zone)
                                allFloorMapMaps[gridName].on('draw:deleted', function (e) {
                                    floormapZoneDeleted(vis, gridName, e);});


                                //Callback for change of base layer (floor)
                                allFloorMapMaps[gridName].on('baselayerchange',  function (e) {
                                    floormapBaseLayerChanged(vis, gridName, e);});


                            }

                            //Create the zone layer (actually not needed if no zone resource defined)
                            if (!this.zoneLayers[layerId]) {
                                this.zoneLayers[layerId] = new L.FeatureGroup();                    
                            }

                            if (!this.markerLayers[layerId]) {
                                this.markerLayers[layerId] = L.layerGroup();                    
                            }
                            
                            //Load any zone data and create associated zone polygons
                            this.initialiseZonesForLayer(gridName, campusId, buildingId, floorId, layerId);

                            this.layerControls[gridName].addBaseLayer(this.layers[layerId], layerLabel);
                           
                        }

                        const dataKey = this.createDataKey(val);

                        var marker;
                        let height = 0;
                        let isOriginTopLeft = false;
                        if (this.config[campusId] && this.config[campusId][buildingId] && this.config[campusId][buildingId][floorId]) {
                            height = this.config[campusId][buildingId][floorId].height;
                            if (this.config[campusId][buildingId][floorId].isOriginTopLeft) {
                                isOriginTopLeft = this.config[campusId][buildingId][floorId].isOriginTopLeft;
                            }
                        }
                        if (height == 0) {
                            alert ("Height not defined for " + campusId + "." + buildingId + "." + floorId);
                        }
                        const x = parseFloat(val[floormapIndexX]);
                        const y = isOriginTopLeft ? height - parseFloat(val[floormapIndexY]) : parseFloat(val[floormapIndexY]);

                        var colour = undefined;
                        if (this.colourByTimestamp && val.length > floormapIndexEventTime && val[floormapIndexEventTime]) {
                            colour = colorByEpochMilli(val[floormapIndexEventTime], minEpochDate, maxEpochDate);
                        } else if (val.length > floormapIndexSeries && val[floormapIndexSeries]) {
                            colour = color(val[floormapIndexSeries]);
                        }

                        if (val.length > floormapIndexIcon && val[floormapIndexIcon]) {
                            const iconName = val[floormapIndexIcon];

                            if (!colour) {
                                colour = color(iconName);
                            }
                            var markerHtml = "<div style='background-color:" + colour + 
                                "' class='marker-pin'></div><i class='fa fa-" + iconName + " awesome'>";

                            var markerIcon = L.divIcon({
                                className: 'custom-div-icon',
                                html: markerHtml,
                                iconSize: [30, 42],
                                iconAnchor: [15, 42]
                            });

                            //Position is y,x deriving from latlon
                            marker = L.marker([y,x], { icon: markerIcon });

                        } else {
                            //Use small circles rather than icons
                            if (!colour) {
                                colour = "red";
                            }

                            //Position is y,x deriving from latlon
                            marker = L.circleMarker([y,x], {radius: 5, 
                                stroke: false,
                                fillOpacity: 1.0,
                                color: colour, fill: true});
                        }

                        //Add popup details
                        if ((val.length > floormapIndexName && val[floormapIndexName]) ||
                            (val.length > floormapIndexSeries && val[floormapIndexSeries]) ||
                            ((val.length > floormapIndexEventTime && val[floormapIndexEventTime])))  {
                            var popupHeading = "Information";
                            if (val.length > floormapIndexSeries && val[floormapIndexSeries]) {
                                popupHeading = val[floormapIndexSeries];
                            }

                            let popupDetail = "";
                            if (val.length > floormapIndexName && val[floormapIndexName]){
                                popupDetail += "<br/>" + val[floormapIndexName];
                            }

                            if (val.length > floormapIndexEventTime && val[floormapIndexEventTime]) {
                                popupDetail += "<br>" + "Event Time: " + commonFunctions.dateToStr(val[floormapIndexEventTime], dateFormat);
                            }                           

                            marker.bindPopup('<p><b>' + popupHeading + '</b>' + popupDetail + '</p>');
                        }

                        this.markerLayers[layerId].addLayer(marker);
                        
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

                    delete this.layerControls[elemToRemoveId];
                    delete this.currentLayer[elemToRemoveId];
                    delete this.zonesInitialisedForMap[elemToRemoveId];

                    //Remove all layers that are associated with this grid
                    for (const layer in this.layers) {
                        if (layer.startsWith(elemToRemoveId)) {
                            delete this.layers[layer];
                        }
                    }

                    for (const zoneLayer in this.zoneLayers) {
                        if (zoneLayer.startsWith(elemToRemoveId)) {
                            delete this.zoneLayers[zoneLayer];
                        }
                    }

                    for (const markerLayer in this.markerLayers) {
                        if (markerLayer.startsWith(elemToRemoveId)) {
                            delete this.markerLayers[markerLayer];
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

            if (settings && settings.isEditZoneModeEnabled && settings.isEditZoneModeEnabled == 'True') {
                this.isEditZoneModeEnabled = true;
            } else {
                this.isEditZoneModeEnabled = false;
            }

            if (settings && settings.isShowTagsEnabled && settings.isShowTagsEnabled == 'True') {
                this.isShowTagsEnabled = true;
            } else {
                this.isShowTagsEnabled = false;
            }

            if (settings && settings.isColourByEventTimeEnabled && settings.isColourByEventTimeEnabled == 'True') {
                this.colourByTimestamp = true;
            } else {
                this.colourByTimestamp = false;
            }

            if (!this.config) {
                if (typeof (localFloorMapConfig) !== "undefined"){
                    this.config = localFloorMapConfig;
                }
                else if (typeof (settings.config) == "string" && settings.config.length > 10) {
                    //Configuration JSON has been manually provided in config rather than js
                    this.config = JSON.parse(settings.config);                 
                } else {
                    console.error("Unable to process config of type " + typeof settings.config + " with no Local FloorMap config,");
                }
            }

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

                if (gridSeriesArray.length != this.gridCount){
                    this.gridCount = gridSeriesArray.length;
                    this.resize();
                }
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

