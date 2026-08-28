import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
    const {
        allThreads,
        setAllThreads,
        currThreadId,
        setNewChat,
        setPrompt,
        setReply,
        setCurrThreadId,
        setPrevChats
    } = useContext(MyContext);

    const { token } = useContext(AuthContext);

    // Get all threads
    const getAllThreads = async () => {
        try {
            const response = await fetch(
                "https://mygpt-b2yj.onrender.com/api/thread",
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
                title: thread.title
            }));

            setAllThreads(filteredData);
        } catch (err) {
            console.log("Error fetching threads:", err);
        }
    };

    // Load threads when current thread changes
    useEffect(() => {
        if (token) {
            getAllThreads();
        }
    }, [currThreadId, token]);


    // Create new chat
    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    };


    // Change thread
    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(
                `https://mygpt-b2yj.onrender.com/api/thread/${newThreadId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch thread");
            }

            const res = await response.json();

            console.log(res);

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
                `https://mygpt-b2yj.onrender.com/api/thread/${threadId}`,
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

            const res = await response.json();

            console.log(res);

            // Remove deleted thread from UI
            setAllThreads((prev) =>
                prev.filter(
                    (thread) => thread.threadId !== threadId
                )
            );

            // If current thread was deleted,
            // create a new chat
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

                {/* Logo */}
                <img
                    src="/blacklogo.png"
                    alt="GPT logo"
                    className="logo"
                />

                {/* New Chat Icon */}
                <span>
                    <i className="fa-solid fa-pen-to-square"></i>
                </span>

            </button>


            {/* Chat History */}
            <ul className="history">

                {allThreads?.map((thread) => (

                    <li
                        key={thread.threadId}
                        onClick={() =>
                            changeThread(thread.threadId)
                        }
                        className={
                            thread.threadId === currThreadId
                                ? "highlighted"
                                : ""
                        }
                    >

                        {thread.title}

                        {/* Delete Button */}
                        <i
                            className="fa-solid fa-trash"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteThread(thread.threadId);
                            }}
                        ></i>

                    </li>

                ))}

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