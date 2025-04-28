const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');
const mongoose = require('mongoose');

// Apply authentication middleware to all routes
router.use(authenticateToken);

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
router.get('/available', async (req, res) => {
    console.log('GET /available - Request received:', {
        user: req.user,
        tenant: req.tenant
    });
    
    try {
        const student = await User.findOne({ 
            _id: req.user._id,
            tenant: req.tenant
        });
        console.log('Found student:', student);
        
        if (!student) {
            console.log('Student not found');
            return res.status(404).json({ error: 'Student not found' });
        }

        const courses = await Course.find({
            tenant: req.tenant,
            students: { $ne: student._id }
        }).populate('teacher', 'username')
          .populate('tas', 'username')
          .populate('students', 'username');

        console.log('Found available courses:', courses);
        res.json(courses);
    } catch (error) {
        console.error('Error fetching available courses:', error);
        res.status(500).json({ error: 'Failed to fetch available courses' });
    }
});

// Get enrolled courses
router.get('/', async (req, res) => {
    console.log('GET / - Request received:', {
        user: req.user,
        tenant: req.tenant
    });
    
    try {
        const student = await User.findOne({ 
            _id: req.user._id,
            tenant: req.tenant
        });
        console.log('Found student:', student);
        
        if (!student) {
            console.log('Student not found');
            return res.status(404).json({ error: 'Student not found' });
        }

        const courses = await Course.find({
            students: student._id,
            tenant: req.tenant
        }).populate('teacher', 'username')
          .populate('tas', 'username')
          .populate('students', 'username');

        console.log('Found enrolled courses:', courses);
        res.json(courses);
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ error: 'Failed to fetch enrolled courses' });
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

// Get student's logs
router.get('/logs', async (req, res) => {
    console.log('GET /logs - Request received:', {
        user: req.user,
        tenant: req.tenant
    });
    
    try {
        const logs = await Log.find({
            studentId: req.user.userId,
            tenant: req.tenant
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

// Get logs for a specific course
router.get('/courses/:courseId/logs', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: new mongoose.Types.ObjectId(req.params.courseId),
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student is enrolled in the course
        if (!course.students.includes(new mongoose.Types.ObjectId(req.user.userId))) {
            return res.status(403).json({ message: 'Not enrolled in this course' });
        }

        const logs = await Log.find({
            courseId: new mongoose.Types.ObjectId(req.params.courseId),
            tenant: req.tenant
        }).sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ message: 'Error fetching logs' });
    }
});

// Enroll in a course
router.post('/courses/:courseId/enroll', async (req, res) => {
    console.log('Enrollment request received:', {
        courseId: req.params.courseId,
        userId: req.user._id,
        tenant: req.tenant
    });
    
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant
        });

        console.log('Found course:', course);

        if (!course) {
            console.log('Course not found');
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        // Verify course belongs to student's tenant
        if (course.tenant !== req.tenant) {
            console.log('Tenant mismatch:', {
                courseTenant: course.tenant,
                userTenant: req.tenant
            });
            return res.status(403).json({ success: false, error: 'Cannot enroll in courses from other tenants' });
        }

        // Clean up students array by removing null values
        course.students = course.students.filter(studentId => studentId !== null);
        console.log('Cleaned students array:', course.students);

        if (course.students.includes(req.user._id)) {
            console.log('Student already enrolled:', {
                userId: req.user._id,
                enrolledStudents: course.students
            });
            return res.status(400).json({ success: false, error: 'Already enrolled in this course' });
        }

        course.students.push(req.user._id);
        await course.save();
        console.log('Successfully enrolled student in course');

        res.json({ success: true, message: 'Successfully enrolled in course' });
    } catch (error) {
        console.error('Error enrolling in course:', error);
        res.status(500).json({ success: false, error: 'Failed to enroll in course' });
    }
});

// Unenroll from a course
router.post('/courses/:courseId/unenroll', async (req, res) => {
    console.log('Unenroll request received:', {
        courseId: req.params.courseId,
        userId: req.user._id,
        tenant: req.tenant
    });
    
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            tenant: req.tenant
        });

        console.log('Found course:', course);

        if (!course) {
            console.log('Course not found');
            return res.status(404).json({ success: false, error: 'Course not found' });
        }

        // Verify course belongs to student's tenant
        if (course.tenant !== req.tenant) {
            console.log('Tenant mismatch:', {
                courseTenant: course.tenant,
                userTenant: req.tenant
            });
            return res.status(403).json({ success: false, error: 'Cannot unenroll from courses in other tenants' });
        }

        // Clean up students array by removing null values
        course.students = course.students.filter(studentId => studentId !== null);
        console.log('Cleaned students array:', course.students);

        if (!course.students.includes(req.user._id)) {
            console.log('Student not enrolled:', {
                userId: req.user._id,
                enrolledStudents: course.students
            });
            return res.status(400).json({ success: false, error: 'Not enrolled in this course' });
        }

        // Remove student from course
        course.students = course.students.filter(studentId => studentId.toString() !== req.user._id.toString());
        await course.save();
        console.log('Successfully unenrolled student from course');

        res.json({ success: true, message: 'Successfully unenrolled from course' });
    } catch (error) {
        console.error('Error unenrolling from course:', error);
        res.status(500).json({ success: false, error: 'Failed to unenroll from course' });
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

// Add log entry for a course
router.post('/courses/:courseId/logs', async (req, res) => {
    console.log('POST /courses/:courseId/logs - Request received:', {
        courseId: req.params.courseId,
        user: req.user,
        tenant: req.tenant,
        body: req.body
    });
    
    try {
        // Verify student is enrolled in the course
        const course = await Course.findOne({
            _id: req.params.courseId,
            students: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            console.log('Course not found or student not enrolled');
            return res.status(404).json({ error: 'Course not found or you are not enrolled' });
        }

        const log = new Log({
            content: req.body.content,
            courseId: new mongoose.Types.ObjectId(req.params.courseId),
            studentId: new mongoose.Types.ObjectId(req.user._id),
            createdBy: new mongoose.Types.ObjectId(req.user._id),
            tenant: req.tenant
        });

        await log.save();
        console.log('Log created successfully:', log);
        res.json(log);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ error: 'Failed to create log' });
    }
});

module.exports = router; 