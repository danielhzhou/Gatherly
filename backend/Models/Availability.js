const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    organizationId: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    // Store time ranges for each day of the week
    timeRanges: {
        type: Map,
        of: [{
            start: String,  // Format: "HH:mm" (24-hour)
            end: String    // Format: "HH:mm" (24-hour)
        }],
        default: new Map([
            ['monday', [{ start: "00:00", end: "23:59" }]],
            ['tuesday', [{ start: "00:00", end: "23:59" }]],
            ['wednesday', [{ start: "00:00", end: "23:59" }]],
            ['thursday', [{ start: "00:00", end: "23:59" }]],
            ['friday', [{ start: "00:00", end: "23:59" }]],
            ['saturday', [{ start: "00:00", end: "23:59" }]],
            ['sunday', [{ start: "00:00", end: "23:59" }]]
        ])
    }
}, { timestamps: true });

// Compound index to ensure one availability record per user per organization
availabilitySchema.index({ userId: 1, organizationId: 1 }, { unique: true });

module.exports = mongoose.model("Availability", availabilitySchema); 