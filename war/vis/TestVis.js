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
// TODO understand the frame and callback IDs
(function() {
    var visName;
    this.changeVis = function() {
        manageIframe();
        // let visType = getVisType();
        visName = getVisName();
        // let rawType = getRawType(visType);
        fetchAndInjectScripts(visName);
    }
    
    function getVisName() {
        if (visType.value.includes("-")) {
            let index = visType.value.indexOf("-")
            let visName = visType.value.substring(0, index);
            return visName;
        } else {
            let visName = visType.value;
            return visName;
        }
    }

    function getVisType() {
        var visType = document.getElementById("visType");
        var index = visType.selectedIndex;
        var value = visType.options[index].value; 
        return value;
    }

    function getBucketSize() {
        var bucketSize = document.getElementById("bucketSize");
        var index = bucketSize.selectedIndex;
        var value = bucketSize.options[index].value; 
        return value;
    }

    function getRawType(type){
        return type.split("-")[0];
    }

    function manageIframe() {
        var iframe = document.getElementById('myIframe');
    
        if (iframe) {
                iframe.parentNode.removeChild(iframe);
        }
    
        var newIframe = document.createElement('iframe');
        newIframe.id = 'myIframe';
        // Append a random query string to force the browser to fetch a new document
        newIframe.src = 'vis.html?' + new Date().getTime();
        document.getElementById('iframe').appendChild(newIframe);
        loadedScripts.clear();
    }    

    // Set to store loaded script names
    let loadedScripts = new Set();
    let scriptQueue = [];
    let pendingFetches = 0;

    function fetchAndInjectScripts(xmlName) {
        // Check if script is already loaded
        if (loadedScripts.has(xmlName)) {
            checkAndAssembleScripts();
            return;
        }
    
        pendingFetches++;
        fetchAndParseXML(xmlName)
            .then(({ xmlDoc, url }) => {
                loadDependencies(xmlDoc, url, xmlName)
                    .then(scripts => {
                        scriptQueue = scriptQueue.concat(scripts);
                        // Mark the script as loaded after dependencies are processed
                        loadedScripts.add(xmlName);
                        pendingFetches--;
                        checkAndAssembleScripts();
                    })
                    .catch(error => {
                        console.error("Failed to load dependencies: ", error);
                        pendingFetches--;
                        checkAndAssembleScripts();
                    });
            })
            .catch(error => {
                console.error("Failed to fetch and parse XML: ", error);
                pendingFetches--;
                checkAndAssembleScripts();
            });
    }

    // this isn't the best
    // as leafletDraw folder has LeafletDrawCSS.script.resource.js etc
    function dependencyUrls(xmlName){
        const baseName = xmlName.split('.')[0];
        const urls = [];
        urls[0] = "../stroom-content/Visualisations/Version3/" + baseName + ".Script.xml";
        urls[1] = "../stroom-content/Visualisations/Version3/Dependencies/" + baseName + "/" + baseName + ".Script.xml";
        urls[2] = "../stroom-content/Visualisations/Version3/Dependencies/Leaflet/" + baseName + ".Script.xml";
        urls[3] = "../stroom-content/Visualisations/Version3/Dependencies/LeafletDraw/" + baseName + ".Script.xml";
        return urls;
    }

    function fetchAndParseXML(xmlName) {
        return new Promise((resolve, reject) => {
            const urls = dependencyUrls(xmlName);
            const fetchPromises = urls.map(url => {
                return fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            throw console.error("Fetch failed for " + url + ". Status: " + response.status);
                        }
                        return response.text().then(xmlText => ({ xmlText, url }));
                    })
                    .then(({ xmlText, url }) => {
                        const parser = new DOMParser();
                        const xmlDoc = parser.parseFromString(xmlText, "application/xml");
                        return { xmlDoc, url };
                    });
            });
    
            Promise.any(fetchPromises)
                .then(({ xmlDoc, url }) => {
                    resolve({ xmlDoc, url });
                })
                .catch(error => {
                    reject(console.error);
                });
        });
    }

    function loadDependencies(dependenciesXML, baseUrl, xmlName) {
        return new Promise((resolve, reject) => {
            const scripts = [];
            let scriptUrl = baseUrl.replace(/\.xml$/, ".resource.js");
            scriptUrl = scriptUrl.replace(xmlName, xmlName);
            scripts.push({ name: xmlName, url: scriptUrl });

            const scriptElement = dependenciesXML.querySelector('script');
            if (!scriptElement) {
                reject(console.error("No script element found"));
                return;
            }
    
            const dependenciesString = scriptElement.querySelector('dependenciesXML').textContent;
            if (!dependenciesString) {
                reject(console.error("No dependenciesXML element found"));
                return;
            }
    
            const dependenciesParser = new DOMParser();
            const dependenciesDoc = dependenciesParser.parseFromString(dependenciesString, 'application/xml');
            const docElements = dependenciesDoc.getElementsByTagName('doc');
    
            for (let i = 0; i < docElements.length; i++) {
                let type = docElements[i].getElementsByTagName('type')[0].textContent;
                let name = docElements[i].getElementsByTagName('name')[0].textContent;
    
                if (type === 'Script') {
                    fetchAndInjectScripts(name); // Recursive call
                }
            }
    
            if (scripts.length > 0) {
                resolve(scripts);
            } else {
                reject(console.error("No script dependencies found"));
            }
        });
    }

    function checkAndAssembleScripts() {
        if (pendingFetches === 0) {
            // Deduplicate scripts
            const uniqueScripts = [];
            const scriptNames = new Set();
    
            scriptQueue.forEach(script => {
                if (!scriptNames.has(script.name)) {
                    uniqueScripts.push(script);
                    scriptNames.add(script.name);
                }
            });
    
            // Move D3 script to the front if it exists
            const d3Index = uniqueScripts.findIndex(script => script.name === 'D3');
            if (d3Index !== -1) {
                const [d3Script] = uniqueScripts.splice(d3Index, 1);
                uniqueScripts.unshift(d3Script);
            }

            // Move the vis script to the end if it exists
            const visIndex = uniqueScripts.findIndex(script => script.name === visName);
            if (visIndex !== -1) {
                const [visScript] = uniqueScripts.splice(visIndex, 1);
                uniqueScripts.push(visScript);
            }

            console.log(uniqueScripts);
            assembleAndPostJSON(uniqueScripts);
            loadedScripts = new Set();
            scriptQueue = [];
            pendingFetches = 0;
        }
    }

    function assembleAndPostJSON(scripts) {
        const iframe = document.getElementById('myIframe');
        const iframeWindow = iframe.contentWindow;
    
        let params = scripts.map(script => ({
            name: script.name,
            url: script.url
        }));
    
        let json = {
            data: {
                functionName: "visualisationManager.injectScripts",
                params: [params]
            }
        };
    
        let jsonString = JSON.stringify(json);
        if (iframeWindow) {
            iframeWindow.postMessage(jsonString, '*');
        }
    }

    // .setVisType instansiates the specific vis
    // add selected theme
    function setVisType(){
        vis = visName;
        const iframe = document.getElementById('myIframe');
        const iframeWindow = iframe.contentWindow;
        let json = {
            data: {
               functionName: "visualisationManager.setVisType",
               params: [
                "visualisations." + visName,
                "vis stroom-theme-dark"
               ]
            }
        };
        let jsonString = JSON.stringify(json);
        if (iframeWindow) {
            iframeWindow.postMessage(jsonString, '*');
        }
    }

    var commonFunctions = visualisations.commonFunctions;
    // var testData = new TestData();
    var vis = null;
    var pass = 0;
    var settings = {};
    var dat = null;
    var useGridSeries = false;
    var dataChangeCounter = 1;
    var randomMax;

    function getDataChangeCounter(){
        return dataChangeCounter++;
    }

    this.update = function() {
        setVisType();
        //remove any d3-tip divs left in the dom otherwise they build up on on each
        //call, cluttering up the dom
        // d3.selectAll(".d3-tip")
        //     .remove();

        settings.stateCounting = "False";
        if (document.getElementById("showLabels").checked) {
            settings.showLabels = "true";
        } else {
            settings.showLabels = "false";
        }

        if (document.getElementById("useGridSeries").checked) {
            settings.gridSeries = "xxx";
            useGridSeries = true;
        } else {
            settings.gridSeries = null;
            useGridSeries = false;
        }

        if (document.getElementById("synchXAxis").checked) {
            settings.synchXAxis = "true";
        } else {
            settings.synchXAxis = null;
        }

        if (document.getElementById("synchYAxis").checked) {
            settings.synchYAxis = "true";
        } else {
            settings.synchYAxis = null;
        }

        if (document.getElementById("displayXAxis").checked) {
            settings.displayXAxis = "true";
        } else {
            settings.displayXAxis = null;
        }

        if (document.getElementById("displayYAxis").checked) {
            settings.displayYAxis = "true";
        } else {
            settings.displayYAxis = null;
        }
        if (document.getElementById("synchSeries").checked) {
            settings.synchSeries = "true";
        } else {
            settings.synchSeries = null;
        }

        if (document.getElementById("synchNames").checked) {
            settings.synchNames = "true";
        } else {
            settings.synchNames = null;
        }

        if (document.getElementById("thresholdMs").value) {
            settings.thresholdMs = document.getElementById("thresholdMs").value;
        } 

        if (document.getElementById("bucketSize").value && getVisType() == "BarChart-bucket") {
            settings.bucketSize = getBucketSize();
        } 

        settings.stateChange = null;
        const visType = getVisType();

        if (visType == "SeriesSessionMap-Stateful")
        {
            settings.stateChange = "Not a real field";
        }

        if (visType == "LineChart-Stateful")
        {
            settings.stateCounting = "True";
        }

        if (visType == "Bubble-flat")
        {
            settings.flattenSeries = "True";
        } else {
            settings.flattenSeries = "False";
        }

        if (visType == "GeoMap")
        {
            settings.initialLatitude = "51.5";
            settings.initialLongitude = "0.0";
            settings.initialZoomLevel = 13;
            settings.tileServerUrl = "https://{s}.tile.osm.org/{z}/{x}/{y}.png";
            settings.tileServerAttribution = "&copy; <a href='http://osm.org/copyright'>OpenStreetMap</a> contributors";

            if ((Math.floor(Math.random()  * 1000) % 2) == 0) {
                settings.isColourByEventTimeEnabled = "False";
            } else {
                settings.isColourByEventTimeEnabled = "True";
            }
        }

        if (visType == 'FloorMap')
        {
            settings.config = '';

            settings.isEditZoneModeEnabled = 'True';

            if ((Math.floor(Math.random()  * 1000) % 2) == 0) {
                settings.originLocation = "Top Left";
            } else {
                settings.originLocation = "Bottom Left";
            }

            settings.config = {
                "The Campus": {
                    "Headquarters": {
                        "Ground Floor": {
                            "image": "testfloorplans/building1-floor0.png",
                            "width": 100,
                            "height": 60
                        },
                        "First Floor": {
                            "image": "testfloorplans/building1-floor1.png",
                            "width": 100,
                            "height": 60
                        },
                        "Second Floor": {
                            "image": "testfloorplans/building1-floor2.png",
                            "width": 100,
                            "height": 60
                        },
                        "Third Floor": {
                            "image": "testfloorplans/building1-floor3.png",
                            "width": 100,
                            "height": 60
                        }
                    },
                    "Downtown": {
                        "Basement": {
                            "image": "testfloorplans/building2-floorb.png",
                            "width": 40,
                            "height": 60,
                            "zoneDictionaryUuid": "staticUrl:testfloorplans/testzones.json",
                            "isOriginTopLeft": true
                        },
                        "North Tower": {
                            "image": "testfloorplans/building2-floorn.png",
                            "width": 40,
                            "height": 60,
                            "zoneDictionaryUuid": "staticUrl:testfloorplans/testzones.json"
                        },
                        "South Tower": {
                            "image": "testfloorplans/building2-floors.png",
                            "width": 40,
                            "height": 60,
                            "zoneDictionaryUuid": "staticUrl:testfloorplans/testzones.json"
                        }
                    }
                }
            };
            settings.config = JSON.stringify(settings.config);
        }


        //For testing data where the grid series key is a dateTimeMs
        //settings.gridSeriesDateFormat = "GridFmt %A %d/%m/%y %H:%M";
        //settings.seriesDateFormat = "SeriesFmt %A %d/%m/%y %H:%M";
        //settings.nameDateFormat = "NameFmt %A %d/%m/%y %H:%M";

        // define the max value for the value dimension to give us different scales
        // of data
        randomMax = Math.pow(10, Math.floor(Math.random() * 8));

        if ((Math.floor(Math.random()  * 1000) % 3) == 0) {
            settings.isEditZoneModeEnabled = "False";
            settings.dateFormat = "";
        } else {
            settings.dateFormat = "%H:%M:%S on %A";
        }

        if ((Math.floor(Math.random()  * 1000) % 2) == 0) {
            settings.isColourByEventTimeEnabled = "False";
        } else {
            settings.isColourByEventTimeEnabled = "True";
        }

        if ((Math.floor(Math.random()  * 1000) % 2) == 0) {
            settings.isShowTagsEnabled = "True";
        } else {
            settings.isShowTagsEnabled = "False";
        }

        testData = new TestData();

        dat = testData.create(getVisType(), pass++, useGridSeries, settings, randomMax);

        postProcessTestData(dat);

        sendDataToVis(dat);
    }

    var sendDataToVis = function(data) {

        //make a copy so that if the vis changes the data we always have a copy of the original
        var datCopy = clone(data);

        //send the new copy
        const iframe = document.getElementById('myIframe');
        const iframeWindow = iframe.contentWindow;
        let json = {
            data: {
               functionName: "visualisationManager.setData",
               params: [
                {},
                settings,
                datCopy
               ]
            }
        };
        let jsonString = JSON.stringify(json);
        if (iframeWindow) {
            iframeWindow.postMessage(jsonString, '*');
        }
    };

    this.resize = function() {
        if (vis != null) {
            const iframe = document.getElementById('myIframe');
            const iframeWindow = iframe.contentWindow;
            let json = {
                data: {
                functionName: "visualisationManager.resize",
                }
            };
            let jsonString = JSON.stringify(json);
            if (iframeWindow) {
                iframeWindow.postMessage(jsonString, '*');
            }
        }
    };

    this.autoResize = function() {
        if (document.getElementById("autoResize").checked) {
            resize();
        }
    };

    this.autoUpdate = function() {
        if (document.getElementById("autoUpdate").checked) {
            update();
        }
        setTimeout(autoUpdate, 3000);
    };

    function addGenericSeries(originalDataObj, dataGenFunc, seriesName) {
        var existingSeriesCount = originalDataObj.values.length;
        var insertBeforePos = Math.round(Math.random() * existingSeriesCount);

        //while (true) {
        var newSeries = dataGenFunc();
        newSeries.key = seriesName;

        if (originalDataObj.values.map(function(d) { return d.key }).indexOf(newSeries.key) === -1) {
            //the key of the new series doesn't already exist so fine to add it

            console.log("Adding new series before position " + insertBeforePos + " with key " + newSeries.key);

            var newValuesArr = [];
            for (i=0; i < existingSeriesCount; i++){
                if (i === insertBeforePos){
                    //Add our new grid series 
                    newValuesArr.push(newSeries);
                }
                newValuesArr.push(originalDataObj.values[i]);
            }
            if (insertBeforePos === existingSeriesCount){
                newValuesArr.push(newSeries);
            }

            originalDataObj.values = newValuesArr;
            //break;
        } else {
            console.log("Series key [" + newSeries.key + "] already exists so can't add the series");
        }
        //}
        //recompute the aggregates as we have changed the data
        commonFunctions.dataAggregator()
            .setRecursive(true)
            .setUseVisibleValues(false)
            .aggregate(originalDataObj);

        return insertBeforePos;
    };

    this.addGridSeries = function() {
        if (useGridSeries) {
            var dataGenFunc = function() {
                var newDat = testData.create(getVisType(), pass++, useGridSeries, settings, randomMax);
                return newDat.values[0];
            };

            var seriesName = "New grid series " + getDataChangeCounter();
            var pos = addGenericSeries(dat, dataGenFunc, seriesName);

            //dat.values[pos].key = "New grid series " + getDataChangeCounter();

            sendDataToVis(dat);
        }
    };

    this.addSeries = function() {
        var gridSeriesPosToAddTo;
        if (useGridSeries) {
            //series is inside a grid series
            var existingGridCount = dat.values.length;
            gridSeriesPosToAddTo = Math.round(Math.random() * (existingGridCount - 1));
        } else {
            gridSeriesPosToAddTo = 0;
        }

        if (dat.values[0].values[0].hasOwnProperty("key")){
            var dataGenFunc = function() {
                var newDat = testData.create(getVisType(), pass++, useGridSeries, settings, randomMax);
                //data is random so just return the first series of the first grid series
                return newDat.values[0].values[0];
            };

            var seriesName = "New series " + getDataChangeCounter();
            var pos = addGenericSeries(dat.values[gridSeriesPosToAddTo], dataGenFunc, seriesName);

            //var newKey = "New series " + getDataChangeCounter();
            //dat.values[gridSeriesPosToAddTo].values[pos].key = newKey;

            console.log("Adding series " + seriesName + " in grid cell " + dat.values[gridSeriesPosToAddTo].key);
            sendDataToVis(dat);
        } else {
            console.log("No series for this visualisation so not doing anything");
        }
    };

    function removeGenericSeries(originalDataObj){
        var existingSeriesCount = originalDataObj.values.length;
        if (existingSeriesCount > 1) {
            var removePos = Math.round(Math.random() * (existingSeriesCount - 1));
            var newValuesArr = [];

            console.log("Removing series at position " + removePos + " with key " + originalDataObj.values[removePos].key);

            for (i=0; i < existingSeriesCount; i++){
                if (i !== removePos){
                    newValuesArr.push(originalDataObj.values[i]);
                }
            }
            originalDataObj.values = newValuesArr;

            //recompute the aggregates as we have changed the data
            commonFunctions.dataAggregator()
                .setRecursive(true)
                .setUseVisibleValues(false)
                .aggregate(originalDataObj);

        } else {
            console.log("Only one series so cannot remove any");
        }
    };

    this.removeGridSeries = function() {
        if (useGridSeries) {
            removeGenericSeries(dat);
            sendDataToVis(dat);
        }
    };

    this.removeSeries = function() {
        if (dat.values[0].values[0].hasOwnProperty("key")) {
            var gridSeriesPosToRemoveFrom;
            if (useGridSeries) {
                //series is inside a grid series
                var existingGridCount = dat.values.length;
                gridSeriesPosToRemoveFrom = Math.round(Math.random() * existingGridCount - 1);

            } else {
                gridSeriesPosToRemoveFrom = 0;
            }

            removeGenericSeries(dat.values[gridSeriesPosToRemoveFrom]);

            sendDataToVis(dat);
        } else {
            console.log("No series for this visualisation so not doing anything");
        }
    };

    this.alterValues = function() {
        var valueChanger = function(originalDataObj) {
            var idxToAlter = Math.round(Math.random() * ( originalDataObj.values.length - 1 ));
            if (originalDataObj.values[0].hasOwnProperty("key")){
                //this is a series level so pick one of them to work on
                valueChanger(originalDataObj.values[idxToAlter]);

            } else {
                //this is where the values are, so assume that the last array position is the one to change
                //var valueArrIdx = originalDataObj.values[0].length - 1;
                var valueArrIdx = testData.visTestDataSettingsMap.getValueFieldIndex(getVisType());
                if (valueArrIdx === -1) {
                    //no index specified so assume the last one in the array
                    valueArrIdx = originalDataObj.values[0].length - 1;
                }

                //Change a value by up to 100%, up or down
                var amountToChangeBy = Math.random() * 2;
                originalDataObj.values[idxToAlter][valueArrIdx] = originalDataObj.values[idxToAlter][valueArrIdx] * amountToChangeBy;
            }
        };

        valueChanger(dat);
        commonFunctions.dataAggregator()
            .setRecursive(true)
            .setUseVisibleValues(false)
            .aggregate(dat);

        sendDataToVis(dat);
    };

    this.saveSvg = function(){
        var html = d3.select(".vis-canvas")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node()
            .outerHTML;

        //TODO this works but it looks like it is not picking up all the css styles
        //so that needs to be sorted out

        var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(html)));
        var img = '<img src="' + imgsrc + '">';
        d3.select("#container").remove();
        d3.select("#svgdataurl").html(img);

        var canvas = document.querySelector("canvas");
        var context = canvas.getContext("2d");
        context.beginPath();
        context.rect(0,0,1000,1000);
        context.fillStyle = "white";
        context.fill();
        var image = new Image;
        image.src = imgsrc;
        image.onload = function() {
            context.drawImage(image, 0 , 0);
            var canvasdata = canvas.toDataURL("image/png");
            //var pngimg = '<img src="' + canvasdata + '">';
            //d3.select 
            var a = document.createElement("a");
            a.download = "vis.png";
            a.href = canvasdata;
            a.click();
        };
    };

    function postProcessTestData(data) {

        //function to set settings.[Green|Amber|Red][Hi|Lo] according to the data
        //if isReversed, Reg->Green else Green->Red
        var setRAGSettigns = function(data, isReversed, addOutliers) {
            //Need to define the thresholds based on the data we have generated
            var valueGetterFunc = function(d) {
                    return d.values[0][0];
            };

            //top and bottom 5% are treated as outliers
            //the rest of the range is split evenly from green-red or vice versa
            var minVal = d3.min(data.values, valueGetterFunc);
            var maxVal = d3.max(data.values, valueGetterFunc);
            var count = (useGridSeries ? 1 : data.values.length);
            if (count === 1) {
                minVal = minVal - (Math.random() * 0.5 * minVal);
                maxVal = maxVal + (Math.random() * 0.5 * maxVal);
            }
            var range = maxVal - minVal;
            if (commonFunctions.isTrue(addOutliers)) {
                var workingRange = range * 0.9;
                var outlierBand = (range - workingRange) / 2;
            } else {
                var workingRange = range;
                var outlierBand = 0;
            }

            var posOrNeg = function() {
                return (Math.random() > 0.5 ? 1 : -1);
            };

            var avgBandSize = workingRange / 3;
            var greenBandSize = avgBandSize + (posOrNeg() * avgBandSize * 0.5);
            var amberBandSize = avgBandSize + (posOrNeg() * avgBandSize * 0.5);
            var redBandSize = workingRange - greenBandSize - amberBandSize;

            if (!isReversed) {
                settings.GreenLo = minVal + outlierBand;
                settings.GreenHi = settings.GreenLo + greenBandSize;
                settings.AmberLo = settings.GreenHi;
                settings.AmberHi = settings.AmberLo + amberBandSize;
                settings.RedLo = settings.AmberHi;
                settings.RedHi = settings.RedLo + redBandSize;
            } else {
                settings.RedLo = minVal + outlierBand;
                settings.RedHi = settings.RedLo + greenBandSize;
                settings.AmberLo = settings.RedHi;
                settings.AmberHi = settings.AmberLo + amberBandSize;
                settings.GreenLo = settings.AmberHi;
                settings.GreenHi = settings.GreenLo + redBandSize;
            }

            console.log("Green: " + commonFunctions.autoFormat(settings.GreenLo) + " - " + commonFunctions.autoFormat(settings.GreenHi));
            console.log("Amber: " + commonFunctions.autoFormat(settings.AmberLo)  + " - " + commonFunctions.autoFormat(settings.AmberHi));
            console.log("Red:   " + commonFunctions.autoFormat(settings.RedLo) + " - " + commonFunctions.autoFormat(settings.RedHi));
            console.log("values:   " + data.values.map(function(d) { return commonFunctions.autoFormat(d.values[0][0]); }));
        };

        if (getVisType() === "RAGStatus-GreenRed" || getVisType() === "TrafficLights-GreenRed") {
            setRAGSettigns(data, false, true);
        } else if (getVisType() === "RAGStatus-RedGreen" || getVisType() === "TrafficLights-RedGreen") {
            setRAGSettigns(data, true, true);
        } else if (getVisType() === "Gauge-GreenRed") {
            setRAGSettigns(data, false, true);
        } else if (getVisType() === "Gauge-RedGreen") {
            setRAGSettigns(data, true, true);
        }

    };

    function clone(obj) {
        var copy;

        if (null == obj || "object" != typeof obj) {
            return obj;
        }

        if (obj instanceof Date) {
            copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        if (obj instanceof Array) {
            copy = [];
            for (var i = 0, len = obj.length; i < len; i++) {
                copy[i] = clone(obj[i]);
            }
            return copy;
        }

        if (obj instanceof Object) {
            copy = {};
            for (var attr in obj) {
                if (obj.hasOwnProperty(attr)) {
                    copy[attr] = clone(obj[attr]);
                }
            }
            return copy;
        }

        throw new Error("Unable to copy obj! Its type isn't supported.");
    };

    setTimeout(autoUpdate, 3000);

})();
