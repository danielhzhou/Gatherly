const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        index: true
    },
    organizations: [{
        organizationId: {
            type: String,
            required: true,
            index: true
        },
        role: {
            type: String,
            enum: ['admin', 'member'],
            default: 'member'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
}, {
    timestamps: true,
    bufferCommands: false,
    autoIndex: true
});

userSchema.index({ clerkId: 1, 'organizations.organizationId': 1 });

userSchema.set('maxTimeMS', 10000);

const User = mongoose.model('User', userSchema);

User.createIndexes().catch(err => {
    console.error('Error creating indexes:', err);
});

module.exports = User; 