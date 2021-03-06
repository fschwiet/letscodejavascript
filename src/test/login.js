var assert = require("assert");

var waitUntil = require("cauldron").waitUntil;
var config = require("../config.js");
var Q = require("q");

waitUntil.defaultWait = 15000;

var selectors = {

    //  From the common layout file, available depending on login state.
    loginButton: "a[href='/login']",
    logoutButtonSelector: "a[href='/logout']",

    //  From the login page
    loginWithGoogleButtonSelector: "a[href='/auth/google']",
    loginUsername : "input[name='username']",
    loginPassword : "input[name='password']",
    loginLocalSubmit : "#submitLocalLogin",
    registerButton: "a[href='/register']",
    resetPasswordButton: "a[href='/resetPassword']",

    //  From the registration page
    registerUsername : "input[name='username']",
    registerEmail : "input[name='email']",
    registerPassword : "input[name='password']",
    registerRetypedPassword : "input[name='retypedPassword']",
    registerSubmit : "input#submitRegistration",

    //  From the reset password page
    resetUsernameOrEmail: "input[name='usernameOrEmail']",
    resetSubmit: "#submitNewPasswordRequest",

    //  From the 2nd reset password page
    resetNewPassword: "input[name='newPassword']",
    resetNewPasswordConfirmation: "input[name='newPasswordConfirmation']",
    resetNewSubmit: "#submitNewPassword",


    //  Selectors used for google login
    googleLoginEmail: "input#Email[type=email]",
    googleLoginNext: "input#next",
    googleLoginPassword: "input#Passwd[type=password]",
    googleLoginSubmit: "input#signIn",

    googleNoThanksButton: "form#recoveryPromptForm input#cancel",

    googleAllowSubmit: "button#submit_approve_access"
};

exports.selectors = selectors;

exports.doLogin = function(page) {

    return page.clickElement(selectors.loginButton, true)
    .then(function() {
        return waitUntil("google auth button is visible", function() {
            return page.evaluate(function(selector) {
                return document.querySelectorAll(selector).length > 0;
            }, selectors.loginWithGoogleButtonSelector);
        });
    })
    .then(function() {
        return page.clickElement(selectors.loginWithGoogleButtonSelector, false);
    })
    .then(function() {
        return handleGoogleAuth(page);
    })
    .then(function() {
        return page.evaluate(function(ibs, obs) {
            return {
                loginButtonCount: document.querySelectorAll(ibs).length,
                logoutButtonCount: document.querySelectorAll(obs).length
            };
        }, selectors.loginButton, selectors.logoutButtonSelector);
    })
    .then(function(evaluation) {
        assert.equal(evaluation.loginButtonCount, 0);
        assert.equal(evaluation.logoutButtonCount, 1);
    });
};

function handleGoogleAuth(page) {

    var googleUsername = config.get("googleTest_username");
    var googlePassword = config.get("googleTest_password");

    assert.notEqual(googleUsername, null, "A config setting was not found for googleTest_username.");
    assert.notEqual(googlePassword, null, "A config setting was not found for googleTest_password.");

    function getPageState() {
        return page.evaluate(function(selectors) {

            var isGooglePage = window.location.toString().indexOf("google.com") > -1;
            
            function hasElement(s) {
                return document.querySelector(s) !== null;
            }

            return {
                url: window.location.toString(),
                hash: window.location.hash.toString(),
                needLogin: isGooglePage && window.location.hash == "#identifier",
                needPassword: isGooglePage && window.location.hash == "#password",
                needSkip: isGooglePage && hasElement(selectors.googleNoThanksButton),
                needAllow: isGooglePage && hasElement(selectors.googleAllowSubmit),
                ready: !isGooglePage && hasElement(selectors.logoutButtonSelector)
            };
        }, selectors)
        .fail(function(err) {
            return {
                needLogin: false,
                needSkip: false,
                needAllow: false,
                ready: false
            };
        });
    }

    return waitUntil("done authenticating", function() {
        return getPageState()
            .then(function(state) {

                if (state.needPassword) {
                    return Q()
                    .then(function() {
                        return page.evaluate(function(selectors, username, password) {
                                document.querySelector(selectors.googleLoginPassword).value = password;
                            }, selectors, googleUsername, googlePassword);
                    })
                    .then(function() {
                        return page.clickElement(selectors.googleLoginSubmit);
                    })
                    .then(function() {
                        return waitUntil("done submitting google password", function() {
                            return getPageState()
                                .then(function(state) {
                                    return !state.needPassword;
                                });
                        }, {
                            msTimeout: 2000,
                            noTimeoutError: true
                        });
                    })
                    .then(function() {
                        return false;
                    });
                } else if (state.needLogin) {
                    return Q()
                    .then(function() {
                        return page.evaluate(function(selectors, username, password) {
                                document.querySelector(selectors.googleLoginEmail).value = username;
                            }, selectors, googleUsername, googlePassword);
                    })
                    .then(function() {
                        return page.clickElement(selectors.googleLoginNext);
                    })
                    .then(function() {
                        return waitUntil("done submitting google username", function() {
                            return getPageState()
                                .then(function(state) {
                                    return !state.needLogin;
                                });
                        }, {
                            msTimeout: 2000,
                            noTimeoutError: true
                        });
                    })
                    .then(function() {
                        return false;
                    });
                } else if (state.needSkip) {
                    return page.clickElement(selectors.googleNoThanksButton)
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

                        return Q()
                        .then(function() {
                            var deferred = Q.defer();
                            setTimeout(function() { deferred.resolve(); }, 5000);  // TODO UGH
                            return deferred.promise;
                        })
                        .then(function() {
                            return page.clickElement(selectors.googleAllowSubmit);
                        })
                        .then(function() {
                            return waitUntil("done allowing google account access", function() {
                                return Q()
                                .then(function() {
                                    return getPageState();
                                })                                    
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
    }, {
        msTimeout: 16000
    });
}