
define(["feeds", "jquery", "views/error500.jade", "sinon"], function(feeds, $, error500) {

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

            console.log("error500", error500({title:"this is the title", isAuthenticated:false}));
            $.get("/html");
            expect(fake.requests.length).to.be(1);
        });
    });
});

