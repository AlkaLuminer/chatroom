// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Listen to Firestore user doc in real-time
      const unsubProfile = onSnapshot(doc(db, "users", user.uid), (snap) => {
        if (snap.exists()) {
          setUserProfile({ id: snap.id, ...snap.data() });
        }
        setLoading(false);
      });

      // Update lastSeen
      updateDoc(doc(db, "users", user.uid), { lastSeen: serverTimestamp() }).catch(() => {});

      return () => unsubProfile();
    });

    return () => unsubAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
