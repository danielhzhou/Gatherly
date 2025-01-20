const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    start: Date,
    end: Date, 
    title: String,
    allDay: {
        type: Boolean,
        default: false
    },
    repeat: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'none'
    }
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;