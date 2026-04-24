// src/App.jsx
import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useNotifications } from "./hooks/useNotifications";
import AuthPage from "./components/Auth/AuthPage";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatWindow from "./components/Chat/ChatWindow";
import ProfileModal from "./components/Profile/ProfileModal";
import "./styles/globals.css";

function AppInner() {
  const { currentUser, userProfile, loading } = useAuth();
  const [activeRoom, setActiveRoom] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Register push notifications
  useNotifications(currentUser?.uid);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, animation: "spin 0.8s linear infinite", display: "inline-block" }}>🔥</div>
          <div style={{ color: "var(--text-muted)", marginTop: 12, fontSize: 14 }}>Loading FireChat…</div>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthPage />;

  return (
    <div className="app-layout">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 199, display: "none"
          }}
        />
      )}

      <Sidebar
        activeRoomId={activeRoom?.id}
        onSelectRoom={(room) => { setActiveRoom(room); setSidebarOpen(false); }}
        onOpenProfile={() => setShowProfile(true)}
        className={sidebarOpen ? "open" : ""}
      />

      <ChatWindow
        room={activeRoom}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
