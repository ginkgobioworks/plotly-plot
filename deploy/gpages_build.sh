#!/bin/bash

# This script pushes a demo-friendly version of your element and its
# dependencies to gh-pages.

# Fork of https://github.com/Polymer/tools/blob/master/bin/gp.sh
# Modified from Polymer to work with Travis CI automated builds by

# Authors:
# Polymer authors
# Zisis Maras http://zisismaras.me/polymer/2015/12/02/automatic-github-pages-for-polymer-elements-with-travis-ci.html
# Misha Wolfson http://ginkgobioworks.com

# usage gp-build <org> <repo> <username> <email> [branch] [gh-pages-branch]
# Run in a clean directory passing in a GitHub org and repo name:
# gp-build foo barproj me me@foo.com master

BOWER=$PWD/node_modules/.bin/bower

org=$1
repo=$2
name=$3
email=$4
branch=${5:-'master'} # default to master when branch isn't specified
gh_pages_branch=${6:-'gh-pages'} # default to master when branch isn't specified

repo_url="https://${GH_TOKEN}@github.com/$org/$repo.git"

tmpdir=`mktemp -d`
cd $tmpdir

# make folder (same as input, no checking!)
mkdir -p $repo
git clone $repo_url --single-branch

# switch to gh-pages branch
pushd $repo >/dev/null
git checkout --orphan gh-pages

# remove all content
git rm -rf -q .

# use bower to install runtime deployment
$BOWER cache clean $repo # ensure we're getting the latest from the desired branch.
git show ${branch}:bower.json > bower.json
echo '{
  "directory": "components"
}
' > .bowerrc
$BOWER install
$BOWER install $org/$repo#$branch
git checkout ${branch} -- demo
rm -rf components/$repo/demo
mv demo components/$repo/

# redirect by default to the component folder
echo "<META http-equiv=\"refresh\" content=\"0;URL=components/$repo/\">" > index.html

git config user.name $name
git config user.email $email

# send it all to github
git add -A .
git commit -am 'Deploy to GitHub Pages'
git push --force --quiet -u $repo_url $gh_pages_branch > /dev/null 2>&1

popd >/dev/null

# Original license
#
# Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
# This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
# The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
# The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
# Code distributed by Google as part of the polymer project is also
# subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
