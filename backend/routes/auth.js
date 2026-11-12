import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import protect from "../middleware/auth.js";

const router = express.Router();

const generateToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is missing");
    }
    return jwt.sign({ userId }, secret, { expiresIn: "30d" });
};

// Email format validation helper
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Signup
router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Please provide your full name" });
    }

    if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Please provide an email address" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check database connection readiness
    if (mongoose.connection.readyState !== 1) {
        console.error("Signup error: Database is not connected (readyState:", mongoose.connection.readyState, ")");
        return res.status(503).json({ error: "Service unavailable: Database connection is not established" });
    }

    try {
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword
        });

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Signup error details:", err);

        // Handle Mongo duplicate key error (code 11000)
        if (err.code === 11000) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }

        // Handle Mongoose validation errors
        if (err.name === "ValidationError") {
            const firstMsg = Object.values(err.errors)[0]?.message || "Invalid input";
            return res.status(400).json({ error: firstMsg });
        }

        res.status(500).json({ error: "Failed to create account. Please try again later." });
    }
});

// Login
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({ error: "Email is required" });
    }

    if (!password || typeof password !== "string") {
        return res.status(400).json({ error: "Password is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check database connection readiness
    if (mongoose.connection.readyState !== 1) {
        console.error("Login error: Database is not connected (readyState:", mongoose.connection.readyState, ")");
        return res.status(503).json({ error: "Service unavailable: Database connection is not established" });
    }

    try {
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = generateToken(user._id);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Login error details:", err);
        res.status(500).json({ error: "Failed to log in. Please try again later." });
    }
});

// Get current logged-in user (used to validate token on app load)
router.get("/me", protect, async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: "Service unavailable: Database is not connected" });
    }

    try {
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error("Me error details:", err);
        res.status(500).json({ error: "Failed to fetch user session" });
    }
});

export default router;
