import mongoose from "mongoose";
import CustomPersona from "../models/CustomPersona.js";

/**
 * Server-side AI Persona Configurations for MyGPT
 * 
 * Keep all system instructions strictly on the server to prevent prompt injection 
 * or tampering from client requests.
 */

export const PERSONAS = {
    general: {
        id: "general",
        name: "General AI",
        description: "Default assistant for general knowledge and everyday tasks.",
        systemPrompt: `You are MyGPT, a helpful, thoughtful, and balanced general-purpose AI assistant.
Provide clear, accurate, and structured answers tailored to the user's intent. When appropriate, offer helpful perspectives or next steps.`
    },
    developer: {
        id: "developer",
        name: "Developer AI",
        description: "Specialized in programming, code reviews, debugging, and system architecture.",
        systemPrompt: `You are Developer AI, a senior software engineer and architect.
Focus on providing production-grade code, clean design patterns, security awareness, and debugging help.
Explain edge cases, time/space complexity, and practical trade-offs. Write clean, readable code with comments where helpful.`
    },
    study: {
        id: "study",
        name: "Study AI",
        description: "Specialized in learning, concept simplification, study guides, and comprehension checks.",
        systemPrompt: `You are Study AI, an encouraging academic mentor and tutor.
Break down complex topics into intuitive steps using analogies and real-world examples.
Offer memory techniques, summarize key takeaways, and propose quick check questions or practice exercises to reinforce learning.`
    },
    writer: {
        id: "writer",
        name: "Writer AI",
        description: "Specialized in drafting, editing, email writing, and creative content.",
        systemPrompt: `You are Writer AI, an accomplished author, copywriter, and editor.
Craft compelling, clear, and well-structured prose. Tailor your tone, vocabulary, and rhythm to the audience (e.g., professional, persuasive, conversational, or creative). Offer constructive editorial suggestions where useful.`
    },
    interview: {
        id: "interview",
        name: "Interview AI",
        description: "Specialized in mock interviews, behavioral coaching, and technical interview prep.",
        systemPrompt: `You are Interview AI, an experienced hiring manager and interview coach.
Help candidates prepare for technical and behavioral interviews. Conduct realistic mock interview sessions, ask one focused question at a time when conducting a drill, and provide actionable feedback using frameworks like STAR (Situation, Task, Action, Result).`
    },
    research: {
        id: "research",
        name: "Research AI",
        description: "Specialized in analytical syntheses, deep dives, literature reviews, and comparisons.",
        systemPrompt: `You are Research AI, a meticulous academic researcher and analyst.
Provide thorough, evidence-based, objective analysis. Structure responses logically, synthesize contrasting perspectives, evaluate underlying assumptions, and clearly distinguish between empirical consensus, emerging theories, and hypotheses.`
    }
};

/**
 * Response Style Guidelines mapping.
 * Enforces tailored behavioral modifiers to complement custom instructions.
 */
export const STYLE_GUIDELINES = {
    professional: "Maintain a polished, formal, objective, and business-ready tone.",
    friendly: "Be warm, encouraging, conversational, and approachable.",
    academic: "Adopt a scholarly, rigorous, analytical tone with clear structural frameworks.",
    concise: "Be extremely succinct, direct, and high information-density. Omit pleasantries and filler words.",
    detailed: "Provide comprehensive, in-depth explanations covering background, context, nuances, and edge cases."
};

/**
 * Builds a secure system prompt for custom personas.
 * Custom instructions are treated as user-configured assistant behavior,
 * subordinate to core safety, security, and platform rules.
 */
export const buildCustomPrompt = (personaName, instructions, responseStyle) => {
    const styleModifier = STYLE_GUIDELINES[responseStyle] || STYLE_GUIDELINES.professional;
    return `You are acting as "${personaName}", a specialized AI assistant.

USER-CONFIGURED ASSISTANT BEHAVIOR & DOMAIN KNOWLEDGE:
${instructions}

RESPONSE STYLE GUIDELINES:
${styleModifier}`;
};

/**
 * Synchronous resolver for built-in personas.
 * Returns default 'general' if missing or not built-in.
 */
export const getPersonaConfig = (personaId) => {
    if (personaId && typeof personaId === "string") {
        const normalizedId = personaId.toLowerCase().trim();
        if (PERSONAS[normalizedId]) {
            return PERSONAS[normalizedId];
        }
    }
    return PERSONAS.general;
};

