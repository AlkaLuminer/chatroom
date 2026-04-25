// src/components/Chat/MessageBubble.jsx
import React, { useState, useRef, useEffect } from "react";
import { editMessage, unsendMessage, toggleReaction } from "../../firebase/firestore";
import { format } from "date-fns";
import ImageLightbox from "../Shared/ImageLightbox";
import "./MessageBubble.css";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

export default function MessageBubble({ message, isOwn, roomId, prevMessage, onReply, onScrollTo, highlighted }) {
  const [showMenu, setShowMenu]       = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [editing, setEditing]         = useState(false);
  const [editValue, setEditValue]     = useState(message.content);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const menuRef = useRef(null);
  const bubbleRef = useRef(null);

  const showAvatar = !isOwn && prevMessage?.senderId !== message.senderId;
  const showName   = !isOwn && showAvatar;
  const timestamp  = message.createdAt?.toDate ? format(message.createdAt.toDate(), "HH:mm") : "";
  const reactions  = message.reactions || {};

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowEmojiBar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Highlight animation
  useEffect(() => {
    if (highlighted && bubbleRef.current) {
      bubbleRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlighted]);

  const handleEdit = async () => {
    if (!editValue.trim() || editValue === message.content) { setEditing(false); return; }
    await editMessage(roomId, message.id, editValue.trim());
    setEditing(false); setShowMenu(false);
  };

  const handleUnsend = async () => {
    if (window.confirm("Unsend this message?")) await unsendMessage(roomId, message.id);
    setShowMenu(false);
  };

  const handleReaction = async (emoji) => {
    await toggleReaction(roomId, message.id, emoji, message._currentUserId);
    setShowEmojiBar(false); setShowMenu(false);
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
      <div className={`bubble-row ${isOwn ? "own" : ""} ${highlighted ? "highlighted" : ""}`} ref={bubbleRef}>
        {!isOwn && (
          <div className="bubble-avatar">
            {showAvatar ? (
              message.senderPhoto
                ? <img src={message.senderPhoto} alt={message.senderName} className="avatar" style={{ width: 32, height: 32 }} />
                : <div className="avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{message.senderName?.[0]?.toUpperCase() || "?"}</div>
            ) : <div style={{ width: 32 }} />}
          </div>
        )}

        <div className="bubble-content-wrap">
          {showName && <div className="bubble-sender">{message.senderName}</div>}

          <div className="bubble-with-menu" ref={menuRef}>
            {editing ? (
              <div className={`bubble ${isOwn ? "bubble-own" : "bubble-other"} bubble-editing`}>
                <input className="bubble-edit-input" value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEdit(); if (e.key === "Escape") setEditing(false); }}
                  autoFocus />
                <div className="bubble-edit-actions">
                  <button className="btn" style={{ padding: "4px 10px", fontSize: 12 }} onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ padding: "4px 10px", fontSize: 12 }} onClick={handleEdit}>Save</button>
                </div>
              </div>
            ) : (
              <div
                className={`bubble ${isOwn ? "bubble-own" : "bubble-other"} ${highlighted ? "bubble-highlight" : ""}`}
                onContextMenu={(e) => { e.preventDefault(); setShowMenu(true); setShowEmojiBar(false); }}
                onDoubleClick={() => isOwn && message.type !== "image" && setEditing(true)}
              >
                {/* Reply Preview inside bubble */}
                {message.replyTo && (
                  <div
                    className="bubble-reply-preview"
                    onClick={() => onScrollTo && onScrollTo(message.replyTo.messageId)}
                  >
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
                  ? <img src={message.content} alt="shared" className="bubble-image" onClick={() => setLightboxSrc(message.content)} />
                  : <span className="bubble-text">{message.content}</span>
                }
                <div className="bubble-meta">
                  <span>{timestamp}</span>
                  {message.editedAt && <span className="bubble-edited">edited</span>}
                </div>
              </div>
            )}

            {/* Emoji Quick Bar (hover-style, shown from menu) */}
            {showEmojiBar && (
              <div className={`emoji-quick-bar anim-pop-in ${isOwn ? "bar-left" : "bar-right"}`}>
                {QUICK_EMOJIS.map((emoji) => (
                  <button key={emoji} className="emoji-quick-btn" onClick={() => handleReaction(emoji)}>
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Context Menu */}
            {showMenu && (
              <div className={`bubble-menu anim-pop-in ${isOwn ? "menu-left" : "menu-right"}`}>
                <button className="bubble-menu-item" onClick={() => { setShowEmojiBar(true); setShowMenu(false); }}>
                  😊 React
                </button>
                <button className="bubble-menu-item" onClick={() => { onReply && onReply(message); setShowMenu(false); }}>
                  ↩ Reply
                </button>
                {isOwn && message.type !== "image" && (
                  <button className="bubble-menu-item" onClick={() => { setEditing(true); setShowMenu(false); }}>
                    ✏️ Edit
                  </button>
                )}
                {isOwn && (
                  <button className="bubble-menu-item danger" onClick={handleUnsend}>🗑 Unsend</button>
                )}
                {message.type === "image" && (
                  <button className="bubble-menu-item" onClick={() => { setLightboxSrc(message.content); setShowMenu(false); }}>
                    🔍 View Image
                  </button>
                )}
                {message.type !== "image" && (
                  <button className="bubble-menu-item" onClick={() => { navigator.clipboard.writeText(message.content); setShowMenu(false); }}>
                    📋 Copy
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Emoji Reactions display */}
          {Object.keys(reactions).length > 0 && (
            <div className={`reactions-row ${isOwn ? "reactions-own" : ""}`}>
              {Object.entries(reactions)
                .filter(([, users]) => users.length > 0)
                .map(([emoji, users]) => (
                  <button
                    key={emoji}
                    className={`reaction-chip ${users.includes(message._currentUserId) ? "reacted" : ""}`}
                    onClick={() => handleReaction(emoji)}
                    title={`${users.length} reaction${users.length > 1 ? "s" : ""}`}
                  >
                    {emoji} <span className="reaction-count">{users.length}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      </div>

      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
    </>
  );
}
