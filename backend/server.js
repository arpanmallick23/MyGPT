import express from "express";
import "dotenv/config";
import cors from "cors";
import mongoose from "mongoose";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";
import voiceRoutes from "./routes/voice.js";
import personaRoutes from "./routes/personas.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors({
    exposedHeaders: ["X-Thread-Persona", "X-Thread-Persona-Name", "X-Thread-Title"]
}));

app.use("/api/auth", authRoutes);
app.use("/api/personas", personaRoutes);
app.use("/api", chatRoutes);
app.use("/api/voice", voiceRoutes);

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
    connectDB();
});

const connectDB = async() => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected with Database!");
    } catch(err) {
        console.log("Failed to connect with Db", err);
    }
};
