const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');

// Student dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const student = await User.findOne({ 
            _id: req.user._id,
            tenant: req.tenant
        });
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const enrolledCourses = await Course.find({
            students: student._id,
            tenant: req.tenant
        }).populate('teacher', 'username');

        const recentLogs = await Log.find({
            userId: student._id,
            tenant: req.tenant
        })
        .sort({ timestamp: -1 })
        .limit(5);

        res.json({
            student,
            enrolledCourses,
            recentLogs
        });
    } catch (error) {
        console.error('Error fetching student dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch student dashboard' });
    }
});

// Get available courses
router.get('/courses/available', async (req, res) => {
    console.log('GET /courses/available - Request received:', {
        user: req.user,
        tenant: req.tenant
    });
    
    try {
        const student = await User.findOne({ 
            _id: req.user.userId,
            tenant: req.tenant
        });
        console.log('Found student:', student);
        
        if (!student) {
            console.log('Student not found');
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        const courses = await Course.find({
            tenant: req.tenant,
            students: { $ne: student._id }
        }).populate('teacher', 'username')
          .populate('tas', 'username')
          .populate('students', 'username');

        console.log('Found available courses:', courses);
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch available courses' });
    }
});

// Get enrolled courses
router.get('/courses', async (req, res) => {
    console.log('GET /courses - Request received:', {
        user: req.user,
        tenant: req.tenant
    });
    
    try {
        const student = await User.findOne({ 
            _id: req.user.userId,
            tenant: req.tenant
        });
        console.log('Found student:', student);
        
        if (!student) {
            console.log('Student not found');
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        const courses = await Course.find({
            students: student._id,
            tenant: req.tenant
        }).populate('teacher', 'username')
          .populate('tas', 'username')
          .populate('students', 'username');

        console.log('Found enrolled courses:', courses);
        res.json({ success: true, data: courses });
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch enrolled courses' });
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

        // Verify course belongs to student's tenant
        if (course.tenant !== req.tenant) {
            return res.status(403).json({ error: 'Cannot enroll in courses from other tenants' });
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

// Unenroll from a course
router.post('/courses/:courseId/unenroll', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant,
            students: req.user._id
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found or not enrolled' });
        }

        // Remove student from course
        course.students = course.students.filter(studentId => studentId.toString() !== req.user._id.toString());
        await course.save();

        res.json({ message: 'Successfully unenrolled from course' });
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        res.status(500).json({ error: 'Failed to unenroll from course' });
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

// Get student logs
router.get('/logs', async (req, res) => {
    console.log('GET /logs - Request received:', {
        user: req.user,
        tenant: req.tenant
    });
    
    try {
        const student = await User.findOne({ 
            _id: req.user.userId,
            tenant: req.tenant
        });
        console.log('Found student:', student);
        
        if (!student) {
            console.log('Student not found');
            return res.status(404).json({ success: false, error: 'Student not found' });
        }

        const logs = await Log.find({
            studentId: student.uvuId,
            tenant: req.tenant,
            createdBy: req.user.userId  // Only return logs created by this student
        })
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 });

        console.log('Found logs:', logs);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching student logs:', error);
        res.status(500).json({ error: 'Failed to fetch student logs' });
    }
});

// Create log entry for a course
router.post('/courses/:courseId/logs', async (req, res) => {
    console.log('POST /courses/:courseId/logs - Request received:', {
        user: req.user,
        tenant: req.tenant,
        courseId: req.params.courseId,
        body: req.body
    });
    
    try {
        // Verify student is enrolled in the course
        const course = await Course.findOne({
            _id: req.params.courseId,
            students: req.user.userId,
            tenant: req.tenant
        });

        if (!course) {
            console.log('Course not found or student not enrolled');
            return res.status(404).json({ success: false, error: 'Course not found or you are not enrolled' });
        }

        const log = new Log({
            studentId: req.user.userId,
            courseId: req.params.courseId,
            content: req.body.content,
            tenant: req.tenant,
            createdBy: req.user.userId
        });

        await log.save();
        console.log('Log created successfully:', log);
        res.json({ success: true, data: log });
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ success: false, error: 'Failed to create log' });
    }
});

module.exports = router; 