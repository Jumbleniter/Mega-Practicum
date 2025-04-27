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
app.post('/:tenant/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const tenant = req.params.tenant;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find user
        const user = await User.findOne({ username, tenant });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Set session
        req.session.user = {
            id: user._id,
            username: user.username,
            role: user.role,
            tenant: user.tenant
        };

        // Return user info and theme
        const theme = tenant === 'uvu' ? {
            primaryColor: '#0056b3',
            secondaryColor: '#e31837',
            accentColor: '#000000'
        } : {
            primaryColor: '#CC0000',
            secondaryColor: '#000000',
            accentColor: '#ffffff'
        };

        res.json({
            message: 'Login successful',
            user: {
                username: user.username,
                role: user.role,
                tenant: user.tenant
            },
            theme
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
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

    if (!req.session.userId) {
        return res.json({
            authenticated: false,
            theme: theme
        });
    }

    User.findById(req.session.userId)
        .then(user => {
            res.json({
                authenticated: true,
                userId: req.session.userId,
                tenant: req.session.tenant,
                role: user.role,
                theme: theme
            });
        })
        .catch(error => {
            console.error('Error fetching user role:', error);
            res.status(500).json({ error: 'Error fetching user information' });
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

// Teacher creation route
app.post('/:tenant/teachers', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password } = req.body;
    const tenant = req.params.tenant;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username, tenant });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new teacher
        const user = new User({
            username,
            password,
            role: 'teacher',
            tenant
        });

        await user.save();
        res.status(201).json({ message: 'Teacher created successfully' });
    } catch (error) {
        console.error('Teacher creation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// TA creation route
app.post('/:tenant/tas', isAuthenticated, isAdmin, async (req, res) => {
    const { username, password } = req.body;
    const tenant = req.params.tenant;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if username already exists
        const existingUser = await User.findOne({ username, tenant });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new TA
        const user = new User({
            username,
            password,
            role: 'ta',
            tenant
        });

        await user.save();
        res.status(201).json({ message: 'TA created successfully' });
    } catch (error) {
        console.error('TA creation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Student creation route
app.post('/:tenant/students', isAuthenticated, isTeacher, async (req, res) => {
    try {
        const { username, password, uvuId } = req.body;
        const tenant = req.params.tenant;

        // Check if username already exists
        const existingUser = await User.findOne({ username, tenant });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if UVU ID already exists
        const existingStudent = await User.findOne({ uvuId, tenant });
        if (existingStudent) {
            return res.status(400).json({ error: 'UVU ID already exists' });
        }

        // Create new student
        const student = new User({
            username,
            password,
            uvuId,
            tenant,
            role: 'student'
        });

        await student.save();
        res.status(201).json({ message: 'Student created successfully' });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// Get teacher's courses
app.get('/:tenant/teacher/courses', isAuthenticated, isTeacher, async (req, res) => {
    try {
        const courses = await Course.find({ 
            tenant: req.params.tenant,
            teacher: req.session.userId 
        }).sort({ display: 1 });
        res.json(courses);
    } catch (error) {
        console.error('Error retrieving teacher courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});

// Get TA's courses
app.get('/:tenant/ta/courses', isAuthenticated, isTA, async (req, res) => {
    try {
        const courses = await Course.find({ 
            tenant: req.params.tenant,
            tas: req.session.userId 
        }).sort({ display: 1 });
        res.json(courses);
    } catch (error) {
        console.error('Error retrieving TA courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});

// Get course logs for TA
app.get('/:tenant/ta/courses/:courseId/logs', isAuthenticated, isTA, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.params.tenant,
            tas: req.session.userId
        });

        if (!course) {
            return res.status(403).json({ error: 'Access denied: Not assigned to this course' });
        }

        const logs = await Log.find({
            courseId: req.params.courseId,
            tenant: req.params.tenant
        }).sort({ date: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error retrieving course logs:', error);
        res.status(500).json({ error: 'Failed to retrieve logs' });
    }
});

// TA student creation route
app.post('/:tenant/ta/students', isAuthenticated, isTA, async (req, res) => {
    try {
        const { username, password, uvuId } = req.body;
        const tenant = req.params.tenant;

        // Check if username already exists
        const existingUser = await User.findOne({ username, tenant });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Check if UVU ID already exists
        const existingStudent = await User.findOne({ uvuId, tenant });
        if (existingStudent) {
            return res.status(400).json({ error: 'UVU ID already exists' });
        }

        // Create new student
        const student = new User({
            username,
            password,
            uvuId,
            tenant,
            role: 'student'
        });

        await student.save();
        res.status(201).json({ message: 'Student created successfully' });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// Add teacher to course (Admin only)
app.post('/:tenant/courses/:courseId/teacher', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.params.tenant
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const { teacherId } = req.body;
        const teacher = await User.findOne({
            _id: teacherId,
            tenant: req.params.tenant,
            role: 'teacher'
        });

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        // Check if course already has a teacher
        if (course.teacher) {
            return res.status(400).json({ message: 'Course already has a teacher assigned' });
        }

        course.teacher = teacherId;
        await course.save();

        res.json({ message: 'Teacher assigned to course successfully' });
    } catch (error) {
        console.error('Error assigning teacher to course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add TA to course (Admin or Teacher)
app.post('/:tenant/courses/:courseId/tas', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.params.tenant
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user is admin or the course's teacher
        const user = await User.findById(req.session.userId);
        if (user.role !== 'admin' && 
            (user.role !== 'teacher' || course.teacher.toString() !== user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to add TAs to this course' });
        }

        const { taId } = req.body;
        const ta = await User.findOne({
            _id: taId,
            tenant: req.params.tenant,
            role: 'ta'
        });

        if (!ta) {
            return res.status(404).json({ message: 'TA not found' });
        }

        if (course.tas.includes(taId)) {
            return res.status(400).json({ message: 'TA already assigned to this course' });
        }

        course.tas.push(taId);
        await course.save();

        res.json({ message: 'TA assigned to course successfully' });
    } catch (error) {
        console.error('Error assigning TA to course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add student to course (Admin, Teacher, or TA)
app.post('/:tenant/courses/:courseId/students', isAuthenticated, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.params.tenant
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if user has permission to add students
        const user = await User.findById(req.session.userId);
        if (user.role !== 'admin' && 
            (user.role !== 'teacher' || course.teacher.toString() !== user._id.toString()) &&
            (user.role !== 'ta' || !course.tas.includes(user._id))) {
            return res.status(403).json({ message: 'Not authorized to add students to this course' });
        }

        const { studentId } = req.body;
        const student = await User.findOne({
            _id: studentId,
            tenant: req.params.tenant,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (course.students.includes(studentId)) {
            return res.status(400).json({ message: 'Student already enrolled in this course' });
        }

        course.students.push(studentId);
        await course.save();

        res.json({ message: 'Student added to course successfully' });
    } catch (error) {
        console.error('Error adding student to course:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Student self-enrollment
app.post('/:tenant/courses/:courseId/enroll', isAuthenticated, ensureTenantAccess, isStudent, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.params.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.students.includes(req.session.userId)) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        course.students.push(req.session.userId);
        await course.save();

        res.json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ error: 'Failed to enroll in course' });
    }
});

// Get course students
app.get('/:tenant/courses/:courseId/students', isAuthenticated, ensureTenantAccess, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.params.tenant
        }).populate('students', 'username uvuId');

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if user has permission to view students
        const user = await User.findById(req.session.userId);
        if (user.role !== 'admin' && 
            (user.role !== 'teacher' || course.teacher.toString() !== user._id.toString()) &&
            (user.role !== 'ta' || !course.tas.includes(user._id)) &&
            (user.role !== 'student' || !course.students.includes(user._id))) {
            return res.status(403).json({ error: 'Not authorized to view students in this course' });
        }

        res.json(course.students);
    } catch (error) {
        console.error('Error fetching course students:', error);
        res.status(500).json({ error: 'Failed to fetch course students' });
    }
});

// Signup route - only for students
app.post('/:tenant/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    const tenant = req.params.tenant;

    try {
        // Validate input
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if username already exists for this tenant
        const existingUser = await User.findOne({ username, tenant });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Create new student user
        const user = new User({
            username,
            password, // Password will be hashed by the pre-save hook
            role: 'student', // Force role to be student
            tenant
        });

        await user.save();
        res.status(201).json({ message: 'Student account created successfully' });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Internal server error' });
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