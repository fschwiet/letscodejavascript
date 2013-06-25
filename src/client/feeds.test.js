define(["feeds", "jquery", "views/feeds.jade", "sinon"], function(feeds, $, feedsView) {

    describe("when the feeds page is shown", function() {

        beforeEach(function() {

            function subscription(name) {
                return {
                    name: name,
                    htmlUrl: "http://server.com/" + name,
                    rssUrl: "http://server.com/" + name + "/rss"
                };
            }

            var templateResult = feedsView({
                    rows: [
                        subscription("first"),
                        subscription("second"),
                        subscription("third")
                    ]
                });

            this.fixture.append(templateResult);

            feeds.initialize(this.fixture);
        });

        describe("when the unsubscribe button is clicked", function() {

            var secondRow;
            var secondRowRssUrl;

            beforeEach(function() {

                this.fakeServer = this.sinon.useFakeXMLHttpRequest();

                secondRow = $(".js-subscription:eq(1)", this.fixture);
                secondRowRssUrl = secondRow.data("rssurl");

                expect(secondRow.length).to.be(1);

                this.fixtureContainsSecondRow = function() {
                    return jQuery.contains(this.fixture[0], secondRow[0]);
                };

                expect(this.fixtureContainsSecondRow()).to.be(true);
                expect(secondRowRssUrl).to.be("http://server.com/second/rss");

                secondRow.find("a.js-unsubscribe").click();
            });

            it("will hide the row ", function() {
                expect(this.fixtureContainsSecondRow()).to.be(false);
            });

            it("will notify the server", function() {

                expect(this.fakeServer.requests.length).to.be(1);

                var request = this.fakeServer.requests[0];

                expect(request.url).to.be("/feeds/unsubscribe");
                expect(request.method).to.be("POST");
                expect(request.requestBody).to.be(JSON.stringify({
                            rssUrl: secondRowRssUrl
                        }));
            });
        });
    });
});