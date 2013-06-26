
define(["trimPostsMonitor", "trimPostsForm", "views/post.jade"], function(trimPostsMonitor, trimPostForms, postView) {

    var topContainer, postsContainer;

    beforeEach(function() {

        topContainer = $("<div>");
        this.fixture.append(topContainer);

        postsContainer = $("<div>");
        this.fixture.append(postsContainer);
    });

    function getPostWithUrl(url) {
        return postView({
            post: {
                feedName: "feed for " + url,
                postName: "post for "+ url,
                postUrl : url,
                postDate: new Date(2012,1,1)
            }
        });
    }

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

        postsContainer.append(getPostWithUrl(firstUrl));
        postsContainer.append(getPostWithUrl(secondUrl));

        expect(postUrlExtractor().length).to.be(2);
    });

    describe("calls show() when appropriate", function() {

        var showCount;

        beforeEach(function() {

            showCount = 0;

            this.sinon.stub(trimPostForms, "create", function() {
                return {
                    show : function() {
                        showCount++;
                    }
                };
            });
        });

        describe("calls show() immediately if the page starts with enough posts", function() {

            it("when created with just a few posts, don't call show", function() {

                postsContainer.append(getPostWithUrl("some url"));
                postsContainer.append(getPostWithUrl("some other"));

                trimPostsMonitor.start(topContainer, postsContainer, 3);

                expect(showCount).to.be(0);
            });

            it("when created with enough posts, call show", function() {

                postsContainer.append(getPostWithUrl("some url"));
                postsContainer.append(getPostWithUrl("some other"));
                postsContainer.append(getPostWithUrl("some other baz"));

                trimPostsMonitor.start(topContainer, postsContainer, 3);

                expect(showCount).to.be(1);
            });
        });

        it("check() calls show() once if there are enough posts", function() {

            var monitor = trimPostsMonitor.start(topContainer, postsContainer, 3);

            postsContainer.append(getPostWithUrl("some url"));
            postsContainer.append(getPostWithUrl("some other"));

            monitor.check();
            expect(showCount).to.be(0);

            postsContainer.append(getPostWithUrl("some other baz"));

            monitor.check();
            expect(showCount).to.be(1);

            monitor.check();
            monitor.check();
            expect(showCount).to.be(1);
        });
    });
});