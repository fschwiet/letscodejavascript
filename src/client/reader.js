define(["views/post.jade", "endpoints", "jquery", "less!reader"], function(postView, endpoints, $) {

    function Reader(trimPostsMonitor) {
        this.postsContainer = null;
        this.trimPostsMonitor = trimPostsMonitor;
    }

    Reader.prototype.loadNextFeed = function() {

        var that = this;
        var feed = this.feedsToLoad.shift();

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

                    console.log("client loaded feeds", posts.length);

                    posts.forEach(function(post) {
                        that.insertPost(post);
                    });
                    
                    that.loadNextFeed();
                },
                error: function(error) {

                    console.log("client failed loading feeds", error);

                    that.loadNextFeed();
                }
            });
    };

    Reader.prototype.startReader = function(postsContainer, feeds) {

        this.postsContainer = postsContainer;

        this.feeds = feeds;
        var feedsToLoad = [];
        this.feedsToLoad = feedsToLoad;

        this.feeds.forEach(function(feed) {
            if (feed.couldRefresh !== false) {
                feedsToLoad.push(feed);
            }
        });

        var that = this;

        //  We'll load 2 feeds at a time until done
        this.loadNextFeed();
        this.loadNextFeed();

        this.postsContainer.on("click", "a.js-finishedButton", function() {

            var post = $(this).parents(".js-post");
            var postUrl = post.find(".js-postLink").attr("href").trim();
            
            endpoints.markFinished(postUrl, function() {
                post.find(".js-unfinishedButton").show();
            });

            $(this).hide();
        });

        this.postsContainer.on("click", "a.js-unfinishedButton", function() {

            var post = $(this).parents(".js-post");
            var postUrl = post.find(".js-postLink").attr("href").trim();

            endpoints.markUnfinished(postUrl, function() {
                    post.find(".js-finishedButton").show();
                });

            $(this).hide();
        });
    };

    Reader.prototype.insertPost = function(post) {

        console.log("insertPost starting");
        var postDate = post.postDate;
        var view = postView({post:post});

        var target = null;

        var otherPosts = this.postsContainer.find(".js-post");

        var matchingPosts = otherPosts.filter(function() {

            var otherPostUrl = $(this).find(".js-postLink").attr("href");

            if (post.postUrl == otherPostUrl) {
                return true;
            }

            return false;
        });

        if (matchingPosts.length > 0) {
            console.log("insertPost finished early, had matchingPosts");
            return;
        }

        this.trimPostsMonitor.check();

        otherPosts.each(function() {
            var next = $(this);
            var nextDate = next.data("postdate");

            if (postDate > nextDate) {
                target = next;
                return false;
            }
        });

        console.log("insertPost adding post");

        if (target !== null) {
            target.before(view);
        } else {
            this.postsContainer.append(view);
        }
    };


    return Reader;
});