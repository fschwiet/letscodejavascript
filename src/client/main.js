require(["feeds", "reader", "jquery", "css!clientLib/bootstrap/css/bootstrap"], function(feeds, Reader, $) {
    feeds.initialize($("body"));

    window.mainInitialized = true;

    if (typeof window.subscribedFeeds !== "undefined") {
        window.feedReader = new Reader();
        window.feedReader.startReader($(".js-postsContainer"), window.subscribedFeeds);
    }
});