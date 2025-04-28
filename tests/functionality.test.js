const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');
require('dotenv').config();

// Test data
const testUsers = {
    uvu: {
        admin: { username: 'test_admin_uvu', password: 'password', role: 'admin', tenant: 'uvu', uvuId: 'A12345678' },
        teacher: { username: 'test_teacher_uvu', password: 'password', role: 'teacher', tenant: 'uvu', uvuId: 'T12345678' },
        ta: { username: 'test_ta_uvu', password: 'password', role: 'ta', tenant: 'uvu', uvuId: 'TA12345678' },
        student: { username: 'test_student_uvu', password: 'password', role: 'student', tenant: 'uvu', uvuId: 'S12345678' }
    },
    uofu: {
        admin: { username: 'test_admin_uofu', password: 'password', role: 'admin', tenant: 'uofu', uvuId: 'A87654321' },
        teacher: { username: 'test_teacher_uofu', password: 'password', role: 'teacher', tenant: 'uofu', uvuId: 'T87654321' },
        ta: { username: 'test_ta_uofu', password: 'password', role: 'ta', tenant: 'uofu', uvuId: 'TA87654321' },
        student: { username: 'test_student_uofu', password: 'password', role: 'student', tenant: 'uofu', uvuId: 'S87654321' }
    }
};

// Helper function to get auth token
const getAuthToken = async (username, password, tenant) => {
    const response = await request(app)
        .post(`/${tenant}/auth/login`)
        .send({ username, password });
    return response.body.token;
};

