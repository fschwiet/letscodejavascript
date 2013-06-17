
define(["reader"], function(Reader) {

    var reader;

    function assertRequestIsGetFor(request, path) {

        expect(request.method).to.be("GET");
        expect(request.url).to.be(path);
    }

    describe("when visiting the reader page", function() {

        beforeEach(function() {
            this.fakeServer = this.sinon.useFakeXMLHttpRequest();

            reader = new Reader();

            reader.startReader(this.fixture, [
                {
                    rssUrl: "http://servera.com/rss"
                },
                {
                    rssUrl: "http://serverb.com/rss"
                }
            ]);
        });

        it("requests entries for all feeds", function() {
            expect(this.fakeServer.requests.length).to.be(2);

            assertRequestIsGetFor(this.fakeServer.requests[0], "/loadFeed?" + JSON.stringify({rssUrl : "http://servera.com/rss"}));
            assertRequestIsGetFor(this.fakeServer.requests[1], "/loadFeed?" + JSON.stringify({rssUrl : "http://serverb.com/rss"}));
        });

        describe("when the entries are returned for a feed", function() {

            it("renders the feed on the page", function() {

                var feedsReturned = [ 
                    {
                        feedName: "first feed",
                        entryName: "first post",
                        entryUrl: "http://someservera.com/firstPost"
                    }
                ];

                this.fakeServer.requests[0].respond(200, { "Content-Type": "application/json"}, JSON.stringify(feedsReturned));

                var articles = [].slice.apply(this.fixture[0].querySelectorAll(".js-post"));

                var contents = articles.map(function(value) {
                    var article = $(value);
                    return {
                        feedName : article.find(".js-feedName").text(),
                        entryName : article.find(".js-entryName").text(),
                        entryUrl : article.find(".js-entryLink").attr("href")
                    };
                });

                expect(JSON.stringify(contents)).to.be(JSON.stringify(feedsReturned));
            });
        });
    });
});

