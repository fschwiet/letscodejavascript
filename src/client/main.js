require(["feeds", "reader", "trimPostsMonitor", "jquery", "css!clientLib/bootstrap/css/bootstrap"], function(feeds, Reader, trimPostsMonitor, $) {
    feeds.initialize($("body"));

    window.mainInitialized = true;

    if (typeof window.subscribedFeeds !== "undefined") {

        var monitor = trimPostsMonitor.start($(".js-topContainer"), $(".js-postsContainer"), 12);

        window.feedReader = new Reader(monitor);
        window.feedReader.startReader($(".js-postsContainer"), window.subscribedFeeds);
    }
});