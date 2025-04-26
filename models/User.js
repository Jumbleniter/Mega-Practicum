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
    role: {
        type: String,
        enum: ['admin', 'teacher', 'ta', 'student'],
        required: true
    },
    tenant: {
        type: String,
        enum: ['uvu', 'uofu'],
        required: true
    },
    uvuId: {
        type: String,
        required: function() {
            return this.role === 'student';
        },
        validate: {
            validator: function(v) {
                return /^\d{8}$/.test(v);
            },
            message: props => `${props.value} is not a valid UVU ID! Must be 8 digits.`
        }
    }
}, {
    timestamps: true
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
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 