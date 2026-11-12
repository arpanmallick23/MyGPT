import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/gemini.js";
import { resolveNewThreadPersona, resolveExistingThreadPersona } from "../utils/personas.js";
import protect from "../middleware/auth.js";

const router = express.Router();

// All routes below require a valid logged-in user
router.use(protect);

// Helper to sanitize Gemini/service errors for safe, user-friendly responses
const formatErrorResponse = (err, defaultMessage = "Something went wrong") => {
    const status = err.status || err.statusCode || 500;
    const isTransient = err.isTransient || status === 503 || status === 429;

    let friendlyMessage = defaultMessage;
    if (status === 503 || isTransient) {
        friendlyMessage = "The AI service is temporarily experiencing high demand or maintenance. Please try again in a few moments.";
    } else if (status === 429) {
        friendlyMessage = "Rate limit reached. Please wait a moment before sending another request.";
    } else if (status === 401 || status === 403) {
        friendlyMessage = "AI service authentication error. Please contact the administrator.";
    } else if (status === 400) {
        friendlyMessage = err.message || "Invalid request. Please check your prompt.";
    }

    return {
        statusCode: typeof status === "number" && status >= 400 && status < 600 ? status : 500,
        payload: {
            error: friendlyMessage,
            isTransient: !!isTransient,
            canRetry: isTransient || status >= 500
        }
    };
};

// Get all threads belonging to the logged-in user
router.get("/thread", async(req, res) => {
    try {
        const threads = await Thread.find({ userId: req.userId }).sort({ updatedAt: -1 });

        // Normalize each thread to ensure persona defaults to 'general' if missing
        const formattedThreads = threads.map(thread => ({
            _id: thread._id,
            threadId: thread.threadId,
            title: thread.title,
            persona: thread.persona || "general",
            personaName: thread.personaName || "General AI",
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt
        }));

        res.json(formattedThreads);
    } catch(err) {
        console.log("Failed to fetch threads:", err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// Get a specific thread
router.get("/thread/:threadId", async(req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({ threadId, userId: req.userId });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        const resolvedPersona = resolveExistingThreadPersona(thread);
        const persona = thread.persona || "general";
        const personaName = thread.personaName || resolvedPersona.name || "General AI";

        const messages = [...(thread.messages || [])];
        res.setHeader("X-Thread-Persona", persona);
        res.setHeader("X-Thread-Persona-Name", encodeURIComponent(personaName));
        res.setHeader("X-Thread-Title", encodeURIComponent(thread.title || ""));

        messages.persona = persona;
        messages.personaName = personaName;
        messages.title = thread.title;

        res.json(messages);
    } catch(err) {
        console.log("Failed to fetch chat:", err);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

// Delete a thread
router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({ threadId, userId: req.userId });

        if (!deletedThread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.status(200).json({ success: "Thread deleted successfully" });
    } catch(err) {
        console.log("Failed to delete thread:", err);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

// Post a chat message
router.post("/chat", async(req, res) => {
    const { threadId, message, persona } = req.body;

    if (!threadId || !message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "missing required fields" });
    }

    try {
        let thread = await Thread.findOne({ threadId, userId: req.userId });
        let activePersonaId = "general";
        let resolvedPersona = null;
        const isNewThread = !thread;

        if (isNewThread) {
            // New conversation: resolve persona from request.
            // Explicit invalid, nonexistent, or unauthorized custom persona IDs return 404 (no silent fallback).
            try {
                resolvedPersona = await resolveNewThreadPersona(persona, req.userId);
            } catch (resolveErr) {
                if (resolveErr.statusCode === 404) {
                    return res.status(404).json({ error: resolveErr.message || "Persona not found" });
                }
                throw resolveErr;
            }

            activePersonaId = resolvedPersona.id;
        } else {
            // Existing conversation: ALWAYS use the stored thread configuration and snapshot.
            resolvedPersona = resolveExistingThreadPersona(thread);
            activePersonaId = thread.persona || "general";
        }

        // Generate response using the resolved persona BEFORE committing changes to MongoDB.
        // This ensures failed generations do not leave half-created threads or orphaned user messages.
        const assistantReply = await getGeminiAPIResponse(message.trim(), resolvedPersona);

        if (isNewThread) {
            thread = new Thread({
                threadId,
                userId: req.userId,
                title: message.trim(),
                persona: activePersonaId,
                personaName: resolvedPersona.name,
                personaSnapshot: resolvedPersona.snapshotData || null,
                messages: [
                    { role: "user", content: message.trim() },
                    { role: "assistant", content: assistantReply }
                ]
            });
        } else {
            thread.messages.push({ role: "user", content: message.trim() });
            thread.messages.push({ role: "assistant", content: assistantReply });
            thread.updatedAt = new Date();
        }

        await thread.save();

        res.json({
            reply: assistantReply,
            persona: activePersonaId,
            personaName: resolvedPersona.name
        });
    } catch(err) {
        console.error("Chat error:", err);
        const { statusCode, payload } = formatErrorResponse(err, "Failed to generate reply");
        res.status(statusCode).json(payload);
    }
});

// Edit a previous message in a thread and regenerate assistant response
router.put("/thread/:threadId/message", async (req, res) => {
    const { threadId } = req.params;
    const { messageIndex, messageId, content } = req.body;

    if (content === undefined || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Message content cannot be empty" });
    }

    try {
        const thread = await Thread.findOne({ threadId, userId: req.userId });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        // Locate message by messageId or by index
        let targetIdx = -1;
        if (messageId) {
            targetIdx = thread.messages.findIndex(m => m._id.toString() === messageId.toString());
        } else if (typeof messageIndex === "number" && messageIndex >= 0 && messageIndex < thread.messages.length) {
            targetIdx = messageIndex;
        }

        if (targetIdx === -1) {
            return res.status(404).json({ error: "Message not found" });
        }

        // Ensure target message is a user message
        if (thread.messages[targetIdx].role !== "user") {
            return res.status(400).json({ error: "Only user messages can be edited" });
        }

        // Resolve persona for regeneration using authoritative stored thread configuration
        const resolvedPersona = resolveExistingThreadPersona(thread);

        // Regenerate assistant reply BEFORE persisting truncation.
        // If Gemini generation fails, thread messages remain intact.
        const assistantReply = await getGeminiAPIResponse(content.trim(), resolvedPersona);

        // Truncate conversation to this point (keep history up to and including this user message)
        const updatedMessages = thread.messages.slice(0, targetIdx + 1);
        updatedMessages[targetIdx].content = content.trim();
        updatedMessages[targetIdx].timestamp = new Date();

        // If editing the very first message, update the thread title as well
        if (targetIdx === 0) {
            thread.title = content.trim();
        }

        updatedMessages.push({
            role: "assistant",
            content: assistantReply,
            timestamp: new Date()
        });

        thread.messages = updatedMessages;
        thread.updatedAt = new Date();

        await thread.save();

        res.json({
            messages: thread.messages,
            reply: assistantReply,
            persona: thread.persona || "general",
            personaName: thread.personaName || resolvedPersona.name
        });
    } catch (err) {
        console.error("Edit message error:", err);
        const { statusCode, payload } = formatErrorResponse(err, "Failed to edit message and regenerate response");
        res.status(statusCode).json(payload);
    }
});

export default router;
