define(["views/post.jade"], function(postView) {

    function Reader() {
        this.container = null;
    }

    Reader.prototype.startReader = function(domContainer, feeds) {

        this.container = domContainer;
        var that = this;

        feeds.forEach(function(feed) {

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
                    }
                });
        });

        this.container.on("click", "a.js-finishedButton", function() {

            $.ajax({
                type: "POST",
                url: "/posts/finished",
                data: JSON.stringify({
                    url: $(this).parents(".js-post").find(".js-postLink").attr("href").trim()
                }),
                contentType: "application/json; charset=utf-8"
            });

            $(this).remove();
        });
    };

    Reader.prototype.insertPost = function(post) {
        var postDate = post.postDate;
        var view = postView(post);

        var target = null;

        this.container.find(".js-post").each(function() {
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