#!/bin/bash

# Function to generate a UUID
generate_uuid() {
  echo "$(uuidgen)"
}

# Ask the user for the name of the visualization
read -p "Enter the name of your visualization: " vis_name

# Function to ask for valid "yes" or "no" input for grid support
ask_for_grid_support() {
  while true; do
    read -p "(Recommended) Do you want grid support for this visualization? (yes/no): " grid_support
    case $grid_support in
        yes|no) break ;;
        *) echo "Please enter 'yes' or 'no'." ;;
    esac
  done
}

# Ask the user if they want grid support and ensure valid input
ask_for_grid_support

# Generate a UUID
uuid=$(generate_uuid)

# Define directory where files will be generated
VIS_DIR="../war/stroom_content/Visualisations/Version3"

# Check if the directory exists
if [ ! -d "$VIS_DIR" ]; then
  echo "Error: Directory $VIS_DIR does not exist."
  exit 1
fi

# Generate the Script file
SCRIPT_FILE="$VIS_DIR/${vis_name}.Script.${uuid}.js"

# Template for JavaScript file
js_template=$(cat <<'EOL'
if (!visualisations) {
    var visualisations = {};
}

//IIFE to provide shared scope for sharing state and constants between the controller 
//object and each grid cell object instance
(function(){
    var d3 = window.d3;
    var commonFunctions = visualisations.commonFunctions;
    var commonConstants = visualisations.commonConstants;
    var margins = commonConstants.margins();

    //Instantiated by Stroom
    visualisations.REPLACEWITHVISNAME = function(containerNode) {

        //Stroom creates a new iFrame for each visualisation so
        //create a div for the gridded visualisation to be built in
        if (containerNode) {
            var element = containerNode;
        } else {
            var element = window.document.createElement("div");
        }
        this.element = element;

        // Optional: Grid support line
        var grid = new visualisations.GenericGrid(this.element);

        // Optional: Grid support line
        var width = commonFunctions.gridAwareWidthFunc(true, containerNode, element, margins);
        // Optional: Grid support line
        var height = commonFunctions.gridAwareHeightFunc(true, containerNode, element, margins);

        var color = commonConstants.categoryGoogle();

        // Optional: Grid support block
        // Called by GenericGrid to create a new instance of the visualisation for each cell.
        this.getInstance = function(containerNode) {
            return new visualisations.Sunburst(containerNode);
        };

        //called by Stroom to pass snapshots of the data as it gathers the query results
        //context - an object containing any shared context between Stroom and the visualisation,
        //          e.g. a common colour scale could be used between multiple visualisations
        //settings - the object containing all the user configurable settings for the visualisation,
        //           e.g. showLabels, displayXAxis, etc.
        //d - the object tree containing all the data. Always contains all data currently available
        //    for a query.
        this.setData = function(context, settings, d) {
            if (context) {
                if (context.color) {
                    color = context.color;
                } else {
                    context.color = color;
                }
            }

            // Inspect settings here:

            // Optional: Grid support line
            //Get grid to construct the grid cells and for each one call back into a
            //new instance of this to build the visualisation in the cell
            //The last array arg allows you to synchronise the scales of fields
            grid.buildGrid(context, settings, d, this, commonConstants.transitionDuration, synchedFields);
        }

        //called by Stroom to instruct the visualisation to redraw itself in a resized container
        this.resize = function() {
            commonFunctions.resize(grid, update, element, margins, width, height);
        };

        // Optional: Grid support block
        // Called by GenericGrid to establish which position in the values array
        // (or null if it is the series key) is used for the legend.
        this.getLegendKeyField = function() {
            return null;
        };

        // Optional: Grid support block
        // called by GenercGrid to build/update a visualisation inside a grid cell
        // context - an object containing any shared context between Stroom and the visualisation,
        //          e.g. a common colour scale could be used between multiple visualisations.
        //          Also can be used by the grid to pass state down to each cell
        // settings - the object containing all the user configurable settings for the visualisation,
        //           e.g. showLabels, displayXAxis, etc.
        // data - the object tree containing all the data for that grid cell. Always contains all data 
        //       currently available for a query.
        this.setDataInsideGrid = function(context, settings, data) {

            // If the context already has a colour set then use it
            if (context) {
                if (context.color) {
                    colour = context.color;
                }
        // Optional: Grid support block
            }

        // Optional: Grid support block
            if (data) {
                // Use data here (typically call update)
            }
        // Optional: Grid support block
        }

        // Function to update the visualization
        // duration - time ms length of transitions
        // d - object tree of data
        // settings - settings object
        var update = function(duration, d, settings) {
            // Add vis specific data manipulation here
        }

        // Used to provide the visualisation's D3 colour scale to the grid
        this.getColourScale = function() {
            return color;
        };
    };
}());
EOL
)

# If grid support is not included, remove the corresponding blocks
if [ "$include_grid_support" = false ]; then
    # Remove the grid support blocks (without leaving any trace of the comment or code)
    js_template=$(echo "$js_template" | sed -e '/Optional: Grid support block/,/}/d')
    js_template=$(echo "$js_template" | sed -e '/Optional: Grid support line/,/;/d')
else
    # If grid support is included, remove the comment but keep the code
    js_template=$(echo "$js_template" | sed '/Optional: Grid support block/d')
    js_template=$(echo "$js_template" | sed '/Optional: Grid support line/d')
fi

# Replace REPLACEWITHVISNAME with the actual visualization name in the template
js_template=$(echo "$js_template" | sed "s/REPLACEWITHVISNAME/$vis_name/g")

# Write the final script to the .js file
echo "$js_template" > "$SCRIPT_FILE"

# Generate the Meta file
META_FILE="$VIS_DIR/${vis_name}.Script.${uuid}.meta"
cat > "$META_FILE" <<EOL
{
    "type": "Script",
    "uuid": "$uuid",
    "name": "$vis_name",
    "version": "UUID Version",
    "dependencies" : [ {
    "type" : "Script",
    "uuid" : "49a5f46c-f627-49ed-afb9-0066b99e235a",
    "name" : "Common"
  }, {
    "type" : "Script",
    "uuid" : "5d4252d6-6f13-4f24-9481-9e98e038747c",
    "name" : "GenericGrid"
  } ]
}
EOL

# Generate the Node file
NODE_FILE="$VIS_DIR/${vis_name}.Script.${uuid}.node"
cat > "$NODE_FILE" <<EOL
name=$vis_name
path=stroom-content/Visualisations/Version3
type=Script
uuid=$uuid
EOL

# Notify the user
echo "Visualization files for '$vis_name' have been created with UUID: $uuid"
echo "- Script file: $SCRIPT_FILE"
echo "- Meta file: $META_FILE"
echo "- Node file: $NODE_FILE"
