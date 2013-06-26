
define(["trimPostsMonitor", "trimPostsForm", "views/post.jade"], function(trimPostsMonitor, trimPostForms, postView) {

    var topContainer, postsContainer;

    beforeEach(function() {

        topContainer = $("<div>");
        this.fixture.append(topContainer);

        postsContainer = $("<div>");
        this.fixture.append(postsContainer);
    });

    it("creates a trimPostsMonitor", function() {

        this.sinon.spy(trimPostForms, "create");

        var expectedDefault = 123654;

        trimPostsMonitor.start(topContainer, postsContainer, expectedDefault);

        expect(trimPostForms.create.callCount).to.be(1);
        
        var call = trimPostForms.create.getCall(0);

        expect(call.args[0]).to.be(expectedDefault);
        expect(typeof call.args[1]).to.be('function');
        expect(call.args[2]).to.be(topContainer);

        var postUrlExtractor = call.args[1];

        expect(postUrlExtractor().length).to.be(0);

        var firstUrl = "http://url/a";
        var secondUrl = "http://url/b";

        postsContainer.append(postView({
            post: {
                feedName: "a",
                postName: "a",
                postUrl : firstUrl,
                postDate: new Date(2012,1,1)
            }
        }));

        postsContainer.append(postView({
            post: {
                feedName: "b",
                postName: "b",
                postUrl : secondUrl,
                postDate: new Date(2012,1,2)
            }
        }));

        expect(postUrlExtractor().length).to.be(2);
    });

    it("calls show() immediately if the page starts with enough posts", function() {

    });

    it("check() calls show() once if there are enough posts", function() {

    });
});