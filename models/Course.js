const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseId: {
        type: String,
        required: true,
        unique: true
    },
    display: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    tenant: {
        type: String,
        required: true,
        enum: ['uvu', 'uofu']
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
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
courseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to get course details (excluding sensitive data)
courseSchema.methods.getDetails = function() {
    const courseObject = this.toObject();
    return courseObject;
};

// Static method to find by teacher and tenant
courseSchema.statics.findByTeacherAndTenant = async function(teacherId, tenant) {
    return this.find({ teacher: teacherId, tenant });
};

// Static method to find by TA and tenant
courseSchema.statics.findByTAAndTenant = async function(taId, tenant) {
    return this.find({ tas: taId, tenant });
};

// Static method to find by student and tenant
courseSchema.statics.findByStudentAndTenant = async function(studentId, tenant) {
    return this.find({ students: studentId, tenant });
};

// Create compound index for tenant and courseId
courseSchema.index({ tenant: 1, courseId: 1 }, { unique: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course; 