import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const getGeminiAPIResponse = async (message) => {
    try {
        const prompt = `
You are a helpful AI assistant.

IMPORTANT FORMATTING RULES:
- Keep answers simple and easy to understand.
- Do NOT use LaTeX.
- Do NOT use $ symbols for mathematical expressions.
- Write complexity as O(n), O(log n), O(n log n), O(n^2), etc.
- Use Markdown headings, bullets and numbered lists when useful.
- Do not unnecessarily create tables.
- Keep DSA explanations concise.
- Include a simple example when appropriate.

User question:
${message}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });

        return response.text;
    } catch (err) {
        console.log("Gemini API Error:", err);
        throw err;
    }
};

export default getGeminiAPIResponse;