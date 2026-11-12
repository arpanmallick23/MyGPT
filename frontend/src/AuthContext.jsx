import { createContext, useState, useEffect } from "react";
import API_BASE_URL from "./apiConfig.js";

export const AuthContext = createContext(null);

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
                const response = await fetch(`${API_BASE_URL}/auth/me`, {
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
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setAuthError(data.error || "Failed to create account. Please check your details.");
                return false;
            }

            if (data.token) {
                localStorage.setItem("sigmagpt_token", data.token);
                setToken(data.token);
                setUser(data.user);
                return true;
            }

            setAuthError("Registration succeeded but no authorization token was received.");
            return false;
        } catch (err) {
            setAuthError("Network connection error. Please ensure the backend server is running.");
            return false;
        }
    };

    const login = async (email, password) => {
        setAuthError("");
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setAuthError(data.error || "Failed to log in");
                return false;
            }

            if (data.token) {
                localStorage.setItem("sigmagpt_token", data.token);
                setToken(data.token);
                setUser(data.user);
                return true;
            }

            setAuthError("Authentication succeeded but no authorization token was received.");
            return false;
        } catch (err) {
            setAuthError("Network connection error. Please ensure the backend server is running.");
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
