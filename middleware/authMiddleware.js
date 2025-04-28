const jwt = require('jsonwebtoken');
const config = require('../config');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    console.log('Authenticating token:', {
        path: req.path,
        cookies: req.cookies,
        headers: req.headers
    });

    // Check for token in cookies or Authorization header
    let token = req.cookies.token;
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    
    if (!token) {
        console.log('No token found');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || config.jwtSecret);
        console.log('Token decoded:', {
            userId: decoded.userId,
            username: decoded.username,
            role: decoded.role,
            tenant: decoded.tenant
        });
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check user role
const checkRole = (requiredRole) => {
    return (req, res, next) => {
        console.log('Checking role:', {
            requiredRole,
            userRole: req.user?.role,
            path: req.path
        });

        if (!req.user) {
            console.log('No user found in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Handle both single role and array of roles
        const hasRequiredRole = Array.isArray(requiredRole)
            ? requiredRole.includes(req.user.role)
            : req.user.role === requiredRole;

        if (!hasRequiredRole) {
            console.log('Role mismatch:', {
                required: requiredRole,
                actual: req.user.role
            });
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    checkRole
}; 