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

//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    //Indicies of attributes within the data value array
    const geomapIndexName = 0;
    const geomapIndexLatitude = 1;
    const geomapIndexLongitude = 2;
    const geomapIndexEventTime = 3;
    const geomapIndexIcon = 4;
    const geomapIndexSeries = 5;
    const geomapIndexGridSeries = 6;

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

    visualisations.GeoMap = function() {
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

        //Whether to colour the markers by event time.
        this.colourByTimestamp = true;

        this.gridCount = 0;
        this.element = window.document.createElement("div");
        const mapNum =  Math.floor((Math.random() * 1000) % 1000);
        this.elementName = "leaflet-geomap-" + mapNum;
        this.element.setAttribute("id", this.elementName);
        this.element.style.display = "grid";
        this.element.style.gridTemplateColumns = "auto";
        this.element.style.gridGap = "5px 5px";

        this.markerLayers = {};//1 layer per  map 
        this.maps = {};
               
        this.start = function() {
            

           
        }

        this.setGridCellLevelData = function(map, gridName, context, settings, data) {

            var dateFormat = settings.dateFormat;
            if (!dateFormat || dateFormat.length < 3) {
                dateFormat = undefined;
            }

            if (data && data !== null) {
       
                if (this.markerLayers[gridName]){
                    this.markerLayers[gridName].clearLayers();
                } else {
                    this.markerLayers[gridName] = L.layerGroup();
                    map.addLayer(this.markerLayers[gridName]);
                }
                
                const seriesArray = data.values;

                for (var i = 0; i < seriesArray.length; i++){
                    const series = seriesArray[i];
                    const vals = series.values;
                    for (const val of vals) {
                 
        
                       
                        var marker;
                        const lat = parseFloat(val[geomapIndexLatitude]);
                        const lon = parseFloat(val[geomapIndexLongitude]);
                        
                        var colour = undefined;
                        if (this.colourByTimestamp && val.length > geomapIndexEventTime && val[geomapIndexEventTime]) {
                            colour = colorByEpochMilli(val[geomapIndexEventTime],
                                data.min[geomapIndexEventTime], data.max[geomapIndexEventTime]);
                        } else if (val.length > geomapIndexSeries && val[geomapIndexSeries]) {
                            colour = color(val[geomapIndexSeries]);
                        }

                        if (val.length > geomapIndexIcon && val[geomapIndexIcon]) {
                            const iconName = val[geomapIndexIcon];

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

                            marker = L.marker([lat,lon], { icon: markerIcon });

                        } else {
                            //Use small circles rather than icons
                            if (!colour) {
                                colour = "red";
                            }

                            marker = L.circleMarker([lat,lon], {radius: 5, 
                                stroke: false,
                                fillOpacity: 1.0,
                                color: colour, fill: true});
                        }

                        //Add popup details
                        if ((val.length > geomapIndexName && val[geomapIndexName]) ||
                        (val.length > geomapIndexSeries && val[geomapIndexSeries]) ||
                        ((val.length > geomapIndexEventTime && val[geomapIndexEventTime])))  {
                        var popupHeading = "Information";
                        if (val.length > geomapIndexSeries && val[geomapIndexSeries]) {
                            popupHeading = val[geomapIndexSeries];
                        }

                        let popupDetail = "";
                        if (val.length > geomapIndexName && val[geomapIndexName]){
                            popupDetail += "<br/>" + val[geomapIndexName];
                        }

                        if (val.length > geomapIndexEventTime && val[geomapIndexEventTime]) {
                            popupDetail += "<br>" + "Event Time: " + commonFunctions.dateToStr(val[geomapIndexEventTime], dateFormat);
                         
                        }                           

                        marker.bindPopup('<p><b>' + popupHeading + '</b>' + popupDetail + '</p>');
                    }

                        this.markerLayers[gridName].addLayer(marker);
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
                    const elemToRemove = document.getElementById(elemToRemoveId);

                    //Remove the map associted with the grid
                    delete this.maps[elemToRemoveId];

                    //remove the markers associated with the grid
                    delete this.markerLayers[elemToRemoveId];

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
             if (settings && settings.isColourByEventTimeEnabled && settings.isColourByEventTimeEnabled == 'True') {
                this.colourByTimestamp = true;
            } else {
                this.colourByTimestamp = false;
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

                for (var i = 0; i < gridSeriesArray.length; i++){
                    const gridSeries = gridSeriesArray[i];

                    var gridMapElementName = this.elementName;
                    if (gridSeriesArray.length > 1 || gridSeriesArray[0].key){
                        //There is a grid key, so more than one element
                        gridMapElementName = this.elementName + "-" + hashString(gridSeries.key);
                    }
                    
                    if (this.maps[gridMapElementName] == undefined) {
    
                        const gridElement = window.document.createElement("div");
                        gridElement.setAttribute("id", gridMapElementName);
                        this.element.appendChild(gridElement);
                
                  
                        this.maps[gridMapElementName] = L.map(gridMapElementName)
                        .setView([parseFloat(settings.initialLatitude), parseFloat(settings.initialLongitude)], 
                            settings.initialZoomLevel);
                        L.tileLayer(settings.tileServerUrl, {
                            attribution: settings.tileServerAttribution
                          }).addTo(this.maps[gridMapElementName]);
                    }

                    this.setGridCellLevelData(this.maps[gridMapElementName], gridMapElementName, 
                        context, settings, gridSeries);
                }
            
                if (gridSeriesArray.length != this.gridCount){
                    this.gridCount = gridSeriesArray.length;
                    this.resize();
                }
            }
        };

        this.resize = function() {
            for (const mapName in this.maps){
                this.maps[mapName].invalidateSize();
            }
        };

        this.getLegendKeyField = function() {
            return 0;
        };
        
    };


}());

