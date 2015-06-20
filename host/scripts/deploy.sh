#!/bin/bash

set -e

function is_git_unclean {

	git_directory=${1:?"is_git_unclean expected parameter"}
	
	pushd  $git_directory > /dev/null
	
	if [ -d .git ];
	then
		change_count=$(git status --porcelain | wc -l)
		popd > /dev/null

		if [ "$change_count" -gt 0 ] 
		then
			true
		else
			false
		fi
	else
		true
	fi
}


name_of_site=${1:?"The first parameter indicating what site to deploy was missing."}
commit_to_deploy=${2:-"master"}

src_to_deploy=./sites/$name_of_site
config_to_deploy=./configs/$name_of_site

if ! [ -d $src_to_deploy ]
then
	echo "Unable to find site to deploy at $src_to_deploy"
	exit 1
fi

src_to_deploy=$(realpath $src_to_deploy)

if is_git_unclean $src_to_deploy
then
	echo "There are uncommitted changes in $src_to_deploy."
	exit 1
fi


if ! [ -s $src_to_deploy/prerun.sh ]
then
	echo "Expected to find file $src_to_deploy/prerun.sh"
	exit 1
fi

if ! [ -s $src_to_deploy/run.sh ]
then
	echo "Expected to find file $src_to_deploy/run.sh"
	exit 1
fi

if ! [ -d ./deploys ] 
then
	mkdir ./deploys
fi

if ! [ -d ./deploys/$name_of_site ] 
then
	mkdir ./deploys/$name_of_site
fi

commit_id=$(git --git-dir $src_to_deploy/.git rev-parse $commit_to_deploy)
dir_index=0

while [ -d ./deploys/$name_of_site/${commit_id}_${dir_index} ]
do
	((dir_index++))
done

deploy_target=$(realpath ./deploys/$name_of_site)/${commit_id}_${dir_index}
deploy_link=$(realpath ./deploys/$name_of_site)/current

mkdir $deploy_target
git --git-dir $src_to_deploy/.git archive --format=tar $commit_to_deploy | tar --extract -C $deploy_target

if [ -d $config_to_deploy ]
then
	cp -r $config_to_deploy/* $deploy_target
fi

if ! pushd $deploy_target > /dev/null
then
	exit 1
fi

	if ! ./prerun.sh
	then
		popd > /dev/null
		echo "Failure running $deploy_target/prerun.sh"
		exit 1
	fi

popd > /dev/null


if [ -h $deploy_link ]
then
	old_deploy_target=$(realpath $deploy_link)
	rm $deploy_link
fi


if ! ln -s $deploy_target $deploy_link
then
	popd > /dev/null
	echo "Unable to create symbolic link."
	exit 1
fi


pushd $deploy_link
	
	if ! $deploy_target/run.sh
	then
		popd > /dev/null

		echo "Failure running $deploy_target/run.sh"

		if [ -n $old_deploy_target ]
		then
			rm $deploy_link
			ln -s $old_deploy_target $deploy_link
		fi

		exit 1
	fi

popd > /dev/null


