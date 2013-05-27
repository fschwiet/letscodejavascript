

task("syncfail", function() {
   fail("synchronous failure"); 
});

var http = require("http");

task("asyncfail", function() {

    http.get("http://www.google.com", function() {
       
        http.get("http://www.com", function() {
           fail("asynchronous failure"); 
        });
    });

    console.log("finishing sync part");
}, { async:true});