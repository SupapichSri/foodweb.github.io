// middleware/requireAuth.js

function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login'); // Redirects to login if user is not authenticated
    }
    next(); // Proceeds to the route handler if authenticated
}

module.exports = requireAuth;
