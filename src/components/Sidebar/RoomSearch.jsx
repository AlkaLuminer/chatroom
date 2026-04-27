// src/components/Sidebar/RoomSearch.jsx
import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import { addMemberToRoom } from "../../firebase/firestore";
import "./RoomSearch.css";

export default function RoomSearch({ onClose, onJoinRoom }) {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);

  const getRank = (name, term) => {
    if (!name) return 99;
    if (name === term) return 0;                                          // 完全一致（大小寫）
    if (name.toLowerCase() === term.toLowerCase()) return 1;             // 完全一致（忽略大小寫）
    if (name.startsWith(term)) return 2;                                 // 字首符合（大小寫）
    if (name.toLowerCase().startsWith(term.toLowerCase())) return 3;    // 字首符合（忽略大小寫）
    if (name.includes(term)) return 4;                                   // 包含（大小寫）
    if (name.toLowerCase().includes(term.toLowerCase())) return 5;      // 包含（忽略大小寫）
    return 99;
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const q = query(
        collection(db, "rooms"),
        where("type", "==", "public")
      );
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 過濾有符合的房間
      const filtered = all.filter((r) => getRank(r.name, searchTerm) < 99);

      // 依排名排序，同排名再按字母順序
      filtered.sort((a, b) => {
        const rankDiff = getRank(a.name, searchTerm) - getRank(b.name, searchTerm);
        if (rankDiff !== 0) return rankDiff;
        return (a.name || "").localeCompare(b.name || "");
      });

      setResults(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (room) => {
    setJoining(true);
    try {
      await addMemberToRoom(room.id, userProfile.uid);
      setJoined(true);
      setTimeout(() => {
        onJoinRoom(room);
        onClose();
      }, 800);
    } catch (err) {
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  const isAlreadyMember = (room) =>
    room.members?.includes(userProfile?.uid);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal room-search-modal anim-slide-up">
        <div className="modal-header">
          <span className="modal-title">🔍 Find Rooms</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Search Input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              placeholder="Search public rooms by name…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" style={{ padding: "8px 16px" }} onClick={handleSearch} disabled={loading}>
              {loading ? "…" : "Search"}
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
            🔒 Private rooms are invite-only and won't appear here.
          </p>

          {/* Results */}
          {results.length === 0 && !loading && searchTerm && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "24px 0" }}>
              No public rooms found for "{searchTerm}"
            </div>
          )}

          <div className="room-search-results">
            {results.map((room) => (
              <button
                key={room.id}
                className="room-search-item"
                onClick={() => { setSelectedRoom(room); setJoined(false); }}
              >
                <div className="room-search-icon">#</div>
                <div className="room-search-info">
                  <div className="room-search-name">{room.name}</div>
                  <div className="room-search-meta">
                    {room.members?.length || 0} members
                    {isAlreadyMember(room) && <span className="member-tag you" style={{ marginLeft: 6 }}>Joined</span>}
                  </div>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: 18 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Room Profile Preview Modal */}
      {selectedRoom && (
        <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => e.target === e.currentTarget && setSelectedRoom(null)}>
          <div className="modal room-preview-modal anim-pop-in">
            <div className="modal-header">
              <span className="modal-title"># {selectedRoom.name}</span>
              <button className="btn-icon" onClick={() => setSelectedRoom(null)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Room Avatar */}
              <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
                <div style={{
                  width: 72, height: 72, borderRadius: "var(--radius-lg)",
                  background: "var(--color-surface3)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 32, margin: "0 auto 12px",
                  border: "2px solid var(--color-border)"
                }}>#</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700 }}>
                  {selectedRoom.name}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
                  Public Room · {selectedRoom.members?.length || 0} members
                </div>
              </div>

              {/* Info rows */}
              <div className="room-preview-info">
                <div className="room-preview-row">
                  <span className="room-preview-label">Type</span>
                  <span className="room-badge public"># Public</span>
                </div>
                <div className="room-preview-row">
                  <span className="room-preview-label">Members</span>
                  <span>{selectedRoom.members?.length || 0} people</span>
                </div>
                <div className="room-preview-row">
                  <span className="room-preview-label">History</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
                    Visible after joining
                  </span>
                </div>
              </div>

              {joined && (
                <p style={{ textAlign: "center", color: "var(--color-green)", fontWeight: 500 }}>
                  ✓ Joined! Entering room…
                </p>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button className="btn btn-ghost" onClick={() => setSelectedRoom(null)}>
                Cancel
              </button>
              {isAlreadyMember(selectedRoom) ? (
                <button className="btn btn-primary" onClick={() => { onJoinRoom(selectedRoom); onClose(); }}>
                  Open Room →
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => handleJoin(selectedRoom)} disabled={joining || joined}>
                  {joining ? "Joining…" : joined ? "✓ Joined!" : "Join Room"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}