// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserRooms } from "../../firebase/firestore";
import { logout } from "../../firebase/auth";
import CreateRoomModal from "./CreateRoomModal";
import RoomSearch from "./RoomSearch";
import "./Sidebar.css";

export default function Sidebar({ activeRoomId, onSelectRoom, onOpenProfile, className }) {
  const { userProfile } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomSearch, setShowRoomSearch] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsub = getUserRooms(userProfile.uid, setRooms);
    return () => unsub();
  }, [userProfile?.uid]);

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <>
      <aside className={`sidebar ${className || ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <span className="sidebar-brand">🔥 FireChat</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn-icon" title="Find Rooms" onClick={() => setShowRoomSearch(true)}>🔍</button>
            <button className="btn-icon" title="New Room" onClick={() => setShowCreateRoom(true)}>✏️</button>
          </div>
        </div>

        {/* Room List */}
        <div className="sidebar-rooms">
          <div className="sidebar-section-label">My Rooms</div>
          {rooms.length === 0 && (
            <div className="sidebar-empty">
              No rooms yet.{"\n"}Click 🔍 to find or ✏️ to create!
            </div>
          )}
          {rooms.map((room, i) => (
            <button
              key={room.id}
              className={`room-item ${activeRoomId === room.id ? "active" : ""}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => onSelectRoom(room)}
            >
              <div className="room-icon">
                {room.type === "private" ? "🔒" : "#"}
              </div>
              <div className="room-info">
                <div className="room-name">{room.name}</div>
                {room.lastMessage && (
                  <div className="room-preview">{room.lastMessage}</div>
                )}
              </div>
              {room.type === "private" && (
                <span className="room-badge private">Private</span>
              )}
            </button>
          ))}
        </div>

        {/* User Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-user-btn" onClick={onOpenProfile}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
              {userProfile?.photoURL ? (
                <img src={userProfile.photoURL} alt={userProfile.displayName}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                initials(userProfile?.displayName)
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userProfile?.displayName || "User"}</div>
              <div className="sidebar-user-email">{userProfile?.email}</div>
            </div>
          </button>
          <button className="btn-icon" title="Sign Out" onClick={logout}>⎋</button>
        </div>
      </aside>

      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreated={(room) => { onSelectRoom(room); setShowCreateRoom(false); }}
        />
      )}
      {showRoomSearch && (
        <RoomSearch
          onClose={() => setShowRoomSearch(false)}
          onJoinRoom={(room) => { onSelectRoom(room); }}
        />
      )}
    </>
  );
}
