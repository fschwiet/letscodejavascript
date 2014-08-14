# -*- mode: ruby -*-
# vi: set ft=ruby :

syncedFolder = File.absolute_path(ENV["SyncedFolder"] || "..")
hostGitUrl = ENV["HostGitUrl"] || "https://github.com/fschwiet/cumulonimbus-host"
hostGitCommit = ENV["HostGitCommit"] || "master"
wwwuser = ENV["wwwuserUsername"] || "wwwuser"
wwwuserPassword = ENV["wwwuserPassword"] || "password"
mysqlRootPassword = ENV["mysqlRootPassword"] || ""

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

def installMysql(vm, rootPassword)

	# Table and columns names will not be case sensitive
	# reference: http://dev.mysql.com/doc/refman/5.0/en/identifier-case-sensitivity.html
	
	vm.provision :chef_solo do |chef|
		chef.cookbooks_path = "cookbooks"
		chef.add_recipe "mymysql"
		chef.json = {
			:mysql => {
				server_root_password: rootPassword,
				version: '5.6',
				port: '3306',
				data_dir: '/data-mysql'
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
	config.vm.synced_folder syncedFolder, "/vagrant"

	aptgetUpdate config.vm
	installGit config.vm

	installNodejs config.vm

	config.vm.provision "shell", inline: "sudo apt-get install -y realpath"
	config.vm.provision "shell", inline: "sudo npm install pm2 -g"

	config.vm.provision "shell", path: "./provision.sites.sh", args: [ 
		wwwuser, 
		wwwuserPassword,
		hostGitUrl,
		hostGitCommit
	]

	installMysql config.vm, mysqlRootPassword
end


