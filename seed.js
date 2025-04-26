require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

console.log('Starting seed script...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Present' : 'Missing');

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

async function seed() {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing users
        console.log('Clearing existing users...');
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create admin users
        console.log('Creating admin users...');
        for (const admin of adminUsers) {
            const user = new User(admin);
            await user.save();
            console.log(`Created admin user: ${admin.username} for tenant: ${admin.tenant}`);
        }

        console.log('Seeding completed successfully');
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
}

seed(); 