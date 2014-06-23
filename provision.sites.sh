
username=${1:?"Expected web app username as first parameter."}
password=${2:?"Expected web app password as second parameter."}

sudo useradd -m -c "Web Applications Account" -p $(openssl passwd -1 "$password") "$username"
sudo mkdir /cumulonimbus
git clone http://github.com/fschwiet/cumulonimbus-host /cumulonimbus
mkdir /cumulonimbus/sites
sudo chown --recursive "$username:$username" /cumulonimbus

#  It might be preferable to write to /etc/cron.d/<filename>, but I couldnt' get that to work.
(sudo crontab -l -u $username ; echo '@reboot PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin bash -c "cd /cumulonimbus && ./run.sh >>~/cronrun_cumulonimbus 2>&1"') | crontab -u "$username" -

echo "Next, run:"
echo "    su $username"
echo "    git clone http://github.com/fschwiet/cumulonimbus-project /cumulonimbus/sites/sample"
echo "    cd /cumulonimbus"
echo "    ./deploy.sh sample"
