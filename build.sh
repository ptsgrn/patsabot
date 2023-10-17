#! /bin/bash
# This script is used to build the project on Toolforge server only!
cd ~/bot
npm install
npm run build

cd web
npm install
npm run build
rm -rf node_modules/