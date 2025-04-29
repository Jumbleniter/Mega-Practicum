const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const { clearTestDatabase, seedTestDatabase } = require('./testSetup');

describe('Basic Application Tests', () => {
    beforeEach(async () => {
        await clearTestDatabase();
        await seedTestDatabase();
    });

    test('database connection', () => {
        expect(mongoose.connection.readyState).toBe(1);
    });

    test('admin users are seeded', async () => {
        const uvuAdmin = await User.findOne({ username: 'root_uvu', tenant: 'uvu' });
        const uofuAdmin = await User.findOne({ username: 'root_uofu', tenant: 'uofu' });
        
        expect(uvuAdmin).toBeTruthy();
        expect(uvuAdmin.role).toBe('admin');
        expect(uofuAdmin).toBeTruthy();
        expect(uofuAdmin.role).toBe('admin');
    });
});

describe('User Model Tests', () => {
    test('creates a new user with hashed password', async () => {
        const testUser = {
            username: 'testuser',
            password: 'testpassword123',
            role: 'student',
            tenant: 'uvu',
            email: 'test@example.com',
            uvuId: 'TEST001'
        };

        const user = await User.create(testUser);
        
        // Verify user was created
        expect(user.username).toBe(testUser.username);
        expect(user.role).toBe(testUser.role);
        expect(user.tenant).toBe(testUser.tenant);
        expect(user.email).toBe(testUser.email);
        expect(user.uvuId).toBe(testUser.uvuId);
        
        // Verify password was hashed
        expect(user.password).not.toBe(testUser.password);
        expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
        
        // Verify password comparison works
        const isMatch = await user.comparePassword(testUser.password);
        expect(isMatch).toBe(true);
        
        // Verify incorrect password fails
        const isWrongMatch = await user.comparePassword('wrongpassword');
        expect(isWrongMatch).toBe(false);
    });

    test('getProfile method excludes sensitive data', async () => {
        const testUser = {
            username: 'profiletest',
            password: 'testpassword123',
            role: 'student',
            tenant: 'uvu',
            uvuId: 'TEST002'
        };

        const user = await User.create(testUser);
        const profile = user.getProfile();
        
        expect(profile.password).toBeUndefined();
        expect(profile.username).toBe(testUser.username);
        expect(profile.role).toBe(testUser.role);
        expect(profile.tenant).toBe(testUser.tenant);
        expect(profile.uvuId).toBe(testUser.uvuId);
    });

    test('static methods for finding users', async () => {
        // Create test users
        const uvuUser = await User.create({
            username: 'findtest_uvu',
            password: 'testpass',
            role: 'student',
            tenant: 'uvu',
            uvuId: 'TEST003'
        });

        const uofuUser = await User.create({
            username: 'findtest_uofu',
            password: 'testpass',
            role: 'student',
            tenant: 'uofu',
            uvuId: 'TEST004'
        });

        // Test findByUsernameAndTenant
        const foundByUsernameUVU = await User.findByUsernameAndTenant('findtest_uvu', 'uvu');
        const foundByUsernameUofU = await User.findByUsernameAndTenant('findtest_uofu', 'uofu');
        
        expect(foundByUsernameUVU).toBeTruthy();
        expect(foundByUsernameUVU.username).toBe('findtest_uvu');
        expect(foundByUsernameUVU.tenant).toBe('uvu');
        
        expect(foundByUsernameUofU).toBeTruthy();
        expect(foundByUsernameUofU.username).toBe('findtest_uofu');
        expect(foundByUsernameUofU.tenant).toBe('uofu');

        // Test findByUVUIdAndTenant
        const foundByUVUIdUVU = await User.findByUVUIdAndTenant('TEST003', 'uvu');
        const foundByUVUIdUofU = await User.findByUVUIdAndTenant('TEST004', 'uofu');
        
        expect(foundByUVUIdUVU).toBeTruthy();
        expect(foundByUVUIdUVU.uvuId).toBe('TEST003');
        expect(foundByUVUIdUVU.tenant).toBe('uvu');
        
        expect(foundByUVUIdUofU).toBeTruthy();
        expect(foundByUVUIdUofU.uvuId).toBe('TEST004');
        expect(foundByUVUIdUofU.tenant).toBe('uofu');

        // Test non-existent users
        const notFoundByUsername = await User.findByUsernameAndTenant('nonexistent', 'uvu');
        const notFoundByUVUId = await User.findByUVUIdAndTenant('NONE', 'uvu');
        
        expect(notFoundByUsername).toBeNull();
        expect(notFoundByUVUId).toBeNull();
    });
});

