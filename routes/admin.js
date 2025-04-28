const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');
const path = require('path');

// Apply authentication and role check middleware to all admin routes
router.use(authenticateToken);
router.use(checkRole('admin'));

// Debug middleware
router.use((req, res, next) => {
    console.log('Admin route accessed:', {
        path: req.path,
        method: req.method,
        user: req.user,
        tenant: req.tenant
    });
    next();
});

// Root admin route - serve the admin dashboard
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Admin dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const users = await User.find({ tenant: req.tenant });
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

    const newUser = new User({
      username,
      password,
      role,
      email,
      tenant: req.tenant
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
    const users = await User.find({ tenant: req.tenant });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndUpdate(
      { _id: id, tenant: req.tenant },
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
    const tenant = req.tenant;
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

// Course management routes
router.post('/courses', async (req, res) => {
  try {
    const { name, description, teacherId } = req.body;
    const newCourse = new Course({
      name,
      description,
      teacher: teacherId,
      tenant: req.tenant
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const courses = await Course.find({ tenant: req.tenant })
      .populate('teacher', 'username')
      .populate('tas', 'username')
      .populate('students', 'username');
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOneAndUpdate(
      { _id: id, tenant: req.tenant },
      req.body,
      { new: true }
    )
    .populate('teacher', 'username')
    .populate('tas', 'username')
    .populate('students', 'username');
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findOneAndDelete({ _id: id, tenant: req.tenant });
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign teacher to course
router.post('/courses/:courseId/teacher', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { teacherId } = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, tenant: req.tenant },
      { teacher: teacherId },
      { new: true }
    )
    .populate('teacher', 'username')
    .populate('tas', 'username')
    .populate('students', 'username');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Assign teacher error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Assign TA to course
router.post('/courses/:courseId/tas', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { taId } = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, tenant: req.tenant },
      { $addToSet: { tas: taId } },
      { new: true }
    )
    .populate('teacher', 'username')
    .populate('tas', 'username')
    .populate('students', 'username');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Assign TA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add student to course
router.post('/courses/:courseId/students', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    const course = await Course.findOneAndUpdate(
      { _id: courseId, tenant: req.tenant },
      { $addToSet: { students: studentId } },
      { new: true }
    )
    .populate('teacher', 'username')
    .populate('tas', 'username')
    .populate('students', 'username');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Log management routes
router.get('/logs', async (req, res) => {
  try {
    const logs = await Log.find({ tenant: req.tenant })
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs, optionally filtered by course
router.get('/api/logs', async (req, res) => {
    try {
        const query = { tenant: req.tenant };
        
        // If course is provided, filter by course
        if (req.query.course) {
            query.courseId = req.query.course;
            
            // Verify course exists
            const course = await Course.findOne({
                _id: req.query.course,
                tenant: req.tenant
            });

            if (!course) {
                return res.status(404).json({ success: false, error: 'Course not found' });
            }
        }

        const logs = await Log.find(query)
            .populate('studentId', 'username uvuId')
            .populate('createdBy', 'username')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

module.exports = router; 