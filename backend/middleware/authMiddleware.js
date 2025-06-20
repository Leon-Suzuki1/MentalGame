const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_very_secret_key_that_should_be_in_env'; // Ensure this matches the one in authController

exports.protect = (req, res, next) => {
    let token;
    // Check for Authorization header and Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, JWT_SECRET);

            // Add user from payload to request object
            // We retrieve the full user from DB to ensure it's up-to-date and exists
            // For simplicity in this step, we'll just attach the decoded payload.
            // In a more robust app, you might fetch user from DB using decoded.user.id
            req.user = decoded.user;
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};
