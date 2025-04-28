const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Use a separate test database
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/course_management_test';

// Helper function to clear test database
const clearTestDatabase = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

// Helper function to seed test database with admin users
const seedTestDatabase = async () => {
    const hashedPasswordUVU = await bcrypt.hash('willy', 10);
    const hashedPasswordUofU = await bcrypt.hash('swoopy', 10);
    
    await User.create([
        {
            username: 'root_uvu',
            password: hashedPasswordUVU,
            role: 'admin',
            tenant: 'uvu'
        },
        {
            username: 'root_uofu',
            password: hashedPasswordUofU,
            role: 'admin',
            tenant: 'uofu'
        }
    ]);
};

// Setup before all tests
beforeAll(async () => {
    try {
        await mongoose.connect(TEST_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
});

// Cleanup after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

// Cleanup and seed before each test
beforeEach(async () => {
    await clearTestDatabase();
    await seedTestDatabase();
});

module.exports = {
    clearTestDatabase
}; 