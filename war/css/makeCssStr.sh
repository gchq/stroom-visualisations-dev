#!/bin/sh
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

if [[ $# -eq 2 ]]; then
    inFile="$1"
    outFile="$2"
else
    echo "ERROR - invalid arguments."
    echo "  Usage: makeCssStr inputCssFile outputJsFile"
    echo "  E.g.: makeCssStr vis.css visCssStr.js"
    exit 1;
fi

echo "Converting CSS file $inFile into JS file $outFile"

echo '' > $outFile
echo '(function() {' >> $outFile
echo 'var cssStr = "" +' >> $outFile
cat $inFile | sed 's|\\|\\\\|g' |sed 's|"|\\"|g' | sed 's|.*|"&" +|' >> $outFile

echo '"";' >> $outFile
echo 'd3.select(document).select("head").insert("style").text(cssStr);' >> $outFile
echo '})();' >> $outFile