/**
 * Resolves persona configuration for creating a NEW thread.
 * 
 * Rules:
 * - If persona is omitted, null, or empty string -> returns 'general'.
 * - If persona matches a built-in persona -> returns that built-in persona.
 * - If persona is a custom persona ('custom_<id>'):
 *     - Validates ObjectId format.
 *     - Verifies document exists and belongs to userId.
 *     - If invalid, nonexistent, or owned by another user -> throws a 404 error (does NOT silently fall back to general).
 * - Any other unknown string identifier -> throws a 404 error.
 * 
 * @param {string|null|undefined} personaId
 * @param {string|mongoose.Types.ObjectId} userId
 * @returns {Promise<{ id: string, name: string, description: string, systemPrompt: string, icon: string, isCustom: boolean, snapshotData: Object|null }>}
 */
export const resolveNewThreadPersona = async (personaId, userId) => {
    // If no persona specified, default to General AI
    if (!personaId || typeof personaId !== "string" || !personaId.trim()) {
        return {
            ...PERSONAS.general,
            icon: "fa-solid fa-sparkles",
            isCustom: false,
            snapshotData: null
        };
    }

    const normalizedId = personaId.trim();

    // Check Built-in Personas
    if (PERSONAS[normalizedId]) {
        return {
            ...PERSONAS[normalizedId],
            icon: "fa-solid fa-sparkles",
            isCustom: false,
            snapshotData: null
        };
    }

    // Explicit custom persona requested: must validate format & ownership
    if (normalizedId.startsWith("custom_")) {
        const rawId = normalizedId.replace("custom_", "").trim();

        if (!mongoose.Types.ObjectId.isValid(rawId)) {
            const err = new Error("Custom persona not found");
            err.statusCode = 404;
            throw err;
        }

        const customDoc = await CustomPersona.findOne({ _id: rawId, userId });
        if (!customDoc) {
            const err = new Error("Custom persona not found");
            err.statusCode = 404;
            throw err;
        }

        return {
            id: `custom_${customDoc._id}`,
            name: customDoc.name,
            description: customDoc.description || "",
            systemPrompt: buildCustomPrompt(customDoc.name, customDoc.instructions, customDoc.responseStyle),
            icon: customDoc.icon || "fa-solid fa-robot",
            isCustom: true,
            snapshotData: {
                name: customDoc.name,
                description: customDoc.description || "",
                instructions: customDoc.instructions,
                responseStyle: customDoc.responseStyle,
                icon: customDoc.icon || "fa-solid fa-robot"
            }
        };
    }

    // Any unrecognized explicit identifier is rejected with 404
    const err = new Error("Persona not found");
    err.statusCode = 404;
    throw err;
};

/**
 * Resolves persona configuration for an EXISTING thread.
 * 
 * Rules:
 * - For built-in personas -> uses the built-in configuration.
 * - For custom personas -> uses the thread's stored `personaSnapshot` as the AUTHORITATIVE configuration.
 *   Does NOT fetch the latest CustomPersona document. Editing a persona does not alter historical threads.
 * - Deleting a persona does not break threads that have a stored snapshot.
 * - If an older thread has no snapshot and its custom persona cannot be found -> safely falls back to General AI.
 * 
 * @param {Object} thread - Mongoose Thread document
 * @returns {{ id: string, name: string, description: string, systemPrompt: string, icon: string, isCustom: boolean }}
 */
export const resolveExistingThreadPersona = (thread) => {
    const personaId = (thread && thread.persona) ? thread.persona.trim() : "general";

    // 1. Check Built-in Personas
    if (PERSONAS[personaId]) {
        return {
            ...PERSONAS[personaId],
            icon: "fa-solid fa-sparkles",
            isCustom: false
        };
    }

    // 2. Custom Persona: stored snapshot is AUTHORITATIVE
    const snapshot = thread.personaSnapshot;
    if (snapshot && snapshot.instructions) {
        return {
            id: personaId,
            name: snapshot.name || thread.personaName || "Custom AI",
            description: snapshot.description || "",
            systemPrompt: buildCustomPrompt(
                snapshot.name || thread.personaName || "Custom AI",
                snapshot.instructions,
                snapshot.responseStyle || "professional"
            ),
            icon: snapshot.icon || "fa-solid fa-robot",
            isCustom: true
        };
    }

    // 3. Fallback for legacy threads without snapshot
    return {
        ...PERSONAS.general,
        name: thread.personaName || PERSONAS.general.name,
        icon: "fa-solid fa-sparkles",
        isCustom: false
    };
};

export default PERSONAS;
