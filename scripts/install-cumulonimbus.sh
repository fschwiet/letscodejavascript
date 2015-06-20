#!/bin/bash

set -e

username=${1:?"Expected web app username as first parameter."}
password=${2:?"Expected web app password as second parameter."}

sudo useradd -m -c "Web Applications Account" -p $(openssl passwd -1 "$password") "$username"
sudo mkdir /cumulonimbus
sudo mkdir /cumulonimbus/sites
sudo mkdir /cumulonimbus/configs
sudo cp -r /vagrant2/host/* /cumulonimbus/
sudo chown --recursive "$username:$username" /cumulonimbus

echo '@reboot wwwuser PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash -c "cd /cumulonimbus; ./scripts/run-on-reboot.sh >>~/cronrun_cumulonimbus 2>&1"' | sudo tee /etc/cron.d/cumulonimbus > /dev/null

echo "To deploy an individual site, do something like:"
echo "    su $username"
echo "    git clone <project_repository> /cumulonimbus/sites/sample"
echo "    sudo /cumulonimbus/scripts/map-hostname.sh www.192.168.33.100.xip.io 80 localhost 8080"
echo "    /cumulonimbus/scripts/link-config-folder.sh sample /sourceDirectory"
echo "    cd /cumulonimbus"
echo "    /cumulonimbus/scripts/deploy.sh sample"
