define(["trimPostsForm"], function(trimPostsForm) {

    return {
        start : function(topContainer, postsContainer, defaultLimit) {

            var form = trimPostsForm.create(defaultLimit, function() {
                return Array.prototype.slice.call(postsContainer[0].querySelectorAll(".js-post")).map(function(post) {
                    return $(post).find(".js-postLink").attr("href");
                });
            }, topContainer);

            var needShow = true;

            function tryShow() {
                if (needShow) {
                    if (postsContainer.find(".js-post").length > defaultLimit) {
                        form.show();
                        needShow = false;
                    }
                }
            }

            tryShow();

            return {
                check: function() {
                    tryShow();
                }
            };
        },
    };
});