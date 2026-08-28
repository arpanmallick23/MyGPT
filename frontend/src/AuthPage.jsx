import "./AuthPage.css";
import { useContext, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";

function AuthPage() {
    const { login, signup, authError, setAuthError } = useContext(AuthContext);
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const switchMode = () => {
        setAuthError("");
        setMode(mode === "login" ? "signup" : "login");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (mode === "login") {
            await login(email, password);
        } else {
            await signup(name, email, password);
        }

        setSubmitting(false);
    };

    return (
        <div className="authPage">
            <div className="authCard">
                <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
                <p className="authSubtitle">
                    {mode === "login" ? "Log in to continue to MyGPT" : "Sign up to start chatting"}
                </p>

                <form onSubmit={handleSubmit}>
                    {mode === "signup" && (
                        <input
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />

                    {authError && <p className="authError">{authError}</p>}

                    <button type="submit" disabled={submitting}>
                        {submitting ? "Please wait..." : mode === "login" ? "Log in" : "Sign up"}
                    </button>
                </form>

                <p className="authSwitch">
                    {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    <span onClick={switchMode}>{mode === "login" ? "Sign up" : "Log in"}</span>
                </p>
            </div>
        </div>
    );
}

export default AuthPage;
