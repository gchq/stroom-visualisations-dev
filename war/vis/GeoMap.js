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

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    //Indicies of attributes within the data value array
    const geomapIndexName = 0;
    const geomapIndexLatitude = 1;
    const geomapIndexLongitude = 2;
    const geomapIndexIcon = 3;
    const geomapIndexSeries = 4;
    const geomapIndexGridSeries = 5;

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

        this.element = window.document.createElement("div");
        const mapNum =  Math.floor((Math.random() * 1000) % 1000);
        this.elementName = "leaflet-geomap-" + mapNum;
        this.element.setAttribute("id", this.elementName);
        this.element.style.display = "grid";
        this.element.style.gridTemplateColumns = "auto";
        this.element.style.gridGap = "5px 5px";

        this.markers = {};
        this.maps = {};
        
        //Load the library stylesheet
        addCss('leaflet/leaflet.css');
        
        //Load additional resources
        addCss('leaflet/leaflet-fontawesome-markers.css');
       
        this.start = function() {
            

           
        }

        this.createDataKey = function (val){
            //Just has locations as all markers are identical, so only one at a single location 
            //can be displayed at a time anyway
            return hashString(val[geomapIndexLatitude] + val[geomapIndexLongitude]);
        }

        this.setGridCellLevelData = function(map, gridName, context, settings, data) {
            if (data && data !== null) {
       
                const seriesArray = data.values;

                for (var i = 0; i < seriesArray.length; i++){
                    const series = seriesArray[i];
                    const vals = series.values;
                    for (const val of vals) {
                        const dataKey = this.createDataKey(val);

                        if (!this.markers[gridName]) {
                            this.markers[gridName] = new Map();
                        }

                        if (!this.markers[gridName].has (dataKey)) {
                          
                            var iconName = 'map-marker';


                            if (val.length > geomapIndexIcon && val[geomapIndexIcon]) {
                                iconName = val[geomapIndexIcon];
                            }

                            var colour = color (iconName);
                            if (val.length > geomapIndexSeries && val[geomapIndexSeries]) {
                                colour = color(val[geomapIndexSeries]);
                            }
    
                            var markerHtml = "<div style='background-color:" + colour + "' class='marker-pin'></div><i class='fa fa-"
                            + iconName + " awesome'>";
                                                          
                            var markerIcon = L.divIcon({
                                className: 'custom-div-icon',
                                html: markerHtml,
                                iconSize: [30, 42],
                                iconAnchor: [15, 42]
                                });
    
                            var marker = L.marker([parseFloat(val[geomapIndexLatitude]),parseFloat(val[geomapIndexLongitude])], {icon: markerIcon})
                                .addTo(map); 

                            if (val.length > geomapIndexName && val[geomapIndexName]){
                                var popupHeading = "Information";
                                if (val.length > geomapIndexSeries && val[geomapIndexSeries]) {
                                    popupHeading = val[geomapIndexSeries];
                                }
                                
                                const popupDetail = val[geomapIndexName];
                                
                                marker.bindPopup('<p><b>' + popupHeading + '</b><br />' + popupDetail + '</p>');
                            }
                            
                            this.markers[gridName].set(dataKey, marker);
                        } else {
                            //  console.log("Not updating marker " + val[1] + ":" + val[2]);
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
                    const elemToRemove = document.getElementById(elemToRemoveId);

                    //Remove the map associted with the grid
                    delete this.maps[elemToRemoveId];

                    //remove the markers associated with the grid
                    delete this.markers[elemToRemoveId];

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
            

                this.resize();
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

