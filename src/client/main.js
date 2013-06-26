require(["feeds", "reader", "trimPostsMonitor", "jquery", "css!clientLib/bootstrap/css/bootstrap", "css!clientLib/bootstrap/css/bootstrap-responsive"], function(feeds, Reader, trimPostsMonitor, $) {
    feeds.initialize($("body"));

    window.mainInitialized = true;

    if (typeof window.subscribedFeeds !== "undefined") {

        var monitor = trimPostsMonitor.start($(".js-topContainer"), $(".js-postsContainer"), 12);

        window.feedReader = new Reader(monitor);
        window.feedReader.startReader($(".js-postsContainer"), window.subscribedFeeds);
    }

    // google analytics code
    (function (i, s, o, g, r, a, m) {
        i.GoogleAnalyticsObject = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
        };
        i[r].l = 1 * new Date();
        a = s.createElement(o);
        m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    ga('create', 'UA-42050413-1', 'asimplereader.com');
    ga('send', 'pageview');
});