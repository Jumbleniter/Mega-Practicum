const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'teacher', 'ta', 'student']
    },
    uvuId: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    tenant: {
        type: String,
        required: true,
        enum: ['uvu', 'uofu']
    },
    enrolledCourses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Method to get user profile (excluding sensitive data)
userSchema.methods.getProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    return userObject;
};

// Static method to find by username and tenant
userSchema.statics.findByUsernameAndTenant = async function(username, tenant) {
    return this.findOne({ username, tenant });
};

// Static method to find by UVU ID and tenant
userSchema.statics.findByUVUIdAndTenant = async function(uvuId, tenant) {
    return this.findOne({ uvuId, tenant });
};

// Indexes
userSchema.index({ username: 1, tenant: 1 }, { unique: true });
userSchema.index({ uvuId: 1, tenant: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1, tenant: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User; 