# 🔥 FireChat — Real-Time Chatroom App

A full-featured real-time chat application built with **React + Firebase**.

## ✨ Features

| Feature | Status |
|---|---|
| Email Sign Up / Login | ✅ |
| Google OAuth Login | ✅ |
| Public & Private Chatrooms | ✅ |
| Switch Rooms / History Messages | ✅ |
| Add / Invite Members (like Messenger) | ✅ |
| Chrome Push Notifications | ✅ |
| Edit / View Profile (name, photo, phone, email, address, birthday) | ✅ |
| Send / Edit / Unsend / Search Messages | ✅ |
| Send / Unsend Images | ✅ |
| Emoji Picker | ✅ |
| Block Users | ✅ |
| Fully Responsive (mobile, tablet, desktop) | ✅ |
| CSS Animations & Transitions | ✅ |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password + Google
4. Enable **Firestore Database**
5. Enable **Storage**
6. Enable **Cloud Messaging** (for notifications)
7. Copy your config into `src/firebase/config.js`

### 3. Set up environment variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your Firebase credentials.

### 4. Run the app
```bash
npm start
```

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js          # Firebase initialization
│   ├── auth.js            # Auth helpers
│   ├── firestore.js       # Firestore helpers
│   └── storage.js         # Storage helpers
├── components/
│   ├── Auth/
│   │   ├── Login.jsx
│   │   └── Signup.jsx
│   ├── Chat/
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   └── EmojiPicker.jsx
│   ├── Sidebar/
│   │   ├── Sidebar.jsx
│   │   ├── RoomList.jsx
│   │   └── CreateRoom.jsx
│   ├── Profile/
│   │   └── ProfileModal.jsx
│   └── Shared/
│       ├── Avatar.jsx
│       └── Modal.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useMessages.js
│   ├── useRooms.js
│   └── useNotifications.js
├── context/
│   └── AuthContext.jsx
├── styles/
│   ├── globals.css
│   ├── animations.css
│   └── variables.css
└── App.jsx
```

---

## 🔒 Firestore Security Rules

See `firestore.rules` for production-ready rules.

---

## 📦 Deployment (GitHub Actions → Firebase Hosting)

Push to `main` branch triggers auto-deploy via `.github/workflows/deploy.yml`.

Setup:
1. `firebase init hosting`
2. Add `FIREBASE_SERVICE_ACCOUNT` secret to GitHub repo
3. Push to deploy!

---

## 🛠 Tech Stack

- **React 18** + React Router v6
- **Firebase 10** (Auth, Firestore, Storage, Messaging)
- **CSS Modules** + Custom Animations
- **emoji-picker-react** for emoji support
- **GitHub Actions** for CI/CD
