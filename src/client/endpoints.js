define(function() {
    return {
        markFinished: function(postUrl, success) {
            $.ajax({
                type: "POST",
                url: "/posts/finished",
                data: JSON.stringify({
                    rssUrl: postUrl
                }),
                contentType: "application/json; charset=utf-8",
                success: success
            });
        },

        markUnfinished: function(postUrl, success) {
            $.ajax({
                type: "POST",
                url: "/posts/unfinished",
                data: JSON.stringify({
                    rssUrl: postUrl
                }),
                contentType: "application/json; charset=utf-8",
                success: success
            });
        }
    };
});