const mongoose = require('mongoose');
const User = require('../models/User');
require('./testSetup');

describe('Basic Application Tests', () => {
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