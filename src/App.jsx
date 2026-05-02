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
  const { currentUser, userProfile, isLoadingAuth } = useAuth();
  const [selectedRoom, setSelectedRoom]         = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen]       = useState(false);

  // Register Chrome push notifications
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
    setIsSidebarOpen(false);
  };

  const handleToggleSidebar = () => setIsSidebarOpen((previous) => !previous);
  const handleOpenProfile   = () => setShowProfileModal(true);
  const handleCloseProfile  = () => setShowProfileModal(false);

  return (
    <div className="app-layout">
      <Sidebar
        activeRoomId={selectedRoom?.id}
        onSelectRoom={handleSelectRoom}
        onOpenProfile={handleOpenProfile}
        className={isSidebarOpen ? "open" : ""}
      />

      <ChatWindow
        room={selectedRoom}
        onToggleSidebar={handleToggleSidebar}
      />

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
