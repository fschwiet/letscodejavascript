define([], function() {

    return {
        initialize: function(region) {
            region.on("click", ".js-unsubscribe", function() {
                var row = $(this).parents("[data-rssurl]");
                var ressUrl = row.data("rssurl");
                row.remove();
            });
        }
    };
});