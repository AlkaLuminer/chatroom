// src/firebase/firestore.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "./config";

// ══════════════════════════════════════════════════════════════════════════════
// ROOMS
// ══════════════════════════════════════════════════════════════════════════════

/** Create a new room (public or private) */
export const createRoom = async (name, type, creatorId, members = []) => {
  const roomRef = await addDoc(collection(db, "rooms"), {
    name,
    type, // "public" | "private"
    createdBy: creatorId,
    members: [creatorId, ...members],
    admins: [creatorId],
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageAt: serverTimestamp(),
  });
  return roomRef.id;
};

/** Get all public rooms */
export const getPublicRooms = (callback) => {
  const q = query(collection(db, "rooms"), where("type", "==", "public"), orderBy("lastMessageAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
};

/** Get rooms for a specific user (all joined rooms, public + private) */
export const getUserRooms = (userId, callback) => {
  const q = query(
    collection(db, "rooms"),
    where("members", "array-contains", userId)
  );
  return onSnapshot(q, (snap) => {
    const rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    rooms.sort((a, b) => {
      const aTime = a.lastMessageAt && a.lastMessageAt.toMillis ? a.lastMessageAt.toMillis() : 0;
      const bTime = b.lastMessageAt && b.lastMessageAt.toMillis ? b.lastMessageAt.toMillis() : 0;
      return bTime - aTime;
    });
    callback(rooms);
  }, (err) => {
    console.error("getUserRooms error:", err);
    callback([]);
  });
};

/** Add a member to a room */
export const addMemberToRoom = (roomId, userId) =>
  updateDoc(doc(db, "rooms", roomId), { members: arrayUnion(userId) });

/** Remove a member from a room */
export const removeMemberFromRoom = (roomId, userId) =>
  updateDoc(doc(db, "rooms", roomId), { members: arrayRemove(userId) });

// ══════════════════════════════════════════════════════════════════════════════
// MESSAGES
// ══════════════════════════════════════════════════════════════════════════════

/** Send a message */
export const sendMessage = async (roomId, senderId, senderName, senderPhoto, content, type = "text") => {
  const msgRef = await addDoc(collection(db, "rooms", roomId, "messages"), {
    senderId,
    senderName,
    senderPhoto,
    content,
    type, // "text" | "image" | "emoji"
    createdAt: serverTimestamp(),
    editedAt: null,
    deleted: false,
  });
  // update room's lastMessage
  await updateDoc(doc(db, "rooms", roomId), {
    lastMessage: type === "image" ? "📷 Image" : content,
    lastMessageAt: serverTimestamp(),
  });
  return msgRef.id;
};

/** Edit a message */
export const editMessage = (roomId, messageId, newContent) =>
  updateDoc(doc(db, "rooms", roomId, "messages", messageId), {
    content: newContent,
    editedAt: serverTimestamp(),
  });

/** Unsend (soft-delete) a message */
export const unsendMessage = (roomId, messageId) =>
  updateDoc(doc(db, "rooms", roomId, "messages", messageId), {
    deleted: true,
    content: "",
  });

/** Listen to messages in real-time */
export const listenToMessages = (roomId, callback) => {
  const q = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

/** Search messages in a room */
export const searchMessages = async (roomId, searchTerm) => {
  const snap = await getDocs(
    query(collection(db, "rooms", roomId, "messages"), orderBy("createdAt", "desc"))
  );
  const term = searchTerm.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((m) => !m.deleted && m.content?.toLowerCase().includes(term));
};

// ══════════════════════════════════════════════════════════════════════════════
// USERS / PROFILE
// ══════════════════════════════════════════════════════════════════════════════

/** Get a user by uid */
export const getUserById = async (uid) => {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/** Update user profile */
export const updateUserProfile = (uid, data) =>
  updateDoc(doc(db, "users", uid), { ...data });

/** Search users by display name */
export const searchUsers = async (term) => {
  const snap = await getDocs(collection(db, "users"));
  const lower = term.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((u) => u.displayName?.toLowerCase().includes(lower) || u.email?.toLowerCase().includes(lower));
};

// ══════════════════════════════════════════════════════════════════════════════
// BLOCK / UNBLOCK
// ══════════════════════════════════════════════════════════════════════════════

export const blockUser = (currentUid, targetUid) =>
  updateDoc(doc(db, "users", currentUid), { blockedUsers: arrayUnion(targetUid) });

export const unblockUser = (currentUid, targetUid) =>
  updateDoc(doc(db, "users", currentUid), { blockedUsers: arrayRemove(targetUid) });
