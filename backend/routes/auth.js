const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, taxId, homeAddress } = req.body;

    // Basic validation to help the frontend dev
    if (!name || !email || !password || !taxId || !homeAddress) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Customer.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const customer = await Customer.create({
      name,
      email,
      password,
      taxId,
      homeAddress, // Database guy will change this to String in the model
    });

    res.status(201).json({
      message: "Customer created successfully",
      id: customer._id,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ email }).select("+password");
    if (!customer) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: customer._id,
        email: customer.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;