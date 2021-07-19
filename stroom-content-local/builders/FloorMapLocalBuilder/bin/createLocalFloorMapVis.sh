#!/bin/bash

if (( $# != 4 ))
then
    echo "Run this script from the directory in which it resides."
    echo "Usage: createLocalFloorMapVis.sh <configuration json> <output vis name> <script uuid> <vis uuid>"
    echo "Example: ./createLocalFloorMapVis.sh ../data/example/example.json \"My Local FloorMap\" \`uuidgen\` \`uuidgen\`"
    exit 1
fi

function encodeImage () {
    IMAGE="$1"
    SCRIPT_JS="$2"
    IMAGE_TYPE=$(echo "$IMAGE" | rev | cut -d . -f 1 | rev)
    echo "  \"data:image/${IMAGE_TYPE};base64, \" +" >> "$SCRIPT_JS"
    base64 -w 70 "$IMAGE" | \
    while IFS= read line ;
    do
      echo "  \"$line\" +" >> "$SCRIPT_JS"
    done
    echo "  \"\"; " >> "$SCRIPT_JS"
}

function processTemplate () {
    TEMPLATE="templates/$1"
    OUTPUT_FILE="$2"
    NAME="$3"
    SCRIPT_UUID="$4"
    VISUALISATION_UUID="$5"
    RANDOM_UUID="$6"

    cat "$TEMPLATE" | \
      sed "s/%%NAME%%/$NAME/g" | \
      sed "s/%%SCRIPT_UUID%%/$SCRIPT_UUID/g" | \
      sed "s/%%VISUALISATION_UUID%%/$VISUALISATION_U         UID/g" | \
      sed "s/%%RANDOM_UUID%%/$RANDOM_UUID/g" \
      > "$OUTPUT_FILE"
}

#start
CONFIG_FILE="$1"
OUTPUT_VIS="$2"
OUTPUT_VIS_NO_SPACES=$(echo -n "$OUTPUT_VIS" | tr ' ' _)
SCRIPT_UUID="$3"
VIS_UUID="$4"
LOCALFLOORMAPCONFIG_LITERAL="localFloorMapConfig"

CONFIG_DIR=$(dirname "$CONFIG_FILE")

VIS_DIRECTORY="Visualisations/Local"

#Normally FloorMapLocalBuilder/output/...
OUTPUT_DIR="$CONFIG_DIR/../../output/$OUTPUT_VIS/$VIS_DIRECTORY"
mkdir -p "$OUTPUT_DIR"

SCRIPT_NAME="$OUTPUT_VIS_NO_SPACES.Script.$SCRIPT_UUID"
VIS_NAME="$OUTPUT_VIS_NO_SPACES.Visualisation.$VIS_UUID"

##There are 6 files to create with similar names
##Create the Script.js
SCRIPT_JS="$OUTPUT_DIR"/"$SCRIPT_NAME".js
echo -n "const $LOCALFLOORMAPCONFIG_LITERAL = " > "$SCRIPT_JS"
cat "$CONFIG_FILE" | jq | grep -v '\"image\":' |grep -v '^}$' >> "$SCRIPT_JS"
echo "};" >> "$SCRIPT_JS"

cat "$CONFIG_FILE" | \
  jq '[leaf_paths as $path | {"key": $path | join("/"), "value": getpath($path)}] | from_entries' | \
  grep '.image"' | \
  while IFS=: read line  || [ -n "$line" ]; 
  do
    # echo LINE: $line
    IFS=':' read -r datapath image_untidy <<< "$line"
    image=`echo "$image_untidy" | tr -d '\" ,'`
    # echo "PAth: $datapath"
    # echo "IMAGE: $image"
    IFS='/' read -r campus_untidy building floor discard <<< "$datapath"
    campus=`echo "$campus_untidy" | tr -d '\" '`
    # echo "Cam: $campus"
    # echo "Bui: $building"
    # echo "Floor: $floor"
    echo "if (!$LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"])" >> "$SCRIPT_JS"
    echo "  $LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"] = {};" >> "$SCRIPT_JS"
    echo "if (!$LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"][\"$building\"])" >> "$SCRIPT_JS"
    echo "  $LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"][\"$building\"] = {};" >> "$SCRIPT_JS"
    echo "if (!$LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"][\"$building\"][\"$floor\"])" >> "$SCRIPT_JS"
    echo "  $LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"][\"$building\"][\"$floor\"] = {};" >> "$SCRIPT_JS"
    echo "$LOCALFLOORMAPCONFIG_LITERAL[\"$campus\"][\"$building\"][\"$floor\"].image =" >> "$SCRIPT_JS"
    if [[ "$image" =~ ^/.* ]] 
    then
      encodeImage "$image" "$SCRIPT_JS" #Absolute path to image
    else
      encodeImage "$CONFIG_DIR"/"$image" "$SCRIPT_JS" #Relative path
    fi
  done

##Script.meta
processTemplate "Script.meta" "$OUTPUT_DIR"/"$OUTPUT_VIS_NO_SPACES.Script.$SCRIPT_UUID.meta"\
  "$OUTPUT_VIS" "$SCRIPT_UUID" "$VIS_UUID" `uuidgen`

##Script.node
processTemplate "Script.node" "$OUTPUT_DIR"/"$OUTPUT_VIS_NO_SPACES.Script.$SCRIPT_UUID.node"\
  "$OUTPUT_VIS" "$SCRIPT_UUID" "$VIS_UUID" `uuidgen`

##Visualisation.json
processTemplate "Visualisation.json" "$OUTPUT_DIR"/"$OUTPUT_VIS_NO_SPACES.Visualisation.$VISUALISATION_UUID.json"\
  "$OUTPUT_VIS" "$SCRIPT_UUID" "$VIS_UUID" `uuidgen`

##Visualisation.meta
processTemplate "Visualisation.meta" "$OUTPUT_DIR"/"$OUTPUT_VIS_NO_SPACES.Visualisation.$VISUALISATION_UUID.meta"\
  "$OUTPUT_VIS" "$SCRIPT_UUID" "$VIS_UUID" `uuidgen`

##Visualisation.node
processTemplate "Visualisation.node" "$OUTPUT_DIR"/"$OUTPUT_VIS_NO_SPACES.Visualisation.$VISUALISATION_UUID.node"\
  "$OUTPUT_VIS" "$SCRIPT_UUID" "$VIS_UUID" `uuidgen`

