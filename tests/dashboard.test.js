const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const Log = require('../models/Log');
const { clearTestDatabase, seedTestDatabase } = require('./testSetup');
const bcrypt = require('bcryptjs');

describe('Dashboard Tests', () => {
    beforeEach(async () => {
        await clearTestDatabase();
        await seedTestDatabase();
    });

    // Admin Dashboard Tests
    describe('Admin Dashboard', () => {
        let testUsers = [];
        let testCourses = [];
        let testLogs = [];

        beforeEach(async () => {
            const hashedPassword = await bcrypt.hash('testpass', 10);

            // Create test users with unique usernames and uvuIds
            testUsers = await User.create([
                {
                    username: 'test_teacher',
                    password: hashedPassword,
                    role: 'teacher',
                    tenant: 'uvu',
                    uvuId: 'T001'
                },
                {
                    username: 'test_student',
                    password: hashedPassword,
                    role: 'student',
                    tenant: 'uvu',
                    uvuId: 'S001'
                }
            ]);

            // Create test courses
            testCourses = await Course.create([
                {
                    courseId: 'CS2100',
                    display: 'Data Structures',
                    description: 'Fundamental data structures and algorithms',
                    teacher: new mongoose.Types.ObjectId(testUsers[0]._id),
                    tenant: 'uvu',
                    students: [new mongoose.Types.ObjectId(testUsers[1]._id)]
                },
                {
                    courseId: 'CS2420',
                    display: 'Algorithms',
                    description: 'Algorithm design and analysis',
                    teacher: new mongoose.Types.ObjectId(testUsers[0]._id),
                    tenant: 'uvu',
                    students: [new mongoose.Types.ObjectId(testUsers[1]._id)]
                }
            ]);

            // Create test logs
            testLogs = await Log.create([
                {
                    content: 'Project proposal approved',
                    courseId: testCourses[0]._id,
                    studentId: new mongoose.Types.ObjectId(testUsers[1]._id),
                    createdBy: new mongoose.Types.ObjectId(testUsers[0]._id),
                    tenant: 'uvu',
                    createdAt: new Date('2025-04-28T10:03:55')
                },
                {
                    content: 'Submitted project proposal',
                    courseId: testCourses[0]._id,
                    studentId: new mongoose.Types.ObjectId(testUsers[1]._id),
                    createdBy: new mongoose.Types.ObjectId(testUsers[1]._id),
                    tenant: 'uvu',
                    createdAt: new Date('2025-04-28T10:03:55')
                }
            ]);
        });

        test('admin dashboard shows correct user counts', async () => {
            const users = await User.find({ tenant: 'uvu' });
            
            const userCounts = {
                total: users.length,
                teachers: users.filter(u => u.role === 'teacher').length,
                tas: users.filter(u => u.role === 'ta').length,
                students: users.filter(u => u.role === 'student').length
            };

            // Expect 3 users: root_uvu (admin) + 2 test users
            expect(userCounts.total).toBe(3);
            expect(userCounts.teachers).toBe(1);
            expect(userCounts.tas).toBe(0);
            expect(userCounts.students).toBe(1);
        });

        test('admin dashboard shows recent users', async () => {
            const users = await User.find({ tenant: 'uvu' })
                .sort({ createdAt: -1 })
                .limit(5);

            expect(users.length).toBeLessThanOrEqual(5);
            // The most recent user should be the last test user created
            expect(users[0].username).toBe('test_student');
        });

        test('admin dashboard shows all courses with correct details', async () => {
            const courses = await Course.find({ tenant: 'uvu' })
                .populate('teacher', 'username')
                .populate('students', 'username uvuId')
                .populate('tas', 'username');

            expect(courses.length).toBe(2);
            
            // Check first course details
            expect(courses[0].courseId).toBe('CS2100');
            expect(courses[0].display).toBe('Data Structures');
            expect(courses[0].description).toBe('Fundamental data structures and algorithms');
            expect(courses[0].teacher.username).toBe('test_teacher');
            expect(courses[0].students.length).toBe(1);
            expect(courses[0].tas.length).toBe(0);

            // Check second course details
            expect(courses[1].courseId).toBe('CS2420');
            expect(courses[1].display).toBe('Algorithms');
            expect(courses[1].description).toBe('Algorithm design and analysis');
            expect(courses[1].teacher.username).toBe('test_teacher');
            expect(courses[1].students.length).toBe(1);
            expect(courses[1].tas.length).toBe(0);
        });

        test('admin dashboard shows all logs with correct details', async () => {
            const logs = await Log.find({ tenant: 'uvu' })
                .populate('createdBy', 'username')
                .populate('studentId', 'username')
                .sort({ createdAt: -1 })
                .limit(100);

            expect(logs.length).toBe(2);
            
            // Check first log details
            expect(logs[0].content).toBe('Project proposal approved');
            expect(logs[0].createdBy.username).toBe('test_teacher');
            expect(logs[0].studentId.username).toBe('test_student');
            expect(logs[0].createdAt.toISOString()).toBe('2025-04-28T10:03:55.000Z');

            // Check second log details
            expect(logs[1].content).toBe('Submitted project proposal');
            expect(logs[1].createdBy.username).toBe('test_student');
            expect(logs[1].studentId.username).toBe('test_student');
            expect(logs[1].createdAt.toISOString()).toBe('2025-04-28T10:03:55.000Z');
        });
    });

    // Teacher Dashboard Tests
    describe('Teacher Dashboard', () => {
        let teacher;
        let course;

        beforeEach(async () => {
            // Create a teacher
            teacher = await User.create({
                username: 'test_teacher',
                password: 'testpass',
                role: 'teacher',
                tenant: 'uvu',
                uvuId: 'T001'
            });

            // Create a course for the teacher
            course = await Course.create({
                courseId: 'CS2100',
                display: 'Test Course',
                description: 'Test Description',
                teacher: new mongoose.Types.ObjectId(teacher._id),
                tenant: 'uvu'
            });
        });

        test('teacher dashboard shows correct course and student counts', async () => {
            const courses = await Course.find({
                teacher: new mongoose.Types.ObjectId(teacher._id),
                tenant: 'uvu'
            }).populate('students', 'username uvuId')
              .populate('tas', 'username');

            const studentCount = courses.reduce((acc, course) => acc + course.students.length, 0);
            const taCount = courses.reduce((acc, course) => acc + course.tas.length, 0);

            expect(courses.length).toBe(1);
            expect(studentCount).toBe(0); // No students enrolled yet
            expect(taCount).toBe(0); // No TAs assigned yet
        });

        test('teacher dashboard shows recent courses', async () => {
            const courses = await Course.find({
                teacher: new mongoose.Types.ObjectId(teacher._id),
                tenant: 'uvu'
            }).sort({ createdAt: -1 })
              .limit(5);

            expect(courses.length).toBe(1);
            expect(courses[0].display).toBe('Test Course');
        });
    });

    // Student Dashboard Tests
    describe('Student Dashboard', () => {
        let student;
        let course;
        let log;

        beforeEach(async () => {
            // Create a student
            student = await User.create({
                username: 'test_student',
                password: 'testpass',
                role: 'student',
                tenant: 'uvu',
                uvuId: 'S001'
            });

            // Create a course
            course = await Course.create({
                courseId: 'CS2100',
                display: 'Test Course',
                description: 'Test Description',
                teacher: new mongoose.Types.ObjectId(),
                tenant: 'uvu',
                students: [new mongoose.Types.ObjectId(student._id)]
            });

            // Create logs with explicit timestamps
            await Log.create([
                {
                    content: 'First log entry',
                    courseId: course._id,
                    studentId: new mongoose.Types.ObjectId(student._id),
                    createdBy: new mongoose.Types.ObjectId(student._id),
                    tenant: 'uvu',
                    createdAt: new Date(Date.now() - 1000) // 1 second ago
                },
                {
                    content: 'Second log entry',
                    courseId: course._id,
                    studentId: new mongoose.Types.ObjectId(student._id),
                    createdBy: new mongoose.Types.ObjectId(student._id),
                    tenant: 'uvu',
                    createdAt: new Date() // Now
                }
            ]);
        });

        test('student dashboard shows enrolled courses', async () => {
            const courses = await Course.find({
                students: new mongoose.Types.ObjectId(student._id),
                tenant: 'uvu'
            }).populate('teacher', 'username');

            expect(courses.length).toBe(1);
            expect(courses[0].display).toBe('Test Course');
        });

        test('student dashboard shows recent logs', async () => {
            const logs = await Log.find({
                studentId: new mongoose.Types.ObjectId(student._id),
                tenant: 'uvu'
            })
            .sort({ createdAt: -1 })
            .limit(5);

            expect(logs.length).toBe(2);
            expect(logs[0].content).toBe('Second log entry');
            expect(logs[1].content).toBe('First log entry');
        });
    });
}); 