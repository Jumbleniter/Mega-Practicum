const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
            },
            message: props => `${props.value} is not a valid UUID!`
        }
    },
    display: {
        type: String,
        required: true
    },
    tenant: {
        type: String,
        enum: ['uvu', 'uofu'],
        required: true
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema); 