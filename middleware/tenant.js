const User = require('../models/User');

// Middleware to determine tenant from URL path or header
const determineTenant = (req, res, next) => {
    // First check X-Tenant header
    const tenantHeader = req.headers['x-tenant'];
    if (tenantHeader && (tenantHeader === 'uvu' || tenantHeader === 'uofu')) {
        req.tenant = tenantHeader;
        return next();
    }

    // Then check URL path
    const path = req.path;
    
    // Handle root path
    if (path === '/') {
        return res.redirect('/uvu');
    }

    // Handle tenant paths
    if (path.startsWith('/uvu')) {
        req.tenant = 'uvu';
        // Only modify the URL if it's not the root tenant path
        if (path !== '/uvu') {
            req.url = req.url.replace('/uvu', '');
        }
    } else if (path.startsWith('/uofu')) {
        req.tenant = 'uofu';
        // Only modify the URL if it's not the root tenant path
        if (path !== '/uofu') {
            req.url = req.url.replace('/uofu', '');
        }
    } else {
        return res.status(400).json({ 
            error: 'Invalid tenant path',
            message: 'Please use /uvu or /uofu in the URL path or provide X-Tenant header'
        });
    }
    next();
};

// Middleware to ensure user can only access their tenant's data
const ensureTenantAccess = async (req, res, next) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (user.tenant !== req.tenant) {
            return res.status(403).json({ error: 'Access denied: Invalid tenant' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Error checking tenant access' });
    }
};

// Middleware to add tenant-specific theme
const addTenantTheme = (req, res, next) => {
    if (req.tenant === 'uvu') {
        res.locals.theme = {
            primaryColor: '#0056b3', // UVU Blue
            secondaryColor: '#ffffff', // White
            accentColor: '#e31837', // UVU Red
            textColor: '#333333',
            backgroundColor: '#ffffff',
            buttonColor: '#0056b3',
            buttonTextColor: '#ffffff',
            headerColor: '#0056b3',
            headerTextColor: '#ffffff',
            institutionName: 'Utah Valley University',
            logo: '/images/uvu-logo.png'
        };
    } else if (req.tenant === 'uofu') {
        res.locals.theme = {
            primaryColor: '#CC0000', // U of U Red
            secondaryColor: '#ffffff', // White
            accentColor: '#000000', // Black
            textColor: '#333333',
            backgroundColor: '#ffffff',
            buttonColor: '#CC0000',
            buttonTextColor: '#ffffff',
            headerColor: '#CC0000',
            headerTextColor: '#ffffff',
            institutionName: 'University of Utah',
            logo: '/images/uofu-logo.png'
        };
    }
    next();
};

module.exports = {
    determineTenant,
    ensureTenantAccess,
    addTenantTheme
}; 