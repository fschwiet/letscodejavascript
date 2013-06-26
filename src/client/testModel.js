
define(["views/post.jade"], function(postView) {

    return {
        getPostWithUrl : function(postUrl) {
            return postView({
                post: {
                    feedName: "feed for " + postUrl,
                    postName: "post for "+ postUrl,
                    postUrl : postUrl,
                    postDate: new Date(2012,1,1)
                }
            });
        }
    };
});
