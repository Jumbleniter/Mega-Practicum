require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Course = require('./models/Course');
const Log = require('./models/Log');
const User = require('./models/User');
const { isAuthenticated, isAdmin, isTeacher, isTA, isStudent } = require('./middleware/auth');
const { determineTenant, ensureTenantAccess, addTenantTheme } = require('./middleware/tenant');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB with detailed logging
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('Successfully connected to MongoDB');
        // Verify the connection by checking if we can list collections
        return mongoose.connection.db.listCollections().toArray();
    })
    .then(collections => {
        console.log('Available collections:', collections.map(c => c.name));
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            codeName: err.codeName
        });
        process.exit(1);
    });

// Middleware
app.use(express.json());

// CORS configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-Tenant');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Tenant-specific middleware
app.use(determineTenant);
app.use(addTenantTheme);

// Authentication Routes
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { username, tenant: req.tenant }); // Debug log

        const user = await User.findOne({ username, tenant: req.tenant });
        console.log('Found user:', user ? 'yes' : 'no'); // Debug log

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare passwords using bcrypt
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user._id;
        req.session.tenant = req.tenant;
        res.json({ message: 'Login successful' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

app.post('/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logout successful' });
    });
});

app.get('/auth/status', (req, res) => {
    const theme = req.tenant === 'uvu' ? {
        primaryColor: '#006400', // UVU Green
        secondaryColor: '#ffffff', // White
        accentColor: '#e31837', // UVU Red
        textColor: '#333333',
        backgroundColor: '#ffffff',
        buttonColor: '#006400',
        buttonTextColor: '#ffffff',
        headerColor: '#006400',
        headerTextColor: '#ffffff',
        institutionName: 'Utah Valley University',
        logo: '/images/uvu-logo.png'
    } : {
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

    res.json({
        authenticated: !!req.session.userId,
        userId: req.session.userId,
        tenant: req.session.tenant,
        theme: theme
    });
});

// Serve index.html for tenant paths
app.get('/uvu', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/uofu', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/uvu/courses', isAuthenticated, ensureTenantAccess, async (req, res) => {
    try {
        const courses = await Course.find({ tenant: 'uvu' }).sort({ display: 1 });
        res.json(courses);
    } catch (error) {
        console.error('Error retrieving courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});

app.get('/uofu/courses', isAuthenticated, ensureTenantAccess, async (req, res) => {
    try {
        const courses = await Course.find({ tenant: 'uofu' }).sort({ display: 1 });
        res.json(courses);
    } catch (error) {
        console.error('Error retrieving courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});

app.post('/uvu/courses', isAuthenticated, ensureTenantAccess, isTeacher, async (req, res) => {
    try {
        const newCourse = {
            ...req.body,
            tenant: 'uvu',
            teacher: req.session.userId
        };
        
        const course = new Course(newCourse);
        await course.save();
        
        console.log(`New course added: ${newCourse.display}`);
        res.status(201).json(course);
    } catch (error) {
        console.error('Error adding new course:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to add course' });
    }
});

app.post('/uofu/courses', isAuthenticated, ensureTenantAccess, isTeacher, async (req, res) => {
    try {
        const newCourse = {
            ...req.body,
            tenant: 'uofu',
            teacher: req.session.userId
        };
        
        const course = new Course(newCourse);
        await course.save();
        
        console.log(`New course added: ${newCourse.display}`);
        res.status(201).json(course);
    } catch (error) {
        console.error('Error adding new course:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to add course' });
    }
});

app.get('/logs', isAuthenticated, ensureTenantAccess, async (req, res) => {
    const { courseId, uvuId } = req.query;
    
    if (!uvuId) {
        return res.status(400).json({ error: 'UVU ID is required' });
    }

    try {
        const query = { uvuId, tenant: req.tenant };
        if (courseId) {
            query.courseId = courseId;
        }
        
        const logs = await Log.find(query).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        console.error('Error retrieving logs:', error);
        res.status(500).json({ error: 'Failed to retrieve logs' });
    }
});

app.post('/logs', isAuthenticated, ensureTenantAccess, async (req, res) => {
    const newLog = {
        ...req.body,
        tenant: req.tenant
    };
    
    try {
        const log = new Log(newLog);
        await log.save();
        
        console.log(`New log added for UVU ID: ${newLog.uvuId}`);
        res.json(log);
    } catch (error) {
        console.error('Error saving new log:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to save log' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'error.html'));
});

// Start server
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`UVU tenant: http://localhost:${PORT}/uvu`);
        console.log(`UofU tenant: http://localhost:${PORT}/uofu`);
    });
}

module.exports = app; 