require(["feeds", "reader", "jquery"], function(feeds, Reader, $) { 
    feeds.initialize($("body"));

    window.mainInitialized = true;

    if (typeof window.subscribedFeeds !== "undefined") {
        window.feedReader = new Reader();
        window.feedReader.startReader($("body"), window.subscribedFeeds);
    }
});