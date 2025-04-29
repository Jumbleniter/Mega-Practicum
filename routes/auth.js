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
  console.log('Login attempt:', {
    username: req.body.username,
    tenant: req.tenant,
    body: req.body
  });
  
  try {
    const { username, password } = req.body;
    const tenant = req.tenant;
    
    if (!tenant) {
      console.log('No tenant specified');
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    // Find user by username and tenant
    const user = await User.findOne({ username, tenant });
    console.log('User lookup result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.log('User not found for:', { username, tenant });
      return res.status(401).json({ error: 'Invalid username' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password verification:', validPassword ? 'Valid' : 'Invalid');
    
    if (!validPassword) {
      console.log('Invalid password for user:', username);
      return res.status(401).json({ error: 'Invalid password' });
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

    // Return success response with token and user info
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: user.tenant
      }
    });

    console.log('Login successful for user:', username);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { username, password, role, uvuId } = req.body;
    const tenant = req.tenant;

    if (!tenant) {
      return res.status(400).json({ error: 'Tenant not specified' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username, tenant });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create new user
    const user = new User({
      username,
      password,
      role: role || 'student',
      tenant,
      uvuId
    });

    await user.save();

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

    res.status(201).json({ 
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        tenant: user.tenant
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
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