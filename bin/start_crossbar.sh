#!/bin/bash

####################################################
####     Copyright (c) 2016 - 2017 BigSQL       ####
####################################################

DIR=$(cd "$(dirname "$0")"; pwd)
export PYTHONPATH=$DIR/../lib
python $DIR/start_crossbar.py start --cbdir $DIR --loglevel info --logtofile --logdir $PGC_HOME/data/logs/pgdevops
