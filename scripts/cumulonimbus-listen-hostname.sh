#!/bin/bash

# Replaces string "IPADDRESS_AWKARD" with the systems actual IP address in the ip rule's name and content

incomingHost=${1:?"Expected incoming host as parameter 1."}
incomingPort=${2:?"Expected incoming port as parameter 2."}
outgoingHost=${3:?"Expected outgoing host as parameter 3."}
outgoingPort=${4:?"Expected outgoing port as parameter 4."}

set -e

nginxRuleContent="

server {
	listen ${incomingHost}:${incomingPort};

	location ~ ^/ {
	    proxy_pass http://${outgoingHost}:${outgoingPort};

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
	}
}
"

nginxRuleFilepath="/etc/nginx/conf.d/${incomingHost}_port${incomingPort}_to_${outgoingHost}_port${outgoingPort}.conf"

ipAddress=$(ip addr show eth0 | grep 'state UP' -A2 | tail -n1 | awk '{print $2}' | cut -f1  -d'/')

nginxRuleContent=$(echo $nginxRuleContent | sed "s/IPADDRESS_AWKWARD/$ipAddress/")
nginxRuleFilepath=$(echo $nginxRuleFilepath | sed "s/IPADDRESS_AWKWARD/$ipAddress/")

#note: need quotes on "$nginxRuleContent" to preserve newlines, though its not sufficient w/ vagrant provisioner for some reason
echo "$nginxRuleContent" > $nginxRuleFilepath

#  open up the firewall
#  
#  The outgoing port is opened up for debugging purposes

ufw allow "${incomingPort}/tcp"
ufw allow "${outgoingPort}/tcp"
ufw reload