// src/components/Auth/AuthPage.jsx
import React, { useState } from "react";
import { signUpWithEmail, loginWithEmail, loginWithGoogle } from "../../firebase/auth";
import "./AuthPage.css";

export default function AuthPage() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!form.displayName.trim()) { setError("Display name is required."); setLoading(false); return; }
        await signUpWithEmail(form.email, form.password, form.displayName);
      } else {
        await loginWithEmail(form.email, form.password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg" />
      <div className="auth-card anim-pop-in">
        {/* Logo / Brand */}
        <div className="auth-brand">
          <span className="auth-logo">🔥</span>
          <h1 className="auth-title">FireChat</h1>
          <p className="auth-subtitle">Real-time conversations, anywhere.</p>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>
            Sign In
          </button>
          <button className={`auth-tab ${mode === "signup" ? "active" : ""}`} onClick={() => setMode("signup")}>
            Create Account
          </button>
        </div>

        <form onSubmit={handleEmailAuth} className="auth-form">
          {mode === "signup" && (
            <div className="form-group anim-slide-down">
              <label>Display Name</label>
              <input className="input" name="displayName" placeholder="How should we call you?" value={form.displayName} onChange={handleChange} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input className="input" type="email" name="email" placeholder="you@email.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="input" type="password" name="password" placeholder={mode === "signup" ? "At least 6 characters" : "Your password"} value={form.password} onChange={handleChange} required minLength={6} />
          </div>

          {error && <p className="error-text anim-shake">⚠ {error}</p>}

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="anim-spin">⟳</span> : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="divider">or continue with</div>

        <button className="btn btn-ghost google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.9 2.1 30.3 0 24 0 14.7 0 6.7 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.1 7-10.2 7-17.1z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.1.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.7l-7.6-5.9c-2.1 1.5-4.9 2.3-8.4 2.3-6.2 0-11.5-3.5-13.4-8.6l-7.9 6.1C6.7 42.6 14.7 48 24 48z"/></svg>
          Google
        </button>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/network-request-failed": "Network error. Check your connection.",
  };
  return map[code] || "Something went wrong. Please try again.";
}
