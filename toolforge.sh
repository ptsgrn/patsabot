#!/usr/bin/env sh
# Copyright (c) 2022 Patsagorn Y.
# 
# This software is released under the MIT License.
# https://opensource.org/licenses/MIT

# afccat
NODE_ENV=production ./src/patsabot/run.js afccat -d "$(date +"%Y-%m-%d")" > /dev/null 2>&1 &

