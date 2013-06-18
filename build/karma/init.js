define(["jquery", "sinon"], function($) {

    window.mocha.globals(['jQuery*', 'XMLHttpRequest']);

    beforeEach(function() {

        this.sinon = sinon.sandbox.create();

        this.fixture = $("<div class='test-fixture'></div>");
        $("body").append(this.fixture);
    });

    afterEach(function() {

        this.fixture.remove();
        this.sinon.restore();
    });
});