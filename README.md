# 🔥 FireChat — Real-Time Chatroom App

A full-featured real-time chat application built with **React + Firebase**.

> **Live Demo:** https://chatroom-c3533.web.app/

---

## ✨ Features

### 🔐 Authentication
- **Email Sign Up / Sign In** — Register and log in with email and password
- **Google OAuth Login** — One-click sign in with your Google account

### 💬 Chatrooms
- **Create Public Rooms** — Anyone can search and join
- **Create Private Rooms** — Invite-only, hidden from search results
- **Switch Between Rooms** — All joined rooms shown in the left sidebar
- **Message History** — Full chat history loaded when entering a room
- **Invite / Add Members** — Search users by name or email and add them
- **Room Info Panel** — View members, invite new people, remove members (admin only)

### 💌 Messages
- **Send Text Messages** — Press Enter or click the send button
- **Send Images** — Click 🖼️ to upload and send photos
- **Send Emojis** — Click 😊 to open the emoji picker
- **Edit Messages** — Right-click your own message to edit
- **Unsend Messages** — Right-click your own message → Unsend
- **Search Messages** — Click 🔍 in the chat header to search within a room
- **Reply to Messages** — Right-click any message → Reply
- **Emoji Reactions** — Right-click any message → React (❤️ 😂 😮 😢 😡 👍)
- **Image Lightbox** — Click any image to view it fullscreen

### 👤 Profile
- **Edit Display Name** — Works for both email and Google accounts
- **Custom Display Email** — Set a public-facing email shown to other members
- **Profile Photo** — Upload and change your avatar
- **Phone Number, Birthday, Address, Bio** — Optional personal info
- **View Other Members' Profiles** — Click any member in Room Info to see their profile

### 🔔 Notifications
- **Chrome Push Notifications** — Get notified when someone messages while window is not focused

### 🚫 User Management
- **Block Users** — Hide messages from specific users
- **Unblock Users** — Restore visibility from member profile or Room Info

### 📱 Responsive Design
- Adapts to desktop, tablet, and mobile
- Sidebar collapses on mobile with hamburger menu

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React 18 |
| Database | Firebase Firestore (real-time) |
| Authentication | Firebase Auth (Email + Google) |
| Image Storage | Base64 compression stored in Firestore |
| Notifications | Firebase Cloud Messaging |
| Hosting | Firebase Hosting |
| Emoji Picker | emoji-picker-react |

---

## 🚀 Local Setup — Step by Step

### Prerequisites
- [Node.js](https://nodejs.org/) v16 or higher
- [Git](https://git-scm.com/)

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/AlkaLuminer/chatroom.git
cd YOUR_REPO_NAME/chatroom
```

---

### Step 2 — Install dependencies

```bash
npm install
```

---

### Step 3 — Create the environment variables file

Create a file named **`.env.local`** in the project root (same folder as `package.json`):

```
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=chatroom-c3533.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=chatroom-c3533
REACT_APP_FIREBASE_STORAGE_BUCKET=chatroom-c3533.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here
```

> ⚠️ **Important:** This file is excluded from Git (`.gitignore`) to protect API keys.
> You must create it manually every time you clone the project.
> Get the values from: Firebase Console → ⚙️ Project Settings → Your Apps → Web App

---

### Step 4 — Start the development server

```bash
npm start
```

The app opens automatically at **http://localhost:3000**

---

### Step 5 — (Optional) Deploy to Firebase Hosting

```bash
npm run build
firebase deploy
```

---

## 📖 How to Use

### Register / Login
1. Open the app at `http://localhost:3000` or `https://chatroom-c3533.web.app/`
2. Click **"Create Account"** to register with email and password, or click **"Google"** to sign in with Google

### Create a Chatroom
1. Click the ✏️ icon in the top-left sidebar
2. Enter a room name and choose **Public** or **Private**
3. Optionally search for and invite members, then click **"Create Room"**

### Find and Join a Room
1. Click the 🔍 icon in the top-left sidebar
2. Type a room name → click a result to preview it → click **"Join Room"**

### Send Messages
- Type in the input box and press **Enter** to send
- Click 😊 for emoji picker, click 🖼️ to send an image

### Reply to a Message
1. Right-click any message → **↩ Reply**
2. A preview bar appears above the input — type your reply and press Enter
3. Click the quoted preview in a message to scroll to the original

### React to a Message
1. Right-click any message → **😊 React**
2. Choose from ❤️ 😂 😮 😢 😡 👍 — click again to remove your reaction

### Edit or Unsend Your Message
- Right-click your own message → **✏️ Edit** or **🗑 Unsend**

### Edit Your Profile
1. Click your name/avatar in the bottom-left corner
2. Update display name, photo, email, phone, birthday, address, bio
3. Click **"Save Changes"**

### View a Member's Profile
1. Click ℹ️ in the chat header to open Room Info
2. Click any member's avatar or name

### Block / Unblock a User
1. Open Room Info (ℹ️) → click a member → **"Block User"**
2. To unblock: same steps → **"Unblock"**

---

## 📁 Project Structure

```
src/
├── firebase/
│   ├── config.js              # Firebase initialization
│   ├── auth.js                # Authentication functions
│   ├── firestore.js           # Database functions
│   └── storage.js             # Image compression
├── context/
│   └── AuthContext.jsx        # Global auth state
├── hooks/
│   └── useNotifications.js    # Push notifications
├── components/
│   ├── Auth/AuthPage.jsx
│   ├── Sidebar/
│   │   ├── Sidebar.jsx
│   │   ├── CreateRoomModal.jsx
│   │   └── RoomSearch.jsx
│   ├── Chat/
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   └── RoomInfoPanel.jsx
│   ├── Profile/
│   │   ├── ProfileModal.jsx
│   │   └── MemberProfileModal.jsx
│   └── Shared/ImageLightbox.jsx
└── styles/
    ├── globals.css
    ├── animations.css
    └── variables.css
```