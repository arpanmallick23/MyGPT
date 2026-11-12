import express from "express";
import mongoose from "mongoose";
import CustomPersona, { ALLOWED_STYLES, ALLOWED_ICONS } from "../models/CustomPersona.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// All custom persona endpoints require a valid authenticated user
router.use(protect);

/**
 * GET /api/personas
 * Lists all custom personas created by the authenticated user.
 */
router.get("/", async (req, res) => {
    try {
        const personas = await CustomPersona.find({ userId: req.userId }).sort({ updatedAt: -1 });

        const formatted = personas.map(p => ({
            id: `custom_${p._id}`,
            _id: p._id,
            name: p.name,
            description: p.description,
            instructions: p.instructions,
            responseStyle: p.responseStyle,
            icon: p.icon,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Error fetching custom personas:", err);
        res.status(500).json({ error: "Failed to fetch custom personas" });
    }
});

/**
 * POST /api/personas
 * Creates a new custom persona for the authenticated user.
 */
router.post("/", async (req, res) => {
    const { name, description, instructions, responseStyle, icon } = req.body;

    // 1. Validate name
    if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Persona name is required" });
    }
    const cleanName = name.trim();
    if (cleanName.length > 50) {
        return res.status(400).json({ error: "Persona name cannot exceed 50 characters" });
    }

    // 2. Validate description
    let cleanDesc = "";
    if (description && typeof description === "string") {
        cleanDesc = description.trim();
        if (cleanDesc.length > 140) {
            return res.status(400).json({ error: "Description cannot exceed 140 characters" });
        }
    }

    // 3. Validate instructions
    if (!instructions || typeof instructions !== "string" || !instructions.trim()) {
        return res.status(400).json({ error: "Custom instructions are required" });
    }
    const cleanInstructions = instructions.trim();
    if (cleanInstructions.length > 3000) {
        return res.status(400).json({ error: "Instructions cannot exceed 3000 characters" });
    }

    // 4. Validate responseStyle
    const style = responseStyle ? String(responseStyle).toLowerCase().trim() : "professional";
    if (!ALLOWED_STYLES.includes(style)) {
        return res.status(400).json({
            error: `Invalid response style. Allowed: ${ALLOWED_STYLES.join(", ")}`
        });
    }

    // 5. Validate icon
    const cleanIcon = icon && ALLOWED_ICONS.includes(icon) ? icon : "fa-solid fa-robot";

    try {
        const newPersona = await CustomPersona.create({
            userId: req.userId,
            name: cleanName,
            description: cleanDesc,
            instructions: cleanInstructions,
            responseStyle: style,
            icon: cleanIcon
        });

        res.status(201).json({
            id: `custom_${newPersona._id}`,
            _id: newPersona._id,
            name: newPersona.name,
            description: newPersona.description,
            instructions: newPersona.instructions,
            responseStyle: newPersona.responseStyle,
            icon: newPersona.icon,
            createdAt: newPersona.createdAt,
            updatedAt: newPersona.updatedAt
        });
    } catch (err) {
        console.error("Error creating custom persona:", err);
        res.status(500).json({ error: "Failed to create custom persona" });
    }
});

/**
 * GET /api/personas/:id
 * Retrieves a single custom persona owned by the authenticated user.
 */
router.get("/:id", async (req, res) => {
    const rawId = req.params.id.replace("custom_", "").trim();

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
        return res.status(404).json({ error: "Persona not found" });
    }

    try {
        const persona = await CustomPersona.findOne({ _id: rawId, userId: req.userId });

        if (!persona) {
            return res.status(404).json({ error: "Persona not found" });
        }

        res.json({
            id: `custom_${persona._id}`,
            _id: persona._id,
            name: persona.name,
            description: persona.description,
            instructions: persona.instructions,
            responseStyle: persona.responseStyle,
            icon: persona.icon,
            createdAt: persona.createdAt,
            updatedAt: persona.updatedAt
        });
    } catch (err) {
        console.error("Error fetching persona:", err);
        res.status(500).json({ error: "Failed to fetch persona" });
    }
});

/**
 * PUT /api/personas/:id
 * Updates an existing custom persona owned by the authenticated user.
 */
router.put("/:id", async (req, res) => {
    const rawId = req.params.id.replace("custom_", "").trim();

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
        return res.status(404).json({ error: "Persona not found" });
    }

    const { name, description, instructions, responseStyle, icon } = req.body;
    const updates = {};

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ error: "Persona name cannot be empty" });
        }
        if (name.trim().length > 50) {
            return res.status(400).json({ error: "Persona name cannot exceed 50 characters" });
        }
        updates.name = name.trim();
    }

    if (description !== undefined) {
        if (typeof description === "string") {
            if (description.trim().length > 140) {
                return res.status(400).json({ error: "Description cannot exceed 140 characters" });
            }
            updates.description = description.trim();
        }
    }

    if (instructions !== undefined) {
        if (typeof instructions !== "string" || !instructions.trim()) {
            return res.status(400).json({ error: "Instructions cannot be empty" });
        }
        if (instructions.trim().length > 3000) {
            return res.status(400).json({ error: "Instructions cannot exceed 3000 characters" });
        }
        updates.instructions = instructions.trim();
    }

    if (responseStyle !== undefined) {
        const style = String(responseStyle).toLowerCase().trim();
        if (!ALLOWED_STYLES.includes(style)) {
            return res.status(400).json({
                error: `Invalid response style. Allowed: ${ALLOWED_STYLES.join(", ")}`
            });
        }
        updates.responseStyle = style;
    }

    if (icon !== undefined) {
        if (!ALLOWED_ICONS.includes(icon)) {
            return res.status(400).json({ error: "Invalid icon identifier" });
        }
        updates.icon = icon;
    }

    try {
        const persona = await CustomPersona.findOneAndUpdate(
            { _id: rawId, userId: req.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!persona) {
            return res.status(404).json({ error: "Persona not found" });
        }

        res.json({
            id: `custom_${persona._id}`,
            _id: persona._id,
            name: persona.name,
            description: persona.description,
            instructions: persona.instructions,
            responseStyle: persona.responseStyle,
            icon: persona.icon,
            createdAt: persona.createdAt,
            updatedAt: persona.updatedAt
        });
    } catch (err) {
        console.error("Error updating persona:", err);
        res.status(500).json({ error: "Failed to update persona" });
    }
});

/**
 * DELETE /api/personas/:id
 * Deletes a custom persona owned by the authenticated user.
 */
router.delete("/:id", async (req, res) => {
    const rawId = req.params.id.replace("custom_", "").trim();

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
        return res.status(404).json({ error: "Persona not found" });
    }

    try {
        const deleted = await CustomPersona.findOneAndDelete({ _id: rawId, userId: req.userId });

        if (!deleted) {
            return res.status(404).json({ error: "Persona not found" });
        }

        res.json({ success: "Persona deleted successfully", id: `custom_${rawId}` });
    } catch (err) {
        console.error("Error deleting persona:", err);
        res.status(500).json({ error: "Failed to delete persona" });
    }
});

export default router;

