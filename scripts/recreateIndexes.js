const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function recreateIndexes() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop all indexes
        await User.collection.dropIndexes();
        console.log('Dropped all indexes');

        // Recreate indexes
        await User.collection.createIndex({ username: 1, tenant: 1 }, { unique: true });
        await User.collection.createIndex({ uvuId: 1, tenant: 1 }, { unique: true, sparse: true });
        await User.collection.createIndex({ role: 1, tenant: 1 });
        console.log('Recreated indexes');

        console.log('Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

recreateIndexes(); 