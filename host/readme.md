ENVIRONMENT VARIABLES

	syncedFolder = File.absolute_path(ENV["SyncedFolder"] || "..")
	hostGitUrl = ENV["HostGitUrl"] || "https://github.com/fschwiet/cumulonimbus-host"
	hostGitCommit = ENV["HostGitCommit"] || "master"
	wwwuser = ENV["wwwuserUsername"] || "wwwuser"
	wwwuserPassword = ENV["wwwuserPassword"] || "password"

COOKBOOKS USED:

* https://github.com/mdxp/nodejs-cookbook
    * https://github.com/opscode-cookbooks/build-essential
    * https://github.com/cookbooks/apt
    * https://github.com/opscode-cookbooks/yum-epel
    * https://github.com/opscode-cookbooks/yum
