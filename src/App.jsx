// src/App.jsx
import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useNotifications } from "./hooks/useNotifications";
import AuthPage from "./components/Auth/AuthPage";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";
import ProfileModal from "./components/Profile/ProfileModal";
import "./styles/globals.css";

function AppContent() {
  const { currentUser, isLoadingAuth } = useAuth();
  const [selectedRoom, setSelectedRoom]         = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab]               = useState("rooms"); // "rooms" | "chat"

  useNotifications(currentUser?.uid);

  if (isLoadingAuth) {
    return (
      <div style={{
        height: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--color-bg)"
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, animation: "spin 0.8s linear infinite", display: "inline-block" }}>🔥</div>
          <div style={{ color: "var(--text-muted)", marginTop: 12, fontSize: 14 }}>Loading FireChat…</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthPage />;

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setActiveTab("chat"); // Switch to chat tab on mobile when room selected
  };

  const handleOpenProfile   = () => setShowProfileModal(true);
  const handleCloseProfile  = () => setShowProfileModal(false);

  return (
    <div className="app-layout">
      {/* Desktop: side-by-side layout */}
      {/* Mobile: tab-based layout */}
      <div className={`app-sidebar-wrap ${activeTab === "rooms" ? "mobile-visible" : "mobile-hidden"}`}>
        <Sidebar
          activeRoomId={selectedRoom?.id}
          onSelectRoom={handleSelectRoom}
          onOpenProfile={handleOpenProfile}
        />
      </div>

      <div className={`app-chat-wrap ${activeTab === "chat" ? "mobile-visible" : "mobile-hidden"}`}>
        <ChatWindow
          room={selectedRoom}
          onToggleSidebar={() => setActiveTab("rooms")}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-btn ${activeTab === "rooms" ? "active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          <span className="mobile-nav-icon">💬</span>
          <span className="mobile-nav-label">Rooms</span>
        </button>
        <button
          className={`mobile-nav-btn ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
          disabled={!selectedRoom}
        >
          <span className="mobile-nav-icon">{selectedRoom ? "#" : "—"}</span>
          <span className="mobile-nav-label">{selectedRoom ? selectedRoom.name : "No Room"}</span>
        </button>
        <button
          className="mobile-nav-btn"
          onClick={handleOpenProfile}
        >
          <span className="mobile-nav-icon">👤</span>
          <span className="mobile-nav-label">Profile</span>
        </button>
      </nav>

      {showProfileModal && <ProfileModal onClose={handleCloseProfile} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
