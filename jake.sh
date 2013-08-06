#!/bin/sh
sudo ifconfig lo0 add 127.0.0.76
node_modules/.bin/jake --trace $*