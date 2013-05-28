
var phantom=require('node-phantom');

phantom.create(function(err,ph) {
  return ph.createPage(function(err,page) {
    return page.open("http://google.com/", function(err,status) {
      console.log("opened site? ", status);
//      page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js', function(err) {
        //jQuery Loaded.
        //Wait for a bit for AJAX content to load on the page. Here, we are waiting 5 seconds.
//        setTimeout(function() {
          return page.evaluate(function() {
            return document.title;
          }, function(err,result) {
            console.log(result);
            ph.exit();
          });
//        }, 5000);
//      });
    });
  });
});