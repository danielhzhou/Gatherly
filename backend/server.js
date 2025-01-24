require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { clerkClient, clerkMiddleware } = require('@clerk/express');
const { requireAuth, syncUserData } = require('./middleware/auth');
const calendarRoutes = require('./Controllers/CalendarController');
const availabilityRoutes = require("./Controllers/AvailabilityController");

const app = express();

// Basic middleware
app.use(express.json());
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            process.env.FRONTEND_URL,
            'http://localhost:3000',
            'https://unrivaled-hotteok-8a7ec4.netlify.app'
        ];
        
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Organization-Id',
        'Clerk-Session-Id',
        'Clerk-Organization-Id'
    ],
    credentials: true
}));

// Add detailed request logging middleware
app.use((req, res, next) => {
    console.log({
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        headers: {
            authorization: req.headers.authorization ? 'Bearer [hidden]' : undefined,
            'x-organization-id': req.headers['x-organization-id'],
            'content-type': req.headers['content-type']
        },
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
    });
    next();
});

// Clerk authentication middleware chain
app.use(clerkMiddleware());
app.use(requireAuth);
app.use(syncUserData);

// Routes
app.use("/api/calendar", calendarRoutes);
app.use("/api/availability", availabilityRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error("Global error handler:", {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({ 
        error: 'Something went wrong!',
        details: err.message
    });
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});