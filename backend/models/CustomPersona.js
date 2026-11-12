import mongoose from "mongoose";

const ALLOWED_STYLES = ["professional", "friendly", "academic", "concise", "detailed"];
const ALLOWED_ICONS = [
    "fa-solid fa-robot",
    "fa-solid fa-brain",
    "fa-solid fa-graduation-cap",
    "fa-solid fa-code",
    "fa-solid fa-briefcase",
    "fa-solid fa-book",
    "fa-solid fa-lightbulb",
    "fa-solid fa-microscope",
    "fa-solid fa-pen-nib",
    "fa-solid fa-comments",
    "fa-solid fa-terminal",
    "fa-solid fa-chart-line"
];

const CustomPersonaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, "Persona name is required"],
        trim: true,
        maxlength: [50, "Persona name cannot exceed 50 characters"]
    },
    description: {
        type: String,
        trim: true,
        maxlength: [140, "Description cannot exceed 140 characters"],
        default: ""
    },
    instructions: {
        type: String,
        required: [true, "Custom instructions are required"],
        trim: true,
        maxlength: [3000, "Instructions cannot exceed 3000 characters"]
    },
    responseStyle: {
        type: String,
        enum: {
            values: ALLOWED_STYLES,
            message: "Invalid response style"
        },
        default: "professional"
    },
    icon: {
        type: String,
        default: "fa-solid fa-robot",
        validate: {
            validator: function(v) {
                return ALLOWED_ICONS.includes(v);
            },
            message: "Invalid icon identifier"
        }
    }
}, {
    timestamps: true
});

export { ALLOWED_STYLES, ALLOWED_ICONS };
export default mongoose.model("CustomPersona", CustomPersonaSchema);

