require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Log = require('./models/Log');

console.log('Starting seed script...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Course.deleteMany({});
        await Log.deleteMany({});
        console.log('Cleared existing data');

        // Create admin users
        const adminUsers = [
            {
                username: 'root_uvu',
                password: 'willy',
                role: 'admin',
                tenant: 'uvu',
                email: 'root@uvu.edu'
            },
            {
                username: 'root_uofu',
                password: 'swoopy',
                role: 'admin',
                tenant: 'uofu',
                email: 'root@uofu.edu'
            }
        ];

        // Create UVU users
        const uvuUsers = [
            {
                username: 'prof_smith',
                password: 'password123',
                role: 'teacher',
                tenant: 'uvu',
                email: 'prof.smith@uvu.edu',
                uvuId: 'T001'
            },
            {
                username: 'ta_johnson',
                password: 'password123',
                role: 'ta',
                tenant: 'uvu',
                email: 'ta.johnson@uvu.edu',
                uvuId: 'TA001'
            },
            {
                username: 'student1',
                password: 'password123',
                role: 'student',
                tenant: 'uvu',
                uvuId: '12345678',
                email: 'student1@uvu.edu'
            },
            {
                username: 'student2',
                password: 'password123',
                role: 'student',
                tenant: 'uvu',
                uvuId: '87654321',
                email: 'student2@uvu.edu'
            }
        ];

        // Create UofU users
        const uofuUsers = [
            {
                username: 'prof_jones',
                password: 'password123',
                role: 'teacher',
                tenant: 'uofu',
                email: 'prof.jones@uofu.edu',
                uvuId: 'T002'
            },
            {
                username: 'ta_williams',
                password: 'password123',
                role: 'ta',
                tenant: 'uofu',
                email: 'ta.williams@uofu.edu',
                uvuId: 'TA002'
            },
            {
                username: 'student3',
                password: 'password123',
                role: 'student',
                tenant: 'uofu',
                uvuId: '11111111',
                email: 'student3@uofu.edu'
            },
            {
                username: 'student4',
                password: 'password123',
                role: 'student',
                tenant: 'uofu',
                uvuId: '22222222',
                email: 'student4@uofu.edu'
            }
        ];

        // Create all users
        const allUsers = [...adminUsers, ...uvuUsers, ...uofuUsers];
        const createdUsers = [];
        for (const user of allUsers) {
            const newUser = new User(user);
            await newUser.save();
            createdUsers.push(newUser);
            console.log(`Created user: ${user.username}`);
        }

        // Create UVU courses
        const uvuTeacher = createdUsers.find(u => u.username === 'prof_smith');
        const uvuTA = createdUsers.find(u => u.username === 'ta_johnson');
        const uvuStudents = createdUsers.filter(u => u.role === 'student' && u.tenant === 'uvu');

        const uvuCourses = [
            {
                courseId: 'CS1400',
                display: 'Introduction to Programming',
                description: 'Basic programming concepts using Python',
                tenant: 'uvu',
                teacher: uvuTeacher._id,
                tas: [uvuTA._id],
                students: uvuStudents.map(s => s._id)
            },
            {
                courseId: 'CS1410',
                display: 'Object-Oriented Programming',
                description: 'Object-oriented programming using Java',
                tenant: 'uvu',
                teacher: uvuTeacher._id,
                tas: [uvuTA._id],
                students: uvuStudents.map(s => s._id)
            }
        ];

        // Create UofU courses
        const uofuTeacher = createdUsers.find(u => u.username === 'prof_jones');
        const uofuTA = createdUsers.find(u => u.username === 'ta_williams');
        const uofuStudents = createdUsers.filter(u => u.role === 'student' && u.tenant === 'uofu');

        const uofuCourses = [
            {
                courseId: 'CS2100',
                display: 'Data Structures',
                description: 'Fundamental data structures and algorithms',
                tenant: 'uofu',
                teacher: uofuTeacher._id,
                tas: [uofuTA._id],
                students: uofuStudents.map(s => s._id)
            },
            {
                courseId: 'CS2420',
                display: 'Algorithms',
                description: 'Algorithm design and analysis',
                tenant: 'uofu',
                teacher: uofuTeacher._id,
                tas: [uofuTA._id],
                students: uofuStudents.map(s => s._id)
            }
        ];

        // Create all courses
        const allCourses = [...uvuCourses, ...uofuCourses];
        const createdCourses = [];
        for (const course of allCourses) {
            const newCourse = new Course(course);
            await newCourse.save();
            createdCourses.push(newCourse);
            console.log(`Created course: ${course.courseId}`);
        }

        // Create sample logs for UVU
        const uvuCourse = createdCourses.find(c => c.courseId === 'CS1400');
        const uvuStudent = createdUsers.find(u => u.username === 'student1');

        const uvuLogs = [
            {
                studentId: uvuStudent.uvuId,
                courseId: uvuCourse._id,
                content: 'Completed assignment 1',
                tenant: 'uvu',
                createdBy: uvuStudent._id
            },
            {
                studentId: uvuStudent.uvuId,
                courseId: uvuCourse._id,
                content: 'Attended office hours',
                tenant: 'uvu',
                createdBy: uvuTA._id
            }
        ];

        // Create sample logs for UofU
        const uofuCourse = createdCourses.find(c => c.courseId === 'CS2100');
        const uofuStudent = createdUsers.find(u => u.username === 'student3');

        const uofuLogs = [
            {
                studentId: uofuStudent.uvuId,
                courseId: uofuCourse._id,
                content: 'Submitted project proposal',
                tenant: 'uofu',
                createdBy: uofuStudent._id
            },
            {
                studentId: uofuStudent.uvuId,
                courseId: uofuCourse._id,
                content: 'Project proposal approved',
                tenant: 'uofu',
                createdBy: uofuTA._id
            }
        ];

        // Create all logs
        const allLogs = [...uvuLogs, ...uofuLogs];
        for (const log of allLogs) {
            const newLog = new Log(log);
            await newLog.save();
            console.log(`Created log for student ${log.studentId}`);
        }

        console.log('Database seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            codeName: error.codeName
        });
        process.exit(1);
    }
};

seedDatabase(); 