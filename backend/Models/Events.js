const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    allDay: {
        type: Boolean,
        default: false
    },
    organizationId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    creatorEmail: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Create compound index for efficient querying
eventSchema.index({ organizationId: 1, start: 1, end: 1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;