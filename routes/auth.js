const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { getTenant } = require('../middleware/tenantMiddleware');
const config = require('../config');

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const tenant = req.tenant;
    
    if (!tenant) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    // Find user by username and tenant
    const user = await User.findOne({ username, tenant });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role,
        tenant: user.tenant
      },
      process.env.JWT_SECRET || config.jwtSecret,
      { expiresIn: '24h' }
    );

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ 
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: user.tenant
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Status route
router.get('/status', async (req, res) => {
  try {
    const token = req.cookies.token;
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    if (!token) {
      return res.json({ authenticated: false });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || config.jwtSecret);
      const user = await User.findById(decoded.userId);

      if (!user || user.tenant !== tenant) {
        return res.json({ authenticated: false });
      }

      res.json({
        authenticated: true,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          tenant: user.tenant
        }
      });
    } catch (error) {
      // Token is invalid or expired
      return res.json({ authenticated: false });
    }
  } catch (error) {
    console.error('Status check error:', error);
    res.json({ authenticated: false });
  }
});

module.exports = router; 