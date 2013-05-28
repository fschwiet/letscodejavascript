// https://github.com/kriskowal/q/issues/303

var Q = require("q");

function promiseLog(message) {
    return Q.fcall(function() {
        console.write(message);
    });
}

promiseLog("a")
.then(promiseLog("b"))
.then(function() {
    return promiseLog("c")
    .then(promiseLog("d"));
})
.then(promiseLog("e"));