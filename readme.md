

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
  *  Delete the default site IIS creates on port 80
  *  Create a production.config.json, with database settings pointing to your database
  *  clone the repository
  *  run set-executionpolicy unrestricted on powershell, in both x64 and x86.
  *  run .\jake.bat releaseToIIS

NOTE: an iisreset may be needed before calling releaseToIIS.  I suspect adding a iisreset to NodeOnIIS boxstarter fixed this but have not verified.
