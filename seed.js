require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('Starting seed script...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create admin users
        const adminUsers = [
            {
                username: 'root_uvu',
                password: 'willy',
                role: 'admin',
                tenant: 'uvu'
            },
            {
                username: 'root_uofu',
                password: 'swoopy',
                role: 'admin',
                tenant: 'uofu'
            }
        ];

        // Create users
        for (const user of adminUsers) {
            const newUser = new User(user);
            await newUser.save();
            console.log(`Created admin user: ${user.username}`);
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