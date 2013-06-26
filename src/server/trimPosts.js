
var Q= require("q");

var dataUserPostsRead = require("./data/userPostsRead.js");

module.exports = function(app) {
    app.post("/trimposts", function(req,res,next) {

        var postsToTrim = null;

        try{
            postsToTrim = JSON.parse(req.body.urlList);
        } catch(err) {
            next("Expected a list of urls in post parameter urlList");
            return;
        }

        if (typeof req.user !== 'object') {
            res.redirect("/");
            return;
        }

        var userId = req.user.id;

        var workToDo = postsToTrim.map(function(postUrl){
            return function() {
                return dataUserPostsRead.markPostAsRead(userId, postUrl);
            };
        });

        workToDo.reduce(Q.when, Q())
        .then(function(){
            res.redirect("/");
        }, function(err){
            next(err);
        });
    });
};