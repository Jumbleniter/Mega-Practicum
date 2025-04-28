const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const config = require('./config');
const tenantMiddleware = require('./middleware/tenantMiddleware');
const authMiddleware = require('./middleware/authMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const taRoutes = require('./routes/ta');
const studentRoutes = require('./routes/student');
const courseRoutes = require('./routes/courses');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/course_management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Basic middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Log request details
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Serve static files from public directory - must come before tenant middleware
app.use(express.static(path.join(__dirname, 'public')));

// Root route - show tenant selection
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Tenant middleware - must come after static files but before routes
app.use(tenantMiddleware.determineTenant);
app.use(tenantMiddleware.verifyTenantAccess);

// Tenant-specific routes
app.get('/:tenant', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Mount routes with proper tenant handling
app.use('/:tenant/auth', authRoutes);

// Admin route - serve admin.html
app.get('/:tenant/admin', authMiddleware.authenticateToken, authMiddleware.checkRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Admin API routes
app.use('/:tenant/admin/api', authMiddleware.authenticateToken, authMiddleware.checkRole('admin'), adminRoutes);

// Other protected routes
app.use('/:tenant/teacher', authMiddleware.authenticateToken, authMiddleware.checkRole('teacher'), teacherRoutes);
app.use('/:tenant/ta', authMiddleware.authenticateToken, authMiddleware.checkRole('ta'), taRoutes);
app.use('/:tenant/student', authMiddleware.authenticateToken, authMiddleware.checkRole('student'), studentRoutes);
app.use('/:tenant/courses', authMiddleware.authenticateToken, courseRoutes);
app.use('/:tenant/logs', authMiddleware.authenticateToken, logRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error in application:', err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app; 