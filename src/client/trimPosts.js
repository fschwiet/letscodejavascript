define(["jquery", "views/formTrimPosts.jade"], function($, jadeTrimPosts) {

    function TrimPosts(defaultLimit, urlSource) {

        this.defaultLimit = defaultLimit;
        this.urlSource = urlSource;

        this.content = null;
    }

    var selectors = {
        formSelector: "form",
        hiddenInputSelector: "input[name='urlList']",
        countSelector: "input[name='countToKeep']",
        warnText: ".js-warn"
    };

    TrimPosts.prototype.show = function(target) {

        var that = this;

        if (this.content === null) {
            this.content = $(jadeTrimPosts({}).trim());

            $(selectors.countSelector, that.content).val(that.defaultLimit);

            this.content.submit(function(event) {

                var inputValue = $(selectors.countSelector, that.content).val();
                var limit = parseFloat(inputValue);

                if (isNaN(limit)) {
                    $(selectors.warnText, that.content).text("A number is expected.");
                    event.preventDefault();
                    return;
                }

                var trimmed = that.urlSource().slice(limit);

                $(selectors.hiddenInputSelector).val(JSON.stringify(trimmed));
            });

            target.append(this.content);
        }
    };

    return {
        selectors: selectors,
        create : function(defaultLimit, urlSource) {
            return new TrimPosts(defaultLimit, urlSource);
        }
    };
});