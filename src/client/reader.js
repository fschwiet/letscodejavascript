define(function() {

    function Reader() {
        this.container = null;
    }

    Reader.prototype.startReader = function(domContainer, feeds) {

        this.container = domContainer;

        feeds.forEach(function(feed) {
            
            $.ajax({
                type:"GET",
                url:"/loadFeed",
                data: JSON.stringify({ rssUrl: feed.rssUrl}),
                contentType: "application/json; charset=utf-8"
            });
        });
    };
    
    return Reader;
});