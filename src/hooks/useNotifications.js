// src/hooks/useNotifications.js
import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc } from "firebase/firestore";
import { messaging, db } from "../firebase/config";

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

export const useNotifications = (userId) => {
  useEffect(() => {
    if (!userId || !messaging) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (token) {
          // Save FCM token to user's Firestore doc
          await updateDoc(doc(db, "users", userId), { fcmToken: token });
        }
      } catch (err) {
        console.warn("Notification permission denied or unsupported:", err);
      }
    };

    requestPermission();

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/logo192.png",
        });
      }
    });

    return () => unsubscribe();
  }, [userId]);
};

/** Show a local notification (for messages from other users in current session) */
export const showLocalNotification = (senderName, message, roomName) => {
  if (Notification.permission !== "granted") return;
  new Notification(`${senderName} in #${roomName}`, {
    body: message.length > 80 ? message.slice(0, 80) + "…" : message,
    icon: "/logo192.png",
  });
};
