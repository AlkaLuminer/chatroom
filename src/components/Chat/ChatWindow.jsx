// src/components/Chat/ChatWindow.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { subscribeToMessages, searchMessages } from "../../firebase/firestore";
import { showLocalNotification } from "../../hooks/useNotifications";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import RoomInfoPanel from "./RoomInfoPanel";
import "./ChatWindow.css";

export default function ChatWindow({ room, onToggleSidebar }) {
  const { userProfile } = useAuth();
  const [messageList, setMessageList]         = useState([]);
  const [searchQuery, setSearchQuery]         = useState("");
  const [searchResults, setSearchResults]     = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isRoomInfoOpen, setIsRoomInfoOpen]   = useState(false);
  const [replyTarget, setReplyTarget]         = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const bottomAnchorRef  = useRef(null);
  const previousCountRef = useRef(0);

  useEffect(() => {
    if (!room) return;
    setMessageList([]);
    setReplyTarget(null);

    const unsubscribe = subscribeToMessages(room.id, (messages) => {
      // Notify if new message arrives while window is not focused
      if (messages.length > previousCountRef.current && previousCountRef.current > 0) {
        const newestMessage = messages[messages.length - 1];
        if (newestMessage.senderId !== userProfile?.uid && !document.hasFocus()) {
          showLocalNotification(newestMessage.senderName, newestMessage.content, room.name);
        }
      }
      previousCountRef.current = messages.length;
      setMessageList(messages);
    });

    return () => unsubscribe();
  }, [room?.id]);

  useEffect(() => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const handleExecuteSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    const results = await searchMessages(room.id, searchQuery);
    setSearchResults(results);
  };

  const handleToggleSearch = () => {
    setIsSearchVisible((previous) => !previous);
    setSearchResults(null);
    setSearchQuery("");
  };

  const handleClearSearch = () => setSearchResults(null);

  const handleScrollToMessage = useCallback((messageId) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 2000);
  }, []);

  const handleSetReply  = (message) => setReplyTarget({
    messageId:  message.id,
    senderName: message.senderName,
    content:    message.content,
    type:       message.type,
  });
  const handleCancelReply = () => setReplyTarget(null);

  const handleOpenRoomInfo  = () => setIsRoomInfoOpen(true);
  const handleCloseRoomInfo = () => setIsRoomInfoOpen(false);

  const isUserBlocked = (senderId) => userProfile?.blockedUsers?.includes(senderId);

  const displayedMessages = searchResults ?? messageList;

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
        <div className="chat-header-info" onClick={handleOpenRoomInfo}>
          <div className="chat-header-icon">{room.type === "private" ? "🔒" : "#"}</div>
          <div>
            <div className="chat-header-name">{room.name}</div>
            <div className="chat-header-meta">
              {room.members?.length || 0} member{room.members?.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className={`btn-icon ${isSearchVisible ? "active" : ""}`}
            onClick={handleToggleSearch} title="Search messages">🔍</button>
          <button className="btn-icon" onClick={handleOpenRoomInfo} title="Room info">ℹ️</button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchVisible && (
        <div className="chat-search-bar anim-slide-down">
          <input className="input" placeholder="Search messages…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleExecuteSearch()}
            style={{ flex: 1 }} autoFocus />
          <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={handleExecuteSearch}>
            Search
          </button>
          {searchResults && (
            <button className="btn btn-ghost" style={{ padding: "8px 16px" }} onClick={handleClearSearch}>
              Clear
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages">
        {searchResults !== null && searchResults.length === 0 && (
          <div className="chat-no-results">No messages found for "{searchQuery}"</div>
        )}
        {displayedMessages.map((message, index) => {
          if (isUserBlocked(message.senderId)) return null;
          return (
            <MessageBubble
              key={message.id}
              message={{ ...message, _currentUserId: userProfile?.uid }}
              isOwn={message.senderId === userProfile?.uid}
              roomId={room.id}
              previousMessage={displayedMessages[index - 1]}
              onReply={handleSetReply}
              onScrollToMessage={handleScrollToMessage}
              isHighlighted={highlightedMessageId === message.id}
            />
          );
        })}
        <div ref={bottomAnchorRef} />
      </div>

      {/* Input */}
      <MessageInput
        room={room}
        replyTarget={replyTarget}
        onCancelReply={handleCancelReply}
      />

      {isRoomInfoOpen && <RoomInfoPanel room={room} onClose={handleCloseRoomInfo} />}
    </div>
  );
}
