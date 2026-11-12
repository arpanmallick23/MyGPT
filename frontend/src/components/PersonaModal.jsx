import { useState, useEffect, useContext } from "react";
import "./PersonaModal.css";
import { AuthContext } from "../AuthContext.jsx";
import { MyContext } from "../MyContext.jsx";
import API_BASE_URL from "../apiConfig.js";
import { ALLOWED_RESPONSE_STYLES, ALLOWED_PERSONA_ICONS } from "../personasConfig.js";

/**
 * Reusable compact Create / Edit Custom Persona Modal
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - personaToEdit: Object | null (if present, enters Edit mode)
 * - onSaved: (savedPersona) => void (callback with created/updated persona)
 */
function PersonaModal({ isOpen, onClose, personaToEdit = null, onSaved }) {
    const { token } = useContext(AuthContext);
    const { fetchCustomPersonas } = useContext(MyContext);

    const isEditMode = Boolean(personaToEdit && (personaToEdit.id || personaToEdit._id));

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [responseStyle, setResponseStyle] = useState("professional");
    const [instructions, setInstructions] = useState("");
    const [icon, setIcon] = useState("fa-solid fa-robot");

    // UI state
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Prefill form values when entering edit mode or resetting for create mode
    useEffect(() => {
        if (isOpen) {
            setErrorMessage("");
            if (personaToEdit) {
                setName(personaToEdit.name || "");
                setDescription(personaToEdit.description || "");
                setResponseStyle(personaToEdit.responseStyle || "professional");
                setInstructions(personaToEdit.instructions || "");
                setIcon(personaToEdit.icon || "fa-solid fa-robot");
            } else {
                setName("");
                setDescription("");
                setResponseStyle("professional");
                setInstructions("");
                setIcon("fa-solid fa-robot");
            }
        }
    }, [isOpen, personaToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage("");

        // Client-side validations
        const cleanName = name.trim();
        const cleanDesc = description.trim();
        const cleanInstructions = instructions.trim();

        if (!cleanName) {
            setErrorMessage("Persona name is required.");
            return;
        }

        if (cleanName.length > 50) {
            setErrorMessage("Persona name cannot exceed 50 characters.");
            return;
        }

        if (cleanDesc.length > 140) {
            setErrorMessage("Description cannot exceed 140 characters.");
            return;
        }

        if (!cleanInstructions) {
            setErrorMessage("Custom instructions are required.");
            return;
        }

        if (cleanInstructions.length > 3000) {
            setErrorMessage("Instructions cannot exceed 3000 characters.");
            return;
        }

        const payload = {
            name: cleanName,
            description: cleanDesc,
            responseStyle,
            instructions: cleanInstructions,
            icon
        };

        setSubmitting(true);

        try {
            const rawId = isEditMode
                ? (personaToEdit._id || personaToEdit.id).replace("custom_", "")
                : null;

            const endpoint = isEditMode
                ? `${API_BASE_URL}/personas/${rawId}`
                : `${API_BASE_URL}/personas`;

            const method = isEditMode ? "PUT" : "POST";

            const response = await fetch(endpoint, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setErrorMessage(data.error || "Failed to save persona. Please check your inputs.");
                setSubmitting(false);
                return;
            }

            // Refresh custom personas in context
            if (fetchCustomPersonas) {
                await fetchCustomPersonas();
            }

            if (onSaved) {
                onSaved(data);
            }

            setSubmitting(false);
            onClose();
        } catch (err) {
            console.error("PersonaModal submit error:", err);
            setErrorMessage("Network connection error. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <div className="personaModalBackdrop" onClick={onClose} role="dialog" aria-modal="true">
            <div className="personaModalCard" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="personaModalHeader">
                    <div className="personaModalTitleBlock">
                        <div className="personaModalHeaderIcon">
                            <i className={icon}></i>
                        </div>
                        <div>
                            <h3 className="personaModalTitle">
                                {isEditMode ? "Edit Custom Persona" : "Create Custom Persona"}
                            </h3>
                            <p className="personaModalSubtitle">
                                {isEditMode
                                    ? "Update your custom assistant's behavior and style."
                                    : "Configure a personalized AI assistant tailored to your workflow."}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="personaModalCloseBtn"
                        onClick={onClose}
                        aria-label="Close dialog"
                        disabled={submitting}
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="personaModalForm" noValidate>
                    {/* Error Alert Box */}
                    {errorMessage && (
                        <div className="personaModalAlert" role="alert">
                            <i className="fa-solid fa-circle-exclamation alertIcon"></i>
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <div className="personaModalBody">
                        {/* Name and Icon Row */}
                        <div className="personaFormRow">
                            <div className="personaFormField flex2">
                                <label htmlFor="persona-name" className="personaFieldLabel">
                                    Persona Name <span className="requiredMarker">*</span>
                                </label>
                                <input
                                    id="persona-name"
                                    type="text"
                                    className="personaInput"
                                    placeholder="e.g. Java Mentor, Career Advisor"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    maxLength={50}
                                    required
                                    disabled={submitting}
                                />
                                <span className="fieldCharHint">{name.length}/50</span>
                            </div>

                            <div className="personaFormField flex1">
                                <label htmlFor="persona-icon" className="personaFieldLabel">
                                    Icon
                                </label>
                                <div className="personaIconSelectWrapper">
                                    <div className="personaIconPreview">
                                        <i className={icon}></i>
                                    </div>
                                    <select
                                        id="persona-icon"
                                        className="personaSelect"
                                        value={icon}
                                        onChange={(e) => setIcon(e.target.value)}
                                        disabled={submitting}
                                    >
                                        {ALLOWED_PERSONA_ICONS.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Description / Tagline */}
                        <div className="personaFormField">
                            <label htmlFor="persona-description" className="personaFieldLabel">
                                Short Description / Tagline
                            </label>
                            <input
                                id="persona-description"
                                type="text"
                                className="personaInput"
                                placeholder="Brief summary of what this assistant does (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={140}
                                disabled={submitting}
                            />
                            <span className="fieldCharHint">{description.length}/140</span>
                        </div>

                        {/* Response Style */}
                        <div className="personaFormField">
                            <label htmlFor="persona-style" className="personaFieldLabel">
                                Response Style <span className="requiredMarker">*</span>
                            </label>
                            <select
                                id="persona-style"
                                className="personaSelect"
                                value={responseStyle}
                                onChange={(e) => setResponseStyle(e.target.value)}
                                disabled={submitting}
                            >
                                {ALLOWED_RESPONSE_STYLES.map((style) => (
                                    <option key={style.id} value={style.id}>
                                        {style.label} — {style.desc}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Instructions */}
                        <div className="personaFormField">
                            <div className="fieldLabelHeader">
                                <label htmlFor="persona-instructions" className="personaFieldLabel">
                                    Custom Instructions <span className="requiredMarker">*</span>
                                </label>
                                <span className={`instructionCounter ${instructions.length > 2800 ? "warn" : ""}`}>
                                    {instructions.length}/3000
                                </span>
                            </div>
                            <textarea
                                id="persona-instructions"
                                className="personaTextarea"
                                rows={6}
                                placeholder="Tell your assistant how to think, respond, and behave. E.g., 'You are a senior Java engineer who always explains concurrency and memory models clearly with minimal boilerplate...'"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                maxLength={3000}
                                required
                                disabled={submitting}
                            ></textarea>
                            <span className="fieldUsageHint">
                                Instructions are saved securely to your account and applied whenever you chat with this persona.
                            </span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="personaModalFooter">
                        <button
                            type="button"
                            className="personaBtnSecondary"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="personaBtnPrimary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <span className="btnLoadingWrap">
                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                    <span>Saving...</span>
                                </span>
                            ) : (
                                <span>{isEditMode ? "Save Changes" : "Create Persona"}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default PersonaModal;

