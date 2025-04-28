const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Test data with unique usernames and uvuIds
const testUsers = {
    uvu: {
        admin: { username: 'test_root_uvu', password: 'willy', role: 'admin', uvuId: '80000001' },
        teacher: { username: 'test_uvu_teacher', password: 'teacher123', role: 'teacher', uvuId: '80000002' },
        ta: { username: 'test_uvu_ta', password: 'ta123', role: 'ta', uvuId: '80000003' },
        student: { username: 'test_uvu_student', password: 'student123', role: 'student', uvuId: '80000004' }
    },
    uofu: {
        admin: { username: 'test_root_uofu', password: 'swoopy', role: 'admin', uvuId: '90000001' },
        teacher: { username: 'test_uofu_teacher', password: 'teacher123', role: 'teacher', uvuId: '90000002' },
        ta: { username: 'test_uofu_ta', password: 'ta123', role: 'ta', uvuId: '90000003' },
        student: { username: 'test_uofu_student', password: 'student123', role: 'student', uvuId: '90000004' }
    }
};

// Helper function to get auth token
const getAuthToken = async (username, password, tenant) => {
    const response = await request(app)
        .post(`/${tenant}/auth/login`)
        .send({ username, password });
    return response.body.token;
};

// Global setup and teardown
beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    
    try {
        // Connect to test database
        const testDbUri = process.env.MONGODB_URI.replace('education_system', 'education_system_test');
        await mongoose.connect(testDbUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000
        });

        // Clear all collections first
        await User.deleteMany({});
        await Course.deleteMany({});
        await Log.deleteMany({});

        // Create test users
        for (const tenant of Object.keys(testUsers)) {
            for (const role of Object.keys(testUsers[tenant])) {
                const user = testUsers[tenant][role];
                const hashedPassword = await bcrypt.hash(user.password, 10);
                await User.create({
                    username: user.username,
                    password: hashedPassword,
                    role: user.role,
                    tenant: tenant,
                    uvuId: user.uvuId
                });
            }
        }
    } catch (error) {
        console.error('Error in beforeAll:', error);
        throw error;
    }
}, 30000); // Increase timeout to 30 seconds

afterAll(async () => {
    // Clean up test database
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
});

beforeEach(async () => {
    // Clear collections before each test
    await Course.deleteMany({});
    await Log.deleteMany({});
});

describe('API Route Tests', () => {
    describe('Auth Routes', () => {
        test('POST /:tenant/auth/login - successful login', async () => {
            const response = await request(app)
                .post('/uvu/auth/login')
                .send({
                    username: testUsers.uvu.admin.username,
                    password: testUsers.uvu.admin.password
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
        });

        test('POST /:tenant/auth/login - invalid credentials', async () => {
            const response = await request(app)
                .post('/uvu/auth/login')
                .send({
                    username: testUsers.uvu.admin.username,
                    password: 'wrongpassword'
                });
            
            expect(response.status).toBe(401);
        });

        test('POST /:tenant/auth/logout - successful logout', async () => {
            const token = await getAuthToken(testUsers.uvu.admin.username, testUsers.uvu.admin.password, 'uvu');
            
            const response = await request(app)
                .post('/uvu/auth/logout')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
        });
    });

    describe('Course Routes', () => {
        test('GET /:tenant/courses - list courses', async () => {
            const token = await getAuthToken(testUsers.uvu.admin.username, testUsers.uvu.admin.password, 'uvu');
            
            const response = await request(app)
                .get('/uvu/courses')
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('POST /:tenant/courses - create course', async () => {
            const token = await getAuthToken(testUsers.uvu.teacher.username, testUsers.uvu.teacher.password, 'uvu');
            
            const response = await request(app)
                .post('/uvu/courses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Course',
                    description: 'Test Description'
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
        });

        test('GET /:tenant/courses/:id - get course details', async () => {
            const token = await getAuthToken(testUsers.uvu.teacher.username, testUsers.uvu.teacher.password, 'uvu');
            
            // Create a course first
            const createResponse = await request(app)
                .post('/uvu/courses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Course',
                    description: 'Test Description'
                });
            
            const courseId = createResponse.body._id;
            
            const response = await request(app)
                .get(`/uvu/courses/${courseId}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(response.body._id).toBe(courseId);
        });
    });

    describe('Log Routes', () => {
        test('POST /:tenant/logs - create log', async () => {
            const token = await getAuthToken(testUsers.uvu.teacher.username, testUsers.uvu.teacher.password, 'uvu');
            
            // Create a course first
            const courseResponse = await request(app)
                .post('/uvu/courses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Course',
                    description: 'Test Description'
                });
            
            const courseId = courseResponse.body._id;
            
            const response = await request(app)
                .post('/uvu/logs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    courseId,
                    studentId: testUsers.uvu.student.username,
                    content: 'Test log content'
                });
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('_id');
        });

        test('GET /:tenant/logs/course/:courseId - get course logs', async () => {
            const token = await getAuthToken(testUsers.uvu.teacher.username, testUsers.uvu.teacher.password, 'uvu');
            
            // Create a course and log
            const courseResponse = await request(app)
                .post('/uvu/courses')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Test Course',
                    description: 'Test Description'
                });
            
            const courseId = courseResponse.body._id;
            
            await request(app)
                .post('/uvu/logs')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    courseId,
                    studentId: testUsers.uvu.student.username,
                    content: 'Test log content'
                });
            
            const response = await request(app)
                .get(`/uvu/logs/course/${courseId}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        test('GET /:tenant/logs/student/:studentId - get student logs', async () => {
            const token = await getAuthToken(testUsers.uvu.student.username, testUsers.uvu.student.password, 'uvu');
            
            const response = await request(app)
                .get(`/uvu/logs/student/${testUsers.uvu.student.username}`)
                .set('Authorization', `Bearer ${token}`);
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('User Management Routes', () => {
        test('POST /:tenant/auth/create-teacher - admin creates teacher', async () => {
            const token = await getAuthToken(testUsers.uvu.admin.username, testUsers.uvu.admin.password, 'uvu');
            
            const response = await request(app)
                .post('/uvu/auth/create-teacher')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'new_teacher',
                    password: 'newpass123',
                    uvuId: '80000005'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.role).toBe('teacher');
        });

        test('POST /:tenant/auth/create-ta - teacher creates TA', async () => {
            const token = await getAuthToken(testUsers.uvu.teacher.username, testUsers.uvu.teacher.password, 'uvu');
            
            const response = await request(app)
                .post('/uvu/auth/create-ta')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'new_ta',
                    password: 'newpass123',
                    uvuId: '80000006'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.role).toBe('ta');
        });

        test('POST /:tenant/auth/create-student - TA creates student', async () => {
            const token = await getAuthToken(testUsers.uvu.ta.username, testUsers.uvu.ta.password, 'uvu');
            
            const response = await request(app)
                .post('/uvu/auth/create-student')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    username: 'new_student',
                    password: 'newpass123',
                    uvuId: '80000007'
                });
            
            expect(response.status).toBe(201);
            expect(response.body.role).toBe('student');
        });
    });
}); 