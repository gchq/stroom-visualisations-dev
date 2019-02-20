#!/usr/bin/env bash

# Requires bash >=4 & uuidgen

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

set -e 
#Enable the use of ** in globs
shopt -s globstar

scriptDir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
sourceDir="$scriptDir/../stroom-content-source"
targetDir="$scriptDir/../stroom-content-target"
artifactDir="$scriptDir/../stroom-content-artifacts"
visJsFilesDir="$scriptDir/../war/vis"
cssFilesDir="$scriptDir/../war/css"
dependenciesSubDir="Dependencies"

scriptType="Script"
visualisationType="Visualisation"
folderType="Folder"
rootPathType="RootPath"
scriptFileSuffix=".$scriptType.xml"
envFilePrefix="uuids."

#Replacement param stuff
paramSurround="@@"
dependencyParamSeparator="#"
dependencyParamName="DEPENDENCY"
uuidParamName="UUID"
scriptNameParamName="SCRIPT_NAME"
versionParamName="VERSION"
gitCommitParamName="GIT_COMMIT"
gitCommitTimeParamName="GIT_COMMIT_TIME"
defaultVersion="SNAPSHOT"

dependencyBlock="&lt;doc&gt;\n" 
dependencyBlock+="&lt;type&gt;Script&lt;/type&gt;\n" 
dependencyBlock+="&lt;uuid&gt;@@UUID@@&lt;/uuid&gt;\n" 
dependencyBlock+="&lt;name&gt;@@SCRIPT_NAME@@&lt;/name&gt;\n" 
dependencyBlock+="&lt;/doc&gt;"


#Associative array to hold the mapping from script/vis name to uuid value
#namespaced by type, 
#e.g. Visualisation.BarChart=0d3bece7-d04c-4a7f-a5ee-b3d9141b6210
declare -A nameToUuidMap

#An array to hold the various environment names
declare -a environments=("production" "staging")
#declare -a environments=("production")
#declare -a environments=("staging")


#dependency in a Visualisation
#&lt;doc&gt;
#&lt;type&gt;Script&lt;/type&gt;
#&lt;uuid&gt;9007c2c9-aae1-480c-9663-dbeda2b16676&lt;/uuid&gt;
#&lt;name&gt;Bar Chart&lt;/name&gt;
#&lt;/doc&gt;

setup_echo_colours() {

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
}

test_for_bash_version_4() {
  local -r bash_version="$(bash -c 'echo $BASH_VERSION')" 
  local -r bash_major_version="${bash_version:0:1}"
  if [[ "${bash_major_version}" -lt 4 ]]; then
    echo -e "${RED}Error${NC} - Bash version 4 or higher required"
    exit 1
  fi
}

splitPath() {
  #strip leading/trailing "/"
  local thePath
  # shellcheck disable=SC2001
  thePath="$(echo "$1" | sed 's#^/\(.*\)/$#\1#')"
  local IFS="/"; 

  expandedPath=($thePath); 
}

getGitComitHashForFile() {
  local filePath=$1

  commitHash="$(git log -1 --format="%H" "${filePath}")"
}

getDateForGitCommit() {
  local commitHash=$1

  commitDate="$(git show -s --format=%ci "${commitHash}")"
}

getUUID() {
  local key=$1
  local value=${nameToUuidMap[$key]}
  if [[ -z "$value" ]]; then
    echo "${RED}Error${NC} - unable to resolve a UUID for key $key"
    exit 1
  fi
  #uuid="$(uuidgen)"
  #echo "$key=$value"
  uuid=$value
}

getRootPath() {
  local key=$1
  local value=${nameToUuidMap[$key]}
  if [[ -z "$value" ]]; then
    echo "${RED}Error${NC} - unable to resolve a value for key $key"
    exit 1
  fi
  rootPath=$value
}

