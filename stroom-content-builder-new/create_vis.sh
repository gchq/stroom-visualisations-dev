#!/bin/bash

generate_uuid() {
  "uuidgen"
}

read -rp "Enter the name of your visualisation: " vis_name

# Function to ask for valid "yes" or "no" input for grid support
ask_for_grid_support() {
  while true; do
    read -rp "(Recommended) Do you want grid support for this visualisation? (yes/no): " grid_support
    case $grid_support in
        yes|no) break ;;
        *) echo "Please enter 'yes' or 'no'." ;;
    esac
  done
}

ask_for_grid_support

uuid_js=$(generate_uuid)
uuid_json=$(generate_uuid)

VIS_DIR="../war/stroom_content/Visualisations/Version3"

if [ ! -d "$VIS_DIR" ]; then
  echo "Error: Directory $VIS_DIR does not exist."
  exit 1
fi

SCRIPT_FILE="$VIS_DIR/${vis_name}.Script.${uuid_js}.js"
JSON_FILE="$VIS_DIR/${vis_name}.Visualisation.${uuid_json}.json"

# Template for JavaScript file
js_template=""
while IFS= read -r line; do
  js_template+="$line"$'\n'
done < template.js

# If grid support is not included, remove the corresponding blocks
if [ "$grid_support" = "no" ]; then
    js_template=$(echo "$js_template" | sed -e '/Optional: Grid support block/,/}/d')
    js_template=$(echo "$js_template" | sed -e '/Optional: Grid support line/,/;/d')
else
    js_template=$(echo "$js_template" | sed '/Optional: Grid support block/d')
    js_template=$(echo "$js_template" | sed '/Optional: Grid support line/d')
fi

js_template=$(echo "$js_template" | sed "s/REPLACEWITHVISNAME/$vis_name/g")

echo "$js_template" > "$SCRIPT_FILE"

remove_grid_blocks() {
  input_file="template.Visualisation.json"
  inside_grid_block=false
  temp_output=""

  # Check if the grid is enabled (assumes grid_support is passed/set before calling this function)
  while IFS= read -r line; do
    if [[ "$line" =~ "GRIDSTART" ]]; then
      inside_grid_block=true
      if [ "$grid_support" = "yes" ]; then
        continue
      fi
    elif [[ "$line" =~ "GRIDEND" ]]; then
      if [ "$grid_support" = "yes" ]; then
        inside_grid_block=false
        continue
      fi
      inside_grid_block=false
    elif [ "$inside_grid_block" = false ]; then
      temp_output+="$line"$'\n'
    elif [ "$inside_grid_block" = true ] && [ "$grid_support" = "yes" ]; then
      temp_output+="$line"$'\n'
    fi
  done < "$input_file"

  echo "$temp_output"
}

json_template=$(remove_grid_blocks)

# Replace the placeholder in the JSON template
json_template=$(echo "$json_template" | sed "s/\${vis_name}/$vis_name/g")

# Write the final JSON output to the script file
echo "$json_template" > "$JSON_FILE"

# Define the file paths for meta and node templates
SCRIPT_META_TEMPLATE_FILE="template.meta"
SCRIPT_NODE_TEMPLATE_FILE="template.node"
JSON_META_TEMPLATE_FILE="template.Visualisation.meta"
JSON_NODE_TEMPLATE_FILE="template.Visualisation.node"

# Generate the Script Meta file
SCRIPT_META_FILE="$VIS_DIR/${vis_name}.Script.${uuid_js}.meta"
sed -e "s/\$uuid_js/$uuid_js/g" \
    -e "s/\$vis_name/$vis_name/g" \
    "$SCRIPT_META_TEMPLATE_FILE" > "$SCRIPT_META_FILE"

# Generate the Script Node file
SCRIPT_NODE_FILE="$VIS_DIR/${vis_name}.Script.${uuid_js}.node"
sed -e "s/\$uuid_js/$uuid_js/g" \
    -e "s/\$vis_name/$vis_name/g" \
    "$SCRIPT_NODE_TEMPLATE_FILE" > "$SCRIPT_NODE_FILE"

# Generate the JSON Meta file
JSON_META_FILE="$VIS_DIR/${vis_name}.Visualisation.${uuid_json}.meta"
sed -e "s/\$uuid_js/$uuid_js/g" \
    -e "s/\$uuid_json/$uuid_json/g" \
    -e "s/\$vis_name/$vis_name/g" \
    "$JSON_META_TEMPLATE_FILE" > "$JSON_META_FILE"

# Generate the JSON Node file
JSON_NODE_FILE="$VIS_DIR/${vis_name}.Visualisation.${uuid_json}.node"
sed -e "s/\$uuid_json/$uuid_json/g" \
    -e "s/\$vis_name/$vis_name/g" \
    "$JSON_NODE_TEMPLATE_FILE" > "$JSON_NODE_FILE"

# Notify the user
echo "Visualization files for '$vis_name' have been created with UUID: $uuid_js"
echo "- Script file: $SCRIPT_FILE"
echo "- Meta file: $SCRIPT_META_FILE"
echo "- Node file: $SCRIPT_NODE_FILE"
echo "- Json file: $JSON_FILE"
echo "- Meta file: $JSON_META_FILE"
echo "- Node file: $JSON_NODE_FILE"
