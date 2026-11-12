import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import AuthPage from "./AuthPage.jsx";
import {MyContext} from "./MyContext.jsx";
import { AuthProvider, AuthContext } from "./AuthContext.jsx";
import { useState, useContext, useEffect, useCallback } from 'react';
import {v1 as uuidv1} from "uuid";
import API_BASE_URL from "./apiConfig.js";

function AppShell() {
  const { token, authLoading, logout } = useContext(AuthContext);

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); // stores all chats of curr thread
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [activePersona, setActivePersona] = useState("general");
  const [customPersonas, setCustomPersonas] = useState([]);
  const [loadingCustomPersonas, setLoadingCustomPersonas] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("sigmagpt_theme") || "dark");

  useEffect(() => {
    localStorage.setItem("sigmagpt_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  // Fetch custom personas belonging to the authenticated user
  const fetchCustomPersonas = useCallback(async () => {
    if (!token) {
      setCustomPersonas([]);
      return;
    }

    setLoadingCustomPersonas(true);
    try {
      const response = await fetch(`${API_BASE_URL}/personas`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        if (logout) logout();
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch custom personas");
      }

      const data = await response.json();
      setCustomPersonas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading custom personas:", err);
    } finally {
      setLoadingCustomPersonas(false);
    }
  }, [token, logout]);

  // Load custom personas whenever token changes or becomes available
  useEffect(() => {
    if (token) {
      fetchCustomPersonas();
    } else {
      setCustomPersonas([]);
    }
  }, [token, fetchCustomPersonas]);

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    activePersona, setActivePersona,
    customPersonas, setCustomPersonas,
    fetchCustomPersonas,
    loadingCustomPersonas,
    theme, toggleTheme
  };

  if (authLoading) {
    return <div className="app" data-theme={theme}></div>;
  }

  if (!token) {
    return (
      <div className="app" data-theme={theme}>
        <AuthPage></AuthPage>
      </div>
    );
  }

  return (
    <div className='app' data-theme={theme}>
      <MyContext.Provider value={providerValues}>
          <Sidebar></Sidebar>
          <ChatWindow></ChatWindow>
      </MyContext.Provider>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppShell></AppShell>
    </AuthProvider>
  );
}

export default App;
