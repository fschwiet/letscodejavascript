
define(["feeds", "jquery", "views/feeds.jade", "sinon"], function(feeds, $, feedsView) {

    describe("when the feeds page is shown", function() {

        beforeEach(function() {

            var templateResult = feedsView({title:"this is the title", isAuthenticated:false, rows:[]});
            this.fixture.append(templateResult);
        });

        describe("feeds.js", function() {

            beforeEach(function() {
                this.fakeServer = this.sinon.useFakeXMLHttpRequest();
            });

            it("supports the delete button", function() {

                $.get("/html");
                expect(this.fakeServer.requests.length).to.be(1);
                expect($("table", this.fixture).length).to.be(1);
            });
        });
    });
});

