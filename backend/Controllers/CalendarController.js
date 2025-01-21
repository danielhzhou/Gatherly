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
            $or: [
                { start: { $gte: moment(req.query.start).toDate(), $lte: moment(req.query.end).toDate() } },
                { end: { $gte: moment(req.query.start).toDate(), $lte: moment(req.query.end).toDate() } },
                { 
                    start: { $lte: moment(req.query.start).toDate() },
                    end: { $gte: moment(req.query.end).toDate() }
                }
            ]
        });
        
        res.json(events);
    } catch (error) {
        console.error("Error fetching events:", error);
        res.status(500).json({ error: "Failed to fetch events" });
    }
});

router.put("/update-event/:id", async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Failed to update event" });
    }
});

router.delete("/delete-event/:id", async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

module.exports = router;