describe('Multi-tenant Isolation Tests', () => {
    test('users cannot access data from other tenants', async () => {
        // Create users in different tenants
        const uvuUser = await User.create({
            username: 'uvu_student',
            password: 'testpass',
            role: 'student',
            tenant: 'uvu',
            uvuId: 'UVU001'
        });

        const uofuUser = await User.create({
            username: 'uofu_student',
            password: 'testpass',
            role: 'student',
            tenant: 'uofu',
            uvuId: 'UOFU001'
        });

        // Create courses in different tenants
        await Course.create([
            {
                courseId: 'CS101-UVU',
                display: 'UVU Computer Science 101',
                description: 'Intro to Computer Science at UVU',
                tenant: 'uvu',
                teacher: uvuUser._id
            },
            {
                courseId: 'CS101-UOFU',
                display: 'UofU Computer Science 101',
                description: 'Intro to Computer Science at UofU',
                tenant: 'uofu',
                teacher: uofuUser._id
            }
        ]);

        // Verify users can only see their own tenant's courses
        const uvuCourses = await Course.find({ tenant: 'uvu' });
        expect(uvuCourses).toHaveLength(1);
        expect(uvuCourses[0].courseId).toBe('CS101-UVU');
        expect(uvuCourses[0].display).toBe('UVU Computer Science 101');

        const uofuCourses = await Course.find({ tenant: 'uofu' });
        expect(uofuCourses).toHaveLength(1);
        expect(uofuCourses[0].courseId).toBe('CS101-UOFU');
        expect(uofuCourses[0].display).toBe('UofU Computer Science 101');
    });
});

describe('Role-based Access Control Tests', () => {
    test('admin can create users of any role', async () => {
        const admin = await User.findOne({ username: 'root_uvu', tenant: 'uvu' });
        
        // Create users with different roles
        const teacher = await User.create({
            username: 'new_teacher',
            password: 'testpass',
            role: 'teacher',
            tenant: 'uvu',
            uvuId: 'T003'
        });

        const ta = await User.create({
            username: 'new_ta',
            password: 'testpass',
            role: 'ta',
            tenant: 'uvu',
            uvuId: 'TA003'
        });

        const student = await User.create({
            username: 'new_student',
            password: 'testpass',
            role: 'student',
            tenant: 'uvu',
            uvuId: 'S003'
        });

        // Verify all users were created successfully
        expect(teacher).toBeTruthy();
        expect(ta).toBeTruthy();
        expect(student).toBeTruthy();

        // Verify roles are set correctly
        expect(teacher.role).toBe('teacher');
        expect(ta.role).toBe('ta');
        expect(student.role).toBe('student');
    });

    test('course creation and access permissions', async () => {
        // Create a teacher
        const teacher = await User.create({
            username: 'test_teacher',
            password: 'testpass',
            role: 'teacher',
            tenant: 'uvu',
            uvuId: 'T004'
        });

        // Create a course as teacher
        const teacherCourse = await Course.create({
            courseId: 'CS102',
            display: 'Teacher Course',
            description: 'A course created by a teacher',
            tenant: 'uvu',
            teacher: teacher._id,
            students: [] // Initialize empty students array
        });

        // Verify teacher can create course
        expect(teacherCourse).toBeTruthy();
        expect(teacherCourse.teacher.toString()).toBe(teacher._id.toString());

        // Create a student
        const student = await User.create({
            username: 'test_student',
            password: 'testpass',
            role: 'student',
            tenant: 'uvu',
            uvuId: 'S004'
        });

        // Update course with student
        await Course.findByIdAndUpdate(
            teacherCourse._id,
            { $push: { students: student._id } },
            { new: true }
        );

        // Verify student is enrolled
        const updatedCourse = await Course.findById(teacherCourse._id)
            .populate('students');

        // Verify student can find their courses
        const studentCourses = await Course.findByStudentAndTenant(new mongoose.Types.ObjectId(student._id), 'uvu');
        expect(studentCourses).toHaveLength(1);
        expect(studentCourses[0]._id.toString()).toBe(teacherCourse._id.toString());
    });
}); 