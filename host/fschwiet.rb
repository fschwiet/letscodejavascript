
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

    vm.provision :shell, inline: "service mysql restart";  #
end