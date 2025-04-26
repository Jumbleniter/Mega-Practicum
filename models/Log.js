const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    uvuId: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{8}$/.test(v);
            },
            message: props => `${props.value} is not a valid UVU ID! Must be 8 digits.`
        }
    },
    courseId: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', logSchema); 