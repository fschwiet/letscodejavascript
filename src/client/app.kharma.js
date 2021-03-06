var dependencies = Object.keys(window.__karma__.files).filter(function(file) {
    return (/\.test\.js$/).test(file);
});

dependencies.push("test-init");

requirejs.config({
        // Karma serves files from '/base'
        baseUrl: '/base/src/client',

        paths: {
            "jquery": "./clientLib/jquery-2.0.0.min",
            "sinon": "../../node_modules/sinon/pkg/sinon-1.7.2",
            "views": "../../src/server/views",
            "test-init": "../../build/karma/init",
            "jadeRuntime": "../../node_modules/jade/runtime"
        },

        shim: {
            jadeRuntime: {
                exports: 'jadeRuntime'
            }
        },


        // ask Require.js to load these files (all our tests)
        deps: dependencies,

        packages: [
          {
            name: 'css',
            location: './clientLib/require-css',
            main: 'css'
          },
          {
            name: 'less',
            location: './clientLib/require-less',
            main: 'less'
          }
        ],        

        // start test run, once Require.js is done
        callback: window.__karma__.start
    });