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
(function() {
    this.changeVis = function() {
        show(getVisType());
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

    function show(type) {
        //var div = document.getElementById("visualisation");
        //div.innerHTML = "";

        vis = eval("new visualisations." + getRawType(type) + "()");

        var container = document.getElementById("container");

        var element = vis.element;

        element.style.width = "100%";
        element.style.height = "100%";

        container.innerHTML = "";
        container.appendChild(element);

        if (vis != null) {
            vis.resize();
            // 				d3.json("data.json", function(root) {
            // 					var dat = createData(0);
            // 					vis.setData(dat);
            // 				});
        }
    }

    var commonFunctions = visualisations.commonFunctions;
    var testData = new TestData();
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
        //remove any d3-tip divs left in the dom otherwise they build up on on each
        //call, cluttering up the dom
        d3.selectAll(".d3-tip")
            .remove();

        settings.stateCounting = "False";
        if (vis != null) {
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

            if (getVisType() == "SeriesSessionMap-Stateful")
            {
                settings.stateChange = "Not a real field";
            }

            if (getVisType() == "LineChart-Stateful")
            {
                settings.stateCounting = "True";
            }

            if (getVisType() == "Bubble-flat")
            {
                settings.flattenSeries = "True";
            } else {
                settings.flattenSeries = "False";
            }

            //For testing data where the grid series key is a dateTimeMs
            //settings.gridSeriesDateFormat = "GridFmt %A %d/%m/%y %H:%M";
            //settings.seriesDateFormat = "SeriesFmt %A %d/%m/%y %H:%M";
            //settings.nameDateFormat = "NameFmt %A %d/%m/%y %H:%M";

            // define the max value for the value dimension to give us different scales
            // of data
            randomMax = Math.pow(10, Math.floor(Math.random() * 8));

            testData = new TestData();

            dat = testData.create(getVisType(), pass++, useGridSeries, settings, randomMax);

            postProcessTestData(dat);

            sendDataToVis(dat);
        }
    }

    var sendDataToVis = function(data) {

        //make a copy so that if the vis changes the data we always have a copy of the original
        var datCopy = clone(data);

        //send the new copy
        vis.setData({}, settings, datCopy);
    };


    this.resize = function() {
        if (vis != null) {
            vis.resize();
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
