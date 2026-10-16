import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Same Firebase project as the Lumi web app
const firebaseConfig = {
  apiKey: 'AIzaSyAUoEeTsZoaLCIxhEznEESHBGnepNSHdHw',
  authDomain: 'lumi-f0d6b.firebaseapp.com',
  databaseURL: 'https://lumi-f0d6b-default-rtdb.firebaseio.com',
  projectId: 'lumi-f0d6b',
  storageBucket: 'lumi-f0d6b.firebasestorage.app',
  messagingSenderId: '804571641219',
  appId: '1:804571641219:web:a44814252a52741d75b2b6',
};

// Singleton pattern — avoid duplicate app init on hot reload
const app =
  getApps().find((a) => a.name === 'lumi-mobile') ??
  initializeApp(firebaseConfig, 'lumi-mobile');

// Firebase v11 on React Native: initialize auth with in-memory persistence.
// AsyncStorage persistence can be added via a custom implementation when needed.
let _auth: ReturnType<typeof getAuth>;
try {
  _auth = initializeAuth(app);
} catch {
  // Already initialized (hot reload)
  _auth = getAuth(app);
}

export const auth = _auth;
export const realtimeDb = getDatabase(app);
export default app;
