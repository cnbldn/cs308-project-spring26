const express = require('express');
const router = express.Router();

// Mock Login Route
// This will unblock the frontend developer immediately
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    console.log(`Login attempt for: ${email}`);

    // Temporary logic: Allow any login for the demo
    if (email && password) {
        return res.status(200).json({
            message: "Login successful (Mock)",
            user: {
                id: "mock-123",
                email: email,
                name: "Demo User",
                role: "customer"
            },
            token: "mock-jwt-token-for-demo"
        });
    }

    return res.status(400).json({ message: "Invalid email or password" });
});

module.exports = router;
