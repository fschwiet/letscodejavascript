#!/bin/sh


#later call to pm2 list -name was stalling on first run)
pm2 list

# recording existing PM2 ids so they can be removed 
old_ids=$(pm2 jlist | node -e "var pm2List = JSON.parse(require('fs').readFileSync('/dev/stdin').toString()); 
    pm2List.forEach(function(value) {
        if (value.name == 'asimplereader') {
            console.log(value.pm2_env.pm_id);
        }
    });
")

if pm2 start ./node_modules/jake/bin/cli.js --name asimplereader -- jakefile.js runServer
then 
    for old_id in $old_ids
    do
        pm2 delete $old_id
    done
else
    echo "PM2 unable to start app"
    exit 1
fi