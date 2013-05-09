//  https://github.com/sgentle/phantomjs-node/issues/77

var phantom = require("phantom");

console.log("Start");

phantom.create(function(browser) {

  console.log("Phantom created");

  browser.createPage(function(page) {
    page.open("http://www.google.com/", function(status) {
      page.evaluate("document.title", function(title) {
        console.log("Page title is '" + title + "'");
      });
    });
  });
});