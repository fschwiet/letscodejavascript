require(["feeds", "jquery"], function(feeds, $) { 
    feeds.initialize($("body"));

    window.mainInitialized = true;
});