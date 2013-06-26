define(["less!feeds"], function() {

    return {
        initialize: function(region) {
            var unsubscribeLink = ".js-unsubscribe";

            region.on("click", unsubscribeLink, function() {
                var row = $(this).parents("[data-rssurl]");
                var rssUrl = row.data("rssurl");
                row.remove();

                $.ajax({
                        type: "POST",
                        url: "/feeds/unsubscribe",
                        data: JSON.stringify({
                                rssUrl: rssUrl
                            }),
                        contentType: "application/json; charset=utf-8"
                    });
            });
        }
    };
});