const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Course = require('../models/Course');
const Log = require('../models/Log');

// Test data
const testCourse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    display: 'Test Course'
};

const testLog = {
    uvuId: '12345678',
    courseId: testCourse.id,
    text: 'Test log entry'
};

// Connect to test database before running tests
beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect(process.env.MONGODB_URI);
});

// Clean up database after each test
afterEach(async () => {
    await Course.deleteMany({});
    await Log.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.connection.close();
});

describe('Course API', () => {
    test('GET /courses should return empty array initially', async () => {
        const response = await request(app)
            .get('/courses')
            .expect(200);
        
        expect(response.body).toEqual([]);
    });

    test('POST /courses should create a new course', async () => {
        const response = await request(app)
            .post('/courses')
            .send(testCourse)
            .expect(201);
        
        expect(response.body.display).toBe(testCourse.display);
        expect(response.body.id).toBe(testCourse.id);
    });

    test('POST /courses should reject invalid UUID', async () => {
        const invalidCourse = {
            id: 'invalid-uuid',
            display: 'Invalid Course'
        };

        const response = await request(app)
            .post('/courses')
            .send(invalidCourse)
            .expect(400);
        
        expect(response.body.error).toBeDefined();
    });
});

describe('Log API', () => {
    beforeEach(async () => {
        // Create a test course before testing logs
        await Course.create(testCourse);
    });

    test('GET /logs should return empty array initially', async () => {
        const response = await request(app)
            .get('/logs')
            .query({ uvuId: testLog.uvuId })
            .expect(200);
        
        expect(response.body).toEqual([]);
    });

    test('POST /logs should create a new log', async () => {
        const response = await request(app)
            .post('/logs')
            .send(testLog)
            .expect(200);
        
        expect(response.body.uvuId).toBe(testLog.uvuId);
        expect(response.body.courseId).toBe(testLog.courseId);
        expect(response.body.text).toBe(testLog.text);
        expect(response.body.date).toBeDefined();
    });

    test('POST /logs should reject invalid UVU ID', async () => {
        const invalidLog = {
            ...testLog,
            uvuId: '12345' // Invalid UVU ID (must be 8 digits)
        };

        const response = await request(app)
            .post('/logs')
            .send(invalidLog)
            .expect(400);
        
        expect(response.body.error).toBeDefined();
    });

    test('GET /logs should return logs for specific course and UVU ID', async () => {
        // Create a test log
        await Log.create(testLog);

        const response = await request(app)
            .get('/logs')
            .query({ 
                uvuId: testLog.uvuId,
                courseId: testLog.courseId
            })
            .expect(200);
        
        expect(response.body.length).toBe(1);
        expect(response.body[0].uvuId).toBe(testLog.uvuId);
        expect(response.body[0].courseId).toBe(testLog.courseId);
    });
}); 