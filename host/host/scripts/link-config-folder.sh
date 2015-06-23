#!/bin/bash

set -e

name_of_site=${1:?"The first parameter should indicate what site to deploy."}
config_folder=${2:?"The second parameter should indicate what folder config files are copied from."}

expected_config_location=$(realpath $config_folder)

if ! [ -d $expected_config_location ]
then
	echo "Unable to find config folder '$expected_config_location'"
	exit 1
fi

expected_site_location=$(realpath ./sites/$name_of_site)

if ! [ -d $expected_site_location ]
then
	echo "Unable to find site '$name_of_site' at '$expected_site_location'"
	exit 1
fi

ln --symbolic $config_folder ./configs/$name_of_site

