#!/bin/bash

# use bash strict mode
# set -euo pipefail || exit 1

rm -rf pyvenv

# create the venv
python3 -m venv pyvenv

# activate it
source pyvenv/bin/activate

# upgrade pip inside the venv and add support for the wheel package format
pip install -U pip wheel

# install packages
pip install twiggy
pip install arrow
pip install mwparserfromhell
pip install git+https://github.com/Riamse/ceterach.git#egg=ceterach