#!/bin/bash

if (( $# != 3 ))
then
    echo "Usage: createFloorPlanSettings.sh <configuration json> <input settings json> <output settings json>"
    echo "Example: ./createFloorPlanSettings.sh ../data/example/example.json ../data/FloorMap.default.settings.json ../../../../stroom-content-source/FloorMap.Visualisation.settings.json"
    exit 1
fi

function encodeImage () {
    IMAGE="$1"
    IMAGE_TYPE=$(echo "$IMAGE" | rev | cut -d . -f 1 | rev)
    echo -n "data:image/${IMAGE_TYPE};base64, "
    base64 -w 0 "$IMAGE" | sed 's/\n//'
}

function processConfig () {
    CONFIG_FILE="$1"

    CONFIG_DIR=$(dirname "$CONFIG_FILE")

    while IFS= read -r line  || [ -n "$line" ]; do
        if [[ "$line" =~ .+ ]]
        then    
            if [[ "$line" =~ .*image.?:.* ]] 
            then 
                echo -n '\"image\": \"'
                image=$(echo -n $line | cut -d ':' -f 2 | sed 's/ //g' | sed 's/"//g' | sed 's/,//g')
                encodeImage "$CONFIG_DIR"/"$image"
                echo -n '\"'
                [[ "$line" =~ .*, ]] && echo -n ','
            else
                echo -n $line | sed 's/"/\\"/g'
            fi
        fi
    done < "$CONFIG_FILE"
}

##Start
CONFIG_FILE="$1"
SETTINGS_FILE="$2"
OUTPUT_FILE="$3"


while IFS= read line  || [ -n "$line" ]; do
  if [[ "$line" =~ .+ ]]
  then
    if [[ "$line" =~ .*defaultValue.?:.?\"\{\}\" ]]
    then
      echo -n '                "defaultValue": "'
      processConfig "$CONFIG_FILE"
      echo -n '"'
      [[ "$line" =~ .*, ]] && echo -n ','
      echo
    else
      echo $line
    fi
  fi
done < "$SETTINGS_FILE"
