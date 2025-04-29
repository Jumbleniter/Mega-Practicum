const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Use a separate test database
const TEST_DB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/course_management_test';

// Helper function to clear test database
const clearTestDatabase = async () => {
    try {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            const collection = collections[key];
            await collection.deleteMany({});
        }
    } catch (error) {
        console.error('Error clearing test database:', error);
    }
};

// Helper function to seed test database with admin users
const seedTestDatabase = async () => {
    try {
        const hashedPasswordUVU = await bcrypt.hash('willy', 10);
        const hashedPasswordUofU = await bcrypt.hash('swoopy', 10);
        
        // Delete existing admin users first
        await User.deleteMany({ 
            username: { $in: ['root_uvu', 'root_uofu'] } 
        });
        
        // Create admin users
        await User.create([
            {
                username: 'root_uvu',
                password: hashedPasswordUVU,
                role: 'admin',
                tenant: 'uvu',
                uvuId: 'ADMIN001'
            },
            {
                username: 'root_uofu',
                password: hashedPasswordUofU,
                role: 'admin',
                tenant: 'uofu',
                uvuId: 'ADMIN002'
            }
        ]);
    } catch (error) {
        console.error('Error seeding test database:', error);
    }
};

// Setup before all tests
beforeAll(async () => {
    try {
        await mongoose.connect(TEST_DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        // Set strictQuery to false to suppress deprecation warning
        mongoose.set('strictQuery', false);
        await seedTestDatabase();
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
});

// Cleanup after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

// Cleanup before each test
beforeEach(async () => {
    await clearTestDatabase();
    await seedTestDatabase();
});

module.exports = {
    clearTestDatabase,
    seedTestDatabase
}; 