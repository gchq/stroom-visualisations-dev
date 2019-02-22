#!/bin/bash

#exit script on any error
set -e

#Shell Colour constants for use in 'echo -e'
#e.g.  echo -e "My message ${GREEN}with just this text in green${NC}"
# shellcheck disable=SC2034
{
  RED='\033[1;31m'
  GREEN='\033[1;32m'
  YELLOW='\033[1;33m'
  BLUE='\033[1;34m'
  NC='\033[0m' # No Colour 
}

create_file_hash() {
  local -r file="$1"
  local -r hash_file="${file}.sha256"

  echo -e "Creating a SHA-256 hash for file ${GREEN}${file}${NC}"
  sha256sum "${file}" > "${hash_file}"
  echo -e "Created hash file ${GREEN}${hash_file}${NC}"
}

generate_file_hashes() {
  for file in "${TRAVIS_BUILD_DIR}"/stroom-content-artifacts/*.zip; do
    create_file_hash "${file}"
  done
}

main() {

  if [ -n "$TRAVIS_TAG" ]; then
    #Tagged commit so use that as our version, e.g. v3.2.0
    local -r VERSION="${TRAVIS_TAG}"
  fi

  #Dump all the travis env vars to the console for debugging
  echo -e "TRAVIS_BUILD_DIR:    [${GREEN}${TRAVIS_BUILD_DIR}${NC}]"
  echo -e "TRAVIS_BUILD_NUMBER: [${GREEN}${TRAVIS_BUILD_NUMBER}${NC}]"
  echo -e "TRAVIS_COMMIT:       [${GREEN}${TRAVIS_COMMIT}${NC}]"
  echo -e "TRAVIS_BRANCH:       [${GREEN}${TRAVIS_BRANCH}${NC}]"
  echo -e "TRAVIS_TAG:          [${GREEN}${TRAVIS_TAG}${NC}]"
  echo -e "TRAVIS_PULL_REQUEST: [${GREEN}${TRAVIS_PULL_REQUEST}${NC}]"
  echo -e "TRAVIS_EVENT_TYPE:   [${GREEN}${TRAVIS_EVENT_TYPE}${NC}]"
  echo -e "VERSION:             [${GREEN}${VERSION}${NC}]"

  #Normal commit/PR/tag build
  local extraBuildArgs=()

  if [ -n "$TRAVIS_TAG" ]; then
    extraBuildArgs+=( "${VERSION}" )
    echo -e "extraBuildArgs:    [${GREEN}${extraBuildArgs[*]}${NC}]"
  fi

  #Do the build
  ./stroom-content-builder/buildImportBundle.sh "${extraBuildArgs[@]}"

  generate_file_hashes
}

main "$@"

exit 0
