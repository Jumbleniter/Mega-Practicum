const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const Log = require('../models/Log');
const Course = require('../models/Course');
const User = require('../models/User');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get logs for a course (admin, teacher, and TA)
router.get('/', checkRole(['admin', 'teacher', 'ta']), async (req, res) => {
    try {
        const query = { tenant: req.tenant };
        
        // If course is provided, filter by course
        if (req.query.course) {
            query.courseId = req.query.course;
            
            // Verify course exists and user has access
            const course = await Course.findOne({
                _id: req.query.course,
                tenant: req.tenant
            });

            if (!course) {
                return res.status(404).json({ error: 'Course not found' });
            }

            // Verify access based on role
            if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.userId) {
                return res.status(403).json({ error: 'Access denied' });
            }

            if (req.user.role === 'ta' && !course.tas.includes(req.user.userId)) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        const logs = await Log.find(query)
            .populate('studentId', 'username uvuId')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get logs for a student (admin, teacher, TA, and student)
router.get('/student/:studentId', checkRole(['admin', 'teacher', 'ta', 'student']), async (req, res) => {
    try {
        // Students can only view their own logs
        if (req.user.role === 'student' && req.user.studentId !== req.params.studentId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // For teachers and TAs, verify they have access to the student's courses
        if (req.user.role === 'teacher' || req.user.role === 'ta') {
            const courses = await Course.find({
                tenant: req.tenant,
                students: req.params.studentId
            });

            if (req.user.role === 'teacher') {
                const hasAccess = courses.some(course => course.teacher.toString() === req.user.userId);
                if (!hasAccess) {
                    return res.status(403).json({ error: 'Access denied' });
                }
            }

            if (req.user.role === 'ta') {
                const hasAccess = courses.some(course => course.tas.includes(req.user.userId));
                if (!hasAccess) {
                    return res.status(403).json({ error: 'Access denied' });
                }
            }
        }

        const logs = await Log.find({
            studentId: req.params.studentId,
            tenant: req.tenant
        }).sort({ createdAt: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching student logs:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new log (admin, teacher, and TA)
router.post('/', checkRole(['admin', 'teacher', 'ta']), async (req, res) => {
    try {
        const { studentId, courseId, content } = req.body;

        // Verify course exists and user has access
        const course = await Course.findOne({
            _id: courseId,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Verify access based on role
        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.role === 'ta' && !course.tas.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Verify student is enrolled in the course
        if (!course.students.includes(studentId)) {
            return res.status(400).json({ error: 'Student is not enrolled in this course' });
        }

        const log = new Log({
            studentId,
            courseId,
            content,
            tenant: req.tenant,
            createdBy: req.user.userId
        });

        await log.save();
        res.status(201).json(log);
    } catch (error) {
        console.error('Error creating log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a log (admin, teacher, and TA)
router.put('/:logId', checkRole(['admin', 'teacher', 'ta']), async (req, res) => {
    try {
        const { content } = req.body;
        const log = await Log.findOne({
            _id: req.params.logId,
            tenant: req.tenant
        });

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        // Verify access based on role
        const course = await Course.findOne({
            _id: log.courseId,
            tenant: req.tenant
        });

        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (req.user.role === 'ta' && !course.tas.includes(req.user.userId)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        log.content = content;
        await log.save();
        res.json(log);
    } catch (error) {
        console.error('Error updating log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a log (admin and teacher only)
router.delete('/:logId', checkRole(['admin', 'teacher']), async (req, res) => {
    try {
        const log = await Log.findOne({
            _id: req.params.logId,
            tenant: req.tenant
        });

        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }

        // Verify access based on role
        const course = await Course.findOne({
            _id: log.courseId,
            tenant: req.tenant
        });

        if (req.user.role === 'teacher' && course.teacher.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await log.remove();
        res.json({ message: 'Log deleted successfully' });
    } catch (error) {
        console.error('Error deleting log:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 