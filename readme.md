## To run the site and tests locally:

* install node v0.10.30
* install git
* install PhantomJS
* install virtualbox
* install vagrant
* clone the repo
* create a config.json file
  1.  copy sample.config.json to config.json
  2.  change any values that don't match the desired configuration.  To run tests locally, its sufficient to set:
    * is_production (use false)
    * googleTest_username
    * googleTest_password
* Run .\jake.bat or .\jake.sh

The tests will fail if the google username/password hasn't been used to authenticate the site yet.  After failing, you will need to visit the site and log in with the google credentials once manually.  The site will be running in a VM created by vagrant at http://localhost:8081.

## To deploy to digital ocean:

* follow the steps needed to run the site locally
* use vagrant to deploy the vagrantfile at .\host to digital ocean
* set up the config file
* create a mysql database (import or run migrations)
  * if importanting from mysqldump, be sure to set the collate first:
    ALTER DATABASE <name> DEFAULT COLLATE utf8_general_ci
* pull the sites source code and run cumulonimbus ./deploy.sh


## Random notes

The PhantomJS process leaked for client tests may be holding onto host->ip mappings, and thereby requiring a reset if hosts file is changed.  

Phantom or sometimes keep a file open in the temp directory, preventing the test run from clearing it.
So at some point you may need to: get-process node | stop-process; get-process \*phant\* | stop-process