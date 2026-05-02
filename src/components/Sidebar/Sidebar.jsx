// src/components/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserRooms } from "../../firebase/firestore";
import { signOutUser } from "../../firebase/auth";
import CreateRoomModal from "./CreateRoomModal";
import RoomSearch from "./RoomSearch";
import "./Sidebar.css";

export default function Sidebar({ activeRoomId, onSelectRoom, onOpenProfile, className }) {
  const { userProfile } = useAuth();
  const [roomList, setRoomList]               = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    const unsubscribe = fetchUserRooms(userProfile.uid, setRoomList);
    return () => unsubscribe();
  }, [userProfile?.uid]);

  const getInitials = (name) =>
    name ? name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() : "?";

  const handleOpenCreate = () => setShowCreateModal(true);
  const handleCloseCreate = () => setShowCreateModal(false);
  const handleOpenSearch  = () => setShowSearchModal(true);
  const handleCloseSearch = () => setShowSearchModal(false);

  const handleRoomCreated = (room) => {
    onSelectRoom(room);
    handleCloseCreate();
  };

  const handleRoomJoined = (room) => {
    onSelectRoom(room);
  };

  return (
    <>
      <aside className={`sidebar ${className || ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <span className="sidebar-brand">🔥 FireChat</span>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="btn-icon" title="Find Rooms" onClick={handleOpenSearch}>🔍</button>
            <button className="btn-icon" title="New Room"   onClick={handleOpenCreate}>✏️</button>
          </div>
        </div>

        {/* Room List */}
        <div className="sidebar-rooms">
          <div className="sidebar-section-label">My Rooms</div>
          {roomList.length === 0 && (
            <div className="sidebar-empty">
              No rooms yet. Click 🔍 to find or ✏️ to create!
            </div>
          )}
          {roomList.map((room, index) => (
            <button
              key={room.id}
              className={`room-item ${activeRoomId === room.id ? "active" : ""}`}
              style={{ animationDelay: `${index * 30}ms` }}
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
                getInitials(userProfile?.displayName)
              )}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{userProfile?.displayName || "User"}</div>
              <div className="sidebar-user-email">{userProfile?.email}</div>
            </div>
          </button>
          <button className="btn-icon" title="Sign Out" onClick={signOutUser}>⎋</button>
        </div>
      </aside>

      {showCreateModal && (
        <CreateRoomModal onClose={handleCloseCreate} onCreated={handleRoomCreated} />
      )}
      {showSearchModal && (
        <RoomSearch onClose={handleCloseSearch} onJoinRoom={handleRoomJoined} />
      )}
    </>
  );
}
