const User = require('../models/User');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user has admin role
const isAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && user.role === 'admin') {
            return next();
        }
        res.status(403).json({ error: 'Admin access required' });
    } catch (error) {
        res.status(500).json({ error: 'Error checking admin status' });
    }
};

// Middleware to check if user has teacher role
const isTeacher = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && (user.role === 'teacher' || user.role === 'admin')) {
            return next();
        }
        res.status(403).json({ error: 'Teacher access required' });
    } catch (error) {
        res.status(500).json({ error: 'Error checking teacher status' });
    }
};

// Middleware to check if user has TA role
const isTA = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user && (user.role === 'ta' || user.role === 'teacher' || user.role === 'admin')) {
            return next();
        }
        res.status(403).json({ error: 'TA access required' });
    } catch (error) {
        res.status(500).json({ error: 'Error checking TA status' });
    }
};

// Middleware to check if user is student or has higher role
const isStudent = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (user) {
            return next();
        }
        res.status(403).json({ error: 'Authentication required' });
    } catch (error) {
        res.status(500).json({ error: 'Error checking user status' });
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isTeacher,
    isTA,
    isStudent
}; 