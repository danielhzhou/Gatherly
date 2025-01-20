const router = require("express").Router();
const Event = require("../Models/Events");
const moment = require("moment");

router.post("/create-event", async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ error: "Failed to create event" });
    }
});

router.get("/get-events", async (req, res) => {
    try {
        const events = await Event.find({
            start: { $gte: moment(req.query.start).toDate() },
            end: { $lte: moment(req.query.end).toDate() }
        });
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

module.exports = router;