describe('Multi-tenant System Tests', () => {
    beforeAll(async () => {
        try {
            // Set test environment
            process.env.NODE_ENV = 'test';
            
            // Connect to database
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 10000
            });

            // Clear test collections
            await Course.deleteMany({});
            await Log.deleteMany({});
            await User.deleteMany({ username: { $in: [
                'test_admin_uvu', 'test_teacher_uvu', 'test_ta_uvu', 'test_student_uvu',
                'test_admin_uofu', 'test_teacher_uofu', 'test_ta_uofu', 'test_student_uofu'
            ]}});

            // Create test users
            for (const tenant of Object.keys(testUsers)) {
                for (const role of Object.keys(testUsers[tenant])) {
                    const user = testUsers[tenant][role];
                    user.password = await bcrypt.hash(user.password, 10);
                    await User.create(user);
                }
            }
        } catch (error) {
            console.error('Error in beforeAll:', error);
            throw error;
        }
    }, 30000); // Increase timeout to 30 seconds

    afterAll(async () => {
        try {
            // Clean up test data
            await Course.deleteMany({});
            await Log.deleteMany({});
            await User.deleteMany({ username: { $in: [
                'test_admin_uvu', 'test_teacher_uvu', 'test_ta_uvu', 'test_student_uvu',
                'test_admin_uofu', 'test_teacher_uofu', 'test_ta_uofu', 'test_student_uofu'
            ]}});
            await mongoose.connection.close();
        } catch (error) {
            console.error('Error in afterAll:', error);
        }
    });

    beforeEach(async () => {
        try {
            await Course.deleteMany({});
            await Log.deleteMany({});
        } catch (error) {
            console.error('Error in beforeEach:', error);
        }
    });

    describe('Authentication Tests', () => {
        test('UVU admin can login', async () => {
            const response = await request(app)
                .post('/uvu/auth/login')
                .send({
                    username: testUsers.uvu.admin.username,
                    password: 'password'
                });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });

        test('UofU admin can login', async () => {
            const response = await request(app)
                .post('/uofu/auth/login')
                .send({
                    username: testUsers.uofu.admin.username,
                    password: 'password'
                });
            expect(response.status).toBe(200);
            expect(response.body.token).toBeDefined();
        });
    });

    describe('Multi-tenant Authentication Tests', () => {
        describe('Tenant Isolation Tests', () => {
            test('UVU admin cannot access UofU resources', async () => {
                const uvuToken = await getAuthToken(testUsers.uvu.admin.username, 'password', 'uvu');
                
                const response = await request(app)
                    .get('/uofu/courses')
                    .set('Authorization', `Bearer ${uvuToken}`);
                
                expect(response.status).toBe(401);
            });

            test('UofU admin cannot access UVU resources', async () => {
                const uofuToken = await getAuthToken(testUsers.uofu.admin.username, 'password', 'uofu');
                
                const response = await request(app)
                    .get('/uvu/courses')
                    .set('Authorization', `Bearer ${uofuToken}`);
                
                expect(response.status).toBe(401);
            });

            test('UVU admin can access UVU create teacher page', async () => {
                const uvuToken = await getAuthToken(testUsers.uvu.admin.username, 'password', 'uvu');
                
                const response = await request(app)
                    .get('/uvu/admin/create-teacher')
                    .set('Authorization', `Bearer ${uvuToken}`);
                
                expect(response.status).toBe(200);
            });

            test('UVU non-admin is redirected from create teacher page', async () => {
                const uvuToken = await getAuthToken(testUsers.uvu.teacher.username, 'password', 'uvu');
                
                const response = await request(app)
                    .get('/uvu/admin/create-teacher')
                    .set('Authorization', `Bearer ${uvuToken}`);
                
                expect(response.status).toBe(403);
            });
        });

        describe('Role-Based Access Control Tests', () => {
            test('Admin can create teacher', async () => {
                const adminToken = await getAuthToken(testUsers.uvu.admin.username, 'password', 'uvu');
                
                const response = await request(app)
                    .post('/uvu/admin/create-teacher')
                    .set('Authorization', `Bearer ${adminToken}`)
                    .send({
                        username: 'new_teacher',
                        password: 'newpass123',
                        uvuId: 'T99999999'
                    });
                
                expect(response.status).toBe(201);
                expect(response.body.role).toBe('teacher');
            });

            test('Teacher can create course', async () => {
                const teacherToken = await getAuthToken(testUsers.uvu.teacher.username, 'password', 'uvu');
                
                const response = await request(app)
                    .post('/uvu/courses')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        name: 'Test Course',
                        description: 'Test Description'
                    });
                
                expect(response.status).toBe(201);
            });

            test('Student cannot create course', async () => {
                const studentToken = await getAuthToken(testUsers.uvu.student.username, 'password', 'uvu');
                
                const response = await request(app)
                    .post('/uvu/courses')
                    .set('Authorization', `Bearer ${studentToken}`)
                    .send({
                        name: 'Test Course',
                        description: 'Test Description'
                    });
                
                expect(response.status).toBe(403);
            });
        });

        describe('Log Access Tests', () => {
            test('Student can only view their own logs', async () => {
                const teacherToken = await getAuthToken(testUsers.uvu.teacher.username, 'password', 'uvu');
                
                // Create a course and enroll student
                const courseResponse = await request(app)
                    .post('/uvu/courses')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        name: 'Test Course',
                        description: 'Test Description'
                    });
                
                const courseId = courseResponse.body._id;
                
                // Create a log for the student
                await request(app)
                    .post('/uvu/logs')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        courseId,
                        studentId: testUsers.uvu.student.username,
                        content: 'Test log content'
                    });
                
                // Try to access logs as student
                const studentToken = await getAuthToken(testUsers.uvu.student.username, 'password', 'uvu');
                const response = await request(app)
                    .get(`/uvu/logs/student/${testUsers.uvu.student.username}`)
                    .set('Authorization', `Bearer ${studentToken}`);
                
                expect(response.status).toBe(200);
                expect(response.body.length).toBeGreaterThan(0);
            });

            test('Student cannot view other students\' logs', async () => {
                const studentToken = await getAuthToken(testUsers.uvu.student.username, 'password', 'uvu');
                
                const response = await request(app)
                    .get('/uvu/logs/student/another_student')
                    .set('Authorization', `Bearer ${studentToken}`);
                
                expect(response.status).toBe(403);
            });
        });

        describe('Course Management Tests', () => {
            test('Teacher can add TA to course', async () => {
                const teacherToken = await getAuthToken(testUsers.uvu.teacher.username, 'password', 'uvu');
                
                // Create course
                const courseResponse = await request(app)
                    .post('/uvu/courses')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        name: 'Test Course',
                        description: 'Test Description'
                    });
                
                const courseId = courseResponse.body._id;
                
                // Add TA to course
                const response = await request(app)
                    .post(`/uvu/courses/${courseId}/tas`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        taId: testUsers.uvu.ta.username
                    });
                
                expect(response.status).toBe(200);
            });

            test('TA can view course logs', async () => {
                const teacherToken = await getAuthToken(testUsers.uvu.teacher.username, 'password', 'uvu');
                
                // Create course and add TA
                const courseResponse = await request(app)
                    .post('/uvu/courses')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        name: 'Test Course',
                        description: 'Test Description'
                    });
                
                const courseId = courseResponse.body._id;
                
                await request(app)
                    .post(`/uvu/courses/${courseId}/tas`)
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        taId: testUsers.uvu.ta.username
                    });
                
                // Create a log
                await request(app)
                    .post('/uvu/logs')
                    .set('Authorization', `Bearer ${teacherToken}`)
                    .send({
                        courseId,
                        studentId: testUsers.uvu.student.username,
                        content: 'Test log content'
                    });
                
                // Try to access logs as TA
                const taToken = await getAuthToken(testUsers.uvu.ta.username, 'password', 'uvu');
                const response = await request(app)
                    .get(`/uvu/logs/course/${courseId}`)
                    .set('Authorization', `Bearer ${taToken}`);
                
                expect(response.status).toBe(200);
                expect(response.body.length).toBeGreaterThan(0);
            });
        });
    });
}); 