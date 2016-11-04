#!/bin/sh

#created local and remote gh-pages branch using
#git subtree split --prefix war -b gh-pages
#git push -f origin gh-pages:gh-pages

git subtree push --prefix war origin gh-pages
