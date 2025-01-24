const router = require("express").Router();
const Event = require("../Models/Events");
const moment = require("moment");
const { requireAuth, requireOrganization, syncUserData } = require("../middleware/auth");

// Add logging middleware to debug auth flow
router.use((req, res, next) => {
    console.log("Calendar route auth debug:", {
        hasAuth: !!req.auth,
        userId: req.auth?.userId,
        hasUser: !!req.user,
        organizationId: req.headers['x-organization-id'],
        path: req.path
    });
    next();
});

// Apply authentication and user sync middleware first
router.use(requireAuth);
router.use(syncUserData);

// Then apply organization check
router.use(requireOrganization);

// Create event
router.post("/create-event", async (req, res) => {
    try {
        console.log("Creating event with data:", {
            body: req.body,
            userId: req.auth?.userId,
            organizationId: req.organizationId,
            hasUser: !!req.user,
            headers: req.headers
        });

        if (!req.body.title || !req.body.start || !req.body.end) {
            console.error("Missing required fields:", req.body);
            return res.status(400).json({ error: "Missing required fields: title, start, and end are required" });
        }

        const event = new Event({
            title: req.body.title,
            start: moment(req.body.start).toDate(),
            end: moment(req.body.end).toDate(),
            allDay: req.body.allDay || false,
            organizationId: req.organizationId,
            userId: req.auth.userId,
            creatorEmail: req.user.email
        });
        
        console.log("Attempting to save event:", event);
        const savedEvent = await event.save();
        console.log("Event saved successfully:", savedEvent);
        
        // Return the event with editable flag
        const eventWithMeta = {
            ...savedEvent.toObject(),
            editable: true // Creator always has edit rights
        };
        res.status(201).json(eventWithMeta);
    } catch (error) {
        console.error("Error creating event:", {
            error: error.message,
            stack: error.stack,
            body: req.body,
            userId: req.auth?.userId,
            hasUser: !!req.user
        });
        res.status(500).json({ 
            error: "Failed to create event", 
            details: error.message,
            validationErrors: error.errors
        });
    }
});

// Get events for organization
router.get("/get-events", async (req, res) => {
    try {
        console.log("Fetching events with params:", {
            organizationId: req.organizationId,
            start: req.query.start,
            end: req.query.end,
            userId: req.auth?.userId
        });

        if (!req.query.start || !req.query.end) {
            return res.status(400).json({ error: "Start and end dates are required" });
        }

        const events = await Event.find({
            organizationId: req.organizationId,
            $or: [
                { start: { $gte: moment(req.query.start).toDate(), $lte: moment(req.query.end).toDate() } },
                { end: { $gte: moment(req.query.start).toDate(), $lte: moment(req.query.end).toDate() } },
                { 
                    start: { $lte: moment(req.query.start).toDate() },
                    end: { $gte: moment(req.query.end).toDate() }
                }
            ]
        }).select('title start end allDay organizationId userId creatorEmail');
        
        console.log("Found events:", events.length);
        
        // Format events to include creator info and editable flag
        const formattedEvents = events.map(event => {
            const isCreator = event.userId === req.auth.userId;
            return {
                ...event.toObject(),
                editable: isCreator
            };
        });

        res.json(formattedEvents);
    } catch (error) {
        console.error("Error fetching events:", {
            error: error.message,
            stack: error.stack,
            query: req.query,
            userId: req.auth?.userId,
            organizationId: req.organizationId
        });
        res.status(500).json({ 
            error: "Failed to fetch events",
            details: error.message
        });
    }
});

// Update event
router.put("/update-event/:id", async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, organizationId: req.organizationId });
        
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if user owns the event
        if (event.userId !== req.auth.userId) {
            return res.status(403).json({ error: "Only the event creator can modify this event" });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { 
                ...req.body, 
                organizationId: req.organizationId, 
                userId: req.auth.userId,
                creatorEmail: event.creatorEmail // Preserve the original creator's email
            },
            { new: true }
        );

        // Return the event with editable flag
        const eventWithMeta = {
            ...updatedEvent.toObject(),
            editable: true // Creator always has edit rights
        };
        res.json(eventWithMeta);
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ error: "Failed to update event" });
    }
});

// Delete event
router.delete("/delete-event/:id", async (req, res) => {
    try {
        const event = await Event.findOne({ _id: req.params.id, organizationId: req.organizationId });
        
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }

        // Check if user owns the event
        if (event.userId !== req.auth.userId) {
            return res.status(403).json({ error: "Only the event creator can delete this event" });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: "Event deleted successfully" });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ error: "Failed to delete event" });
    }
});

module.exports = router;