
var tests = Object.keys(window.__karma__.files).filter(function (file) {
      return (/\.test\.js$/).test(file);
});

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/src/client',

    paths: {
        "jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min",
        "sinon": "../../node_modules/sinon/pkg/sinon-1.7.2"
    },

    shim: {
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});
