# -*- mode: ruby -*-
# vi: set ft=ruby :

syncedFolder = File.absolute_path(ENV["SyncedFolder"] || "..")
hostGitUrl = ENV["HostGitUrl"] || "https://github.com/fschwiet/cumulonimbus-host"
hostGitCommit = ENV["HostGitCommit"] || "master"
wwwuser = ENV["wwwuserUsername"] || "wwwuser"
wwwuserPassword = ENV["wwwuserPassword"] || "password"
mysqlRootPassword = ENV["mysqlRootPassword"] || ""

hostnameASimpleReader = ENV["hostnameASimpleReader"] || "asimplereader.192.168.33.100.xip.io"
hostnameInternetDanceFloor = ENV["hostnameInternetDanceFloor"] || "internetdancefloor.192.168.33.100.xip.io"

require "./util.rb"


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
	megabytesMemoryInstalled = 512

	config.omnibus.chef_version = :latest

	config.vm.network "private_network", ip: "192.168.33.100"
	config.vm.synced_folder syncedFolder, "/vagrant"

	enableFirewall config.vm, [
		"21/tcp",    #ftp, used by wget during some provisioning
		"22/tcp",    #ssh
		"80/tcp",    #
		"8080/tcp",  # testing
		"8081/tcp",  # testing
		"8082/tcp",  # testing
		"8083/tcp",  # testing
		"8084/tcp",  # testing
		"8085/tcp",  # testing
		"8086/tcp",  # testing
		"8086/tcp",  # testing
		"8087/tcp",  # testing
		"8088/tcp",  # testing
		"8089/tcp",  # testing
		"3306/tcp"  #mysql
	]

	protectSshFromLoginAttacks config.vm

	createSwapFileIfMissing config.vm, 2*megabytesMemoryInstalled

	aptgetUpdate config.vm
	installGit config.vm

	installNodejs config.vm

	config.vm.provision "shell", inline: "sudo apt-get install -y realpath"
	config.vm.provision "shell", inline: "sudo npm install pm2 -g"

	installNginx config.vm
	writeNginxProxyRule config.vm, hostnameASimpleReader, 80, "localhost", 8081
	writeNginxProxyRule config.vm, hostnameInternetDanceFloor, 80, "localhost", 8082

	installMysql config.vm, mysqlRootPassword

	config.vm.provision "shell", path: "./provision.sites.sh", args: [ 
		wwwuser, 
		wwwuserPassword,
		hostGitUrl,
		hostGitCommit
	]
end


