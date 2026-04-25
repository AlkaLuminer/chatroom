// src/components/Profile/ProfileModal.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../firebase/firestore";
import { fileToBase64 } from "../../firebase/storage";
import { updateProfile, updateEmail, verifyBeforeUpdateEmail } from "firebase/auth";
import { auth } from "../../firebase/config";
import "./ProfileModal.css";

export default function ProfileModal({ onClose }) {
  const { userProfile } = useAuth();
  const isGoogleUser = auth.currentUser?.providerData?.[0]?.providerId === "google.com";

  const [form, setForm] = useState({
    displayName: userProfile?.displayName || "",
    email:       userProfile?.email       || "",
    phoneNumber: userProfile?.phoneNumber || "",
    birthday:    userProfile?.birthday    || "",
    address:     userProfile?.address     || "",
    bio:         userProfile?.bio         || "",
  });
  const [photoPreview, setPhotoPreview] = useState(userProfile?.photoURL || "");
  const [photoBase64, setPhotoBase64]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState("");

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setSaved(false);
    setError("");
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB."); return; }
    try {
      const base64 = await fileToBase64(file, 150);
      setPhotoBase64(base64);
      setPhotoPreview(base64);
    } catch (err) {
      setError("Failed to process photo.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const photoURL = photoBase64 || userProfile?.photoURL || "";

      // Update display name in Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: form.displayName,
        ...(photoBase64 && { photoURL }),
      });

      // Update email — only for email/password accounts
      if (!isGoogleUser && form.email && form.email !== userProfile?.email) {
        try {
          await verifyBeforeUpdateEmail(auth.currentUser, form.email);
          setError("Verification email sent to " + form.email + ". Please verify to complete email change.");
        } catch (emailErr) {
          if (emailErr.code === "auth/requires-recent-login") {
            setError("Please sign out and sign in again before changing your email.");
          } else {
            setError("Could not update email: " + emailErr.message);
          }
          setSaving(false);
          return;
        }
      }

      // Update Firestore profile
      await updateUserProfile(userProfile.uid, {
        displayName: form.displayName,
        phoneNumber: form.phoneNumber,
        birthday:    form.birthday,
        address:     form.address,
        bio:         form.bio,
        photoURL,
      });

      setSaved(true);
      setPhotoBase64(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal profile-modal anim-slide-up">
        <div className="modal-header">
          <span className="modal-title">Edit Profile</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Avatar */}
            <div className="profile-avatar-section">
              <label className="profile-avatar-label">
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" className="profile-avatar-img" />
                  : <div className="profile-avatar-placeholder">{initials(form.displayName)}</div>
                }
                <div className="profile-avatar-overlay">📷</div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
              </label>
              <div className="profile-avatar-hint">Click to change photo</div>
            </div>

            {/* Display Name — always editable */}
            <div className="form-group">
              <label>Display Name</label>
              <input className="input" type="text" name="displayName"
                placeholder="Your name" value={form.displayName} onChange={handleChange} />
            </div>

            {/* Email */}
            <div className="form-group">
              <label>Email {isGoogleUser && <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 11 }}>(Google account — cannot change)</span>}</label>
              <input className="input" type="email" name="email"
                value={form.email}
                onChange={handleChange}
                readOnly={isGoogleUser}
                disabled={isGoogleUser}
                style={isGoogleUser ? { opacity: 0.6, cursor: "not-allowed" } : {}}
                placeholder="you@email.com"
              />
              {!isGoogleUser && (
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  A verification email will be sent to confirm the change.
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="form-group">
              <label>Phone Number</label>
              <input className="input" type="tel" name="phoneNumber"
                placeholder="+886 912 345 678" value={form.phoneNumber} onChange={handleChange} />
            </div>

            {/* Birthday */}
            <div className="form-group">
              <label>Birthday</label>
              <input className="input" type="date" name="birthday"
                value={form.birthday} onChange={handleChange}
                max={new Date().toISOString().split("T")[0]} />
            </div>

            {/* Address */}
            <div className="form-group">
              <label>Address</label>
              <input className="input" type="text" name="address"
                placeholder="City, Country" value={form.address} onChange={handleChange} />
            </div>

            {/* Bio */}
            <div className="form-group">
              <label>Bio</label>
              <textarea className="input" name="bio"
                placeholder="A little about you..." value={form.bio}
                onChange={handleChange} rows={3} style={{ resize: "none" }} />
            </div>

            {error && <p className="error-text">⚠ {error}</p>}
            {saved && <p style={{ color: "var(--color-green)", fontSize: 13 }}>✓ Profile saved!</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
