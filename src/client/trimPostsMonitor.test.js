define(["trimPostsMonitor", "trimPostsForm", "testModel"], function(trimPostsMonitor, trimPostForms, testModel) {

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

        postsContainer.append(testModel.getPostWithUrl(firstUrl));
        postsContainer.append(testModel.getPostWithUrl(secondUrl));

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

                postsContainer.append(testModel.getPostWithUrl("some url"));
                postsContainer.append(testModel.getPostWithUrl("some other"));
                postsContainer.append(testModel.getPostWithUrl("some other one"));

                trimPostsMonitor.start(topContainer, postsContainer, 3);

                expect(showCount).to.be(0);
            });

            it("when created with enough posts, call show", function() {

                postsContainer.append(testModel.getPostWithUrl("some url"));
                postsContainer.append(testModel.getPostWithUrl("some other"));
                postsContainer.append(testModel.getPostWithUrl("some other baz"));
                postsContainer.append(testModel.getPostWithUrl("some other baz foo"));

                trimPostsMonitor.start(topContainer, postsContainer, 3);

                expect(showCount).to.be(1);
            });
        });

        it("check() calls show() once if there are enough posts", function() {

            var monitor = trimPostsMonitor.start(topContainer, postsContainer, 3);

            postsContainer.append(testModel.getPostWithUrl("some url"));
            postsContainer.append(testModel.getPostWithUrl("some other"));
            postsContainer.append(testModel.getPostWithUrl("some other faz"));

            monitor.check();
            expect(showCount).to.be(0);

            postsContainer.append(testModel.getPostWithUrl("some other baz"));

            monitor.check();
            expect(showCount).to.be(1);

            monitor.check();
            monitor.check();
            expect(showCount).to.be(1);
        });
    });
});