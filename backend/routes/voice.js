import express from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import protect from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.post("/transcribe", protect, upload.single("audio"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No audio file provided" });
    }

    try {
        const base64Audio = req.file.buffer.toString("base64");

        const response = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: "Transcribe this audio exactly as spoken. Return only the transcribed text, with no extra commentary, labels, or quotation marks." },
                        {
                            inlineData: {
                                mimeType: req.file.mimetype || "audio/webm",
                                data: base64Audio
                            }
                        }
                    ]
                }
            ]
        });

        const text = response.text?.trim();

        if (!text) {
            return res.status(500).json({ error: "Could not transcribe audio" });
        }

        res.json({ text });
    } catch (err) {
        console.log("Gemini transcription error:", err);
        res.status(500).json({ error: "Failed to transcribe audio" });
    }
});

export default router;
