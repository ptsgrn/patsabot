#! /bin/bash
# used locally
# store current directory
CDIR=$(pwd)
echo -e ">> ${BLUE}Current directory: ${NC}"
echo $CDIR

# color
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[1;34m' # Light Blue
NC='\033[0m' # No Color


# build web app
echo -e ">> ${BLUE}Building web app...${NC}"
cd $CDIR/web

# install dependencies
npm i
npm build

echo -e ">> ${GREEN}Web app build complete${NC}"
echo -e ">> ${BLUE}Building server and bot script...${NC}"

cd $CDIR
tsc

echo -e ">> ${GREEN}Server and bot script build complete${NC}"

echo -e ">> ${BLUE}DONE${NC}"