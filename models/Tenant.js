const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['uvu', 'uofu']
    },
    displayName: {
        type: String,
        required: true
    },
    theme: {
        primaryColor: {
            type: String,
            default: '#007bff'
        },
        secondaryColor: {
            type: String,
            default: '#6c757d'
        },
        backgroundColor: {
            type: String,
            default: '#ffffff'
        },
        textColor: {
            type: String,
            default: '#212529'
        }
    },
    logo: {
        type: String
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
tenantSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Method to get tenant details
tenantSchema.methods.getDetails = function() {
    const tenantObject = this.toObject();
    return tenantObject;
};

// Static method to find by name
tenantSchema.statics.findByName = async function(name) {
    return this.findOne({ name });
};

// Static method to get all tenants
tenantSchema.statics.getAll = async function() {
    return this.find();
};

const Tenant = mongoose.model('Tenant', tenantSchema);

module.exports = Tenant; 