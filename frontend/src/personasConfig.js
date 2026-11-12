export const PERSONAS = [
    {
        id: "general",
        name: "General AI",
        tagline: "Everyday reasoning & questions",
        icon: "fa-solid fa-sparkles"
    },
    {
        id: "developer",
        name: "Developer AI",
        tagline: "Coding, debugging & systems",
        icon: "fa-solid fa-code"
    },
    {
        id: "study",
        name: "Study AI",
        tagline: "Learning, tutoring & summaries",
        icon: "fa-solid fa-graduation-cap"
    },
    {
        id: "writer",
        name: "Writer AI",
        tagline: "Drafting, editing & copy",
        icon: "fa-solid fa-pen-nib"
    },
    {
        id: "interview",
        name: "Interview AI",
        tagline: "Mock drills & behavioral prep",
        icon: "fa-solid fa-user-tie"
    },
    {
        id: "research",
        name: "Research AI",
        tagline: "Deep inquiry & comparisons",
        icon: "fa-solid fa-microscope"
    }
];

export const ALLOWED_RESPONSE_STYLES = [
    { id: "professional", label: "Professional", desc: "Formal, objective, and business-ready" },
    { id: "friendly", label: "Friendly", desc: "Warm, conversational, and approachable" },
    { id: "academic", label: "Academic", desc: "Scholarly, structured, and rigorous" },
    { id: "concise", label: "Concise", desc: "Direct, succinct, and high information-density" },
    { id: "detailed", label: "Detailed", desc: "Exhaustive, in-depth context and nuances" }
];

export const ALLOWED_PERSONA_ICONS = [
    { id: "fa-solid fa-robot", label: "Robot" },
    { id: "fa-solid fa-brain", label: "Brain" },
    { id: "fa-solid fa-graduation-cap", label: "Graduation Cap" },
    { id: "fa-solid fa-code", label: "Code" },
    { id: "fa-solid fa-briefcase", label: "Briefcase" },
    { id: "fa-solid fa-book", label: "Book" },
    { id: "fa-solid fa-lightbulb", label: "Lightbulb" },
    { id: "fa-solid fa-microscope", label: "Microscope" },
    { id: "fa-solid fa-pen-nib", label: "Pen Nib" },
    { id: "fa-solid fa-comments", label: "Comments" },
    { id: "fa-solid fa-terminal", label: "Terminal" },
    { id: "fa-solid fa-chart-line", label: "Chart Line" }
];

/**
 * Resolves a persona identifier to its display configuration.
 * 
 * Supports:
 * 1. Six built-in personas (by exact ID).
 * 2. Active custom personas loaded from the backend (matching 'custom_<ObjectId>').
 * 3. Deleted historical custom personas using the stored `personaName` and default robot icon.
 * 4. Safe fallback to General AI.
 * 
 * @param {string} id - Persona ID (e.g., 'developer', 'custom_672b1234abcd...')
 * @param {Array} customPersonas - User's active custom personas from the backend
 * @param {string} fallbackName - Stored personaName from historical Thread record
 * @returns {Object} { id, name, tagline, icon, isCustom, isDeleted }
 */
export const getPersonaById = (id, customPersonas = [], fallbackName = "") => {
    // 1. Check built-in personas
    const builtIn = PERSONAS.find(p => p.id === id);
    if (builtIn) {
        return {
            ...builtIn,
            isCustom: false,
            isDeleted: false
        };
    }

    // 2. Check active custom personas loaded from the backend
    if (id && typeof id === "string" && id.startsWith("custom_")) {
        if (Array.isArray(customPersonas) && customPersonas.length > 0) {
            const foundCustom = customPersonas.find(p => p.id === id || p._id === id.replace("custom_", ""));
            if (foundCustom) {
                return {
                    id: foundCustom.id || `custom_${foundCustom._id}`,
                    name: foundCustom.name,
                    tagline: foundCustom.description || "Custom AI Assistant",
                    icon: foundCustom.icon || "fa-solid fa-robot",
                    instructions: foundCustom.instructions,
                    responseStyle: foundCustom.responseStyle || "professional",
                    isCustom: true,
                    isDeleted: false
                };
            }
        }

        // 3. Deleted historical custom persona fallback
        return {
            id,
            name: fallbackName || "Custom AI",
            tagline: "Custom AI Assistant",
            icon: "fa-solid fa-robot",
            isCustom: true,
            isDeleted: true
        };
    }

    // 4. Safe fallback to General AI
    return {
        ...PERSONAS[0],
        isCustom: false,
        isDeleted: false
    };
};
