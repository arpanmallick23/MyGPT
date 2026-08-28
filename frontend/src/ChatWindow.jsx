import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { AuthContext } from "./AuthContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import {ScaleLoader} from "react-spinners";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat, theme, toggleTheme} = useContext(MyContext);
    const { token, user, logout } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [recording, setRecording] = useState(false);
    const [transcribing, setTranscribing] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const getReply = async () => {
        if (!prompt.trim()) return;

        setLoading(true);
        setNewChat(false);

        console.log("message ", prompt, " threadId ", currThreadId);
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId
            })
        };

        try {
            const response = await fetch("http://localhost:8080/api/chat", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch(err) {
            console.log(err);
        }
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if(prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                },{
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    // ---- Voice input (Whisper) ----

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                stream.getTracks().forEach(track => track.stop());
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await sendForTranscription(audioBlob);
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.log("Mic access error:", err);
            alert("Couldn't access your microphone. Please allow microphone permissions.");
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

            const response = await fetch("http://localhost:8080/api/voice/transcribe", {
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
        }
        setTranscribing(false);
    };

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>MyGPT <i className="fa-solid fa-chevron-down"></i></span>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
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
            }
            <Chat></Chat>

            <ScaleLoader color="var(--text-primary)" loading={loading}>
            </ScaleLoader>
            
            <div className="chatInput">
                <div className="inputBox">
                    <input placeholder={transcribing ? "Transcribing..." : "Ask anything"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
                        disabled={transcribing}
                    >
                           
                    </input>
                    <div id="mic" className={recording ? "recording" : ""} onClick={toggleRecording} title={recording ? "Stop recording" : "Record voice message"}>
                        <i className={recording ? "fa-solid fa-stop" : "fa-solid fa-microphone"}></i>
                    </div>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    MyGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;
