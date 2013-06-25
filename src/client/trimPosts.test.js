
/* jshint scripturl: true */

define(["jquery", "trimPosts"], function($, TrimPosts) {

    describe("trimPosts", function() {

        var trimPosts = null;

        beforeEach(function() {

            trimPosts = new TrimPosts(function() {
                return ['postUrlA', 'postUrlB', 'postUrlC', 'postUrlD'];
            });

            expectFormCountToBe(0);
            trimPosts.show(this.fixture);
            expectFormCountToBe(1);

            //  Prevent the submit action from redirecting the browser
            $(formSelector).attr("action", "javascript:void(0)");
        });

        var formSelector = "form";
        var hiddenInputSelector = "input[name='urlList']";
        var countSelector = "input[name='trimPostsAfter']";

        function getWarning() {
            return $(".js-warn", $(formSelector));
        }

        function expectFormCountToBe(value) {
            expect($(formSelector).length).to.be(value);
        }

        it("shows a form", function() {

            trimPosts.show(this.fixture);
            trimPosts.show(this.fixture);
            expectFormCountToBe(1);
        });

        describe("when the form is submited", function() {

            beforeEach(function() {
                $(formSelector).find(countSelector).val("2");
                $(formSelector).submit();
            });

            it("sets an input value with a list of all postUrls after the index", function() {
                expect($(formSelector).find(hiddenInputSelector).val())
                    .to.be(JSON.stringify(['postUrlC', 'postUrlD']));
            });
        });

        describe("when the form is submitted with an invalid value", function() {

            var submitEvent;

            beforeEach(function() {

                expect(getWarning().text().length).to.be(0);

                $(formSelector).find(countSelector).val("");

                submitEvent = $.Event('submit');

                $(formSelector).trigger(submitEvent);
            });

            it("shows an user message", function() {

                expect(getWarning().text().length).to.be.greaterThan(10);

            });

            it("prevents the submit", function() {
                expect(submitEvent.isDefaultPrevented()).to.be(true);
            });
        });
    });
});

