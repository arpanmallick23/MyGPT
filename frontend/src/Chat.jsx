import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import { AuthContext } from "./AuthContext";
import API_BASE_URL from "./apiConfig";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
    const { newChat, prevChats, setPrevChats, reply, setReply, currThreadId, setActivePersona } = useContext(MyContext);
    const { token } = useContext(AuthContext);
    const [latestReply, setLatestReply] = useState(null);

    // Edit prompt state
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingText, setEditingText] = useState("");
    const [savingEdit, setSavingEdit] = useState(false);
    const [editError, setEditError] = useState("");

    const chatsEndRef = useRef(null);

    // Smooth scroll to bottom when new messages arrive or typing updates
    useEffect(() => {
        chatsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [prevChats, latestReply]);

    // Handle typing animation for latest reply
    useEffect(() => {
        if (reply === null) {
            setLatestReply(null);
            return;
        }

        if (!prevChats?.length) return;

        const content = reply.split(" ");
        let idx = 0;

        const interval = setInterval(() => {
            setLatestReply(
                content.slice(0, idx + 1).join(" ")
            );
            idx++;

            if (idx >= content.length) {
                clearInterval(interval);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [prevChats, reply]);

    // Start editing a user message
    const handleStartEdit = (idx, content) => {
        setEditingIndex(idx);
        setEditingText(content);
        setEditError("");
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingIndex(null);
        setEditingText("");
        setEditError("");
    };

    // Submit edited message
    const handleSaveEdit = async (idx) => {
        if (!editingText.trim()) {
            setEditError("Message cannot be empty.");
            return;
        }

        setSavingEdit(true);
        setEditError("");

        try {
            const response = await fetch(`${API_BASE_URL}/thread/${currThreadId}/message`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    messageIndex: idx,
                    messageId: prevChats[idx]?._id,
                    content: editingText.trim()
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || "Failed to update message");
            }

            const data = await response.json();

            // Update thread messages with regenerated branch
            if (data.messages) {
                setPrevChats(data.messages);
            } else {
                // Fallback branch reconstruction
                const truncated = prevChats.slice(0, idx + 1);
                truncated[idx] = { ...truncated[idx], content: editingText.trim() };
                truncated.push({ role: "assistant", content: data.reply });
                setPrevChats(truncated);
            }

            if (data.persona) {
                setActivePersona(data.persona);
            }

            setReply(data.reply);
            setEditingIndex(null);
            setEditingText("");
        } catch (err) {
            console.error("Save edit error:", err);
            setEditError(err.message || "Failed to save edit.");
        } finally {
            setSavingEdit(false);
        }
    };

    const markdownOptions = {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight],
    };

    return (
        <>
            {newChat && <h1>Start a New Chat!</h1>}

            <div className="chats">
                {prevChats?.slice(0, -1).map((chat, idx) => (
                    <div
                        className={chat.role === "user" ? "userDiv" : "gptDiv"}
                        key={idx}
                    >
                        {chat.role === "user" ? (
                            editingIndex === idx ? (
                                <div className="editPromptContainer">
                                    <textarea
                                        className="editPromptTextarea"
                                        value={editingText}
                                        onChange={(e) => setEditingText(e.target.value)}
                                        disabled={savingEdit}
                                        rows={3}
                                    />
                                    {editError && <span className="editErrorNotice">{editError}</span>}
                                    <div className="editPromptActions">
                                        <button
                                            type="button"
                                            className="editPromptCancelBtn"
                                            onClick={handleCancelEdit}
                                            disabled={savingEdit}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="editPromptSaveBtn"
                                            onClick={() => handleSaveEdit(idx)}
                                            disabled={savingEdit}
                                        >
                                            {savingEdit ? (
                                                <>
                                                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                    <span>Regenerating...</span>
                                                </>
                                            ) : (
                                                <span>Save & Submit</span>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="userMessageWrapper">
                                    <p className="userMessage">{chat.content}</p>
                                    <div className="userMessageActions">
                                        <button
                                            type="button"
                                            className="editPromptBtn"
                                            onClick={() => handleStartEdit(idx, chat.content)}
                                            title="Edit message"
                                            aria-label="Edit message"
                                        >
                                            <i className="fa-solid fa-pencil"></i>
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (
                            <ReactMarkdown {...markdownOptions}>
                                {chat.content}
                            </ReactMarkdown>
                        )}
                    </div>
                ))}

                {prevChats.length > 0 && (
                    <>
                        {prevChats[prevChats.length - 1].role === "user" ? (
                            <div className="userDiv" key="last-user">
                                {editingIndex === prevChats.length - 1 ? (
                                    <div className="editPromptContainer">
                                        <textarea
                                            className="editPromptTextarea"
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            disabled={savingEdit}
                                            rows={3}
                                        />
                                        {editError && <span className="editErrorNotice">{editError}</span>}
                                        <div className="editPromptActions">
                                            <button
                                                type="button"
                                                className="editPromptCancelBtn"
                                                onClick={handleCancelEdit}
                                                disabled={savingEdit}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="editPromptSaveBtn"
                                                onClick={() => handleSaveEdit(prevChats.length - 1)}
                                                disabled={savingEdit}
                                            >
                                                {savingEdit ? (
                                                    <>
                                                        <i className="fa-solid fa-circle-notch fa-spin"></i>
                                                        <span>Regenerating...</span>
                                                    </>
                                                ) : (
                                                    <span>Save & Submit</span>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="userMessageWrapper">
                                        <p className="userMessage">
                                            {prevChats[prevChats.length - 1].content}
                                        </p>
                                        <div className="userMessageActions">
                                            <button
                                                type="button"
                                                className="editPromptBtn"
                                                onClick={() => handleStartEdit(prevChats.length - 1, prevChats[prevChats.length - 1].content)}
                                                title="Edit message"
                                                aria-label="Edit message"
                                            >
                                                <i className="fa-solid fa-pencil"></i>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="gptDiv" key="last-assistant">
                                <ReactMarkdown {...markdownOptions}>
                                    {latestReply !== null ? latestReply : prevChats[prevChats.length - 1].content}
                                </ReactMarkdown>
                            </div>
                        )}
                    </>
                )}

                <div ref={chatsEndRef} />
            </div>
        </>
    );
}

export default Chat;