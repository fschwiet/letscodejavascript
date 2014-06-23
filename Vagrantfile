# -*- mode: ruby -*-
# vi: set ft=ruby :


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
				#version: "0.10.6",
				#checksum_linux_x64: "cc7ccfce24ae0ebb0c50661ef8d98b5db07fc1cd4a222c5d1ae232260d5834ca"
				#version: "0.11.10",
				#checksum_linux_x64: "5397e1e79c3052b7155deb73525761e3a97d5fcb0868d1e269efb25d7ec0c127"
			}	
		}
	end
end

Vagrant.configure("2") do |config|

	config.vm.box = "opscode-ubuntu-14.04"
	config.vm.box_url = "http://opscode-vm-bento.s3.amazonaws.com/vagrant/virtualbox/opscode_ubuntu-14.04_chef-provisionerless.box"

	config.omnibus.chef_version = :latest

	config.vm.network "private_network", ip: "192.168.33.100"
	config.vm.network "forwarded_port", guest: 8080, host: 8080
	config.vm.synced_folder "..", "/vagrant"

	aptgetUpdate config.vm
	installGit config.vm

	installNodejs config.vm

	config.vm.provision "shell", inline: "sudo apt-get install -y realpath"
	config.vm.provision "shell", inline: "sudo npm install pm2 -g"

	config.vm.provision "shell", path: "./provision.sites.sh", args: [ "wwwuser", Secret.wwwuser_password || "password" ]
end


