const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { getTenant } = require('../middleware/tenantMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');

// Apply authentication and role check middleware to all student routes
router.use(authenticateToken);
router.use(checkRole('student'));

// Student dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const tenant = getTenant(req);
    const studentId = req.user._id;

    // Get student's enrolled courses
    const courses = await Course.find({ 
      tenant,
      students: studentId 
    }).populate('teacher', 'username')
      .populate('tas', 'username');

    // Get recent logs for the student
    const recentLogs = await Log.find({
      tenant,
      student: studentId
    })
    .sort({ date: -1 })
    .limit(10)
    .populate('course', 'name');

    res.json({
      message: 'Student dashboard',
      stats: {
        totalCourses: courses.length
      },
      recentLogs,
      courses
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student's courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({
            students: req.user._id,
            tenant: req.tenant
        })
        .populate('teacher', 'username')
        .populate('tas', 'username');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching student courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Get course details
router.get('/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            students: req.user._id,
            tenant: req.tenant
        })
        .populate('teacher', 'username')
        .populate('tas', 'username');

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error('Error fetching course:', error);
        res.status(500).json({ error: 'Failed to fetch course' });
    }
});

// Get student's logs for a course
router.get('/courses/:courseId/logs', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            students: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const logs = await Log.find({
            course: req.params.courseId,
            student: req.user._id,
            tenant: req.tenant
        })
        .populate('createdBy', 'username')
        .sort({ date: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching course logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Enroll in a course
router.post('/courses/:courseId/enroll', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (course.students.includes(req.user._id)) {
            return res.status(400).json({ error: 'Already enrolled in this course' });
        }

        course.students.push(req.user._id);
        await course.save();

        res.json({ message: 'Successfully enrolled in course' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ error: 'Failed to enroll in course' });
    }
});

// Get student profile
router.get('/profile', async (req, res) => {
    try {
        const student = await User.findById(req.user._id)
            .select('-password')
            .populate('enrolledCourses', 'name');
        res.json(student);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update student profile
router.put('/profile', async (req, res) => {
    try {
        const { username, email } = req.body;
        
        const student = await User.findById(req.user._id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (username) {
            const existingUser = await User.findOne({ 
                username, 
                tenant: req.tenant,
                _id: { $ne: req.user._id }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            student.username = username;
        }

        if (email) {
            student.email = email;
        }

        await student.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Get all student logs
router.get('/logs', async (req, res) => {
  try {
    const tenant = getTenant(req);
    const studentId = req.user._id;

    const logs = await Log.find({
      tenant,
      student: studentId
    })
    .sort({ date: -1 })
    .populate('course', 'name');

    res.json(logs);
  } catch (error) {
    console.error('Get student logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 