
def aptgetUpdate(vm)
	vm.provision :chef_solo do |chef|
		chef.cookbooks_path = "cookbooks"
		chef.add_recipe "apt"
	end
end

def installGit(vm)
	vm.provision "shell", inline: "sudo apt-get install -y git"
end

def installNodejs(vm)

	vm.provision :chef_solo do |chef|
		chef.cookbooks_path = "cookbooks"
		chef.add_recipe "nodejs::install_from_binary"
		chef.add_recipe "nodejs::npm"

		chef.json = {
			:nodejs => {
				version: "0.10.30",
				checksum_linux_x64: "173d2b9ba4cbfb45a2472029f2904f965081498381a34d01b3889a850238de2b"
			}	
		}
	end
end

def protectSshFromLoginAttacks(vm)
	vm.provision "shell", inline: <<-EOS
		sudo apt-get install -y fail2ban; 
		sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local; 
		sudo service fail2ban restart
	EOS
end


def createSwapFileIfMissing(vm,sizeInMegabytes)

	# final size of dd result is bs * count

	createScript = <<-EOS 

		if [[ $(sudo swapon -s) != */* ]]
		then
			echo "Creating swap drive of $size megabytes"

			## Create the swapfile
			sudo dd if=/dev/zero of=/swapfile bs=1024 count=$sizek
			sudo chown root:root /swapfile 
			sudo chmod 0600 /swapfile
			sudo mkswap /swapfile

			## Configue the system to use the swapfile

			# swapon works until next reboot
			sudo swapon /swapfile
			# /etc/stab is used after reboot
			echo "/swapfile       none    swap    sw      0       0" >> /etc/fstab

		else
			echo "Swap drive already detected - none created."
		fi

	EOS

	createScript = createScript.gsub("$size", sizeInMegabytes.to_s)

	vm.provision "shell", inline: createScript
end


def enableFirewall(vm, allowed)

	firewallConfig = <<-EOS
		sudo apt-get install -y ufw
		sudo ufw default deny incoming
		sudo ufw default allow outgoing
	EOS

	for term in allowed
		firewallConfig += "sudo ufw allow " + term + "\n"
	end

	firewallConfig += <<-EOS
		sudo echo yes | ufw enable
		sudo ufw status verbose
	EOS

	vm.provision "shell", inline: firewallConfig
end


def installNginx(vm)
	vm.provision :chef_solo do |chef|
		chef.cookbooks_path = "cookbooks"
		chef.add_recipe "nginx"
	end
end

def writeNginxProxyRule(vm, incomingHost, incomingPort, outgoingHost, outgoingPort)

	vm.provision "shell", path: "scripts/writeNginxRule.sh", args: [ incomingHost, incomingPort, outgoingHost, outgoingPort ]
	# vm.provision "shell", inline: 'sudo nginx -s reload'
end

