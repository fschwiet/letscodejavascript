
var setup = require("../test/setup");
var assert = require("assert");
var nconf = require("../server/config.js");
var hostname = nconf.get("smoketestServer_hostname");
var port = nconf.get("testServer_port");
var waitUntil = require("../test/waitUntil");

var selectors = {

    loginButtonSelector : "a[href='/auth/google']",
    logoutButtonSelector : "a[href='/logout']",

    googleLoginEmail : "input[type=email][name=Email]",
    googleLoginPassword : "input[name=Passwd]",
    googleLoginSubmit : "input[type=submit][name=signIn]",

    googleNoThanksButton : "form#recoveryPromptForm input#cancel",

    googleAllowSubmit : "button[id=submit_approve_access]"
};

waitUntil.defaultWait = 15000;


setup.qtest(exports, "can log in with google credentials", setup.usingPhantom(
function(page) {

    function getPageState() {
        return page.promise.evaluate(function(selectors) {

            var isGooglePage = window.location.toString().indexOf("google.com") > -1;

            function hasElement(s) {
                return document.querySelector(s) !== null;
            }

            return  {
                needLogin:  isGooglePage && hasElement(selectors.googleLoginEmail),
                needSkip:   isGooglePage && hasElement(selectors.googleNoThanksButton),
                needAllow:  isGooglePage && hasElement(selectors.googleAllowSubmit),
                ready:      !isGooglePage && hasElement(selectors.logoutButtonSelector)
            };
        }, selectors);
    }

    var googleUsername = nconf.get("googleTest_username");
    var googlePassword = nconf.get("googleTest_password");

    assert.notEqual(googleUsername, null, "A config setting was not found for googleTest_username.");
    assert.notEqual(googlePassword, null, "A config setting was not found for googleTest_password.");

    return page.promise.open("http://" + hostname + ":" + port + "/")
        .then(function() {
            return page.promise.clickElement(selectors.loginButtonSelector);
        })
        .then(function() {
            return waitUntil("done authenticating", function() {
                return getPageState()
                .then(function(state) {

                    console.log("state", state);
                    if (state.needLogin) {
                        return page.promise.evaluate(function(selectors, username, password) {
                            document.querySelector(selectors.googleLoginEmail).value = username;
                            document.querySelector(selectors.googleLoginPassword).value = password;
                        }, selectors, googleUsername, googlePassword)
                        .then(function() {
                            return page.promise.clickElement(selectors.googleLoginSubmit);
                        })
                        .then(function() {
                            return waitUntil("done logging into google", function() {
                                return getPageState()
                                .then(function(state) {
                                    return !state.needLogin;
                                });
                            });
                        })
                        .then(function() {
                            return false;
                        });
                    } else if (state.needSkip) {
                        return page.promise.clickElement(selectors.googleNoThanksButton)
                        .then(function() {
                            return waitUntil("done skipping password recovery", function() {
                                return getPageState()
                                .then(function(state) {
                                    return !state.needSkip;
                                });
                            });
                        })
                        .then(function() {
                            return false;
                        });
                    } else if (state.needAllow) {
                        /*
                        var ii = 0
                        return waitUntil("short delay",function() { return ++ii > 3;})
                        
                        .then(function() {
                            return page.promise.evaluate(function() {
                                return document.querySelectorAll(selectors.googleAllowSubmit).toString();
                            })
                            then(function(result) {
                                console.log(result);
                            });
                        })
*/
                        return page.promise.clickElement(selectors.googleAllowSubmit)
                        .then(function() {
                            return waitUntil("done allowing google account access", function() {
                                return getPageState()
                                .then(function(state) {
                                    return !state.needAllow;
                                });
                            });
                        })
                        .then(function() {
                            return false;
                        });
                    }

                    return state.ready;
                });
            }, 10000);
        })



        .then(function() {
            return page.promise.evaluate(function(ibs, obs) {
                return {
                    loginButtonCount: document.querySelectorAll(ibs).length,
                    logoutButtonCount: document.querySelectorAll(obs).length
                };
            }, selectors.loginButtonSelector, selectors.logoutButtonSelector);
        })
        .then(function(evaluation) {
            assert.equal(evaluation.loginButtonCount, 0);
            assert.equal(evaluation.logoutButtonCount, 1);
        });
}));

