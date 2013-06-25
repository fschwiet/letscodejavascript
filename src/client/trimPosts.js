define(["jquery", "views/formTrimPosts.jade"], function($, jadeTrimPosts) {

    function TrimPosts(urlSource) {
        this.content = null;
        this.urlSource = urlSource;
    }

    TrimPosts.prototype.show = function(target) {

        var that = this;

        if (this.content === null) {
            this.content = $(jadeTrimPosts({}).trim());

            this.content.submit(function(event) {

                var inputValue = $("input[name=trimPostsAfter]", that.content).val();
                var limit = parseFloat(inputValue);

                if (isNaN(limit)) {
                    $(".js-warn", that.content).text("A number is expected.");
                    event.preventDefault();
                    return;
                }

                var trimmed = that.urlSource().slice(limit);

                $("input[name='urlList']").val(JSON.stringify(trimmed));
            });

            target.append(this.content);
        }
    };

    return TrimPosts;
});