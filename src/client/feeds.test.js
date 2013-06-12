
define(["feeds", "jquery", "sinon"], function(feeds, $) {

    var fake;

    beforeEach(function() {

        this.sinon = sinon.sandbox.create();
    });

    afterEach(function(){
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

