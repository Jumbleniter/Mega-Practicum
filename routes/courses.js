const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const Course = require('../models/Course');
const User = require('../models/User');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get all courses (admin only)
router.get('/', checkRole('admin'), async (req, res) => {
    try {
        const courses = await Course.find({ tenant: req.tenant });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get courses for teacher
router.get('/teacher', checkRole('teacher'), async (req, res) => {
    try {
        const courses = await Course.find({ 
            tenant: req.tenant,
            teacher: req.user.userId 
        });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get courses for TA
router.get('/ta', checkRole('ta'), async (req, res) => {
    try {
        const courses = await Course.find({ 
            tenant: req.tenant,
            tas: req.user.userId 
        });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching TA courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get courses for student
router.get('/student', checkRole('student'), async (req, res) => {
    try {
        const courses = await Course.find({ 
            tenant: req.tenant,
            students: req.user.userId 
        });
        res.json(courses);
    } catch (error) {
        console.error('Error fetching student courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new course (admin and teacher only)
router.post('/', checkRole(['admin', 'teacher']), async (req, res) => {
    try {
        const { courseId, display, description } = req.body;
        
        const course = new Course({
            courseId,
            display,
            description,
            tenant: req.tenant,
            teacher: req.user.role === 'teacher' ? req.user.userId : null
        });

        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add student to course (admin and teacher only)
router.post('/:courseId/students', checkRole(['admin', 'teacher']), async (req, res) => {
    try {
        const { studentId } = req.body;
        const course = await Course.findOne({ 
            _id: req.params.courseId,
            tenant: req.tenant 
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Verify student exists and belongs to the same tenant
        const student = await User.findOne({ 
            _id: studentId,
            tenant: req.tenant,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (!course.students.includes(studentId)) {
            course.students.push(studentId);
            await course.save();
        }

        res.json(course);
    } catch (error) {
        console.error('Error adding student to course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add TA to course (admin and teacher only)
router.post('/:courseId/tas', checkRole(['admin', 'teacher']), async (req, res) => {
    try {
        const { taId } = req.body;
        const course = await Course.findOne({ 
            _id: req.params.courseId,
            tenant: req.tenant 
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Verify TA exists and belongs to the same tenant
        const ta = await User.findOne({ 
            _id: taId,
            tenant: req.tenant,
            role: 'ta'
        });

        if (!ta) {
            return res.status(404).json({ error: 'TA not found' });
        }

        if (!course.tas.includes(taId)) {
            course.tas.push(taId);
            await course.save();
        }

        res.json(course);
    } catch (error) {
        console.error('Error adding TA to course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 