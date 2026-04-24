const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Cart = require("../models/Cart");

// REGISTER
router.post("/register", async (req, res) => {
  console.log("[REGISTER] Incoming body:", req.body);
  try {
    const { name, email, password, taxId, homeAddress } = req.body;

    // Basic validation to help the frontend dev
    if (!name || !email || !password || !taxId || !homeAddress) {
      console.warn("[REGISTER] Missing fields:", {
        name: !!name,
        email: !!email,
        password: !!password,
        taxId: !!taxId,
        homeAddress: !!homeAddress,
      });
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Customer.findOne({ email });
    if (existing) {
      console.warn("[REGISTER] Duplicate email:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const customer = await Customer.create({
      name,
      email,
      password,
      taxId,
      homeAddress, // Database guy will change this to String in the model
    });

    console.log("[REGISTER] Created customer:", customer._id);
    res.status(201).json({
      message: "Customer created successfully",
      id: customer._id,
    });
  } catch (err) {
    console.error("[REGISTER] Error:", err);
    res.status(500).json({
      message: err.message || "Server error during registration",
    });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, sessionId } = req.body;

    const customer = await Customer.findOne({ email }).select("+password");
    if (!customer) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Merge carts if a sessionId is present (Requirement #4)
    if (sessionId) {
      try {
        await Cart.mergeCarts(sessionId, customer._id);
        console.log(`[LOGIN] Carts merged for user ${customer._id} and session ${sessionId}`);
      } catch (mergeErr) {
        console.error("[LOGIN] Cart merge failed:", mergeErr);
      }
    }

    res.json({
      message: "Login successful",
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
        role: customer.role,
        homeAddress: customer.homeAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
