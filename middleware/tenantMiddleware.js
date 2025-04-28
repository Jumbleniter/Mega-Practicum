const User = require('../models/User');
const config = require('../config');

// Middleware to determine tenant from URL path
const determineTenant = (req, res, next) => {
    // Skip for static files and favicon
    if (req.path.startsWith('/js/') || 
        req.path.startsWith('/css/') || 
        req.path.startsWith('/images/') || 
        req.path === '/favicon.ico') {
        return next();
    }

    // Extract tenant from path
    const pathParts = req.path.split('/');
    const tenant = pathParts[1];

    // Validate tenant
    if (tenant && (tenant === 'uvu' || tenant === 'uofu')) {
        req.tenant = tenant;
        return next();
    }

    // If no valid tenant found, default to UVU
    req.tenant = 'uvu';
    next();
};

// Middleware to verify tenant access
const verifyTenantAccess = async (req, res, next) => {
    // Skip for static files and favicon
    if (req.path.startsWith('/js/') || 
        req.path.startsWith('/css/') || 
        req.path.startsWith('/images/') || 
        req.path === '/favicon.ico') {
        return next();
    }

    // For protected routes, verify user's tenant
    if (req.user) {
        try {
            const user = await User.findById(req.user.userId);
            if (!user || user.tenant !== req.tenant) {
                return res.status(403).json({ error: 'Access denied: Invalid tenant' });
            }
        } catch (error) {
            console.error('Error verifying tenant access:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    next();
};

module.exports = {
    determineTenant,
    verifyTenantAccess
}; 