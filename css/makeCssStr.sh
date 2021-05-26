#!/bin/bash
#**********************************************************************
# Copyright 2016 Crown Copyright
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#**********************************************************************

# Script to turn the input file into a series of strings concatenated together
# This is for use to be able to set the css using javascript in ace

# shellcheck disable=SC2034
if [ "${MONOCHROME}" = true ]; then
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  BLUE2=''
  NC='' # No Colour
else 
  RED='\033[1;31m'
  GREEN='\033[1;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[1;34m'
  BLUE2='\033[1;34m'
  NC='\033[0m' # No Colour
fi

if [[ $# -eq 2 ]]; then
  inFile="$1"
  outFile="$2"
else
  echo "ERROR - invalid arguments."
  echo "  Usage: makeCssStr inputCssFile outputJsFile"
  echo "  E.g.: makeCssStr vis.css visCssStr.js"
  exit 1;
fi

echo -e "${GREEN}Converting CSS file ${BLUE}$inFile${GREEN} into JS file ${BLUE}$outFile${NC}"

#echo '' > "${outFile}"
#echo '(function() {' >> "${outFile}"
#echo 'var cssStr = "" +' >> "${outFile}"
#cat "${inFile}" | sed 's|\\|\\\\|g' | sed 's|"|\\"|g' | sed 's|.*|"&" +|' >> "${outFile}"

#echo '"";' >> "${outFile}"
#echo 'd3.select(document).select("head").insert("style").text(cssStr);' >> "${outFile}"
#echo '})();' >> "${outFile}"

{
  echo '(function() {'
  echo 'var cssStr = "" +'
  # Use pipe as sed delimiter
  sed 's|\\|\\\\|g; s|"|\\"|g; s|.*|"&" +|' < "${inFile}"

  echo '"";'
  echo 'd3.select(document).select("head").insert("style").text(cssStr);'
  echo '})();'
} > "${outFile}"
