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
    origin: true, // Allow all origins temporarily for debugging
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Organization-Id',
        'Clerk-Session-Id',
        'Clerk-Organization-Id'
    ],
    credentials: true,
    exposedHeaders: ['Access-Control-Allow-Origin']
}));

// Add detailed request logging middleware
app.use((req, res, next) => {
    console.log("Incoming request:", {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        origin: req.headers.origin,
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

// MongoDB connection with better options
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000, // Timeout after 15 seconds instead of 30
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    retryWrites: true,
})
.then(() => {
    console.log("Connected to MongoDB successfully");
})
.catch(err => {
    console.error("MongoDB connection error:", {
        error: err.message,
        stack: err.stack,
        code: err.code,
        name: err.name
    });
});

// Add MongoDB connection error handlers
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});