var express = require('express');
var csv = require('express-csv');
var dataFeedPosts = require("./data/feedPosts.js");
var url = require('url');

module.exports = function(app) {

    app.all("/downloadAllPosts", function(req, res, next){

        dataFeedPosts.loadUnreadPostsFromDatabase(req.user.id)
        .then(function(posts) {

            var results = [];
            results.push(["baseUrl", "name", "url", "hostname"]);

            posts.forEach(function(val) {

                var parsed = url.parse(val.url);
                results.push([
                    parsed.hostname +  parsed.pathname, 
                    val.name, 
                    val.url, 
                    parsed.hostname]);
            });

            res.csv(results);
        })
        .fail(function(err) {
            next(err);
        });
    });
};

