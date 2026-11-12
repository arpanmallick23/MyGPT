import "./Sidebar.css";
import { useContext, useEffect, useCallback } from "react";
import { MyContext } from "./MyContext.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { v1 as uuidv1 } from "uuid";
import API_BASE_URL from "./apiConfig.js";
import { getPersonaById } from "./personasConfig.js";
import FuturisticALogo from "./components/FuturisticALogo.jsx";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats,
        setActivePersona,
        customPersonas,
        loadingCustomPersonas
    } = useContext(MyContext);

    const { token } = useContext(AuthContext);

    // Get all threads
    const getAllThreads = useCallback(async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/thread`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch threads");
            }

            const res = await response.json();

            const filteredData = res.map((thread) => ({
                threadId: thread.threadId,
                title: thread.title,
                persona: thread.persona || "general",
                personaName: thread.personaName || (thread.persona === "general" || !thread.persona ? "General AI" : "")
            }));

            setAllThreads(filteredData);
        } catch (err) {
            console.log("Error fetching threads:", err);
        }
    }, [token, setAllThreads]);

    // Load threads when current thread, token, or customPersonas list changes
    useEffect(() => {
        if (token) {
            getAllThreads();
        }
    }, [currThreadId, token, getAllThreads, customPersonas]);

    // Create new chat
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        // Retain current activePersona for the new chat, or defaults to general
    };

    // Change thread
    const changeThread = async (selectedThread) => {
        const newThreadId = typeof selectedThread === "object" ? selectedThread.threadId : selectedThread;
        const threadPersona = (typeof selectedThread === "object" && selectedThread.persona) ? selectedThread.persona : "general";

        setCurrThreadId(newThreadId);
        setActivePersona(threadPersona);

        try {
            const response = await fetch(
                `${API_BASE_URL}/thread/${newThreadId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch thread");
            }

            // Read persona from header or thread metadata
            const headerPersona = response.headers.get("X-Thread-Persona");
            if (headerPersona) {
                setActivePersona(headerPersona);
            }

            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log("Error changing thread:", err);
        }
    };

    // Delete thread
    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/thread/${threadId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to delete thread");
            }

            // Remove deleted thread from UI
            setAllThreads((prev) =>
                prev.filter(
                    (thread) => thread.threadId !== threadId
                )
            );

            // If current thread was deleted, create a new chat
            if (threadId === currThreadId) {
                createNewChat();
            }

        } catch (err) {
            console.log("Error deleting thread:", err);
        }
    };

    return (
        <section className="sidebar">
            {/* New Chat Button */}
            <button onClick={createNewChat}>
                {/* Brand Logo & Name */}
                <div className="sidebarBrand">
                    <div className="sidebarLogoWrap">
                        <FuturisticALogo className="sidebarLogoImg" />
                    </div>
                    <span className="sidebarBrandName">MyGPT</span>
                </div>

                {/* New Chat Icon */}
                <span className="newChatIcon">
                    <i className="fa-solid fa-pen-to-square"></i>
                </span>
            </button>

            {/* Chat History */}
            <ul className="history">
                {allThreads?.map((thread) => {
                    const personaInfo = getPersonaById(
                        thread.persona || "general",
                        customPersonas,
                        thread.personaName || ""
                    );
                    const displayName = personaInfo.name || thread.personaName || "AI Assistant";

                    return (
                        <li
                            key={thread.threadId}
                            onClick={() => changeThread(thread)}
                            className={
                                thread.threadId === currThreadId
                                    ? "highlighted"
                                    : ""
                            }
                        >
                            <span className="threadItemContent">
                                <i
                                    className={`${personaInfo.icon} threadPersonaIcon`}
                                    title={displayName}
                                ></i>
                                <span className="threadTitleText">{thread.title}</span>
                            </span>

                            {/* Delete Button */}
                            <i
                                className="fa-solid fa-trash"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteThread(thread.threadId);
                                }}
                            ></i>
                        </li>
                    );
                })}
            </ul>

            {/* Footer */}
            <div className="sign">
                <p>
                    By Arpan &hearts;
                </p>
            </div>
        </section>
    );
}

export default Sidebar;
