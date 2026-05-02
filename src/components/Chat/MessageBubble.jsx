// src/components/Chat/MessageBubble.jsx
import React, { useState, useRef, useEffect } from "react";
import { editMessage, unsendMessage, toggleReaction } from "../../firebase/firestore";
import { format } from "date-fns";
import ImageLightbox from "../Shared/ImageLightbox";
import "./MessageBubble.css";

const QUICK_EMOJI_LIST = ["❤️", "😂", "😮", "😢", "😡", "👍"];

export default function MessageBubble({
  message, isOwn, roomId, previousMessage,
  onReply, onScrollToMessage, isHighlighted
}) {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [isEmojiBarOpen, setIsEmojiBarOpen]       = useState(false);
  const [isEditMode, setIsEditMode]               = useState(false);
  const [editedContent, setEditedContent]         = useState(message.content);
  const [lightboxImageSrc, setLightboxImageSrc]   = useState(null);

  const contextMenuRef = useRef(null);
  const bubbleRef      = useRef(null);

  const shouldShowAvatar = !isOwn && previousMessage?.senderId !== message.senderId;
  const shouldShowName   = !isOwn && shouldShowAvatar;
  const formattedTime    = message.createdAt?.toDate ? format(message.createdAt.toDate(), "HH:mm") : "";
  const reactionMap      = message.reactions || {};

  // Close context menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
        setIsContextMenuOpen(false);
        setIsEmojiBarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Scroll into view when highlighted
  useEffect(() => {
    if (isHighlighted && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  const handleSaveEdit = async () => {
    if (!editedContent.trim() || editedContent === message.content) {
      setIsEditMode(false);
      return;
    }
    await editMessage(roomId, message.id, editedContent.trim());
    setIsEditMode(false);
    setIsContextMenuOpen(false);
  };

  const handleUnsendMessage = async () => {
    if (window.confirm("Unsend this message?")) {
      await unsendMessage(roomId, message.id);
    }
    setIsContextMenuOpen(false);
  };

  const handleSelectReaction = async (emoji) => {
    await toggleReaction(roomId, message.id, emoji, message._currentUserId);
    setIsEmojiBarOpen(false);
    setIsContextMenuOpen(false);
  };

  const handleOpenContextMenu = (event) => {
    event.preventDefault();
    setIsContextMenuOpen(true);
    setIsEmojiBarOpen(false);
  };

  const handleOpenEmojiBar = () => {
    setIsEmojiBarOpen(true);
    setIsContextMenuOpen(false);
  };

  const handleReplyToMessage = () => {
    onReply && onReply(message);
    setIsContextMenuOpen(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setIsContextMenuOpen(false);
  };

  const handleClickReplyPreview = () => {
    onScrollToMessage && onScrollToMessage(message.replyTo.messageId);
  };

  const handleOpenLightbox = () => {
    setLightboxImageSrc(message.content);
    setIsContextMenuOpen(false);
  };

  if (message.deleted) {
    return (
      <div className={`bubble-row ${isOwn ? "own" : ""}`} ref={bubbleRef}>
        <div className="bubble bubble-deleted">🚫 This message was unsent</div>
      </div>
    );
  }

  return (
    <>
      <div
        className={`bubble-row ${isOwn ? "own" : ""} ${isHighlighted ? "highlighted" : ""}`}
        ref={bubbleRef}
      >
        {/* Avatar (for other users only) */}
        {!isOwn && (
          <div className="bubble-avatar">
            {shouldShowAvatar ? (
              message.senderPhoto
                ? <img src={message.senderPhoto} alt={message.senderName} className="avatar" style={{ width: 32, height: 32 }} />
                : <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>
                    {message.senderName?.[0]?.toUpperCase() || "?"}
                  </div>
            ) : (
              <div style={{ width: 32 }} />
            )}
          </div>
        )}

        <div className="bubble-content-wrap">
          {shouldShowName && <div className="bubble-sender">{message.senderName}</div>}

          <div className="bubble-with-menu" ref={contextMenuRef}>
            {/* Edit Mode */}
            {isEditMode ? (
              <div className={`bubble ${isOwn ? "bubble-own" : "bubble-other"} bubble-editing`}>
                <input
                  className="bubble-edit-input"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit();
                    if (e.key === "Escape") setIsEditMode(false);
                  }}
                  autoFocus
                />
                <div className="bubble-edit-actions">
                  <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={() => setIsEditMode(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }}
                    onClick={handleSaveEdit}>Save</button>
                </div>
              </div>
            ) : (
              /* Normal Bubble */
              <div
                className={`bubble ${isOwn ? "bubble-own" : "bubble-other"} ${isHighlighted ? "bubble-highlight" : ""}`}
                onContextMenu={handleOpenContextMenu}
                onDoubleClick={() => isOwn && message.type !== "image" && setIsEditMode(true)}
              >
                {/* Reply preview inside bubble */}
                {message.replyTo && (
                  <div className="bubble-reply-preview" onClick={handleClickReplyPreview}>
                    <div className="bubble-reply-bar" />
                    <div className="bubble-reply-content">
                      <div className="bubble-reply-name">{message.replyTo.senderName}</div>
                      <div className="bubble-reply-text">
                        {message.replyTo.type === "image" ? "📷 Image" : message.replyTo.content}
                      </div>
                    </div>
                  </div>
                )}

                {/* Message content */}
                {message.type === "image"
                  ? <img src={message.content} alt="shared" className="bubble-image"
                      onClick={() => setLightboxImageSrc(message.content)} />
                  : <span className="bubble-text">{message.content}</span>
                }

                <div className="bubble-meta">
                  <span>{formattedTime}</span>
                  {message.editedAt && <span className="bubble-edited">edited</span>}
                </div>
              </div>
            )}

            {/* Emoji Quick Bar */}
            {isEmojiBarOpen && (
              <div className={`emoji-quick-bar anim-pop-in ${isOwn ? "bar-left" : "bar-right"}`}>
                {QUICK_EMOJI_LIST.map((emoji) => (
                  <button key={emoji} className="emoji-quick-btn" onClick={() => handleSelectReaction(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Context Menu */}
            {isContextMenuOpen && (
              <div className={`bubble-menu anim-pop-in ${isOwn ? "menu-left" : "menu-right"}`}>
                <button className="bubble-menu-item" onClick={handleOpenEmojiBar}>😊 React</button>
                <button className="bubble-menu-item" onClick={handleReplyToMessage}>↩ Reply</button>
                {isOwn && message.type !== "image" && (
                  <button className="bubble-menu-item" onClick={() => { setIsEditMode(true); setIsContextMenuOpen(false); }}>
                    ✏️ Edit
                  </button>
                )}
                {isOwn && (
                  <button className="bubble-menu-item danger" onClick={handleUnsendMessage}>
                    🗑 Unsend
                  </button>
                )}
                {message.type === "image" && (
                  <button className="bubble-menu-item" onClick={handleOpenLightbox}>🔍 View Image</button>
                )}
                {message.type !== "image" && (
                  <button className="bubble-menu-item" onClick={handleCopyText}>📋 Copy</button>
                )}
              </div>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactionMap).length > 0 && (
            <div className={`reactions-row ${isOwn ? "reactions-own" : ""}`}>
              {Object.entries(reactionMap)
                .filter(([, users]) => users.length > 0)
                .map(([emoji, users]) => (
                  <button
                    key={emoji}
                    className={`reaction-chip ${users.includes(message._currentUserId) ? "reacted" : ""}`}
                    onClick={() => handleSelectReaction(emoji)}
                    title={`${users.length} reaction${users.length > 1 ? "s" : ""}`}
                  >
                    {emoji} <span className="reaction-count">{users.length}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {lightboxImageSrc && (
        <ImageLightbox src={lightboxImageSrc} onClose={() => setLightboxImageSrc(null)} />
      )}
    </>
  );
}
