// src/components/Profile/MemberProfileModal.jsx
import React, { useState, useEffect } from "react";
import { getUserById, blockUser, unblockUser } from "../../firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import "./MemberProfileModal.css";

export default function MemberProfileModal({ userId, onClose }) {
  const { userProfile } = useAuth();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  const isBlocked = userProfile?.blockedUsers?.includes(userId);
  const isMe = userId === userProfile?.uid;

  useEffect(() => {
    getUserById(userId).then((data) => { setMember(data); setLoading(false); });
  }, [userId]);

  const handleBlock = async () => {
    if (isBlocked) {
      await unblockUser(userProfile.uid, userId);
    } else {
      if (!window.confirm(`Block ${member?.displayName}?`)) return;
      await blockUser(userProfile.uid, userId);
    }
    onClose();
  };

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal member-profile-modal anim-pop-in">
        <div className="modal-header">
          <span className="modal-title">Profile</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
        ) : !member ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>User not found.</div>
        ) : (
          <div className="modal-body">
            <div className="member-profile-header">
              <div className="member-profile-avatar">
                {member.photoURL
                  ? <img src={member.photoURL} alt={member.displayName} className="member-profile-img" />
                  : <div className="member-profile-initials">{initials(member.displayName)}</div>}
              </div>
              <div className="member-profile-name">{member.displayName || "Unknown"}</div>
              {/* 顯示自訂 email，沒填就不顯示 */}
              {member.displayEmail && (
                <div className="member-profile-email">{member.displayEmail}</div>
              )}
              {isBlocked && <span className="member-tag blocked" style={{ marginTop: 6 }}>Blocked</span>}
            </div>

            <div className="member-profile-info">
              {member.bio && (
                <div className="member-profile-row">
                  <span className="member-profile-label">Bio</span>
                  <span className="member-profile-value">{member.bio}</span>
                </div>
              )}
              {member.phoneNumber && (
                <div className="member-profile-row">
                  <span className="member-profile-label">Phone</span>
                  <span className="member-profile-value">{member.phoneNumber}</span>
                </div>
              )}
              {member.address && (
                <div className="member-profile-row">
                  <span className="member-profile-label">Location</span>
                  <span className="member-profile-value">{member.address}</span>
                </div>
              )}
              {member.birthday && (
                <div className="member-profile-row">
                  <span className="member-profile-label">Birthday</span>
                  <span className="member-profile-value">{member.birthday}</span>
                </div>
              )}
              {!member.bio && !member.phoneNumber && !member.address && !member.birthday && !member.displayEmail && (
                <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "12px 0" }}>
                  This user hasn't filled in their profile yet.
                </div>
              )}
            </div>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          {!isMe && !loading && member && (
            <button className={`btn ${isBlocked ? "btn-ghost" : "btn-danger"}`} onClick={handleBlock}>
              {isBlocked ? "✓ Unblock" : "Block User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
