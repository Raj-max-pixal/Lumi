import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';
import { auth, realtimeDb } from '../config/firebase';
import type { LumiUser, FirebaseProfile } from '../types';

type AuthContextType = {
  user: LumiUser | null;
  profile: FirebaseProfile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LumiUser | null>(null);
  const [profile, setProfile] = useState<FirebaseProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const lumiUser: LumiUser = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Lumi Dev',
          avatar:
            firebaseUser.photoURL ||
            `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(firebaseUser.uid)}`,
          username: firebaseUser.email
            ? `@${firebaseUser.email.split('@')[0].replace(/[^a-z0-9_]/gi, '').toLowerCase()}`
            : undefined,
          email: firebaseUser.email || undefined,
        };
        setUser(lumiUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const profileRef = ref(realtimeDb, `publicProfiles/${user.id}`);
    const unsub = onValue(profileRef, (snap) => {
      const val = snap.val() as Omit<FirebaseProfile, 'id'> | null;
      if (val) {
        setProfile({ id: user.id, ...val });
      }
    });
    return () => unsub();
  }, [user?.id]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
