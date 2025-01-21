const router = require("express").Router();
const Availability = require("../Models/Availability");
const { requireAuth, requireOrganization, syncUserData } = require("../middleware/auth");

// Apply middleware
router.use(requireAuth);
router.use(syncUserData);
router.use(requireOrganization);

// Get user's availability
router.get("/get-availability", async (req, res) => {
    try {
        const availability = await Availability.findOne({
            userId: req.auth.userId,
            organizationId: req.organizationId
        });
        
        res.json(availability || { timeRanges: new Map() });
    } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ error: "Failed to fetch availability" });
    }
});

// Get all users' availability in the organization
router.get("/get-group-availability", async (req, res) => {
    try {
        const availabilities = await Availability.find({
            organizationId: req.organizationId
        });
        
        res.json(availabilities);
    } catch (error) {
        console.error("Error fetching group availability:", error);
        res.status(500).json({ error: "Failed to fetch group availability" });
    }
});

// Update user's availability
router.post("/update-availability", async (req, res) => {
    try {
        const { timeRanges } = req.body;
        
        // Validate time ranges
        for (const [day, ranges] of Object.entries(timeRanges)) {
            for (const range of ranges) {
                if (!range.start || !range.end || 
                    !range.start.match(/^([01]\d|2[0-3]):([0-5]\d)$/) ||
                    !range.end.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) {
                    return res.status(400).json({ 
                        error: "Invalid time format. Use HH:mm (24-hour format)" 
                    });
                }
            }
        }

        const availability = await Availability.findOneAndUpdate(
            {
                userId: req.auth.userId,
                organizationId: req.organizationId
            },
            {
                userId: req.auth.userId,
                organizationId: req.organizationId,
                userEmail: req.user.email,
                timeRanges
            },
            { 
                new: true,
                upsert: true
            }
        );

        res.json(availability);
    } catch (error) {
        console.error("Error updating availability:", error);
        res.status(500).json({ error: "Failed to update availability" });
    }
});

// Calculate overlapping free times
router.get("/calculate-overlap", async (req, res) => {
    try {
        const availabilities = await Availability.find({
            organizationId: req.organizationId
        });

        if (availabilities.length === 0) {
            return res.json({
                overlap: {},
                userCount: 0
            });
        }

        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const overlap = {};
        const totalUsers = availabilities.length;

        // Process each day
        for (const day of days) {
            const timeSlots = new Map(); // Map to store count of available users per minute

            // Process each user's availability
            for (const userAvail of availabilities) {
                const ranges = userAvail.timeRanges.get(day) || [];
                
                // For each time range, mark all minutes as available
                for (const range of ranges) {
                    const [startHour, startMin] = range.start.split(':').map(Number);
                    const [endHour, endMin] = range.end.split(':').map(Number);
                    const startMinutes = startHour * 60 + startMin;
                    const endMinutes = endHour * 60 + endMin;

                    for (let minute = startMinutes; minute <= endMinutes; minute++) {
                        timeSlots.set(minute, (timeSlots.get(minute) || 0) + 1);
                    }
                }
            }

            // Convert minutes back to time ranges with availability percentages
            const ranges = [];
            let currentRange = null;

            for (let minute = 0; minute < 24 * 60; minute++) {
                const count = timeSlots.get(minute) || 0;
                const percentage = (count / totalUsers) * 100;

                if (count > 0) {
                    if (!currentRange) {
                        currentRange = {
                            start: `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`,
                            percentage
                        };
                    }
                } else if (currentRange) {
                    currentRange.end = `${String(Math.floor((minute - 1) / 60)).padStart(2, '0')}:${String((minute - 1) % 60).padStart(2, '0')}`;
                    ranges.push(currentRange);
                    currentRange = null;
                }
            }

            // Handle case where range extends to end of day
            if (currentRange) {
                currentRange.end = "23:59";
                ranges.push(currentRange);
            }

            overlap[day] = ranges;
        }

        res.json({
            overlap,
            userCount: totalUsers
        });
    } catch (error) {
        console.error("Error calculating overlap:", error);
        res.status(500).json({ error: "Failed to calculate overlapping times" });
    }
});

module.exports = router; 