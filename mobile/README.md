# 📱 Lumi Mobile App

> **The social network for developers — now as a native mobile app.**

A full-featured React Native / Expo mobile app connected to the **same Firebase Realtime Database** as the Lumi web app. Sign in with the same account across web and mobile!

---

## 🚀 Features

| Screen | What it does |
|---|---|
| 🏠 **Home Feed** | Real-time community posts with likes, comments, saves, and stories |
| 🔍 **Explore** | Grid layout with search + category filters across all posts |
| ✨ **AI Lab** | 8 developer AI tools + chat assistant with 3 personality modes |
| 🚀 **Hackathon** | Browse & publish hackathon projects, filter by category/tech |
| 💬 **Chat** | Direct messages with any developer on Lumi |
| 👤 **Profile** | Edit bio, skills, portfolio links, view followers/following |
| 🎬 **Dev Clips** | TikTok-style vertical scrolling for video content |

---

## ⚡ Quick Start

### Prerequisites
- [Node.js](https://nodejs.org) v18+
- [Expo Go](https://expo.dev/go) app on your Android/iOS device

### Run the app

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

Then:
- **Android**: Scan the QR code with the **Expo Go** app
- **iOS**: Scan with your iPhone Camera app
- **Browser** (web preview): Press `w`

---

## 🏗️ Build for Production

### Android APK (no Google account needed)
```bash
npx expo run:android
```

### Using EAS Build (cloud builds)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## 📁 Project Structure

```
mobile/
├── App.tsx                   # Root component + navigation
├── index.js                  # Expo entry point
├── app.json                  # Expo config
├── babel.config.js           # Babel (required for Reanimated)
├── src/
│   ├── config/
│   │   ├── firebase.ts       # Firebase SDK (same project as web)
│   │   └── theme.ts          # Design tokens (colors, spacing, etc.)
│   ├── context/
│   │   └── AuthContext.tsx   # Firebase auth state (global)
│   ├── types/
│   │   └── index.ts          # Shared TypeScript types
│   ├── components/
│   │   ├── BottomTabBar.tsx  # Custom tab navigation
│   │   └── StoryViewer.tsx   # Full-screen story viewer
│   └── screens/
│       ├── HomeScreen.tsx    # Feed + stories + post composer
│       ├── ExploreScreen.tsx # Grid explore + search
│       ├── AILabScreen.tsx   # AI tools + chat assistant
│       ├── HackathonScreen.tsx # Project showcase + publish
│       ├── ChatScreen.tsx    # Direct messages
│       ├── ProfileScreen.tsx # User profile + edit
│       ├── DevClipsScreen.tsx # TikTok-style video feed
│       └── AuthScreen.tsx    # Sign in / Sign up
```

---

## 🔥 Firebase

The mobile app connects to the **same Firebase project** as the web app (`lumi-f0d6b`):
- **Auth**: Email/Password authentication (same accounts work on web + mobile)
- **Realtime Database**: Live updates for feed, chat, stories, and hackathon projects

---

## 🎨 Design

- **Color scheme**: Dark-first with purple + cyan accents
- **Typography**: System fonts with bold weight hierarchy
- **Animations**: Animated heart likes, story progress bars, smooth transitions
- **Layout**: Instagram-style feed, TikTok-style clips, LinkedIn-style profiles

---

*Built with ❤️ by the Lumi team — For developers, by developers.*
