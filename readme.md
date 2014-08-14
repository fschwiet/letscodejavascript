Prerequisites:

* install node v0.10.30
* install git
* install PhantomJS
* install virtualbox
* install vagrant
* clone the repo
* create a config.json file
    1.  copy sample.config.json to config.json
    2.  change any values that don't match the desired configuration
        * "googleTest_" will require creating a throw-away google account.  You may need to authenticate with the account to the 
        server before it works for the tests, use jake task runServer and authenticate there.
        * "deployment_" are only used only during deployment and can be ignored otherwise.
    3.  (optional) remove any settings where you like the defaults

NOTE: 
The PhantomJS process leaked for client tests may be holding onto host->ip mappings, and thereby requiring a reset if hosts file is changed.  

Phantom or sometimes keep a file open in the temp directory, preventing the test run from clearing it.
So at some point you may need to: get-process node | stop-process; get-process \*phant\* | stop-process
