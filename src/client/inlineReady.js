
window.ready = function(callback) {
    require(
        ["jquery"], 
        function() { 
            callback();
        });
}