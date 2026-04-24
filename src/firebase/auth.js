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
export const signUpWithEmail = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName });
  await createUserDocument(userCredential.user, { displayName });
  return userCredential.user;
};

// ─── Email Login ──────────────────────────────────────────────────────────────
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

// ─── Google Login ─────────────────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  const user = userCredential.user;
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    await createUserDocument(user, {});
  }
  return user;
};

// ─── Sign Out ─────────────────────────────────────────────────────────────────
export const logout = () => signOut(auth);

// ─── Password Reset ───────────────────────────────────────────────────────────
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// ─── Create/Update User Document in Firestore ─────────────────────────────────
export const createUserDocument = async (user, extraData) => {
  const userRef = doc(db, "users", user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || extraData.displayName || "",
      photoURL: user.photoURL || "",
      phoneNumber: "",
      address: "",
      birthday: "",
      bio: "",
      blockedUsers: [],
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      ...extraData,
    },
    { merge: true }
  );
};
