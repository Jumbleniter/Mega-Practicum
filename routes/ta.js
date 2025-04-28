const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { getTenant } = require('../middleware/tenantMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');

// Apply authentication and role check middleware to all TA routes
router.use(authenticateToken);
router.use(checkRole('ta'));

// TA dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const tenant = getTenant(req);
    const taId = req.user._id;

    // Get courses where TA is assigned
    const courses = await Course.find({ 
      tenant,
      tas: taId 
    }).populate('students', 'username uvuId')
      .populate('teacher', 'username');

    // Get recent logs for all courses
    const recentLogs = await Log.find({
      tenant,
      course: { $in: courses.map(c => c._id) }
    })
    .sort({ date: -1 })
    .limit(10)
    .populate('student', 'username uvuId');

    res.json({
      message: 'TA dashboard',
      stats: {
        totalCourses: courses.length,
        totalStudents: courses.reduce((acc, course) => acc + course.students.length, 0)
      },
      recentLogs,
      courses
    });
  } catch (error) {
    console.error('TA dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get TA's courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({
            tas: req.user._id,
            tenant: req.tenant
        })
        .populate('teacher', 'username')
        .populate('students', 'username uvuId');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching TA courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get course details
router.get('/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tas: req.user._id,
            tenant: req.tenant
        })
        .populate('teacher', 'username')
        .populate('students', 'username uvuId');

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

// Get course logs
router.get('/courses/:courseId/logs', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tas: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const logs = await Log.find({
            course: req.params.courseId,
            tenant: req.tenant
        })
        .populate('student', 'username uvuId')
        .populate('createdBy', 'username')
        .sort({ date: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching course logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
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

// Add student to course
router.post('/courses/:courseId/students', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tas: req.user._id,
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

// Create log entry
router.post('/courses/:courseId/logs', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tas: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const { studentId, text } = req.body;
        
        if (!studentId || !text) {
            return res.status(400).json({ error: 'Student ID and log text are required' });
        }

        const student = await User.findOne({
            _id: studentId,
            tenant: req.tenant,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (!course.students.includes(studentId)) {
            return res.status(400).json({ error: 'Student not enrolled in course' });
        }

        const log = new Log({
            course: req.params.courseId,
            student: studentId,
            text,
            createdBy: req.user._id,
            tenant: req.tenant
        });

        await log.save();
        res.status(201).json(log);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ error: 'Failed to create log' });
    }
});

module.exports = router; 