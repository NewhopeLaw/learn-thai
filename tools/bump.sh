#!/bin/sh
# Publish a new version: bumps ?v= on every script in index.html, the offline cache name in sw.js,
# and version.json, which open apps check so they reload onto the new version by themselves.
# Run from the repo root after changing app files:   sh tools/bump.sh
set -e
V=$(grep -o '?v=[0-9]*' index.html | head -1 | cut -d= -f2); N=$((V + 1))
sed -i "s/?v=$V/?v=$N/g" index.html
C=$(grep -o 'learn-thai-shell-v[0-9]*' sw.js | grep -o '[0-9]*$')
sed -i "s/learn-thai-shell-v$C/learn-thai-shell-v$((C + 1))/" sw.js
printf '{ "v": %s }\n' "$N" > version.json
echo "version $N"
