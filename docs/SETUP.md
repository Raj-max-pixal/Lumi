# Lumi Firebase setup

Lumi uses Firebase Authentication, **Realtime Database**, and Cloud Storage for Firebase. The app currently has no Firestore record reads or writes. The separate `/demo` route uses fictional browser-local data only.

## Correct project and current status

The intended Firebase project is `lumi-f0d6b` and its Realtime Database URL is `https://lumi-f0d6b-default-rtdb.firebaseio.com`. On 16 October 2026, the project owner's Firebase CLI account created the `Lumi Web` app, retrieved its SDK configuration, and published `database.rules.json` to the active Realtime Database. An unauthenticated read of `publicProfiles` returned 200; an unauthenticated read of `privateProfiles` returned 401, as intended.

The verified web configuration is in ignored `.env.local` and the seven matching public Vercel variables for Production and Preview. The public Vercel deployment is live at `https://lumi-maxmax.vercel.app/`. Cloud Storage rules are **not yet published**: Firebase reports that Storage has not been set up for this project. New Cloud Storage buckets require the pay-as-you-go Blaze plan, so the owner must decide whether to enable billing before creating one. Open Build → Storage → Get Started in Firebase Console, create the bucket, then publish `storage.rules` before testing uploads. Authentication providers and authorized domains still need Console verification. On 16 October, Firebase Console itself failed to load its terms-of-service acceptance status in this browser, so the setup could not be completed here.

## Web app configuration

In Firebase Console → Project settings → Your apps, register/select the Lumi **Web** app and copy the web configuration into `.env.local` for development and Vercel Project → Settings → Environment Variables for Production and Preview. Rebuild after changing any `NEXT_PUBLIC_` value.

Required names: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.

Optional: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Server-only optional: `YOUTUBE_API_KEY` for developer video discovery. Firebase Web SDK identifiers are public client configuration; Admin service-account JSON and private server keys must never be placed in `NEXT_PUBLIC_` variables or committed to Git.

`lib/firebase.ts` checks that the database URL, Auth domain, Storage bucket, sender ID, and app ID are internally consistent with the selected project. Only Firebase Console can confirm that the API key and web app actually belong to that project. The application will fail initialization with an actionable missing/mismatch message until all required values are configured.

## Console steps

1. **Realtime Database:** `database.rules.json` is published to the instance above. For later updates, run `npx firebase deploy --only database --project lumi-f0d6b --account multimax305@gmail.com` from the repository. Do not replace it with a root-level public read/write rule.
2. **Authentication:** In Build → Authentication → Sign-in method, enable Email/Password and Google. In Authentication → Settings → Authorized domains, add `lumi-maxmax.vercel.app` and any preview domain used for login testing. Configure Google's project support email if Console requests it.
3. **Storage:** In Build → Storage, create/activate the bucket for `lumi-f0d6b` if none exists. Copy its exact bucket name into `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`; do not infer the suffix. Review and publish the repository's `storage.rules` in Storage → Rules, or run `npx firebase deploy --only storage --project lumi-f0d6b` after CLI access is granted. If Console asks for billing or other activation, complete that exact Console step first.
4. **Vercel:** The new project's seven web config values are set for Production and Preview. Redeploy after any later `NEXT_PUBLIC_` update. A Git push alone will not update an existing deployment's embedded client configuration.

## Rules model

Public discovery reads exist only at `publicProfiles`, `community/posts`, `hackathon/projects`, `hackathon/teams`, `hackathon/discoverableStudents`, `hackathon/servers`, stories, and follow lists. Private profiles, team requests, notifications, and direct messages require the relevant authenticated user. Writes tie owner/author IDs to `auth.uid`; team owners approve a pending request before adding a member; server messages require membership. Rules validate the fields and sizes needed by current client flows. Storage accepts only owner-path image/video uploads of supported MIME types and bounded sizes, with overwrite and delete denied. Firebase Storage metadata can still be spoofed by a malicious client; scanning real file bytes would require a trusted backend or post-upload moderation.

Notifications are client-originated. Their `senderId` is now bound to `auth.uid`, but an authenticated account can still send unwanted notifications to another user. Before a large public launch, move cross-user notification creation to a trusted backend with rate limits and event verification. User-generated content also needs moderation.

Realtime Database rules cannot count children, so they cannot enforce `maxMembers` for teams. The current client checks capacity for normal use, but a malicious client or concurrent approvals can exceed it. A trusted server transaction is needed before treating team capacity as a hard limit. The same applies to profile skill and featured-project count limits; the rules validate individual values, while the UI enforces list length.

## Verification after configuration

1. Run `npm run test:rules`, `npx tsc --noEmit`, and `npm run build`. The rules tests run only against local `demo-lumi-rules` emulators; they cannot modify production.
2. With two **real** accounts, register via Email/Password, sign out/in, refresh to check persistence, and test Google sign-in. Confirm each account's `publicProfiles/{uid}` entry and that a user cannot edit the other's profile.
3. Publish a post, project, and team with account A. Have B view public content, react/comment, request to join A's team, and join a server. Confirm B cannot impersonate A or add themselves to A's team without approval. Test direct-message access with a third account.
4. Upload an allowed JPEG and MP4; reject an SVG and an oversized file. Confirm an account cannot write to another account's Storage path or overwrite an existing file.
5. Confirm `/demo` remains labeled fictional, writes only to that browser's localStorage, and creates no Firebase records. Simulate an unavailable database and verify the real pages show errors with a labeled demo link.

**Common errors:** `401 Permission denied` on the new database before rules are published is expected under the locked rules. A rules-based permission denial after publication indicates an unauthorized path, missing Auth session, or a rule/data mismatch. `auth/unauthorized-domain` means the Vercel hostname is absent from authorized domains. Storage 404/permission errors require checking bucket creation, the exact bucket name, activation, and published rules. Build-time Firebase config errors name missing or mismatched web app settings; do not bypass them with placeholders.
