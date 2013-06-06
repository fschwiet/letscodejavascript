


exports.standard = function(title, request) {
    return {
        title: title,
        isAuthenticated : typeof request.deserializeUser == "object"
    };
};
