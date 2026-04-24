// src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { listenToMessages, searchMessages } from "../../firebase/firestore";
import { showLocalNotification } from "../../hooks/useNotifications";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import RoomInfoPanel from "./RoomInfoPanel";
import "./ChatWindow.css";

export default function ChatWindow({ room, onToggleSidebar }) {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showRoomInfo, setShowRoomInfo] = useState(false);
  const bottomRef = useRef(null);
  const prevMsgCount = useRef(0);

  useEffect(() => {
    if (!room) return;
    setMessages([]);
    const unsub = listenToMessages(room.id, (msgs) => {
      // Show notification for new messages from others
      if (msgs.length > prevMsgCount.current && prevMsgCount.current > 0) {
        const newest = msgs[msgs.length - 1];
        if (newest.senderId !== userProfile?.uid && !document.hasFocus()) {
          showLocalNotification(newest.senderName, newest.content, room.name);
        }
      }
      prevMsgCount.current = msgs.length;
      setMessages(msgs);
    });
    return () => unsub();
  }, [room?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const results = await searchMessages(room.id, searchQuery);
    setSearchResults(results);
  };

  const isBlocked = (senderId) =>
    userProfile?.blockedUsers?.includes(senderId);

  const displayMessages = searchResults ?? messages;

  if (!room) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-icon">💬</div>
        <div className="chat-empty-title">Welcome to FireChat</div>
        <div className="chat-empty-sub">Select a room or create a new one to start chatting.</div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button className="btn-icon mobile-menu-btn" onClick={onToggleSidebar}>☰</button>
        <div className="chat-header-info" onClick={() => setShowRoomInfo(true)}>
          <div className="chat-header-icon">{room.type === "private" ? "🔒" : "#"}</div>
          <div>
            <div className="chat-header-name">{room.name}</div>
            <div className="chat-header-meta">
              {room.members?.length || 0} member{room.members?.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button
            className={`btn-icon ${showSearch ? "active" : ""}`}
            onClick={() => { setShowSearch(!showSearch); setSearchResults(null); setSearchQuery(""); }}
            title="Search messages"
          >🔍</button>
          <button className="btn-icon" onClick={() => setShowRoomInfo(true)} title="Room info">ℹ️</button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="chat-search-bar anim-slide-down">
          <input
            className="input"
            placeholder="Search messages…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{ flex: 1 }}
            autoFocus
          />
          <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={handleSearch}>Search</button>
          {searchResults && (
            <button className="btn btn-ghost" style={{ padding: "8px 16px" }} onClick={() => setSearchResults(null)}>Clear</button>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="chat-messages">
        {searchResults !== null && searchResults.length === 0 && (
          <div className="chat-no-results">No messages found for "{searchQuery}"</div>
        )}
        {displayMessages.map((msg, i) => {
          if (isBlocked(msg.senderId)) return null;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === userProfile?.uid}
              roomId={room.id}
              prevMessage={displayMessages[i - 1]}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput room={room} />

      {/* Room Info Panel */}
      {showRoomInfo && (
        <RoomInfoPanel room={room} onClose={() => setShowRoomInfo(false)} />
      )}
    </div>
  );
}