replaceXmlTagContent() {
  local filePath=$1
  local tagName=$2
  local newValue=$3

    #'&' in a sed replacement has special meaning in that it is replaced with the search
    #term so need to escape it to '\&'
    # shellcheck disable=SC2001
    newValue="$(echo "$newValue" | sed "s#&#\\\&#g")"

    sed -i "s/\(<${tagName}>\)[^<>]*\(<\/${tagName}>\)/\1$newValue\2/" "${filePath}"
  }

replaceInFile() {
  local filePath=$1
  local searchValue=$2
  local replacementValue=$3

  #echo "filePath: $filePath"
  #echo "searchValue: $searchValue"
  #echo "replacementValue: $replacementValue"

  #'&' in a sed replacement has special meaning in that it is replaced with the search
  #term so need to escape it to '\&'
  # shellcheck disable=SC2001
  replacementValue=$(echo "$replacementValue" | sed "s#&#\\\&#g")

  sed -i "s!${searchValue}!${replacementValue}!" "${filePath}"
}

replaceParamInFile() {
  local filePath=$1
  local paramName=$2
  local replacementValue=$3

  #echo "filePath: $filePath"
  #echo "paramName: $paramName"
  #echo "replacementValue: $replacementValue"

  local searchValue="${paramSurround}${paramName}${paramSurround}"

  replaceInFile "${filePath}" "${searchValue}" "${replacementValue}"
  #sed -i "s##${replacementValue}#g" ${filePath};
}

