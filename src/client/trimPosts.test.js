
/* jshint scripturl: true */

define(["jquery", "trimPosts"], function($, TrimPosts) {

    describe("trimPosts", function() {

        var selectors = TrimPosts.selectors;
        
        var trimPosts = null;
        var defaultLimit = 123654;

        beforeEach(function() {

            trimPosts = new TrimPosts(defaultLimit, function() {
                return ['postUrlA', 'postUrlB', 'postUrlC', 'postUrlD'];
            });

            expectFormCountToBe(0);
            trimPosts.show(this.fixture);
            expectFormCountToBe(1);

            //  Prevent the submit action from redirecting the browser
            $(selectors.formSelector).attr("action", "javascript:void(0)");
        });

        function getWarning() {
            return $(selectors.warnText, $(selectors.formSelector));
        }

        function expectFormCountToBe(value) {
            expect($(selectors.formSelector).length).to.be(value);
        }

        it("shows a form", function() {

            trimPosts.show(this.fixture);
            trimPosts.show(this.fixture);
            expectFormCountToBe(1);
        });

        it("sets the default value", function() {
            expect($(selectors.countSelector).val()).to.be(defaultLimit.toString());
        });

        describe("when the form is submited", function() {

            beforeEach(function() {
                $(selectors.formSelector).find(selectors.countSelector).val("2");
                $(selectors.formSelector).submit();
            });

            it("sets an input value with a list of all postUrls after the index", function() {
                expect($(selectors.formSelector).find(selectors.hiddenInputSelector).val())
                    .to.be(JSON.stringify(['postUrlC', 'postUrlD']));
            });
        });

        describe("when the form is submitted with an invalid value", function() {

            var submitEvent;

            beforeEach(function() {

                expect(getWarning().text().length).to.be(0);

                $(selectors.formSelector).find(selectors.countSelector).val("");

                submitEvent = $.Event('submit');

                $(selectors.formSelector).trigger(submitEvent);
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

