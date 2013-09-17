module.exports = {
    assertPage: require("./lib/assertPage.js"),
    phantom: require("./lib/node-phantom-shim.js"),
    nodeunit: require("./lib/nodeunit-builder.js"),
    shouldFail: require("./lib/should-fail.js"),
    usingPhantomPage: require("./lib/using-phantom-page.js"),
    waitUntil: require("./lib/waitUntil.js")
};