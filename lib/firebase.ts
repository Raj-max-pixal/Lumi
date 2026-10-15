import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Public Firebase web identifiers only. Admin SDK credentials never belong here.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const required = {
  NEXT_PUBLIC_FIREBASE_API_KEY: firebaseConfig.apiKey,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: firebaseConfig.authDomain,
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: firebaseConfig.databaseURL,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: firebaseConfig.projectId,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: firebaseConfig.messagingSenderId,
  NEXT_PUBLIC_FIREBASE_APP_ID: firebaseConfig.appId
};
const missing = Object.entries(required)
  .filter(([, value]) => !value?.trim() || value.startsWith("your-"))
  .map(([key]) => key);
if (missing.length) {
  throw new Error(`Lumi Firebase configuration is missing: ${missing.join(", ")}. Set these public web app variables in .env.local and Vercel, then rebuild.`);
}
try {
  const url = new URL(firebaseConfig.databaseURL!);
  if (url.protocol !== "https:" || ![".firebasedatabase.app", ".firebaseio.com"].some((suffix) => url.hostname.endsWith(suffix)) || !url.hostname.startsWith(`${firebaseConfig.projectId}-`)) throw new Error("invalid endpoint");
} catch {
  throw new Error("NEXT_PUBLIC_FIREBASE_DATABASE_URL must be the HTTPS Realtime Database URL for NEXT_PUBLIC_FIREBASE_PROJECT_ID from Firebase Console.");
}
if (firebaseConfig.authDomain !== `${firebaseConfig.projectId}.firebaseapp.com` || (firebaseConfig.storageBucket && ![`${firebaseConfig.projectId}.appspot.com`, `${firebaseConfig.projectId}.firebasestorage.app`].includes(firebaseConfig.storageBucket))) {
  throw new Error("Firebase Auth domain or optional Storage bucket does not match NEXT_PUBLIC_FIREBASE_PROJECT_ID. Copy web app settings from the same Firebase project.");
}
if (!/^\d+$/.test(firebaseConfig.messagingSenderId ?? "") || !firebaseConfig.appId?.startsWith(`1:${firebaseConfig.messagingSenderId}:web:`)) {
  throw new Error("Firebase app ID and messaging sender ID do not match. Copy both from the same Firebase web app.");
}

const app = getApps().find((existing: { name: string }) => existing.name === "lumi") ?? initializeApp(firebaseConfig, "lumi");

export const auth = getAuth(app);
// Retained for compatibility; live app records currently use Realtime Database.
export const firestore = getFirestore(app);
export const realtimeDb = getDatabase(app);

export default app;
