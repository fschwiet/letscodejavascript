


module.exports = function(title, request) {
    return {
        title: title,
        isAuthenticated : typeof request.deserializeUser == "object"
    };
};
