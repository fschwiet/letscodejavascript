
define(["feeds", "jquery", "views/feeds.jade", "sinon"], function(feeds, $, feedsView) {

    describe("when the feeds page is shown", function() {

        beforeEach(function() {

            this.fixture.append(feedsView({title:"this is the title", isAuthenticated:false, rows:[], isPartialView:true}));
        });

        describe("feeds.js", function() {

            beforeEach(function() {
                fake = this.sinon.useFakeXMLHttpRequest();
            });

            it("supports the delete button", function() {

                $.get("/html");
                expect($("table", this.fixture).length).to.be(1);
            });
        });
    });
});

