import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

const API_BASE = "http://localhost:8080/api";

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("sigmagpt_token") || null);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [authError, setAuthError] = useState("");

    // Validate stored token on first load
    useEffect(() => {
        const validate = async () => {
            const storedToken = localStorage.getItem("sigmagpt_token");

            if (!storedToken) {
                setAuthLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_BASE}/auth/me`, {
                    headers: { Authorization: `Bearer ${storedToken}` }
                });

                if (!response.ok) {
                    throw new Error("Invalid session");
                }

                const data = await response.json();
                setUser(data.user);
                setToken(storedToken);
            } catch (err) {
                localStorage.removeItem("sigmagpt_token");
                setToken(null);
                setUser(null);
            } finally {
                setAuthLoading(false);
            }
        };

        validate();
    }, []);

    const signup = async (name, email, password) => {
        setAuthError("");
        try {
            const response = await fetch(`${API_BASE}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setAuthError(data.error || "Failed to sign up");
                return false;
            }

            localStorage.setItem("sigmagpt_token", data.token);
            setToken(data.token);
            setUser(data.user);
            return true;
        } catch (err) {
            setAuthError("Network error, please try again");
            return false;
        }
    };

    const login = async (email, password) => {
        setAuthError("");
        try {
            const response = await fetch(`${API_BASE}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                setAuthError(data.error || "Failed to log in");
                return false;
            }

            localStorage.setItem("sigmagpt_token", data.token);
            setToken(data.token);
            setUser(data.user);
            return true;
        } catch (err) {
            setAuthError("Network error, please try again");
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem("sigmagpt_token");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ token, user, authLoading, authError, setAuthError, signup, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
