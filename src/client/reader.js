define(["views/post.jade"], function(postView) {

    function Reader() {
        this.container = null;
    }

    Reader.prototype.startReader = function(domContainer, feeds) {

        this.container = domContainer;
        var that = this;

        feeds.forEach(function(feed) {
            
            $.ajax({
                type:"GET",
                url:"/posts",
                data: { rssUrl: feed.rssUrl},
                contentType: "application/json; charset=utf-8",
                success: function(posts) {

                    posts.forEach(function(post) {
                        var view = postView(post);
                        that.container.append(view);
                    });
                }
            });
        });
    };
    
    return Reader;
});