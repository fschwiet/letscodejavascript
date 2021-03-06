// Karma configuration
// Generated on Thu May 23 2013 00:45:59 GMT-0700 (Pacific Daylight Time)


// base path, that will be used to resolve files and exclude
basePath = '../../';


// list of files / patterns to load in the browser
files = [
    MOCHA,
    MOCHA_ADAPTER,
    REQUIRE,
    REQUIRE_ADAPTER,
    'node_modules/expect.js/expect.js',
    'src/client/app.kharma.js', 
    {
        pattern: 'build/karma/init.js',
        included: false
    }, 
    {
        pattern: 'node_modules/jade/runtime.js',
        included: false
    }, 
    {
        pattern: 'node_modules/sinon/pkg/**/*.js',
        included: false
    }, 
    {
        pattern: 'src/client/**/*.js',
        included: false
    }, 
    {
        pattern: 'src/client/**/*.less',
        included: false
    }, 
    {
        pattern: 'src/client/**/*.css',
        included: false
    }, 
    {
        pattern: 'src/server/views/**/*.jade',
        included: false
    }
];


// list of files to exclude
exclude = [
    'src/client/require.js',
    'src/client/app.js',
    'src/client/main.js'
];


// test results reporter to use
// possible values: 'dots', 'progress', 'junit'
reporters = ['progress'];


// web server port
port = 9876;


// cli runner port
runnerPort = 9100;


// enable / disable colors in the output (reporters and logs)
colors = true;


// level of logging
// possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
logLevel = LOG_INFO;


// enable / disable watching file and executing tests whenever any file changes
autoWatch = false;


// Start these browsers, currently available:
// - Chrome
// - ChromeCanary
// - Firefox
// - Opera
// - Safari (only Mac)
// - PhantomJS
// - IE (only Windows)
browsers = [];


// If browser does not capture in given timeout [ms], kill it
captureTimeout = 60000;


// Continuous Integration mode
// if true, it capture browsers, run tests and exit
singleRun = false;


preprocessors = {
    '**/*.jade': 'jade'
};