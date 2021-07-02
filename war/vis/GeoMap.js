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


    var hashString = function(input) {
        var hash = 0, i, chr;
        if (input.length === 0) return hash;
        for (i = 0; i < input.length; i++) {
          chr   = input.charCodeAt(i);
          hash  = ((hash << 5) - hash) + chr;
          hash |= 0; // Convert to 32bit integer
        }
        return hash;
      };
    var markerColours = ['red', 'darkred', 'orange', 'green', 'darkgreen', 'blue', 'purple', 'darkpurple', 'cadetblue'];
        
    var markerColour = function (seriesNum) {
        return markerColours[seriesNum % markerColours.length];
    }


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
        this.element.setAttribute("id", "leaflet-geomap");
        
        //Load the library stylesheet
        addCss('leaflet/leaflet.css');
        
        //Load additional resources
        addCss('leaflet/extras/awesome-markers/leaflet.awesome-markers.css');

        addJs('leaflet/extras/awesome-markers/leaflet.awesome-markers.js');
       
        this.start = function() {
            

           
        }

        this.setGridCellLevelData = function(context, settings, data) {
            if (data && data !== null) {
                const seriesArray = data.values;

                for (var i = 0; i < seriesArray.length; i++){
                    const series = seriesArray[i];
                    const colour = markerColour (i);
                    const vals = series.values;
                    for (const val of vals) {
                        var iconName = 'map-marker';
                        if (val.length > 3 && val[3]) {
                            iconName = val[3];
                        }

                        var markerIcon = L.AwesomeMarkers.icon({
                            icon: iconName,
                            prefix: 'fa',
                            markerColor: colour
                        });

                    
                        var marker = L.marker([parseFloat(val[1]),parseFloat(val[2])], {icon: markerIcon}).addTo(this.mymap);      
                    }
                }
            
            }
        };
     
        //Public method for setting the data on the visualisation(s) as a whole
        //This is the entry point from Stroom
        this.setData = function(context, settings, data) {
            if (this.mymap == undefined) {
                this.mymap = L.map("leaflet-geomap")
                .setView([parseFloat(settings.initialLatitude), parseFloat(settings.initialLongitude)], 
                    settings.initialZoomLevel);
                L.tileLayer(settings.tileServerUrl, {
                    attribution: settings.tileServerAttribution
                  }).addTo(this.mymap);
            }

            if (data && data !== null) {
                const gridSeriesArray = data.values;

                for (const gridSeries of gridSeriesArray){
                    this.setGridCellLevelData(context, settings, gridSeries);
                }
            
            }
        };

        this.resize = function() {
            
        };

        this.getLegendKeyField = function() {
            return 0;
        };
        
    };


}());

