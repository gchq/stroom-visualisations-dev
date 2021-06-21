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

/*
 * Produces a grid of 'stroom' logos using each of the colours in the
 * categoryGoogle colour range.
 */

if (!visualisations) {
    var visualisations = {};
}
//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){

    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    visualisations.GeoMap = function() {

        this.element = window.document.createElement("div");
        this.element.setAttribute("id", "leaflet-map");
        //this.element.setAttribute("style", "height: 100px");

       
        this.start = function() {
            

           
        }

     
        //Public method for setting the data on the visualisation(s) as a whole
        //This is the entry point from Stroom
        this.setData = function(context, settings, data) {

            if (this.mymap == undefined) {
                this.mymap = L.map("leaflet-map").setView([51.505, -0.09], 13);
                L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  }).addTo(this.mymap);
            }

            if (data && data !==null) {
                //#########################################################
                //Perform any visualisation specific data manipulation here
                //#########################################################

            }
        };

        this.resize = function() {
            
        };

        this.getLegendKeyField = function() {
            return 0;
        };

    };


}());

