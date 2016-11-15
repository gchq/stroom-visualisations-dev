# Structure of a Visualisation Script

The basic skeleton of a visualisation JavaScript file looks like this:

```javascript
if (!visualisations) {
    var visualisations = {};
}

//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){
    var d3 = window.d3;
    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;

    //Instantiated by Stroom
    visualisations.MyVisualisation = function() {

        //Stroom creates a new iFrame for each visualisation so
        //create a div for the gridded visualisation to be built in
        this.element = window.document.createElement("div");

        var grid = new visualisations.GenericGrid(this.element);

        //Called by GenericGrid to create a new instance of the visualisation for each cell.
        this.getInstance = function(containerNode) {
            return new visualisations.MyVisualisation.Visualisation(containerNode);
        };

        //called by Stroom to pass snapshots of the data as it gathers the query results
        //context - an object containing any shared context between Stroom and the visualisation,
        //          e.g. a common colour scale could be used between multiple visualisations
        //settings - the object containing all the user configurable settings for the visualisation,
        //           e.g. showLabels, displayXAxis, etc.
        //d - the object tree containing all the data. Always contains all data currently available
        //    for a query.
        this.setData = function(context, settings, d) {

        };

        //called by Stroom to instruct the visualisation to redraw itself in a resized container
        this.resize = function() {
            //get GenericGrid to reszie the whole and to resize each grid cell visualisation
            grid.resize();
        };

        //Called by GenericGrid to establish which position in the values array
        //(or null if it is the series key) is used for the legend.
        this.getLegendKeyField = function() {
            
        };
    };

    //Object representing a visualisation inside a grid cell
    // containerNode - the SVG node in which the visualisation can build itself
    visualisations.MyVisualisation.Visualisation = function(containerNode) {

        //called by GenercGrid to build/update a visualisation inside a grid cell
        //context - an object containing any shared context between Stroom and the visualisation,
        //          e.g. a common colour scale could be used between multiple visualisations.
        //          Also can be used by the grid to pass state down to each cell
        //settings - the object containing all the user configurable settings for the visualisation,
        //           e.g. showLabels, displayXAxis, etc.
        //data - the object tree containing all the data for that grid cell. Always contains all data 
        //       currently available for a query.
        this.setDataInsideGrid = function(context, settings, data) {

        };

        //called by GenericGrid when a grid cell is removed.
        //Can be used to clear state for example
        this.teardown = function() {

        };

        //used to provide the visualisation's D3 colour scale to the grid
        //so that it can build the legend
        this.getColourScale = function() {

        };
    };

}());
```
