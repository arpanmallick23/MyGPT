import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import AuthPage from "./AuthPage.jsx";
import {MyContext} from "./MyContext.jsx";
import { AuthProvider, AuthContext } from "./AuthContext.jsx";
import { useState, useContext, useEffect } from 'react';
import {v1 as uuidv1} from "uuid";

function AppShell() {
  const { token, authLoading } = useContext(AuthContext);

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); //stores all chats of curr threads
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem("sigmagpt_theme") || "dark");

  useEffect(() => {
    localStorage.setItem("sigmagpt_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "dark" ? "light" : "dark"));
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
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
  )
}

function App() {
  return (
    <AuthProvider>
      <AppShell></AppShell>
    </AuthProvider>
  )
}

export default App
