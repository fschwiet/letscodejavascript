define(["less!feeds"], function() {

    return {
        initialize: function(region) {
            var unsubscribeLink = ".js-unsubscribe";

            region.on("click", unsubscribeLink, function() {
                var anchor = $(this);
                var row = anchor.parents("[data-rssurl]");
                var rssUrl = row.data("rssurl");
                anchor.hide();

                $.ajax({
                        type: "POST",
                        url: "/feeds/unsubscribe",
                        data: JSON.stringify({
                                rssUrl: rssUrl
                            }),
                        contentType: "application/json; charset=utf-8",
                        success: function() {
                            row.remove();
                        },
                        error: function() {
                            anchor.show();
                        }
                    });
            });
        }
    };
});