const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: true
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    tenant: {
        type: String,
        required: true,
        enum: ['uvu', 'uofu']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
logSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create indexes for efficient querying
logSchema.index({ studentId: 1, tenant: 1 });
logSchema.index({ courseId: 1, tenant: 1 });
logSchema.index({ createdBy: 1, tenant: 1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log; 