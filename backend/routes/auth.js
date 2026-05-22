const express = require("express");
const router = express.Router();
const Customer = require("../models/Customer");
const Cart = require("../models/Cart");

// REGISTER
router.post("/register", async (req, res) => {
  console.log("[REGISTER] Incoming body:", req.body);

  try {
    const { name, email, password, homeAddress } = req.body;

    // Basic validation to help the frontend dev
    if (!name || !email || !password || !homeAddress) {
      console.warn("[REGISTER] Missing fields:", {
        name: !!name,
        email: !!email,
        password: !!password,
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
      homeAddress,
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
        taxId: customer.taxId || "",
        homeAddress: customer.homeAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PROFILE (name / email / homeAddress / taxId)
router.put("/profile/:id", async (req, res) => {
  try {
    const { name, email, homeAddress, taxId } = req.body;

    if (!name || !email || !homeAddress) {
      return res
        .status(400)
        .json({ message: "Name, email and home address are required" });
    }

    if (email) {
      const existing = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updated = await Customer.findByIdAndUpdate(
      req.params.id,
      { name, email, homeAddress, taxId: taxId || "" },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        taxId: updated.taxId || "",
        homeAddress: updated.homeAddress,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE PASSWORD
router.put("/password/:id", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    const customer = await Customer.findById(req.params.id).select("+password");
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const isMatch = await customer.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    customer.password = newPassword;
    await customer.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