replaceDependencyParams() {
  local filePath=$1
  #basically match on '@@DEPENDENCY#.......@@'
  local searchTerm="${paramSurround}${dependencyParamName}${dependencyParamSeparator}[^@]*${paramSurround}"

  #loop over each dependency tag in the file and replace it with a resolved dependency block
  while read -r grepMatch; do
    #extract the bit between the '#' and the end '@@', i.e. the script name
    local scriptName
    scriptName="$(echo "$grepMatch" | grep -P -o "[^@#]*(?=@@)")"
    echo -e "${GREEN}Replacing dependency tag ${BLUE}${grepMatch}${NC}"
    #echo "env: $env"

    #Assemble the key to look up the uuid e.g. 'production.Script.Common'
    getUUID "$env.$scriptType.$scriptName"
    #echo "uuid; $uuid"

    #echo "dependencyBlock: $dependencyBlock"
    local uuidParam="${paramSurround}${uuidParamName}${paramSurround}"
    #echo "uuidParam: $uuidParam"
    local scriptNameParam="${paramSurround}${scriptNameParamName}${paramSurround}"
    #echo "scriptNameParam: $scriptNameParam"

    #Replace the two params in the dependency block with the uuid and script name
    local editedDependencyBlock
    editedDependencyBlock="$(echo "$dependencyBlock" | \
      sed "s/$uuidParam/$uuid/" | \
      sed "s/$scriptNameParam/$scriptName/" \
    )"

    #echo "editedDependencyBlock: $editedDependencyBlock"

    replaceInFile "${filePath}" "${grepMatch}" "${editedDependencyBlock}"
  done < <(grep -o "${searchTerm}" "${filePath}") 

}

buildFolder() {
  local folderName=$1
  local parentPath=$2
  local folderPath="${parentPath}/${folderName}"
  local osPath="${targetDir}/${parentPath}/${folderName}"

  echo -e "${GREEN}Making path ${BLUE}${osPath}${NC}"
  mkdir -p "${osPath}"

  local newFile="${osPath}.Folder.xml"
  echo -e "${GREEN}Copying template file ${BLUE}${scriptDir}/template.Folder.xml${GREEN} to ${BLUE}${newFile}${NC}"
  cp "${scriptDir}/template.Folder.xml" "${newFile}"

  replaceXmlTagContent "${newFile}" "name" "${folderName}"

  getUUID "$env.$folderType.$folderPath/"
  replaceParamInFile "${newFile}" "${uuidParamName}" "${uuid}"

  echo ""
}

exitIfFileNotExists() {
  local fileName=$1

  if ! [[ -f $fileName ]]; then
    echo -e "${RED}Error${NC} - File ${BLUE}${fileName}${NC} doesn't exist";
    exit 1;
  fi
}

#~~~~~~~~~~~~~~~~~~~~~~~~~~~~Start of script~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
#if [[ $# -eq 1 ]]; then
#rootPath=$1
#if ! [[ $rootPath =~ ^/([0-9a-zA-Z_-()]+/)+$ ]]; then 
#echo "ERROR - Root path is invalid, it must conform to the pattern ^/([0-9a-zA-Z_-()]+/)+$";
#exit 1;
#fi
#else
#echo "ERROR - invalid arguments."
#echo "  Usage: buildImportBundle stroomPathForVisualisations"
#echo "  E.g.: buildImportBundle /Visualisations/Version3/"
#exit 1;
#fi

#while true; do
#echo ""
#read -e -p "Please enter the root path for the visualisations content: " -i "/Visualisations/Version3/" rootPath
#if [[ $rootPath =~ ^/([0-9a-zA-Z_-()]+/)+$ ]]; then
#break;
#else
#echo ""
#echo "Root path is invalid, it must conform to the pattern ^/([0-9a-zA-Z_-()]+/)+$";
#fi
#done

# Script uses some bash4 features so check it is present
test_for_bash_version_4

setup_echo_colours

# If an arg is supplied use that as the version else use the default
version=${1:-${defaultVersion}}

echo -e "${YELLOW}version: ${BLUE}${version}${NC}"
echo -e "${YELLOW}scriptDir: ${BLUE}${scriptDir}${NC}"
echo -e "${YELLOW}sourceDir: ${BLUE}${sourceDir}${NC}"
echo -e "${YELLOW}targetDir: ${BLUE}${targetDir}${NC}"
echo -e "${YELLOW}visJsFilesDir: ${BLUE}${visJsFilesDir}${NC}"

echo ""
mkdir -p "${targetDir}"
mkdir -p "${artifactDir}"

echo -e "${GREEN}Clearing out dir ${BLUE}${artifactDir}/*${NC}"
# :? makes command fail if artifactDir is not set to prevent rm from
# wiping the filesystem
rm -rf "${artifactDir:?}"/*

for env in "${environments[@]}"; do

  #The file containing all the uuids for an environment
  envFile=$scriptDir/$envFilePrefix$env

  exitIfFileNotExists "${envFile}"

  #loop through all the lines in the env specific file adding all the
  #key value pairs into the nameToUuidMap, prefixed with the environment name
  while read -r line || [[ -n "$line" ]]; do
    if [[ ! -z $line ]] && [[ ${line:0:1} != "#" ]]; then
      ##read the line into an array, splitting on '='
      IFS='=' read -r -a arr <<< "$line"

          #Add the key/value into the associative array
          key="$env.${arr[0]}"
          uuid=${arr[1]}
          nameToUuidMap[$key]=$uuid
    fi
  done < "${envFile}"
done

#echo "Contents of map:"
#for key in ${!nameToUuidMap[@]}; do
#getUUID $key
#echo "$key - ${nameToUuidMap[$key]} - $uuid"
#done

#build an import bundle zip for each environment
for env in "${environments[@]}"; do
  echo -e ""
  echo -e "${GREEN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"
  echo -e "${GREEN}Processing environment: ${BLUE}$env${NC}"
  echo -e "${GREEN}~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~${NC}"

  echo -e "${GREEN}Clearing out dir ${BLUE}${targetDir}/*${NC}"
  # :? makes command fail if artifactDir is not set to prevent rm from
  # wiping the filesystem
  rm -rf "${targetDir:?}"/*

  getRootPath "${env}.${rootPathType}"
  echo -e "${YELLOW}rootPath: ${BLUE}${rootPath}${NC}"
  splitPath "${rootPath}"

  rootPathWithNoTrailingSlash="$(echo "${rootPath}" | sed 's/\/$//')"
  currentParentPath=""
  #loop through each dir in the root path to create the structure
  for pathPart in "${expandedPath[@]}"; do 
    echo -e "${GREEN}Building folder entity for ${BLUE}${pathPart}${NC}"; 
    buildFolder "${pathPart}" "${currentParentPath}"
    currentParentPath="${currentParentPath}/${pathPart}"
  done;

  osPath=${targetDir}/${currentParentPath}/

  echo -e "${GREEN}Copying the static content${NC}"
  cp --dereference -r "${sourceDir}"/* "${osPath}"

  #loop through all the *.Script.xml files in the source and do the following:
  #  generate a uuid for the script and store it in the map
  #  copy the corresponding js file
  #  do param substitution on the *.script.xml and *.Visualisation.xml files
  for file in "${sourceDir}"/*"${scriptFileSuffix}"; do
    echo -e "${GREEN}Processing script file: ${BLUE}${file}${NC}"

    baseScriptName=$(basename "${file}" | sed "s/${scriptFileSuffix}$//")
    echo -e "${YELLOW}baseScriptName: ${BLUE}${baseScriptName}${NC}"

    if [[ "${baseScriptName}" = "CSS" ]]; then
      #special case for CSS as its js file has to be generated from a raw css file
      #as Stroom cannot load a CSS directly

          #Generate the css javascript file and copy it into the target dir
          #do it in a sub shell to avoid any name clashes
          inputCssFile=${cssFilesDir}/vis.css
          sourceScriptJsFile=${cssFilesDir}/visCssStr.js
          echo -e "${YELLOW}inputCssFile: ${BLUE}${inputCssFile}${NC}"
          echo -e "${YELLOW}sourceScriptJsFile: ${BLUE}${sourceScriptJsFile}${NC}"
          #sourceScriptJsFile="${cssFilesDir}/$outputCssJsFile" 
          . "${cssFilesDir}/makeCssStr.sh" "$inputCssFile" "$sourceScriptJsFile"
          getGitComitHashForFile "${inputCssFile}"
        else
          sourceScriptJsFile="${visJsFilesDir}/${baseScriptName}.js" 
          getGitComitHashForFile "${sourceScriptJsFile}"
    fi

    destScriptJsFile="${osPath}/${baseScriptName}.Script.resource.js"
    echo -e "${GREEN}Copying script .js file ${BLUE}${sourceScriptJsFile}${GREEN} to ${BLUE}${destScriptJsFile}${NC}"
    cp "${sourceScriptJsFile}" "${destScriptJsFile}"

    destScriptXmlFile="${osPath}/${baseScriptName}.Script.xml"
    replaceParamInFile "${destScriptXmlFile}" "${versionParamName}" "${version}"
    replaceParamInFile "${destScriptXmlFile}" "${gitCommitParamName}" "${commitHash}"
    getDateForGitCommit "${commitHash}"
    replaceParamInFile "${destScriptXmlFile}" ${gitCommitTimeParamName} "${commitDate}"
    #replace the parent path in the file with the root path, stripping any trailing /
    replaceParamInFile "${destScriptXmlFile}" "PARENT_PATH" "${rootPathWithNoTrailingSlash}"
    replaceDependencyParams "${destScriptXmlFile}"

    getUUID "$env.$scriptType.$baseScriptName"
    replaceParamInFile "${destScriptXmlFile}" "${uuidParamName}" "${uuid}"

    if [[ -f ${sourceDir}/${baseScriptName}.Visualisation.xml ]]; then
      #script has a visualisation so process that file
      sourceVisJsonFile="${sourceDir}/${baseScriptName}.Visualisation.settings.json"
      getGitComitHashForFile "${sourceVisJsonFile}"
      destVisXmlFile="${osPath}/${baseScriptName}.Visualisation.xml"
      replaceParamInFile "${destVisXmlFile}" "${versionParamName}" "${version}"
      replaceParamInFile "${destVisXmlFile}" "${gitCommitParamName}" "${commitHash}"
      getDateForGitCommit "${commitHash}"
      replaceParamInFile "${destVisXmlFile}" "${gitCommitTimeParamName}" "${commitDate}"
      replaceDependencyParams "${destVisXmlFile}"

      getUUID "$env.$visualisationType.$baseScriptName"
      replaceParamInFile "${destVisXmlFile}" "${uuidParamName}" "${uuid}"
    fi
    echo ""
  done

  echo -e ""
  echo -e "${GREEN}Processing dependency script files${NC}"
  echo -e "${GREEN}----------------------------------${NC}"

  #Loop through all the dependency script files in the target dir to
  #replace and PARENT_PATH params
  for file in ${osPath}/${dependenciesSubDir}/**/*${scriptFileSuffix}; do
    echo -e "${GREEN}Processing script file: ${BLUE}${file}${NC}"
    baseScriptName=$(basename "${file}" | sed "s/${scriptFileSuffix}$//")

    replaceDependencyParams "${file}"

    getUUID "$env.$scriptType.$baseScriptName"
    replaceParamInFile "${file}" "${uuidParamName}" "${uuid}"
  done

  echo -e ""
  echo -e "${GREEN}Processing dependency folder files${NC}"
  echo -e "${GREEN}----------------------------------${NC}"

  echo -e "${YELLOW}osPath: ${BLUE}${osPath}${NC}"

  for file in ${osPath}/**/*${folderType}.xml; do
    echo -e "${GREEN}Processing Folder file: ${BLUE}${file}${NC}"

    #subtract the targetDir string from the file string to get the path as it will be in stroom
    #see bash parameter substitution
    #e.g. /a/b/c/d/myDir.Folder.xml becomes /c/d/myDir.Folder.xml
    stroomPath=${file#$targetDir}
    #remove the filename from the end by deleting up to an including the last dot, then add a slash
    #e.g. /c/d/myDir.Folder.xml becomes /c/d/myDir/
    stroomPath="${stroomPath%%.*}/"
    #replace any instances of // with / in case we have doubled up on path separators at any point
    stroomPath=${stroomPath//\/\//\/}
    echo -e "${GREEN}Folder path in Stroom: ${BLUE}$stroomPath${NC}"

    getUUID "$env.$folderType.$stroomPath"
    replaceParamInFile "${file}" "${uuidParamName}" "${uuid}"
  done

  echo ""
  echo -e "${GREEN}Creating zip file${NC}"
  #Now zip all the target output, removing the zipped content
  pushd "${targetDir}"

  #get the git commit hash for no file, thus getting the latest hash for the repo
  zip -9 -q -r -m "${artifactDir}/visualisations-${env}-${version}.zip" ./*
  #zip -9 -q -r $artifactDir/visualisations-$env.zip ./*
  popd

done

echo -e ""
echo -e "${GREEN}Done!"

#TODO The uuid lookup map could be extended such that we include a version in the dependency.  Currently
#all the visualisations code is released as a complete set, so if say we uplift D3 to a new version we have
#to alter all visualisations that depend on it.  It may be preferable to have a more fine grained approach 
#such that each vis can depend on specific versions of its dependencies.  We could do this be having a 
#dependency tag like @@DEPENDENCY#Common#1-2@@ and in the uuid.* file Script.Common.1-2=xxxxxxxxxxxx.  Thus
#we can have multiple versions of Common in the bundle where the difference is a breaking change.
# In order to implement this, testvis would need to be more clever so that it loads up the
#correct version of a script.  Testvis could possibly be driven off the Stroom xml files.

#TODO We may want to minify all the vis .js files using something like uglifyjs

