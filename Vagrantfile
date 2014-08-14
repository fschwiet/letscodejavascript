# -*- mode: ruby -*-
# vi: set ft=ruby :

syncedFolder = File.absolute_path(ENV["SyncedFolder"] || "..")
hostGitUrl = ENV["HostGitUrl"] || "https://github.com/fschwiet/cumulonimbus-host"
hostGitCommit = ENV["HostGitCommit"] || "master"
wwwuser = ENV["wwwuserUsername"] || "wwwuser"
wwwuserPassword = ENV["wwwuserPassword"] || "password"

require "./util.rb"

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
end


