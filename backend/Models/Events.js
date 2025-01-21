const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    start: Date,
    end: Date, 
    title: String,
    allDay: {
        type: Boolean,
        default: false
    }
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;