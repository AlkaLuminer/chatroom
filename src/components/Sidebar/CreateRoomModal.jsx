// src/components/Sidebar/CreateRoomModal.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createRoom, searchUsers, addMemberToRoom } from "../../firebase/firestore";

export default function CreateRoomModal({ onClose, onCreated }) {
  const { userProfile } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState("public");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearchMembers = async (term) => {
    setMemberSearch(term);
    if (term.length < 2) { setMemberResults([]); return; }
    const results = await searchUsers(term);
    setMemberResults(results.filter((u) => u.uid !== userProfile.uid && !selectedMembers.find((m) => m.uid === u.uid)));
  };

  const handleAddMember = (user) => {
    setSelectedMembers((prev) => [...prev, user]);
    setMemberSearch("");
    setMemberResults([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Room name is required."); return; }
    setLoading(true);
    try {
      const memberIds = selectedMembers.map((m) => m.uid);
      const roomId = await createRoom(name.trim(), type, userProfile.uid, memberIds);
      onCreated({ id: roomId, name: name.trim(), type, members: [userProfile.uid, ...memberIds] });
      onClose();
    } catch (err) {
      setError("Failed to create room. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal anim-slide-up">
        <div className="modal-header">
          <span className="modal-title">New Room</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="form-group">
              <label>Room Name</label>
              <input className="input" placeholder="e.g. general, design-team…" value={name} onChange={(e) => { setName(e.target.value); setError(""); }} required />
            </div>

            <div className="form-group">
              <label>Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["public", "private"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn ${type === t ? "btn-primary" : "btn-ghost"}`}
                    style={{ flex: 1 }}
                    onClick={() => setType(t)}
                  >
                    {t === "public" ? "# Public" : "🔒 Private"}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {type === "public" ? "Anyone can join this room." : "Only invited members can see this room."}
              </p>
            </div>

            <div className="form-group">
              <label>Invite Members</label>
              <input
                className="input"
                placeholder="Search by name or email…"
                value={memberSearch}
                onChange={(e) => handleSearchMembers(e.target.value)}
              />
              {memberResults.length > 0 && (
                <div style={{ background: "var(--color-surface2)", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                  {memberResults.map((u) => (
                    <button
                      key={u.uid}
                      type="button"
                      style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, color: "var(--text-primary)", textAlign: "left" }}
                      onClick={() => handleAddMember(u)}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface3)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                    >
                      <div className="avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{u.displayName?.[0] || "?"}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{u.displayName}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.email}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedMembers.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                  {selectedMembers.map((m) => (
                    <span
                      key={m.uid}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "var(--color-accent-glow)", color: "var(--color-accent)",
                        border: "1px solid var(--color-accent)", borderRadius: 99,
                        padding: "3px 10px", fontSize: 13
                      }}
                    >
                      {m.displayName}
                      <button
                        type="button"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}
                        onClick={() => setSelectedMembers((prev) => prev.filter((x) => x.uid !== m.uid))}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="error-text">⚠ {error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Creating…" : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
