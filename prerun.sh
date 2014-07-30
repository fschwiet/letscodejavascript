#!/bin/bash

set -e

./jake.sh runMigrations
./jake.sh buildClientBundle