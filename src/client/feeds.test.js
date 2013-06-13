
define(["feeds", "jquery", "views/feeds.jade", "sinon"], function(feeds, $, feedsView) {

    describe("when the feeds page is shown", function() {
        var fixture;

        beforeEach(function() {

            this.sinon = sinon.sandbox.create();

            fixture = $("<div class='test-fixture'></div>");
            fixture.append(feedsView({title:"this is the title", isAuthenticated:false, rows:[], isPartialView:true}));
            $("body").append(fixture);
        });

        afterEach(function(){

            fixture.remove();
            this.sinon.restore();
        });

        describe("feeds.js", function() {

            beforeEach(function() {
                fake = this.sinon.useFakeXMLHttpRequest();
            });

            afterEach(function() {
            });

            it("supports the delete button", function() {

                $.get("/html");
                expect(fake.requests.length).to.be(1);
            });
        });
    });

});

