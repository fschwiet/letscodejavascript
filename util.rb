
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
