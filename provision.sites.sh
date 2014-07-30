
username=${1:?"Expected web app username as first parameter."}
password=${2:?"Expected web app password as second parameter."}
host_repository=${3:?"Expected host repository as third parameter."}
host_repository_commit=${4:?"Expected host repository commit id as fourth parameter."}

sudo useradd -m -c "Web Applications Account" -p $(openssl passwd -1 "$password") "$username"
sudo mkdir /cumulonimbus
git clone -b $host_repository_commit $host_repository /cumulonimbus
mkdir /cumulonimbus/sites
mkdir /cumulonimbus/configs
sudo chown --recursive "$username:$username" /cumulonimbus

#  It might be preferable to write to /etc/cron.d/<filename>, but I couldnt' get that to work.
(sudo crontab -l -u $username ; echo '@reboot PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash -c "cd /cumulonimbus && ./run.sh >>~/cronrun_cumulonimbus 2>&1"') | crontab -u "$username" -

echo "To deploy an individual site, do something like:"
echo "    su $username"
echo "    git clone <project_repository> /cumulonimbus/sites/sample"
echo "    mkdir /cumulonimbus/sites/sample.config"
echo "    cp <config file> /cumulonimbus/sites/sample.config/config.json"
echo "    ln --symbolic /cumulonimbus/sites/sample.config /cumulonimbus/configs/sample"
echo "    cd /cumulonimbus"
echo "    ./deploy.sh sample"
