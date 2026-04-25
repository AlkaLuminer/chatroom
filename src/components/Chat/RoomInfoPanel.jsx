// src/components/Chat/RoomInfoPanel.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getUserById, addMemberToRoom, removeMemberFromRoom, searchUsers } from "../../firebase/firestore";
import MemberProfileModal from "../Profile/MemberProfileModal";
import "./RoomInfoPanel.css";

export default function RoomInfoPanel({ room, onClose }) {
  const { userProfile } = useAuth();
  const [members, setMembers] = useState([]);
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteResults, setInviteResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const isAdmin = room.admins?.includes(userProfile?.uid);
  const blockedList = userProfile?.blockedUsers || [];

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const fetched = await Promise.all((room.members || []).map((uid) => getUserById(uid)));
      setMembers(fetched.filter(Boolean));
      setLoading(false);
    };
    fetchMembers();
  }, [room.members]);

  const handleInviteSearch = async (term) => {
    setInviteSearch(term);
    if (term.length < 2) { setInviteResults([]); return; }
    const results = await searchUsers(term);
    setInviteResults(results.filter((u) => !room.members?.includes(u.uid)));
  };

  const handleInvite = async (user) => {
    await addMemberToRoom(room.id, user.uid);
    setInviteSearch("");
    setInviteResults([]);
  };

  const handleKick = async (uid) => {
    if (uid === userProfile?.uid) return;
    if (!window.confirm("Remove this member?")) return;
    await removeMemberFromRoom(room.id, uid);
  };

  return (
    <>
      <div className="room-info-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="room-info-panel anim-slide-in-right">
          <div className="room-info-header">
            <h3 className="room-info-title">{room.type === "private" ? "🔒" : "#"} {room.name}</h3>
            <button className="btn-icon" onClick={onClose}>✕</button>
          </div>

          <div className="room-info-meta">
            <span className={`room-badge ${room.type}`} style={{ fontSize: 13, padding: "4px 12px" }}>
              {room.type === "private" ? "Private Room" : "Public Room"}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {room.members?.length || 0} members
            </span>
          </div>

          {/* Invite */}
          <div className="room-info-section">
            <div className="room-info-section-label">Invite Members</div>
            <input className="input" placeholder="Search by name or email…"
              value={inviteSearch} onChange={(e) => handleInviteSearch(e.target.value)} />
            {inviteResults.length > 0 && (
              <div className="invite-results">
                {inviteResults.map((u) => (
                  <div key={u.uid} className="member-row">
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                      {u.photoURL
                        ? <img src={u.photoURL} alt={u.displayName} style={{ width: 32, height: 32, borderRadius: "50%" }} />
                        : u.displayName?.[0]}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{u.displayName}</div>
                      <div className="member-email">{u.email}</div>
                    </div>
                    <button className="btn btn-primary" style={{ padding: "5px 12px", fontSize: 12 }} onClick={() => handleInvite(u)}>
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Members */}
          <div className="room-info-section">
            <div className="room-info-section-label">Members</div>
            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "8px 0" }}>Loading…</div>
            ) : (
              <div className="members-list">
                {members.map((member) => {
                  const isYou = member.uid === userProfile?.uid;
                  const isRoomAdmin = room.admins?.includes(member.uid);
                  const isBlocked = blockedList.includes(member.uid);
                  return (
                    <div key={member.uid} className="member-row">
                      {/* Clickable avatar + name */}
                      <button
                        className="member-clickable"
                        onClick={() => setSelectedMemberId(member.uid)}
                        title="View profile"
                      >
                        <div className="avatar" style={{ width: 36, height: 36, fontSize: 14 }}>
                          {member.photoURL
                            ? <img src={member.photoURL} alt={member.displayName} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
                            : (member.displayName?.[0] || "?")}
                        </div>
                        <div className="member-info">
                          <div className="member-name">
                            {member.displayName}
                            {isYou && <span className="member-tag you">You</span>}
                            {isRoomAdmin && <span className="member-tag admin">Admin</span>}
                            {isBlocked && <span className="member-tag blocked">Blocked</span>}
                          </div>
                          <div className="member-email">{member.email}</div>
                        </div>
                      </button>
                      {!isYou && isAdmin && (
                        <button className="btn btn-danger member-action-btn"
                          style={{ fontSize: 12, padding: "4px 10px" }}
                          onClick={() => handleKick(member.uid)}>
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Profile Modal */}
      {selectedMemberId && (
        <MemberProfileModal
          userId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </>
  );
}
