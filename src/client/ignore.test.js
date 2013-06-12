define(["ignore"], function(testModule) {
    describe("sample test", function() {
        it("has a test", function() {

            testModule.helloWorld();
            expect(testModule.truth()).to.be(true);
        });
});});

