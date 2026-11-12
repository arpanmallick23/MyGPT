import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const PersonaSnapshotSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    description: { type: String, trim: true },
    instructions: { type: String, trim: true },
    responseStyle: { type: String, trim: true },
    icon: { type: String, trim: true }
}, { _id: false });

const ThreadSchema = new mongoose.Schema({
    threadId: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    title: {
        type: String,
        default: "New Chat"
    },
    persona: {
        type: String,
        default: "general"
    },
    personaName: {
        type: String,
        default: "General AI"
    },
    personaSnapshot: {
        type: PersonaSnapshotSchema,
        default: null
    },
    messages: [MessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Thread", ThreadSchema);
