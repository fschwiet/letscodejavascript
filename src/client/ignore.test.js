define(["ignore"], function(testModule) {
    describe("sample test", function() {
        it("has a test", function() {

            expect(testModule.truth()).to.be(true);
        });
    });
});