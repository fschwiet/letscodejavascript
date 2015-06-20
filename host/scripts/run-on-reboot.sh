#!/bin/bash

for directory in ./deploys/*; do
   	if [ -d "$directory/current" ]; then
		pushd $directory/current; 
		./run.sh
        popd
  	fi
done
