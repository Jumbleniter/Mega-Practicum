const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { getTenant } = require('../middleware/tenantMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');

// Apply authentication and role check middleware to all admin routes
router.use(authenticateToken);
router.use(checkRole('admin'));

// Admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const tenant = getTenant(req);
    const users = await User.find({ tenant });
    const userCounts = {
      total: users.length,
      teachers: users.filter(u => u.role === 'teacher').length,
      tas: users.filter(u => u.role === 'ta').length,
      students: users.filter(u => u.role === 'student').length
    };

    res.json({
      message: 'Admin dashboard',
      userCounts,
      recentUsers: users.slice(-5) // Get 5 most recent users
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management routes
router.post('/users', async (req, res) => {
  try {
    const { username, password, role, email } = req.body;
    const tenant = getTenant(req);

    const newUser = new User({
      username,
      password,
      role,
      email,
      tenant
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const tenant = getTenant(req);
    const users = await User.find({ tenant });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = getTenant(req);
    const user = await User.findOneAndUpdate(
      { _id: id, tenant },
      req.body,
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = getTenant(req);
    const user = await User.findOneAndDelete({ _id: id, tenant });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({ tenant: req.tenant })
            .populate('teacher', 'username')
            .populate('tas', 'username')
            .populate('students', 'username uvuId');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get all logs
router.get('/logs', async (req, res) => {
    try {
        const logs = await Log.find({ tenant: req.tenant })
            .populate('course', 'name')
            .populate('student', 'username uvuId')
            .populate('createdBy', 'username')
            .sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Create teacher
router.post('/teachers', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username, tenant: req.tenant });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const teacher = new User({
            username,
            password,
            role: 'teacher',
            tenant: req.tenant
        });

        await teacher.save();
        res.status(201).json({ message: 'Teacher created successfully' });
    } catch (error) {
        console.error('Error creating teacher:', error);
        res.status(500).json({ error: 'Failed to create teacher' });
    }
});

// Create TA
router.post('/tas', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const existingUser = await User.findOne({ username, tenant: req.tenant });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const ta = new User({
            username,
            password,
            role: 'ta',
            tenant: req.tenant
        });

        await ta.save();
        res.status(201).json({ message: 'TA created successfully' });
    } catch (error) {
        console.error('Error creating TA:', error);
        res.status(500).json({ error: 'Failed to create TA' });
    }
});

// Create student
router.post('/students', async (req, res) => {
    try {
        const { username, password, uvuId } = req.body;
        
        if (!username || !password || !uvuId) {
            return res.status(400).json({ error: 'Username, password, and UVU ID are required' });
        }

        const existingUser = await User.findOne({ username, tenant: req.tenant });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const existingStudent = await User.findOne({ uvuId, tenant: req.tenant });
        if (existingStudent) {
            return res.status(400).json({ error: 'UVU ID already exists' });
        }

        const student = new User({
            username,
            password,
            uvuId,
            role: 'student',
            tenant: req.tenant
        });

        await student.save();
        res.status(201).json({ message: 'Student created successfully' });
    } catch (error) {
        console.error('Error creating student:', error);
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// Assign teacher to course
router.post('/courses/:courseId/teacher', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const { teacherId } = req.body;
        const teacher = await User.findOne({
            _id: teacherId,
            tenant: req.tenant,
            role: 'teacher'
        });

        if (!teacher) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        if (course.teacher) {
            return res.status(400).json({ error: 'Course already has a teacher' });
        }

        course.teacher = teacherId;
        await course.save();

        res.json({ message: 'Teacher assigned to course successfully' });
    } catch (error) {
        console.error('Error assigning teacher:', error);
        res.status(500).json({ error: 'Failed to assign teacher' });
    }
});

// Assign TA to course
router.post('/courses/:courseId/tas', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const { taId } = req.body;
        const ta = await User.findOne({
            _id: taId,
            tenant: req.tenant,
            role: 'ta'
        });

        if (!ta) {
            return res.status(404).json({ error: 'TA not found' });
        }

        if (course.tas.includes(taId)) {
            return res.status(400).json({ error: 'TA already assigned to course' });
        }

        course.tas.push(taId);
        await course.save();

        res.json({ message: 'TA assigned to course successfully' });
    } catch (error) {
        console.error('Error assigning TA:', error);
        res.status(500).json({ error: 'Failed to assign TA' });
    }
});

// Add student to course
router.post('/courses/:courseId/students', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const { studentId } = req.body;
        const student = await User.findOne({
            _id: studentId,
            tenant: req.tenant,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (course.students.includes(studentId)) {
            return res.status(400).json({ error: 'Student already enrolled in course' });
        }

        course.students.push(studentId);
        await course.save();

        res.json({ message: 'Student added to course successfully' });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).json({ error: 'Failed to add student' });
    }
});

module.exports = router; 