define([], function() {

    return {
        initialize: function(region) {
            region.on("click", ".js-unsubscribe", function() {
                var row = $(this).parents("[data-rssurl]");
                var rssUrl = row.data("rssurl");
                row.remove();

                $.post("/feeds/unsubscribe", JSON.stringify({ rssUrl: rssUrl}), function() {}, "json");
            });
        }
    };
});