module.exports = function(title, request) {

    return {
        title: title,
        isAuthenticated: typeof request.user == "object",
        flash: request.flash()
    };
};