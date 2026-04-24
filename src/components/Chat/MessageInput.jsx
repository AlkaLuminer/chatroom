// src/components/Chat/MessageInput.jsx
import React, { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../context/AuthContext";
import { sendMessage } from "../../firebase/firestore";
import { uploadChatImage } from "../../firebase/storage";
import "./MessageInput.css";

export default function MessageInput({ room }) {
  const { userProfile } = useAuth();
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const fileRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !imageFile) return;

    const senderName = userProfile.displayName || "Anonymous";
    const senderPhoto = userProfile.photoURL || "";

    try {
      if (imageFile) {
        setUploading(true);
        const { url } = await uploadChatImage(imageFile, room.id);
        await sendMessage(room.id, userProfile.uid, senderName, senderPhoto, url, "image");
        setImageFile(null);
        setImagePreview(null);
        setUploading(false);
      }
      if (trimmed) {
        await sendMessage(room.id, userProfile.uid, senderName, senderPhoto, trimmed, "text");
        setText("");
      }
    } catch (err) {
      console.error("Send error:", err);
      setUploading(false);
    }
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emojiData) => {
    setText((t) => t + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Max file size is 10MB."); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  return (
    <div className="message-input-area">
      {/* Image Preview */}
      {imagePreview && (
        <div className="image-preview-bar anim-slide-up">
          <img src={imagePreview} alt="preview" className="image-preview-thumb" />
          <span className="image-preview-name">{imageFile?.name}</span>
          <button className="btn-icon" onClick={() => { setImageFile(null); setImagePreview(null); }}>✕</button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="emoji-picker-wrap anim-pop-in">
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme="dark"
            height={380}
            width="100%"
            searchDisabled={false}
          />
        </div>
      )}

      <div className="message-input-row">
        {/* Emoji Toggle */}
        <button
          className={`btn-icon input-action-btn ${showEmoji ? "active" : ""}`}
          onClick={() => setShowEmoji((v) => !v)}
          title="Emoji"
        >😊</button>

        {/* Image Upload */}
        <button
          className="btn-icon input-action-btn"
          onClick={() => fileRef.current?.click()}
          title="Send image"
          disabled={uploading}
        >🖼️</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Text area */}
        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder={`Message #${room.name}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ resize: "none" }}
          disabled={uploading}
        />

        {/* Send button */}
        <button
          className={`btn btn-primary send-btn ${(text.trim() || imageFile) ? "ready" : ""}`}
          onClick={handleSend}
          disabled={uploading || (!text.trim() && !imageFile)}
        >
          {uploading ? <span className="anim-spin">⟳</span> : "➤"}
        </button>
      </div>
    </div>
  );
}
