const { clerkClient, requireAuth: clerkRequireAuth } = require('@clerk/express');
const User = require('../Models/User');

// Middleware to verify authentication
const requireAuth = clerkRequireAuth({
    onError: (err, req, res) => {
        console.error("Authentication error:", err);
        res.status(401).json({ error: "Authentication required" });
    }
});

// Middleware to sync user data
const syncUserData = async (req, res, next) => {
    try {
        if (!req.auth?.userId) {
            console.error("No userId in auth object");
            return res.status(401).json({ error: "Authentication required" });
        }

        // Get user data from Clerk with timeout
        const clerkUser = await Promise.race([
            clerkClient.users.getUser(req.auth.userId),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Clerk API timeout')), 5000)
            )
        ]);
        
        // Get organization from the JWT token
        let organizations = [];
        if (req.auth.orgId) {
            organizations.push({
                organizationId: req.auth.orgId,
                role: req.auth.orgRole?.replace('org:', '') || 'member',
                joinedAt: new Date()
            });
        }

        // Update or create user in our database with timeout
        const user = await Promise.race([
            User.findOneAndUpdate(
                { clerkId: req.auth.userId },
                {
                    clerkId: req.auth.userId,
                    email: clerkUser.emailAddresses[0].emailAddress,
                    organizations: organizations
                },
                { 
                    upsert: true, 
                    new: true,
                    maxTimeMS: 5000 // Set MongoDB operation timeout
                }
            ),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('MongoDB operation timeout')), 5000)
            )
        ]);

        // Attach user to request object for later use
        req.user = user;
        next();
    } catch (error) {
        console.error("Error syncing user data:", {
            error: error.message,
            stack: error.stack,
            userId: req.auth?.userId,
            type: error.name,
            code: error.code
        });

        // Handle specific error types
        if (error.message.includes('timeout')) {
            return res.status(503).json({ 
                error: "Service temporarily unavailable", 
                details: "Database operation timed out. Please try again."
            });
        }

        return res.status(500).json({ 
            error: "Failed to sync user data",
            details: error.message
        });
    }
};

// Middleware to verify organization membership
const requireOrganization = async (req, res, next) => {
    try {
        console.log("Checking organization membership:", {
            headers: req.headers,
            userId: req.auth?.userId,
            hasUser: !!req.user,
            organizationCount: req.user?.organizations?.length || 0,
            orgId: req.auth?.orgId
        });

        // Get organization ID from headers
        const organizationId = req.headers['x-organization-id'];
        
        if (!organizationId) {
            console.error("No organization ID in headers");
            return res.status(400).json({ error: "Organization ID is required" });
        }

        if (!req.auth?.userId) {
            console.error("No user ID in request");
            return res.status(401).json({ error: "Authentication required" });
        }

        // Check if the organization ID matches the one in the JWT
        if (req.auth.orgId !== organizationId) {
            console.error("Organization ID mismatch", {
                tokenOrgId: req.auth.orgId,
                requestOrgId: organizationId
            });
            return res.status(403).json({ error: "Not authorized for this organization" });
        }

        // Add organization ID to request object for use in routes
        req.organizationId = organizationId;
        next();
    } catch (error) {
        console.error("Organization verification failed:", {
            error: error.message,
            stack: error.stack,
            userId: req.auth?.userId,
            organizationId: req.headers['x-organization-id']
        });
        res.status(500).json({ error: "Organization verification failed" });
    }
};

module.exports = {
    requireAuth,
    requireOrganization,
    syncUserData
}; 