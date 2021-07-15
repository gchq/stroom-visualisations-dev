
if (!visualisations) {
    var visualisations = {};
}


//IIFE to prvide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){

    visualisations.LocalFloorMap = function() {

        this.setData = function(context, settings, data) {
            if (!this.floormap) {
                this.floormap = new visualisations.FloorMap();
                this.floormap.config = "myconfig";
            }
            return this.floormap.setData(context, settings, data);
        }
        
        this.resize = function() {
            return this.floormap.resize();
        };

        this.getLegendKeyField = function() {
            return 0;
        };
    };
}());
