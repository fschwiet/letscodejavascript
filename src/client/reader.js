define(["views/post.jade", "endpoints", "less!reader"], function(postView, endpoints) {

    function Reader() {
        this.container = null;
    }

    Reader.prototype.loadNextFeed = function() {

        var that = this;
        var feed = this.feeds.shift();

        if (typeof feed == "undefined") {
            return;
        }

        $.ajax({
                type: "GET",
                url: "/posts",
                data: {
                    rssUrl: feed.rssUrl
                },
                success: function(posts) {

                    posts.forEach(function(post) {
                        that.insertPost(post);
                    });
                    
                    that.loadNextFeed();
                },
                error: function() {

                    that.loadNextFeed();
                }
            });
    };

    Reader.prototype.startReader = function(domContainer, feeds) {

        this.container = domContainer;
        this.feeds = feeds;
            
        //  We'll load 2 feeds at a time until done
        this.loadNextFeed();
        this.loadNextFeed();

        this.container.on("click", "a.js-finishedButton", function() {

            var post = $(this).parents(".js-post");
            var postUrl = post.find(".js-postLink").attr("href").trim();
            
            endpoints.markFinished(postUrl, function() {
                post.find(".js-unfinishedButton").show();
            });

            $(this).hide();
        });

        this.container.on("click", "a.js-unfinishedButton", function() {

            var post = $(this).parents(".js-post");
            var postUrl = post.find(".js-postLink").attr("href").trim();

            endpoints.markUnfinished(postUrl, function() {
                    post.find(".js-finishedButton").show();
                });

            $(this).hide();
        });
    };


    Reader.prototype.insertPost = function(post) {
        var postDate = post.postDate;
        var view = postView({post:post});

        var target = null;

        var otherPosts = this.container.find(".js-post");

        var matchingPosts = otherPosts.filter(function() {

            var otherPostUrl = $(this).find(".js-postLink").attr("href");

            if (post.postUrl == otherPostUrl) {
                return true;
            }

            return false;
        });

        if (matchingPosts.length > 0) {
            return;
        }

        otherPosts.each(function() {
            var next = $(this);
            var nextDate = next.data("postdate");

            if (postDate > nextDate) {
                target = next;
                return false;
            }
        });

        if (target !== null) {
            target.before(view);
        } else {
            this.container.append(view);
        }
    };

    return Reader;
});