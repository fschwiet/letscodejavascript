
var Q = require("q");

var phantom=require('../test/node-phantom-shim');

phantom.promise.create()
.then(function(ph) {
  return ph.promise.createPage().then(function(page) {
    
    console.log("calling open");
    return page.promise.open("http://google.com/")
      .then(function(status) {

        console.log("opened site? ", status);
      })
      .then(function() {
        return page.promise.evaluate(function() {
          return document.title;
        });
      })
      .then(function(title) {
        console.log("title was " + title);
      })
      .then(function() { 
        console.log("finished");
      });
  })
  .fail(function(err) {
     console.log("failed: " + err);
  })
  .fin(function() {
    console.log("ph.exit called");
    ph.exit();
  });
});
