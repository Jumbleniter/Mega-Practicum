const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const Course = require('../models/Course');
const Log = require('../models/Log');
const User = require('../models/User');

// Test data
const testTeacher = {
    username: 'test_teacher',
    password: 'test123',
    role: 'teacher',
    tenant: 'uvu'
};

const testCourse = {
    courseId: 'CS101',
    display: 'Test Course',
    description: 'A test course',
    tenant: 'uvu',
    teacher: null // Will be set in beforeEach
};

const testLog = {
    courseId: null, // Will be set in beforeEach
    studentId: null, // Will be set in beforeEach
    content: 'Test log entry',
    tenant: 'uvu'
};

// Connect to test database before running tests
beforeAll(async () => {
    // Connect to a test database
    const testDbUri = process.env.MONGODB_URI.replace('education_system', 'education_system_test');
    await mongoose.connect(testDbUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
});

// Clean up database after each test
afterEach(async () => {
    await Course.deleteMany({});
    await Log.deleteMany({});
    await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

describe('Course API', () => {
    beforeEach(async () => {
        // Create a test teacher
        const teacher = await User.create(testTeacher);
        testCourse.teacher = teacher._id;
    });

    test('GET /courses should return empty array initially', async () => {
        const response = await request(app)
            .get('/uvu/courses')
            .expect(200);
        
        expect(response.body).toEqual([]);
    });

    test('POST /courses should create a new course', async () => {
        const response = await request(app)
            .post('/uvu/courses')
            .send(testCourse)
            .expect(201);
        
        expect(response.body.display).toBe(testCourse.display);
        expect(response.body.courseId).toBe(testCourse.courseId);
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
        // Create a test teacher and course
        const teacher = await User.create(testTeacher);
        const course = await Course.create({
            ...testCourse,
            teacher: teacher._id
        });
        
        // Create a test student
        const student = await User.create({
            username: 'test_student',
            password: 'test123',
            role: 'student',
            tenant: 'uvu'
        });

        testLog.courseId = course._id;
        testLog.studentId = student._id;
    });

    test('GET /logs should return empty array initially', async () => {
        const response = await request(app)
            .get('/uvu/logs')
            .expect(200);
        
        expect(response.body).toEqual([]);
    });

    test('POST /logs should create a new log', async () => {
        const response = await request(app)
            .post('/uvu/logs')
            .send(testLog)
            .expect(201);
        
        expect(response.body.content).toBe(testLog.content);
        expect(response.body.courseId).toBe(testLog.courseId.toString());
        expect(response.body.studentId).toBe(testLog.studentId.toString());
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