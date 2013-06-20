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

            reader.startReader(this.fixture, [{
                        rssUrl: "http://servera.com/rss"
                    }, {
                        rssUrl: "http://serverb.com/rss"
                    }
                ]);
        });

        it("requests entries for all feeds", function() {
            expect(this.fakeServer.requests.length).to.be(2);

            assertRequestIsGetFor(this.fakeServer.requests[0], "/posts?" + $.param({
                        rssUrl: "http://servera.com/rss"
                    }));
            assertRequestIsGetFor(this.fakeServer.requests[1], "/posts?" + $.param({
                        rssUrl: "http://serverb.com/rss"
                    }));
        });

        describe("when the entries are returned for a feed", function() {

            var feedsReturnedByFirstServer = [{
                    feedName: "first feed",
                    postName: "first post",
                    postUrl: "http://someservera.com/firstPost",
                    postDate: new Date("June 2, 2013")
                }
            ];

            beforeEach(function() {

                this.fakeServer.requests[0].respond(200, {
                        "Content-Type": "application/json"
                    }, JSON.stringify(feedsReturnedByFirstServer));
            });

            function extractPostsFromPage(fixture) {
                var articles = [].slice.apply(fixture[0].querySelectorAll(".js-post"));

                return articles.map(function(value) {
                    var article = $(value);
                    return {
                        feedName: article.find(".js-feedName").text().trim(),
                        postName: article.find(".js-postName").text().trim(),
                        postUrl: article.find(".js-postLink").attr("href").trim(),
                        postDate: article.data("postdate")
                    };
                });
            }

            it("renders the feed on the page", function() {

                var contents = extractPostsFromPage(this.fixture);

                expect(JSON.stringify(contents)).to.be(JSON.stringify(feedsReturnedByFirstServer));
            });

            describe("when the entries are received for a second feed", function() {

                var feedsReturnedBySecondServer = [
                    {
                        feedName: "second feed",
                        postName: "earlier post",
                        postUrl: "http://someservera.com/earlierPost",
                        postDate: new Date("June 1, 2013")
                    }, 
                    {
                        feedName: "second feed",
                        postName: "later post",
                        postUrl: "http://someservera.com/laterPost",
                        postDate: new Date("June 3, 2013")
                    }
                ];

                beforeEach(function() {

                    this.fakeServer.requests[1].respond(200, {
                            "Content-Type": "application/json"
                        }, JSON.stringify(feedsReturnedBySecondServer));
                });

                it("inserts the feed items in chronological order", function() {

                    var titles = extractPostsFromPage(this.fixture).map(function(val) { return val.postName; });

                    expect(JSON.stringify(titles)).to.be(JSON.stringify([
                            "later post",
                            "first post",
                            "earlier post"
                        ]));
                });
            });

            describe("when the 'mark finished' button is clicked", function() {

                var finishRequest;

                function findMarkFinishedButton(fixture) {
                    return $(".js-post:contains('first post') a.js-finishedButton:visible", fixture);
                }

                function findMarkUnfinishedButton(fixture) {
                    return $(".js-post:contains('first post') a.js-unfinishedButton:visible", fixture);
                }

                beforeEach(function() {

                    this.fakeServer.requests = [];

                    expect(findMarkFinishedButton(this.fixture).length).to.be(1);
                    expect(findMarkUnfinishedButton(this.fixture).length).to.be(0);
                    findMarkFinishedButton(this.fixture).click();
                });


                it("sends a request marking the post as read", function() {

                    expect(this.fakeServer.requests.length).to.be(1);

                    var request = this.fakeServer.requests[0];

                    expect(request.url).to.be("/posts/finished");
                    expect(request.method).to.be("POST");
                    expect(request.requestBody).to.be(JSON.stringify({
                                url: "http://someservera.com/firstPost"
                            }));
                });

                it("removes the button", function() {

                    expect(findMarkFinishedButton(this.fixture).length).to.be(0);
                    expect(findMarkUnfinishedButton(this.fixture).length).to.be(0);
                });

                describe("when the finished request completes", function() {

                    beforeEach(function() {
                        this.fakeServer.requests[0].respond(200);
                        this.fakeServer.requests = [];
                    });

                    it("shows the unfinish button", function() {
                        expect(findMarkFinishedButton(this.fixture).length).to.be(0);
                        expect(findMarkUnfinishedButton(this.fixture).length).to.be(1);
                    });

                    describe("when the unfinish button is clicked", function() {

                        beforeEach(function() {

                            findMarkUnfinishedButton(this.fixture).click();
                        });

                        it("sends a web request", function() {

                            expect(this.fakeServer.requests.length).to.be(1);

                            var request = this.fakeServer.requests[0];

                            expect(request.url).to.be("/posts/unfinished");
                            expect(request.method).to.be("POST");
                            expect(request.requestBody).to.be(JSON.stringify({
                                url: "http://someservera.com/firstPost"
                            }));
                        });

                        it("hides the unfinished button", function() {

                            expect(findMarkFinishedButton(this.fixture).length).to.be(0);
                            expect(findMarkUnfinishedButton(this.fixture).length).to.be(0);
                        });

                        describe("when the 'unfinished' web request complets", function() {

                            beforeEach(function() {
                                this.fakeServer.requests[0].respond(200);
                                this.fakeServer.requests = [];
                            });

                            it("shows the finish button", function() {

                                expect(findMarkFinishedButton(this.fixture).length).to.be(1);
                                expect(findMarkUnfinishedButton(this.fixture).length).to.be(0);
                            });
                        });
                    });
                });
            });
        });
    });
});