import "./AuthPage.css";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { footerLinksConfig } from "./linksConfig.js";
import FuturisticALogo from "./components/FuturisticALogo.jsx";

function AuthPage() {
    const { login, signup, authError, setAuthError } = useContext(AuthContext);
    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [clientError, setClientError] = useState("");
    const [infoModal, setInfoModal] = useState(null); // { title, content }

    // Load remembered email if present
    useEffect(() => {
        const savedEmail = localStorage.getItem("mygpt_remembered_email");
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }
    }, []);

    const switchMode = (newMode) => {
        setAuthError("");
        setClientError("");
        setPassword("");
        setConfirmPassword("");
        setMode(newMode);
    };

    // Password strength calculation for signup
    const getPasswordStrength = (pass) => {
        if (!pass) return { score: 0, label: "", colorClass: "" };
        let score = 0;
        if (pass.length >= 6) score += 1;
        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;

        if (score <= 1) return { score: 1, label: "Weak", colorClass: "strength-weak" };
        if (score === 2) return { score: 2, label: "Fair", colorClass: "strength-fair" };
        if (score === 3) return { score: 3, label: "Good", colorClass: "strength-good" };
        return { score: 4, label: "Strong", colorClass: "strength-strong" };
    };

    const strength = mode === "signup" ? getPasswordStrength(password) : null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setClientError("");

        if (mode === "signup") {
            if (password.length < 6) {
                setClientError("Password must be at least 6 characters.");
                return;
            }
            if (password !== confirmPassword) {
                setClientError("Passwords do not match.");
                return;
            }
        }

        // Handle remember me preference
        if (rememberMe) {
            localStorage.setItem("mygpt_remembered_email", email.trim());
        } else {
            localStorage.removeItem("mygpt_remembered_email");
        }

        setSubmitting(true);
        if (mode === "login") {
            await login(email.trim(), password);
        } else {
            await signup(name.trim(), email.trim(), password);
        }
        setSubmitting(false);
    };

    // Helper to handle link clicks safely
    const handleFooterLinkClick = (e, item) => {
        if (item.url && item.url !== "#") {
            if (item.url.startsWith("mailto:")) {
                window.location.href = item.url;
                return;
            }
            window.open(item.url, "_blank", "noopener,noreferrer");
            return;
        }

        e.preventDefault();
        // Fallback informative dialogs for items without live external URLs
        const infoMap = {
            about: {
                title: "About MyGPT",
                content:
                    "MyGPT is a next-generation AI assistant built to empower creators, developers, and thinkers with contextual conversations, real-time code assistance, and fluid problem solving."
            },
            features: {
                title: "Features & Capabilities",
                content:
                    "Key features include intelligent multi-turn dialogue, cross-session persistent chat history, code synthesis & debugging, voice transcription, and customizable workspaces."
            },
            contact: {
                title: "Contact & Support",
                content:
                    "Have questions or need assistance? Reach out directly to our support team at support@mygpt.local or check back soon for our live support portal."
            },
            privacy: {
                title: "Privacy Policy",
                content:
                    "Your privacy is our priority. Conversation data is encrypted and handled in compliance with industry security protocols. We do not sell your personal data or use private conversations to train public models."
            },
            terms: {
                title: "Terms of Service",
                content:
                    "By using MyGPT, you agree to engage with the AI assistant respectfully and within applicable laws. You retain full ownership of your prompts and generated outputs."
            }
        };

        const modalData = infoMap[item.id] || {
            title: item.label,
            content: `${item.label} information will be accessible here soon.`
        };

        setInfoModal(modalData);
    };

    const errorMessage = clientError || authError;

    return (
        <div className="authPage">
            <div className="authContainer">
                {/* LEFT BRAND / VALUE PROPOSITION PANEL (Clean, Authentic, Minimal) */}
                <div className="authHeroPanel">
                    {/* Subtle ambient lighting */}
                    <div className="ambientOrb orbViolet"></div>
                    <div className="ambientOrb orbBlue"></div>

                    <div className="heroContent">
                        {/* Clean Brand Badge */}
                        <div className="brandBadge">
                            <div className="brandLogoIcon">
                                <FuturisticALogo />
                            </div>
                            <span className="brandName">MyGPT</span>
                        </div>

                        {/* Direct, Human Typography */}
                        <div className="heroTypography">
                            <h1 className="heroTitle">
                                Meet your new <span className="highlightGradient">AI companion.</span>
                            </h1>
                            <p className="heroDescription">
                                A smarter space to think, create, learn, and explore.
                            </p>
                        </div>

                        {/* Three Simple, Authentic Feature Highlights */}
                        <div className="heroFeatures">
                            <div className="featureItem">
                                <div className="featureIconWrapper">
                                    <i className="fa-solid fa-comment-dots"></i>
                                </div>
                                <div className="featureText">
                                    <h4>Intelligent conversations</h4>
                                    <p>Natural, contextual dialogue tailored to your questions.</p>
                                </div>
                            </div>

                            <div className="featureItem">
                                <div className="featureIconWrapper">
                                    <i className="fa-solid fa-clock-rotate-left"></i>
                                </div>
                                <div className="featureText">
                                    <h4>Your chat history, always accessible</h4>
                                    <p>Pick up right where you left off across every session.</p>
                                </div>
                            </div>

                            <div className="featureItem">
                                <div className="featureIconWrapper">
                                    <i className="fa-solid fa-code"></i>
                                </div>
                                <div className="featureText">
                                    <h4>Help with everyday tasks and coding</h4>
                                    <p>Brainstorm, write, review code, and solve challenges faster.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT FORM / AUTHENTICATION PANEL */}
                <div className="authFormPanel">
                    <div className="authFormScrollArea">
                        {/* Mobile Brand Header */}
                        <div className="mobileBrandHeader">
                            <div className="brandBadge">
                                <div className="brandLogoIcon">
                                    <FuturisticALogo />
                                </div>
                                <span className="brandName">MyGPT</span>
                            </div>
                        </div>

                        <div className="formInnerContainer">
                            {/* Header Tabs */}
                            <div className="authTabs">
                                <button
                                    type="button"
                                    className={`authTabBtn ${mode === "login" ? "active" : ""}`}
                                    onClick={() => switchMode("login")}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    className={`authTabBtn ${mode === "signup" ? "active" : ""}`}
                                    onClick={() => switchMode("signup")}
                                >
                                    Create Account
                                </button>
                            </div>

                            {/* Title Header */}
                            <div className="formHeader">
                                <h2 className="formTitle">
                                    {mode === "login" ? "Welcome back" : "Get started with MyGPT"}
                                </h2>
                                <p className="formSubtitle">
                                    {mode === "login"
                                        ? "Continue your journey with MyGPT."
                                        : "Create your free account to unlock intelligent assistance."}
                                </p>
                            </div>

                            {/* Error Alert Box */}
                            {errorMessage && (
                                <div className="errorAlert" role="alert">
                                    <i className="fa-solid fa-circle-exclamation errorIcon"></i>
                                    <span>{errorMessage}</span>
                                </div>
                            )}

                            {/* Auth Form */}
                            <form onSubmit={handleSubmit} className="authForm" noValidate>
                                {/* Full Name field for Sign Up */}
                                {mode === "signup" && (
                                    <div className="formField">
                                        <label htmlFor="auth-name" className="fieldLabel">
                                            Full name
                                        </label>
                                        <div className="inputWrapper">
                                            <i className="fa-regular fa-user inputIcon"></i>
                                            <input
                                                id="auth-name"
                                                type="text"
                                                placeholder="Enter your name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                autoComplete="name"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Email field */}
                                <div className="formField">
                                    <label htmlFor="auth-email" className="fieldLabel">
                                        Email address
                                    </label>
                                    <div className="inputWrapper">
                                        <i className="fa-regular fa-envelope inputIcon"></i>
                                        <input
                                            id="auth-email"
                                            type="email"
                                            placeholder="Enter your email address"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password field */}
                                <div className="formField">
                                    <label htmlFor="auth-password" className="fieldLabel">
                                        Password
                                    </label>
                                    <div className="inputWrapper">
                                        <i className="fa-regular fa-lock inputIcon"></i>
                                        <input
                                            id="auth-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            minLength={6}
                                            required
                                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                                        />
                                        <button
                                            type="button"
                                            className="togglePasswordBtn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                        >
                                            <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                        </button>
                                    </div>

                                    {/* Password Strength Meter for Sign Up */}
                                    {mode === "signup" && password.length > 0 && (
                                        <div className="passwordStrength">
                                            <div className="strengthBars">
                                                {[1, 2, 3, 4].map((index) => (
                                                    <div
                                                        key={index}
                                                        className={`strengthBar ${index <= strength.score ? strength.colorClass : ""}`}
                                                    ></div>
                                                ))}
                                            </div>
                                            <div className="strengthMeta">
                                                <span>Password strength:</span>
                                                <span className={`strengthLabel ${strength.colorClass}`}>
                                                    {strength.label}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm Password field for Sign Up */}
                                {mode === "signup" && (
                                    <div className="formField">
                                        <label htmlFor="auth-confirm-password" className="fieldLabel">
                                            Confirm password
                                        </label>
                                        <div className="inputWrapper">
                                            <i className="fa-regular fa-lock-keyhole inputIcon"></i>
                                            <input
                                                id="auth-confirm-password"
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Re-enter your password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                minLength={6}
                                                required
                                                autoComplete="new-password"
                                            />
                                            <button
                                                type="button"
                                                className="togglePasswordBtn"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                            >
                                                <i className={`fa-regular ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Remember Me Checkbox (for Login) */}
                                {mode === "login" && (
                                    <div className="formOptions">
                                        <label className="checkboxContainer">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                            <span className="customCheckmark"></span>
                                            <span className="checkboxLabel">Remember me</span>
                                        </label>
                                    </div>
                                )}

                                {/* Primary Submit Button with Loading State */}
                                <button
                                    type="submit"
                                    className="primaryAuthBtn"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <span className="btnLoadingContent">
                                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                                            <span>Authenticating...</span>
                                        </span>
                                    ) : (
                                        <span className="btnTextContent">
                                            <span>{mode === "login" ? "Sign in to account" : "Create account"}</span>
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </span>
                                    )}
                                </button>
                            </form>

                            {/* Switch Mode Footer */}
                            <div className="authFooter">
                                <p className="switchText">
                                    {mode === "login" ? (
                                        <button
                                            type="button"
                                            className="switchPromptBtn"
                                            onClick={() => switchMode("signup")}
                                        >
                                            <span className="switchPromptLabel">Don't have an account?</span>
                                            <span className="switchLink">Sign up for free</span>
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="switchPromptBtn"
                                            onClick={() => switchMode("login")}
                                        >
                                            <span className="switchPromptLabel">Already have an account?</span>
                                            <span className="switchLink">Sign in</span>
                                        </button>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Compact, Premium 3-Column SaaS Footer */}
                    <footer className="authGlobalFooter">
                        <div className="footerThreeColumns">
                            {/* Column 1 – Brand */}
                            <div className="footerCol footerColBrand">
                                <div className="footerBrandHeader">
                                    <div className="footerBrandMark">
                                        <FuturisticALogo />
                                    </div>
                                    <span className="footerBrandName">{footerLinksConfig.brand.name}</span>
                                </div>
                                <p className="footerTagline">{footerLinksConfig.brand.tagline}</p>
                                <p className="footerDesc">{footerLinksConfig.brand.description}</p>
                            </div>

                            {/* Column 2 – Explore */}
                            <div className="footerCol footerColExplore">
                                <h5 className="footerColTitle">Explore</h5>
                                <nav className="footerLinksList" aria-label="Explore MyGPT">
                                    {footerLinksConfig.explore.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            className="footerColLink"
                                            onClick={(e) => handleFooterLinkClick(e, item)}
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Column 3 – Connect */}
                            <div className="footerCol footerColConnect">
                                <h5 className="footerColTitle">Connect</h5>
                                <div className="footerSocialIconsGrid" aria-label="Connect with us">
                                    {footerLinksConfig.socials.map((social) => {
                                        const isAvailable = Boolean(social.url && social.url !== "#");
                                        if (isAvailable) {
                                            return (
                                                <a
                                                    key={social.id}
                                                    href={social.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="socialIconBtn active"
                                                    aria-label={social.name}
                                                    title={social.name}
                                                >
                                                    <i className={social.icon}></i>
                                                </a>
                                            );
                                        }
                                        return (
                                            <span
                                                key={social.id}
                                                className="socialIconBtn placeholder"
                                                title={`${social.name} (Coming soon)`}
                                                aria-label={`${social.name} (Coming soon)`}
                                            >
                                                <i className={social.icon}></i>
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="footerBottomBar">
                            <span className="copyrightText">&copy; 2026 MyGPT. All rights reserved.</span>
                            <span className="madeWithCare">Made with care.</span>
                        </div>
                    </footer>
                </div>
            </div>

            {/* Modal for Informational Links */}
            {infoModal && (
                <div className="modalBackdrop" onClick={() => setInfoModal(null)}>
                    <div className="modalCard" onClick={(e) => e.stopPropagation()}>
                        <div className="modalHeader">
                            <h3>{infoModal.title}</h3>
                            <button
                                type="button"
                                className="modalCloseBtn"
                                onClick={() => setInfoModal(null)}
                                aria-label="Close dialog"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="modalBody">
                            <p>{infoModal.content}</p>
                        </div>
                        <div className="modalFooter">
                            <button
                                type="button"
                                className="modalPrimaryBtn"
                                onClick={() => setInfoModal(null)}
                            >
                                Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AuthPage;
