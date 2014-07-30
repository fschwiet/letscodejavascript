#!/bin/sh

set -e

./jake.sh runMigrations
./jake.sh buildClientBundle