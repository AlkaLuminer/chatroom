// src/components/Profile/ProfileModal.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../firebase/firestore";
import { uploadProfilePhoto } from "../../firebase/storage";
import { updateProfile } from "firebase/auth";
import { auth } from "../../firebase/config";
import "./ProfileModal.css";

export default function ProfileModal({ onClose }) {
  const { userProfile } = useAuth();

  const [formData, setFormData] = useState({
    displayName:  userProfile?.displayName  || "",
    displayEmail: userProfile?.displayEmail || "",
    phoneNumber:  userProfile?.phoneNumber  || "",
    birthday:     userProfile?.birthday     || "",
    address:      userProfile?.address      || "",
    bio:          userProfile?.bio          || "",
  });
  const [photoPreview, setPhotoPreview]   = useState(userProfile?.photoURL || "");
  const [photoBase64, setPhotoBase64]     = useState(null);
  const [isSaving, setIsSaving]           = useState(false);
  const [isSaved, setIsSaved]             = useState(false);
  const [errorMessage, setErrorMessage]   = useState("");
  const [debugMessage, setDebugMessage]   = useState("");

  const getInitials = (name) =>
    name ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  const handleFieldChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setIsSaved(false);
    setErrorMessage("");
  };

  const handleSelectPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setDebugMessage(`Selected file: ${file.name}, size: ${(file.size / 1024).toFixed(1)}KB, type: ${file.type}`);

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo must be under 5MB.");
      return;
    }

    try {
      setDebugMessage("Compressing image...");
      const base64 = await uploadProfilePhoto(file);
      const sizeKB  = Math.round(base64.length / 1024);
      setDebugMessage(`Compressed to: ${sizeKB}KB base64`);
      setPhotoBase64(base64);
      setPhotoPreview(base64);
    } catch (err) {
      setErrorMessage("Failed to process photo: " + err.message);
      setDebugMessage("Photo error: " + err.message);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setDebugMessage("Saving...");

    try {
      const photoURL = photoBase64 || userProfile?.photoURL || "";

      // Step 1: Update Firebase Auth display name only
      // NOTE: Firebase Auth photoURL does NOT accept Base64 strings,
      // so we only update displayName here and store photo in Firestore
      setDebugMessage("Step 1: Updating Firebase Auth display name...");
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
      });
      setDebugMessage("Step 1 done. Step 2: Updating Firestore...");

      // Step 2: Build the data object and check its size
      const updateData = {
        displayName:  formData.displayName,
        displayEmail: formData.displayEmail,
        phoneNumber:  formData.phoneNumber,
        birthday:     formData.birthday,
        address:      formData.address,
        bio:          formData.bio,
        photoURL,
      };

      const dataSizeKB = Math.round(JSON.stringify(updateData).length / 1024);
      setDebugMessage(`Step 2: Data size = ${dataSizeKB}KB. Saving to Firestore...`);

      await updateUserProfile(userProfile.uid, updateData);

      setDebugMessage("Saved successfully!");
      setIsSaved(true);
      setPhotoBase64(null);
    } catch (err) {
      console.error("Save profile error:", err);
      setErrorMessage(`Failed to save: ${err.message} (code: ${err.code})`);
      setDebugMessage("Error: " + JSON.stringify({ message: err.message, code: err.code }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal profile-modal anim-slide-up">
        <div className="modal-header">
          <span className="modal-title">Edit Profile</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSaveProfile}>
          <div className="modal-body">
            {/* Avatar */}
            <div className="profile-avatar-section">
              <label className="profile-avatar-label">
                {photoPreview
                  ? <img src={photoPreview} alt="avatar" className="profile-avatar-img" />
                  : <div className="profile-avatar-placeholder">{getInitials(formData.displayName)}</div>
                }
                <div className="profile-avatar-overlay">📷</div>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleSelectPhoto} />
              </label>
              <div className="profile-avatar-hint">Click to change photo</div>
            </div>

            {/* Debug info */}
            {debugMessage && (
              <div style={{
                fontSize: 11, color: "var(--color-yellow)",
                background: "rgba(251,191,36,0.1)", borderRadius: 6,
                padding: "6px 10px", wordBreak: "break-all"
              }}>
                🔍 {debugMessage}
              </div>
            )}

            <div className="form-group">
              <label>Display Name</label>
              <input className="input" type="text" name="displayName"
                placeholder="Your name" value={formData.displayName} onChange={handleFieldChange} />
            </div>

            <div className="form-group">
              <label>Display Email <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 11 }}>(shown to others)</span></label>
              <input className="input" type="text" name="displayEmail"
                placeholder="e.g. contact@example.com"
                value={formData.displayEmail} onChange={handleFieldChange} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Your actual login email: {userProfile?.email}
              </span>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input className="input" type="tel" name="phoneNumber"
                placeholder="+886 912 345 678" value={formData.phoneNumber} onChange={handleFieldChange} />
            </div>

            <div className="form-group">
              <label>Birthday</label>
              <input className="input" type="date" name="birthday"
                value={formData.birthday} onChange={handleFieldChange}
                max={new Date().toISOString().split("T")[0]} />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input className="input" type="text" name="address"
                placeholder="City, Country" value={formData.address} onChange={handleFieldChange} />
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea className="input" name="bio" placeholder="A little about you..."
                value={formData.bio} onChange={handleFieldChange}
                rows={3} style={{ resize: "none" }} />
            </div>

            {errorMessage && <p className="error-text">⚠ {errorMessage}</p>}
            {isSaved && <p style={{ color: "var(--color-green)", fontSize: 13 }}>✓ Profile saved!</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}