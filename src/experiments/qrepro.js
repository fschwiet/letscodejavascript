// https://github.com/kriskowal/q/issues/303

var Q = require("q");

function promiseLog(message) {
    return function() {
        return Q.fcall(function() {
            console.log(message);
        });
    };
}

promiseLog("a")()
.then(promiseLog("b"))
.then(function() {
    return promiseLog("c")()
    .then(promiseLog("d"));
})
.then(promiseLog("e"))
.fin(function() {
    promiseLog("lets get crazy")()
    .then(function(v) {
        console.log("1A " + v);
        return "A";
    }, function(v) {
        console.log("1B " + v);
    })
    .then(function(v) {
        console.log("2A " + v);
        throw new Error("boo");
    }, function(v) {
        console.log("2B " + v);
    })
    .then(function(v) {
        console.log("3A " + v);
    }, function(v) {
        console.log("3B " + v.stack);
        throw v;
    })
    .then(function(v) {
        console.log("3A " + v);
    }, function(v) {
        console.log("3B " + v.stack);
    });
});



