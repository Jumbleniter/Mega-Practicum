const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { getTenant } = require('../middleware/tenantMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');

// Apply authentication and role check middleware to all teacher routes
router.use(authenticateToken);
router.use(checkRole('teacher'));

// Teacher dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const tenant = getTenant(req);
    const teacherId = req.user._id;

    // Get teacher's courses
    const courses = await Course.find({ 
      tenant,
      teacher: teacherId 
    }).populate('students', 'username uvuId')
      .populate('tas', 'username');

    // Get counts for dashboard
    const studentCount = courses.reduce((acc, course) => acc + course.students.length, 0);
    const taCount = courses.reduce((acc, course) => acc + course.tas.length, 0);

    res.json({
      message: 'Teacher dashboard',
      stats: {
        totalCourses: courses.length,
        totalStudents: studentCount,
        totalTAs: taCount
      },
      recentCourses: courses.slice(-5)
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get teacher's courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await Course.find({
            teacher: req.user._id,
            tenant: req.tenant
        })
        .populate('tas', 'username')
        .populate('students', 'username uvuId');
        res.json(courses);
    } catch (error) {
        console.error('Error fetching teacher courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});

// Create a new course
router.post('/courses', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Course name is required' });
        }

        const course = new Course({
            name,
            description,
            teacher: req.user._id,
            tenant: req.tenant
        });

        await course.save();
        res.status(201).json(course);
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({ error: 'Failed to create course' });
    }
});

// Get course details
router.get('/courses/:courseId', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
            tenant: req.tenant
        })
        .populate('tas', 'username')
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

// Update course
router.put('/courses/:courseId', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (name) course.name = name;
        if (description) course.description = description;

        await course.save();
        res.json(course);
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({ error: 'Failed to update course' });
    }
});

// Get course logs
router.get('/courses/:courseId/logs', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
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

// Assign TA to course
router.post('/courses/:courseId/tas', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
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

// Remove TA from course
router.delete('/courses/:courseId/tas/:taId', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const taIndex = course.tas.indexOf(req.params.taId);
        if (taIndex === -1) {
            return res.status(404).json({ error: 'TA not found in course' });
        }

        course.tas.splice(taIndex, 1);
        await course.save();

        res.json({ message: 'TA removed from course successfully' });
    } catch (error) {
        console.error('Error removing TA:', error);
        res.status(500).json({ error: 'Failed to remove TA' });
    }
});

// Add student to course
router.post('/courses/:courseId/students', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
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

// Remove student from course
router.delete('/courses/:courseId/students/:studentId', async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.courseId,
            teacher: req.user._id,
            tenant: req.tenant
        });

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const studentIndex = course.students.indexOf(req.params.studentId);
        if (studentIndex === -1) {
            return res.status(404).json({ error: 'Student not found in course' });
        }

        course.students.splice(studentIndex, 1);
        await course.save();

        res.json({ message: 'Student removed from course successfully' });
    } catch (error) {
        console.error('Error removing student:', error);
        res.status(500).json({ error: 'Failed to remove student' });
    }
});

module.exports = router; 