
//  Just making sure this loads
require("./index.js");

module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {

            },
            uses_defaults: ['*.js', 'lib/**/*.js']
        },
        nodeunit: {
            all: ['lib/**/*.test.js'],
            slow: ['lib/**/*.test.slow.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    // Default task(s).
    grunt.registerTask('default', ['jshint','nodeunit:all','nodeunit:slow']);
};

