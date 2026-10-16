"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "firebase/auth";
import { Loader2, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase";
import { createUserProfileIfMissing, ensureUserProfile } from "@/lib/social-firebase";
import { firebaseErrorMessage } from "@/lib/firebase-errors";

export type LumiViewer = {
  id: string;
  name: string;
  avatar: string;
  username?: string;
};

type AuthUserShape = {
  uid?: string;
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
};

const avatarSeeds = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=LumiOne",
  "https://api.dicebear.com/9.x/notionists/svg?seed=LumiTwo",
  "https://api.dicebear.com/9.x/notionists/svg?seed=LumiThree",
  "https://api.dicebear.com/9.x/notionists/svg?seed=LumiFour"
];

function buildGuestProfile(uid: string) {
  const suffix = uid.slice(0, 4).toUpperCase();
  return {
    name: `Lumi Guest ${suffix}`,
    avatar: avatarSeeds[uid.charCodeAt(0) % avatarSeeds.length]
  };
}

export default function AuthPanel({
  isFocusMode = false,
  onViewerChange
}: {
  isFocusMode?: boolean;
  onViewerChange: (viewer: LumiViewer | null) => void;
}) {
  const [viewer, setViewer] = useState<LumiViewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("Sign in to post, follow, and chat.");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIsLoading(false);
      setStatus("Sign-in is taking too long. Please try again.");
    }, 10000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (user: AuthUserShape | null) => {
        if (!user?.uid) {
          setViewer(null);
          onViewerChange(null);
          setIsLoading(false);
          window.clearTimeout(timeout);
          return;
        }

        const nextViewer = {
          id: user.uid,
          name: user.displayName ?? buildGuestProfile(user.uid).name,
          avatar: user.photoURL ?? buildGuestProfile(user.uid).avatar,
          username: user.email ? `@${user.email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase()}` : undefined
        };

        // Email signup fires this callback before the chosen display name is saved.
        if (user.displayName || !user.email) {
          void createUserProfileIfMissing({
            id: nextViewer.id,
            name: nextViewer.name,
            avatar: nextViewer.avatar,
            username: nextViewer.username
          }).then(() => setStatus("Signed in and ready."))
            .catch((error: unknown) => setStatus(firebaseErrorMessage(error, "Saving your profile")));
        } else {
          setStatus("Signed in. Finish your account profile to publish.");
        }

        setViewer(nextViewer);
        onViewerChange(nextViewer);
        if (user.displayName || !user.email) setStatus("Checking your Lumi profile...");
        setIsLoading(false);
        window.clearTimeout(timeout);
      },
      (error: unknown) => {
        setViewer(null);
        onViewerChange(null);
        setStatus(firebaseErrorMessage(error, "Sign-in"));
        setIsLoading(false);
        window.clearTimeout(timeout);
      }
    );

    return () => {
      window.clearTimeout(timeout);
      unsubscribe();
    };
  }, [onViewerChange]);

  async function handleGoogleSignIn() {
    setIsLoading(true);
    setStatus("Opening Google sign-in...");
    try {
      const provider = new GoogleAuthProvider();
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, provider);
    } catch (error) {
      setStatus(firebaseErrorMessage(error, "Google sign-in"));
      setIsLoading(false);
    }
  }

  async function handleEmailSignIn() {
    if (!email.trim() || password.length < 6 || (creatingAccount && !displayName.trim())) {
      setStatus("Enter an email, a password of at least 6 characters, and a name for a new account.");
      return;
    }
    setIsLoading(true);
    setStatus(creatingAccount ? "Creating account..." : "Signing in...");
    let accountCreated = false;
    try {
      await setPersistence(auth, browserLocalPersistence);
      if (creatingAccount) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        accountCreated = true;
        await updateProfile(credential.user, {
          displayName: displayName.trim(),
          photoURL: buildGuestProfile(credential.user.uid).avatar
        });
        // Persist the chosen name after Auth has finished creating the account.
        await ensureUserProfile({
          id: credential.user.uid,
          name: displayName.trim(),
          avatar: buildGuestProfile(credential.user.uid).avatar,
          username: `@${email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase()}`
        });
        const nextViewer = {
          id: credential.user.uid,
          name: displayName.trim(),
          avatar: buildGuestProfile(credential.user.uid).avatar,
          username: `@${email.split("@")[0].replace(/[^a-z0-9_]/gi, "").toLowerCase()}`
        };
        setViewer(nextViewer);
        onViewerChange(nextViewer);
        setStatus("Signed in and ready.");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      setStatus(accountCreated ? `Account created, but ${firebaseErrorMessage(error, "Saving your profile").toLowerCase()}` : firebaseErrorMessage(error, creatingAccount ? "Registration" : "Sign-in"));
      setIsLoading(false);
    }
  }

  async function handleSignOut() {
    try { await signOut(auth); setStatus("Signed out."); }
    catch (error) { setStatus(firebaseErrorMessage(error, "Sign-out")); }
  }

  return (
    <section className={`rounded-[24px] border p-4 ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-zinc-950"}`}>
      {isLoading ? (
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-lumi-purple" />
          <p className={isFocusMode ? "text-sm text-slate-500" : "text-sm text-white/60"}>{status}</p>
        </div>
      ) : viewer ? (
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full">
            <Image src={viewer.avatar} alt={viewer.name} fill unoptimized className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`truncate font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>{viewer.name}</p>
            <p className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>@{viewer.id.slice(0, 8)}</p>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs ${
              isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/75"
            }`}
          >
            <LogOut className="h-3.5 w-3.5" />
            Log out
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <p className={`font-semibold ${isFocusMode ? "text-slate-900" : "text-white"}`}>Welcome to Lumi</p>
            <p className={isFocusMode ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-white/60"}>{status}</p>
          </div>
          <div className="space-y-2">
            {creatingAccount ? <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" aria-label="Your name" className={`w-full rounded-xl border px-3 py-2 text-sm ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-black/20"}`} /> : null}
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" aria-label="Email" className={`w-full rounded-xl border px-3 py-2 text-sm ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-black/20"}`} />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" aria-label="Password" className={`w-full rounded-xl border px-3 py-2 text-sm ${isFocusMode ? "border-slate-200 bg-white" : "border-white/10 bg-black/20"}`} />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => void handleEmailSignIn()} className="rounded-full bg-lumi-purple px-4 py-2 text-sm font-medium text-white">{creatingAccount ? "Create account" : "Sign in"}</button>
            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              className={`rounded-full px-4 py-2 text-sm ${isFocusMode ? "bg-slate-100 text-slate-700" : "bg-white/10 text-white/80"}`}
            >
              Continue with Google
            </button>
          </div>
          <button type="button" onClick={() => setCreatingAccount((current) => !current)} className="text-sm text-lumi-purple">{creatingAccount ? "Already have an account? Sign in" : "New to Lumi? Create an account"}</button>
          <p className={isFocusMode ? "text-xs text-slate-500" : "text-xs text-white/55"}>If sign-in is unavailable, please try again shortly.</p>
        </div>
      )}
      {viewer && !isLoading && status !== "Signed in and ready." && status !== "Signed out." ? <p role="status" className="mt-3 text-sm text-amber-500">{status}</p> : null}
    </section>
  );
}
