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
	megabytesMemoryInstalled = 512

	config.omnibus.chef_version = :latest

	config.vm.network "private_network", ip: "192.168.33.100"
	config.vm.synced_folder syncedFolder, "/vagrant"

	enableFirewall config.vm, [
		"21/tcp",    #ftp, used by wget during some provisioning
		"22/tcp",    #ssh
		"80/tcp",    #www
		"8080/tcp",  #www testing
		"3306/tcp"  #mysql
	]

	protectSshFromLoginAttacks config.vm

	createSwapFileIfMissing config.vm, 2*megabytesMemoryInstalled

	aptgetUpdate config.vm
	installGit config.vm

	installNodejs config.vm

	config.vm.provision "shell", inline: "sudo apt-get install -y realpath"
	config.vm.provision "shell", inline: "sudo npm install pm2 -g --unsafe-perm"

	installNginx config.vm
	writeNginxProxyRule config.vm, "www.192.168.33.100.xip.io", 80, "localhost", 8080

	config.vm.provision "file", source: "./scripts/writeNginxRule.sh", destination: "/tmp/writeNginxRule.sh"
	config.vm.provision "shell", inline: "cp /tmp/writeNginxRule.sh /usr/local/bin; chmod +x /usr/local/bin/writeNginxRule.sh"

	config.vm.provision "file", destination: "/tmp/cumulonimbus.sudoers", source: "./resources/cumulonimbus.sudoers"
	config.vm.provision "shell", inline: "visudo -f /tmp/cumulonimbus.sudoers -c"
	config.vm.provision "shell", inline: "chmod 0440 /tmp/cumulonimbus.sudoers"
	config.vm.provision "shell", inline: "cp /tmp/cumulonimbus.sudoers /etc/sudoers.d/cumulonimbus.sudoers"

	config.vm.provision "shell", path: "./scripts/prepareCumulonimbus.sh", args: [ 
		wwwuser, 
		wwwuserPassword,
		hostGitUrl,
		hostGitCommit
	]

end


