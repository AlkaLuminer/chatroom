// src/firebase/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, googleProvider, db } from "./config";

// ─── Email Sign Up ────────────────────────────────────────────────────────────
export const registerWithEmail = async (email, password, displayName) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await createUserDocument(result.user, { displayName });
  return result.user;
};

// ─── Email Login ──────────────────────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// ─── Google Login ─────────────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const existingDoc = await getDoc(doc(db, "users", user.uid));
  if (!existingDoc.exists()) {
    await createUserDocument(user, {});
  }
  return user;
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const signOutUser = () => signOut(auth);

// ─── Password Reset ───────────────────────────────────────────────────────────
export const sendPasswordReset = (email) => sendPasswordResetEmail(auth, email);

// ─── Create User Document in Firestore ───────────────────────────────────────
export const createUserDocument = async (user, extraData) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      uid:          user.uid,
      email:        user.email,
      displayName:  user.displayName || extraData.displayName || "",
      displayEmail: "",
      photoURL:     user.photoURL || "",
      phoneNumber:  "",
      address:      "",
      birthday:     "",
      bio:          "",
      blockedUsers: [],
      createdAt:    serverTimestamp(),
      lastSeen:     serverTimestamp(),
      ...extraData,
    },
    { merge: true }
  );
};
