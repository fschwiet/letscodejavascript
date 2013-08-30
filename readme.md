Prerequisites:

* install node v0.10.6
* install git
* install PhantomJS
* clone the repo
* install MySQL (for Windows, use http://dev.mysql.com/doc/refman/5.6/en/windows-install-archive.html to install the zip from http://dev.mysql.com/downloads/mysql/)
* create a config.json file
    1.  copy sample.config.json to config.json
    2.  change any values that don't match the desired configuration
        * "googleTest_" will require creating a throw-away google account.  You may need to authenticate with the account to the 
        server before it works for the tests, use jake task runServer and authenticate there.
        * "deployment_" are only used only during deployment and can be ignored otherwise.
    3.  (optional) remove any settings where you like the defaults

Note:

To deploy to IIS:

  *  Install NodeOnIIS boxstarter package at https://github.com/fschwiet/fschwiet-boxstarter (this installs node, git, phantomjs, carbon, iis, iisnode, urlrewrite, etc)
  *  Set the "deployment_" configuration values in "config.json".
    * deployment_configFile will point to the configuration file like "config.json" the deployed environment will use (its "deployment_" values are not used).  I use production.config.json.
  * Verify the HTTP port are available in IIS.
  * Verify the database has been created
  *  Modify the hosts file so your configured server_hostname maps to localhost (if the hostname doesn't resolve to localhost already)
  *  clone the repository
  *  run set-executionpolicy unrestricted on powershell, in both x64 and x86.
  *  run .\jake.bat deployToIIS
    *  Directories will be created with appropriate permissions.
    *  First a test site is created in IIS (without disturbing existing deployments), then smoke tests are ran before the final iis site is created (overwriting any existing deployment).


NOTE: 

One common deployment problem is that an an existing IIS site collides with the host:port binding.  In this case, the new site will be stopped in IIS.

The PhantomJS process leaked for client tests may be holding onto host->ip mappings, and thereby requiring a reset if hosts file is changed.  
Phantom or sometimes keep a file open in the temp directory, preventing the test run from clearing it.
So at some point you may need to: get-process node | stop-process; get-process \*phant\* | stop-process

An iisreset may be needed before calling deployToIIS.  I suspect adding a iisreset to NodeOnIIS boxstarter fixed this but have not verified.

To run the tests on mac, you need to enable other 127.0.0.n which are used.  Run:
  sudo ifconfig lo0 add 127.0.0.76

