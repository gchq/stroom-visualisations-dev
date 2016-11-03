# Structure of a Visualisation Script
The basic skeleton of a visualisation JavaScript file looks like this:

```javascript
if (!visualisations) {
    var visualisations = {};
}
(function(){
    visualisations.MyVisualisation = function() {

        this.element = window.document.createElement("div");

        this.getInstance = function(containerNode) {
            return new visualisations.TrafficLights.Visualisation(containerNode);
        };

        //called by Stroom to pass snapshots of the data
        this.setData = function(context, settings, d) {

        };

        //called by Stroom to instruct the visualisation to redraw itself in a resized container
        this.resize = function() {
            
        };

        //used to tell the grid what data to use for the legend
        this.getLegendKeyField = function() {
            
        };
    };

    visualisations.MyVisualisation.Visualisation = function(containerNode) {

        //called by GenercGrid to build/update a visualisation inside a grid cell
        this.setDataInsideGrid = function(context, settings, data) {

        };

        //called by GenericGrid when a grid cell is removed
        this.teardown = function() {

        };

        //used to provide the visualisation's colour scheme to the grid
        this.getColourScale = function(){

        };
    };

}());
```
