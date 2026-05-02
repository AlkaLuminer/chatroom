// src/components/Chat/MessageInput.jsx
import React, { useState, useRef } from "react";
import EmojiPicker from "emoji-picker-react";
import { useAuth } from "../../context/AuthContext";
import { sendMessage } from "../../firebase/firestore";
import { uploadChatImage } from "../../firebase/storage";
import "./MessageInput.css";

export default function MessageInput({ room, replyTarget, onCancelReply }) {
  const { userProfile } = useAuth();
  const [messageText, setMessageText]         = useState("");
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage]   = useState(false);
  const [selectedImagePreview, setSelectedImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile]       = useState(null);

  const fileInputRef    = useRef(null);
  const textareaRef     = useRef(null);

  const handleSubmitMessage = async () => {
    const trimmedText = messageText.trim();
    if (!trimmedText && !selectedImageFile) return;

    const senderName  = userProfile.displayName || "Anonymous";
    const senderPhoto = userProfile.photoURL    || "";

    try {
      if (selectedImageFile) {
        setIsUploadingImage(true);
        const { url } = await uploadChatImage(selectedImageFile, room.id);
        await sendMessage(room.id, userProfile.uid, senderName, senderPhoto, url, "image", replyTarget || null);
        setSelectedImageFile(null);
        setSelectedImagePreview(null);
        setIsUploadingImage(false);
      }
      if (trimmedText) {
        await sendMessage(room.id, userProfile.uid, senderName, senderPhoto, trimmedText, "text", replyTarget || null);
        setMessageText("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setIsUploadingImage(false);
    }

    setIsEmojiPickerOpen(false);
    onCancelReply && onCancelReply();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitMessage();
    }
  };

  const handleSelectEmoji = (emojiData) => {
    setMessageText((previous) => previous + emojiData.emoji);
    textareaRef.current?.focus();
  };

  const handleSelectImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Max file size is 10MB."); return; }
    setSelectedImageFile(file);
    setSelectedImagePreview(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null);
    setSelectedImagePreview(null);
  };

  const handleToggleEmojiPicker = () => setIsEmojiPickerOpen((previous) => !previous);
  const handleOpenFileDialog     = () => fileInputRef.current?.click();

  const isReadyToSend = messageText.trim() || selectedImageFile;

  return (
    <div className="message-input-area">
      {/* Reply Preview Bar */}
      {replyTarget && (
        <div className="reply-preview-bar anim-slide-up">
          <div className="reply-preview-bar-line" />
          <div className="reply-preview-info">
            <div className="reply-preview-name">↩ Replying to {replyTarget.senderName}</div>
            <div className="reply-preview-text">
              {replyTarget.type === "image" ? "📷 Image" : replyTarget.content}
            </div>
          </div>
          <button className="btn-icon" onClick={onCancelReply} style={{ marginLeft: "auto" }}>✕</button>
        </div>
      )}

      {/* Selected Image Preview */}
      {selectedImagePreview && (
        <div className="image-preview-bar anim-slide-up">
          <img src={selectedImagePreview} alt="preview" className="image-preview-thumb" />
          <span className="image-preview-name">{selectedImageFile?.name}</span>
          <button className="btn-icon" onClick={handleRemoveSelectedImage}>✕</button>
        </div>
      )}

      {/* Emoji Picker */}
      {isEmojiPickerOpen && (
        <div className="emoji-picker-wrap anim-pop-in">
          <EmojiPicker onEmojiClick={handleSelectEmoji} theme="dark" height={380} width="100%" />
        </div>
      )}

      <div className="message-input-row">
        <button
          className={`btn-icon input-action-btn ${isEmojiPickerOpen ? "active" : ""}`}
          onClick={handleToggleEmojiPicker}
          title="Emoji"
        >😊</button>

        <button
          className="btn-icon input-action-btn"
          onClick={handleOpenFileDialog}
          title="Send image"
          disabled={isUploadingImage}
        >🖼️</button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleSelectImageFile}
        />

        <textarea
          ref={textareaRef}
          className="message-textarea"
          placeholder={replyTarget ? `Reply to ${replyTarget.senderName}...` : `Message #${room.name}…`}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{ resize: "none" }}
          disabled={isUploadingImage}
        />

        <button
          className={`btn btn-primary send-btn ${isReadyToSend ? "ready" : ""}`}
          onClick={handleSubmitMessage}
          disabled={isUploadingImage || !isReadyToSend}
        >
          {isUploadingImage ? <span className="anim-spin">⟳</span> : "➤"}
        </button>
      </div>
    </div>
  );
}
