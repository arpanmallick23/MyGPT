import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import API_BASE_URL from "./apiConfig.js";
import { PERSONAS, getPersonaById } from "./personasConfig.js";
import PersonaModal from "./components/PersonaModal.jsx";

function ChatWindow() {
    const {
        prompt,
        setPrompt,
        reply,
        setReply,
        currThreadId,
        setPrevChats,
        newChat,
        setNewChat,
        activePersona,
        setActivePersona,
        customPersonas,
        fetchCustomPersonas,
        loadingCustomPersonas,
        theme,
        toggleTheme
    } = useContext(MyContext);

    const { token, user, logout } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isPersonaOpen, setIsPersonaOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);

    // Error state for temporary API availability issues or request failures
    const [chatError, setChatError] = useState(null);

    // Custom Persona modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [personaToEdit, setPersonaToEdit] = useState(null);

    // Custom Persona deletion dialog state
    const [personaToDelete, setPersonaToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const personaDropdownRef = useRef(null);

    // Close persona menu on outside clicks
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (personaDropdownRef.current && !personaDropdownRef.current.contains(e.target)) {
                setIsPersonaOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getReply = async (manualRetryPrompt = null) => {
        const promptToSend = manualRetryPrompt !== null ? manualRetryPrompt : prompt;
        if (!promptToSend || !promptToSend.trim()) return;

        setLoading(true);
        setChatError(null);
        setNewChat(false);

        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                message: promptToSend.trim(),
                threadId: currThreadId,
                persona: activePersona // Pass current persona
            })
        };

        try {
            const response = await fetch(`${API_BASE_URL}/chat`, options);
            const res = await response.json();

            if (!response.ok) {
                // Friendly error message without raw stack traces
                setChatError({
                    message: res.error || "The AI service is temporarily unavailable. Please try again.",
                    canRetry: res.canRetry !== false,
                    failedPrompt: promptToSend.trim()
                });
                // Ensure prompt remains in input box so the user does not lose their thoughts
                setPrompt(promptToSend.trim());
                setLoading(false);
                return;
            }

            if (res.persona) {
                setActivePersona(res.persona);
            }
            setReply(res.reply);
            setChatError(null);
        } catch(err) {
            console.error("Chat error:", err);
            setChatError({
                message: "Network or server connection issue. Please check your connection and try again.",
                canRetry: true,
                failedPrompt: promptToSend.trim()
            });
            setPrompt(promptToSend.trim());
        } finally {
            setLoading(false);
        }
    };

    // Append new chat to prevChats ONLY on successful reply
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prevChats => ([
                ...prevChats,
                { role: "user", content: prompt },
                { role: "assistant", content: reply }
            ]));
            setPrompt("");
        }
    }, [reply]);

    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    };

    const handleSelectPersona = (personaId) => {
        if (newChat) {
            setActivePersona(personaId);
        }
        setIsPersonaOpen(false);
    };

    const handleOpenCreateModal = () => {
        setPersonaToEdit(null);
        setIsModalOpen(true);
        setIsPersonaOpen(false);
    };

    const handleOpenEditModal = (e, persona) => {
        e.stopPropagation();
        setPersonaToEdit(persona);
        setIsModalOpen(true);
        setIsPersonaOpen(false);
    };

    const handleOpenDeleteConfirm = (e, persona) => {
        e.stopPropagation();
        setPersonaToDelete(persona);
        setDeleteError("");
        setIsPersonaOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!personaToDelete) return;
        setDeleting(true);
        setDeleteError("");

        try {
            const rawId = (personaToDelete._id || personaToDelete.id).replace("custom_", "");
            const response = await fetch(`${API_BASE_URL}/personas/${rawId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setDeleteError(data.error || "Failed to delete persona");
                setDeleting(false);
                return;
            }

            // If the deleted persona was currently selected for a new conversation, reset to general
            const deletedPersonaId = personaToDelete.id || `custom_${personaToDelete._id}`;
            if (newChat && activePersona === deletedPersonaId) {
                setActivePersona("general");
            }

            // Refresh custom personas in context
            if (fetchCustomPersonas) {
                await fetchCustomPersonas();
            }

            setDeleting(false);
            setPersonaToDelete(null);
        } catch (err) {
            console.error("Delete persona error:", err);
            setDeleteError("Network error. Please try again.");
            setDeleting(false);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                stream.getTracks().forEach(track => track.stop());
                sendForTranscription(audioBlob);
            };

            mediaRecorderRef.current.start();
            setRecording(true);
        } catch (err) {
            console.log("Microphone access denied:", err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const toggleRecording = () => {
        if (recording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    const sendForTranscription = async (audioBlob) => {
        setTranscribing(true);
        try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const response = await fetch(`${API_BASE_URL}/voice/transcribe`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.text) {
                setPrompt(prev => (prev ? `${prev} ${data.text}` : data.text));
            } else {
                console.log("Transcription failed:", data.error);
            }
        } catch (err) {
            console.log("Transcription error:", err);
        } finally {
            setTranscribing(false);
        }
    };

    const currentPersona = getPersonaById(activePersona || "general", customPersonas);

    return (
        <div className="chatWindow">
            <div className="navbar">
                {/* Persona Selector (Compact, matching design tokens) */}
                <div className="personaSelectorContainer" ref={personaDropdownRef}>
                    <button
                        type="button"
                        className={`personaPillBtn ${!newChat ? "locked" : ""}`}
                        onClick={() => setIsPersonaOpen(!isPersonaOpen)}
                        title={newChat ? "Choose AI Persona" : `${currentPersona.name} (locked for this conversation)`}
                    >
                        <i className={`${currentPersona.icon} personaPillIcon`}></i>
                        <span className="personaPillLabel">{currentPersona.name}</span>
                        {newChat ? (
                            <i className="fa-solid fa-chevron-down personaChevron"></i>
                        ) : (
                            <span className="personaLockedBadge" title="Conversation persona is set">
                                <i className="fa-solid fa-lock"></i>
                            </span>
                        )}
                    </button>

                    {/* Persona Menu Dropdown */}
                    {isPersonaOpen && (
                        <div className="personaDropdownMenu">
                            <div className="personaMenuHeader">
                                <span>Select AI Persona</span>
                                {!newChat && <span className="personaNotice">Current Chat Locked</span>}
                            </div>

                            {/* Scrollable list of persona categories */}
                            <div className="personaMenuScrollArea">
                                {/* SECTION 1: Built-in Personas */}
                                <div className="personaSectionHeader">
                                    <span>Built-in Personas</span>
                                </div>
                                <div className="personaOptionsList">
                                    {PERSONAS.map((p) => {
                                        const isSelected = p.id === currentPersona.id;
                                        return (
                                             <div
                                                key={p.id}
                                                className={`personaOptionItem ${isSelected ? "selected" : ""} ${!newChat && !isSelected ? "disabled" : ""}`}
                                                onClick={() => handleSelectPersona(p.id)}
                                            >
                                                <div className="personaOptionIcon">
                                                    <i className={p.icon}></i>
                                                </div>
                                                <div className="personaOptionText">
                                                    <div className="personaOptionName">
                                                        <span>{p.name}</span>
                                                        {isSelected && <i className="fa-solid fa-check checkIcon"></i>}
                                                    </div>
                                                    <span className="personaOptionTagline">{p.tagline}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* SECTION 2: My Custom Personas */}
                                <div className="personaSectionHeader">
                                    <span>My Custom Personas</span>
                                    {loadingCustomPersonas && (
                                        <i className="fa-solid fa-circle-notch fa-spin sectionLoadingIcon"></i>
                                    )}
                                </div>

                                <div className="personaOptionsList">
                                    {Array.isArray(customPersonas) && customPersonas.length > 0 ? (
                                        customPersonas.map((cp) => {
                                            const customId = cp.id || `custom_${cp._id}`;
                                            const isSelected = customId === currentPersona.id;
                                            return (
                                                <div
                                                    key={customId}
                                                    className={`personaOptionItem ${isSelected ? "selected" : ""} ${!newChat && !isSelected ? "disabled" : ""}`}
                                                    onClick={() => handleSelectPersona(customId)}
                                                >
                                                    <div className="personaOptionIcon custom">
                                                        <i className={cp.icon || "fa-solid fa-robot"}></i>
                                                    </div>
                                                    <div className="personaOptionText">
                                                        <div className="personaOptionName">
                                                            <span>{cp.name}</span>
                                                            {isSelected && <i className="fa-solid fa-check checkIcon"></i>}
                                                        </div>
                                                        {cp.description && (
                                                            <span className="personaOptionTagline">{cp.description}</span>
                                                        )}
                                                    </div>

                                                    {/* Compact Edit & Delete action buttons */}
                                                    <div className="personaItemActions" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            className="personaActionBtn"
                                                            title="Edit Persona"
                                                            onClick={(e) => handleOpenEditModal(e, cp)}
                                                        >
                                                            <i className="fa-solid fa-pen"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="personaActionBtn danger"
                                                            title="Delete Persona"
                                                            onClick={(e) => handleOpenDeleteConfirm(e, cp)}
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="personaEmptyNotice">
                                            <span>No custom personas yet.</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Create Custom Persona action button */}
                            <div className="personaCreateActionWrap">
                                <button
                                    type="button"
                                    className="personaCreateBtn"
                                    onClick={handleOpenCreateModal}
                                >
                                    <i className="fa-solid fa-plus"></i>
                                    <span>Create Custom Persona</span>
                                </button>
                            </div>

                            {!newChat && (
                                <div className="personaMenuFooter">
                                    <span>To switch personas, start a new chat.</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Profile Pill & Menu */}
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>

            {isOpen && (
                <div className="dropDown">
                    <div className="dropDownUser">{user?.name}<br/>{user?.email}</div>

                    <div className="dropDownItem" onClick={toggleTheme}>
                        <span className="themeToggle">
                            <i className={theme === "dark" ? "fa-solid fa-moon" : "fa-solid fa-sun"}></i>
                            Appearance
                        </span>
                        <span>{theme === "dark" ? "Dark" : "Light"}</span>
                    </div>

                    <div className="dropDownItem" onClick={logout}>
                        <span><i className="fa-solid fa-arrow-right-from-bracket"></i> Log out</span>
                    </div>
                </div>
            )}

            <Chat></Chat>

            <ScaleLoader color="var(--text-primary)" loading={loading} />

            {/* Error Banner when AI generation experiences temporary downtime or errors */}
            {chatError && (
                <div className="chatErrorBanner" role="alert">
                    <div className="chatErrorContent">
                        <i className="fa-solid fa-circle-exclamation chatErrorIcon"></i>
                        <span className="chatErrorMessage">{chatError.message}</span>
                    </div>
                    {chatError.canRetry && (
                        <button
                            type="button"
                            className="chatRetryBtn"
                            onClick={() => getReply(chatError.failedPrompt)}
                            disabled={loading}
                        >
                            <i className="fa-solid fa-rotate-right"></i>
                            <span>Retry</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="chatErrorDismissBtn"
                        onClick={() => setChatError(null)}
                        aria-label="Dismiss error"
                        title="Dismiss error"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            <div className="chatInput">
                <div className="inputBox">
                    <input
                        placeholder={transcribing ? "Transcribing..." : `Ask ${currentPersona.name}...`}
                        value={prompt}
                        onChange={(e) => {
                            setPrompt(e.target.value);
                            if (chatError) setChatError(null);
                        }}
                        onKeyDown={(e) => e.key === 'Enter' ? getReply() : ''}
                        disabled={transcribing || loading}
                    />
                    <div
                        id="mic"
                        className={recording ? "recording" : ""}
                        onClick={toggleRecording}
                        title={recording ? "Stop recording" : "Record voice message"}
                    >
                        <i className={recording ? "fa-solid fa-stop" : "fa-solid fa-microphone"}></i>
                    </div>
                    <div
                        id="submit"
                        onClick={() => getReply()}
                        title="Send message"
                        style={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>
                </div>
                <p className="info">
                    MyGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>

            {/* Persona Modal for Creating & Editing */}
            <PersonaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                personaToEdit={personaToEdit}
                onSaved={(savedPersona) => {
                    if (newChat && savedPersona) {
                        const newId = savedPersona.id || `custom_${savedPersona._id}`;
                        setActivePersona(newId);
                    }
                }}
            />

            {/* Compact Delete Confirmation Dialog */}
            {personaToDelete && (
                <div className="deleteConfirmBackdrop" onClick={() => !deleting && setPersonaToDelete(null)}>
                    <div className="deleteConfirmCard" onClick={(e) => e.stopPropagation()}>
                        <div className="deleteConfirmHeader">
                            <i className="fa-solid fa-triangle-exclamation warningIcon"></i>
                            <h4>Delete Persona</h4>
                        </div>
                        <p className="deleteConfirmText">
                            Are you sure you want to delete <strong>{personaToDelete.name}</strong>?
                            Existing conversations will remain intact under their original snapshot.
                        </p>

                        {deleteError && (
                            <div className="deleteConfirmAlert">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{deleteError}</span>
                            </div>
                        )}

                        <div className="deleteConfirmFooter">
                            <button
                                type="button"
                                className="deleteCancelBtn"
                                onClick={() => setPersonaToDelete(null)}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="deleteActionBtn"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <span className="btnLoadingWrap">
                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                        <span>Deleting...</span>
                                    </span>
                                ) : (
                                    <span>Delete</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatWindow;
