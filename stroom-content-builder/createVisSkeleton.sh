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

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
sourceDir="$scriptDir/../stroom-content-source"
visJsFilesDir="$scriptDir/../war/vis"

scriptFileSuffix=".Script.xml"
scriptJsFileSuffix=".js"
visualisationFileSuffix=".Visualisation.xml"
visualisationJsonFileSuffix=".Visualisation.settings.json"
scriptRefHeader="&lt;?xml version="1.1" encoding="UTF-8"?&gt;\n"
paramSurround="@@"
dependencyParamSeparator="#"
dependencyParamName="DEPENDENCY"
    

replaceXmlTagContent() {
    local filePath=$1
    local tagName=$2
    local newValue=$3

    #'&' in a sed replacement has special meaning in that it is replaced with the search
    #term so need to escape it to '\&'
    newValue=$(echo "$newValue" | sed "s#&#\\\&#g")

    sed -i "s!\(<${tagName}>\)[^<>]*\(<\/${tagName}>\)!\1$newValue\2!" ${filePath};
}

exitIfFileExists() {
    local suffix=$1
    local dir=$2

    local fileToTest="${dir}/${visName}${suffix}" 

    if [[ -f $fileToTest ]]; then
        echo "ERROR - file [$fileToTest] already exists, cannot create skeleton files, aborting"
        echo ""
        exit 1
    fi
}

isFileOkToCreate() {
    local suffix=$1
    local dir=$2

    local fileToTest="${dir}/${visName}${suffix}" 

    if [[ -f $fileToTest ]]; then
        echo "WARNING - File [$fileToTest] already exists, will not create skelton file"
        echo ""
        return 1;
    else
        return 0;
    fi
}

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~Start of script~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
if [[ $# -eq 1 ]]; then
    visName=$1
else
   echo "ERROR - invalid arguments."
   echo "  Usage: createVisSkeleton.sh visName"
   echo "  E.g.: createVisSkeleton.sh myNewVisName"
   exit 1;
fi

echo "rootPath: $rootPath"
echo "scriptDir: $scriptDir"
echo "sourceDir: $sourceDir"
echo "visJsFilesDir: $visJsFilesDir"

echo ""


if isFileOkToCreate $scriptFileSuffix $sourceDir; then
    newScriptFile=$sourceDir/$visName$scriptFileSuffix
    echo "Creating file       $newScriptFile"
    cp $scriptDir/template$scriptFileSuffix $newScriptFile
    replaceXmlTagContent $newScriptFile "name" $visName
fi

if isFileOkToCreate $scriptJsFileSuffix $visJsFilesDir; then
    newScriptJsFile=$visJsFilesDir/$visName$scriptJsFileSuffix
    echo "Creating empty file $newScriptJsFile"
    touch $newScriptJsFile
fi

if isFileOkToCreate $visualisationFileSuffix $sourceDir; then
    newVisualisationFile=$sourceDir/$visName$visualisationFileSuffix
    echo "Creating file       $newVisualisationFile"
    cp $scriptDir/template$visualisationFileSuffix $newVisualisationFile
    replaceXmlTagContent $newVisualisationFile "functionName"  "visualisations.$visName"
    replaceXmlTagContent $newVisualisationFile "name" $visName
    replaceXmlTagContent $newVisualisationFile "scriptRefXML" "${scriptRefHeader}${paramSurround}${dependencyParamName}${dependencyParamSeparator}${visName}${paramSurround}"
fi

if isFileOkToCreate $visualisationJsonFileSuffix $sourceDir; then
    newVisualisationJsonFile=$sourceDir/$visName$visualisationJsonFileSuffix
    echo "Creating empty file $newVisualisationJsonFile"
    touch $newVisualisationJsonFile
fi

echo ""
echo "All done"
