# -*- mode: ruby -*-
# vi: set ft=ruby :

syncedFolder = File.absolute_path(ENV["SyncedFolder"] || "..")
hostGitUrl = ENV["HostGitUrl"] || "https://github.com/fschwiet/cumulonimbus-host"
hostGitCommit = ENV["HostGitCommit"] || "master"
wwwuser = ENV["wwwuserUsername"] || "wwwuser"
wwwuserPassword = ENV["wwwuserPassword"] || "password"
mysqlRootPassword = ENV["mysqlRootPassword"] || ""

digitalOceanPrivateKeyPath = ENV["digitalOceanPrivateKeyPath"] || nil #  /path/id_rsa
digitalOceanProviderToken = ENV["digitalOceanProviderToken"] || nil

require "./util.rb"
require "./fschwiet.rb"


Vagrant.configure("2") do |config|

	config.vm.box = "opscode-ubuntu-14.04"
	config.vm.box_url = "http://opscode-vm-bento.s3.amazonaws.com/vagrant/virtualbox/opscode_ubuntu-14.04_chef-provisionerless.box"
	megabytesMemoryInstalled = 512

	config.vm.provider :digital_ocean do |provider, override|
		
		provider.ssh_key_name = "cumulonimbus-machine fschwiet"
		override.ssh.private_key_path = digitalOceanPrivateKeyPath
		
		override.vm.box = 'digital_ocean'
		override.vm.box_url = "https://github.com/smdahlen/vagrant-digitalocean/raw/master/box/digital_ocean.box"

		provider.token = digitalOceanProviderToken
		provider.image = 'Ubuntu 14.04 x64'
		provider.region = 'nyc2'
		provider.size = '512mb'
	end

	config.omnibus.chef_version = :latest

	config.vm.network "private_network", ip: "192.168.33.100"
	config.vm.synced_folder syncedFolder, "/vagrant"

	enableFirewall config.vm, [
		"3306/tcp",  #mysql
		"21/tcp",    #ftp, used by wget during some provisioning
		"22/tcp"     #ssh
	]

	protectFromBashBug config.vm
	protectSshFromLoginAttacks config.vm

	createSwapFileIfMissing config.vm, 2*megabytesMemoryInstalled

	aptgetUpdate config.vm

	config.vm.provision "shell", inline: "sudo apt-get install -y make"  # required by nodejs cookbook, was missing from DigitalOcean box

	installGit config.vm

	installNodejs config.vm

	config.vm.provision "shell", inline: "sudo apt-get install -y realpath"
	config.vm.provision "shell", inline: "sudo apt-get install -y realpath"
	config.vm.provision "shell", inline: "sudo npm install pm2 -g --unsafe-perm"

	installNginx config.vm

	installMysql config.vm, mysqlRootPassword	

	config.vm.provision "file", source: "./scripts/cumulonimbus-listen-hostname.sh", destination: "/tmp/cumulonimbus-listen-hostname.sh"
	config.vm.provision "shell", inline: "mv /tmp/cumulonimbus-listen-hostname.sh /usr/local/bin; chmod +x /usr/local/bin/cumulonimbus-listen-hostname.sh"

	config.vm.provision "file", destination: "/tmp/cumulonimbus.sudoers", source: "./resources/cumulonimbus.sudoers"
	config.vm.provision "shell", inline: "visudo -f /tmp/cumulonimbus.sudoers -c"
	config.vm.provision "shell", inline: "chown root:root /tmp/cumulonimbus.sudoers"
	config.vm.provision "shell", inline: "chmod 0440 /tmp/cumulonimbus.sudoers"
	config.vm.provision "shell", inline: "mv /tmp/cumulonimbus.sudoers /etc/sudoers.d/cumulonimbus"

	config.vm.provision "shell", path: "./scripts/install-cumulonimbus.sh", args: [ 
		wwwuser, 
		wwwuserPassword,
		hostGitUrl,
		hostGitCommit
	]

end


