# Lumi Firebase setup

Lumi's supported core workflows use Firebase Authentication and **Realtime Database** on the current free plan. Publishing uses text and external HTTPS links; the web app does not upload files or require Firebase Storage. The app currently has no Firestore record reads or writes. `/community` requires sign-in and stores each account's private servers and messages at `userCommunities/{uid}`. The old `/demo` URL redirects there.

## Correct project and current status

The intended Firebase project is `lumi-f0d6b` and its Realtime Database URL is `https://lumi-f0d6b-default-rtdb.firebaseio.com`. On 16 October 2026, the project owner's Firebase CLI account created the `Lumi Web` app, retrieved its SDK configuration, and published `database.rules.json` to the active Realtime Database. An unauthenticated read of `publicProfiles` returned 200; an unauthenticated read of `privateProfiles` returned 401, as intended.

The verified web configuration is in ignored `.env.local` and the seven matching public Vercel variables for Production and Preview. The production URL is `https://lumi-maxmax.vercel.app/`. On 16 October 2026, the owner-authorized CLI enabled Email/Password and Google Auth and published the updated Realtime Database rules. A live temporary-account smoke test passed sign-up, link-only project publishing, public reading, cross-user write denial, and cleanup. The public Google Auth endpoint returned a sign-in URL for the production domain; full Google popup login still needs browser verification. Firebase Storage is not set up and is not needed for supported workflows. A new bucket would require the pay-as-you-go Blaze plan, which this project must not enable.

## Web app configuration

In Firebase Console → Project settings → Your apps, register/select the Lumi **Web** app and copy the web configuration into `.env.local` for development and Vercel Project → Settings → Environment Variables for Production and Preview. Rebuild after changing any `NEXT_PUBLIC_` value.

Required names: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.

Optional: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (unused by the link-only app) and `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`. Curated YouTube embeds need no API key. Firebase Web SDK identifiers are public client configuration; Admin service-account JSON and private server keys must never be placed in `NEXT_PUBLIC_` variables or committed to Git.

## Lumi AI on the $0 plan

The floating student developer chat calls Ollama Cloud through the server-only `/api/ai/chat` route. It requires a signed-in Firebase user and a private `OLLAMA_API_KEY` set in local `.env.local` and the Vercel Production environment. Create a key in [Ollama settings](https://ollama.com/settings/keys), then set the Vercel variable and redeploy. Never put the key in a `NEXT_PUBLIC_` variable, browser form, or Git. `OLLAMA_MODEL` is optional and defaults to `gemma4:31b`; choose a model included in Ollama's Free starter allowance. Chat history is held only in the open browser tab. The route limits prompt size and message length and gives a visible error when no key, quota, or service is available. Do not buy usage credits or enable automatic payments for Lumi. Ollama's Free allowance is limited and may change; check [official pricing](https://ollama.com/pricing) before enabling the chat for a large audience.

`lib/firebase.ts` checks that the database URL, Auth domain, sender ID, app ID, and any optional Storage bucket are internally consistent with the selected project. The application will fail initialization with an actionable missing/mismatch message until all required values are configured.

## Console steps

1. **Realtime Database:** `database.rules.json` is published to the instance above. For later updates, run `npx firebase deploy --only database --project lumi-f0d6b --account multimax305@gmail.com` from the repository. Do not replace it with a root-level public read/write rule.
2. **Authentication:** `firebase deploy --only auth --project lumi-f0d6b --account multimax305@gmail.com` enabled Email/Password and Google with the Lumi brand and project-owner support email. Firebase Authentication now authorizes `lumi-maxmax.vercel.app`, alongside the default Firebase domains, for Google sign-in. Email/Password registration was tested live.
3. **Storage:** Leave Cloud Storage unconfigured. Its bucket requires Blaze and the supported Lumi workflows use URLs instead. The retained `storage.rules` are not deployed or needed by the app.
4. **Vercel:** The new project's seven web config values are set for Production and Preview. Redeploy after any later `NEXT_PUBLIC_` update. A Git push alone will not update an existing deployment's embedded client configuration.

## Rules model

Public discovery reads exist only at `publicProfiles`, `community/posts`, `hackathon/projects`, `hackathon/teams`, `hackathon/discoverableStudents`, `hackathon/servers`, stories, and follow lists. Private profiles, personal communities, team requests, notifications, and direct messages require the relevant authenticated user. Writes tie owner/author IDs to `auth.uid`; team owners approve a pending request before adding a member; server messages require membership. Rules validate the fields and sizes needed by current client flows. Storage accepts only owner-path image/video uploads of supported MIME types and bounded sizes, with overwrite and delete denied. Firebase Storage metadata can still be spoofed by a malicious client; scanning real file bytes would require a trusted backend or post-upload moderation.

Notifications are client-originated. Their `senderId` is now bound to `auth.uid`, but an authenticated account can still send unwanted notifications to another user. Before a large public launch, move cross-user notification creation to a trusted backend with rate limits and event verification. User-generated content also needs moderation.

Realtime Database rules cannot count children, so they cannot enforce `maxMembers` for teams. The current client checks capacity for normal use, but a malicious client or concurrent approvals can exceed it. A trusted server transaction is needed before treating team capacity as a hard limit. The same applies to profile skill and featured-project count limits; the rules validate individual values, while the UI enforces list length.

## Verification after configuration

1. Run `npm run test:rules`, `npx tsc --noEmit`, and `npm run build`. The rules tests run only against local `demo-lumi-rules` emulators; they cannot modify production.
2. With two **real** accounts, register via Email/Password, sign out/in, refresh to check persistence, and test Google sign-in. Confirm each account's `publicProfiles/{uid}` entry and that a user cannot edit the other's profile.
3. Publish a post, project, and team with account A. Have B view public content, react/comment, request to join A's team, and join a server. Confirm B cannot impersonate A or add themselves to A's team without approval. Test direct-message access with a third account.
4. Run `./tests/live-firebase-smoke.ps1` with the owner-authorized test plan to verify real link-only publishing, public reads, and cross-user denial. It creates and removes temporary Auth users and a project. Verify a user-facing post, story, and avatar URL in a browser. Direct file uploads should clearly say they are unavailable.
5. Open `/community` while signed out and confirm its contents are hidden. Sign in with two accounts and verify each sees only their own server notes. Confirm the starter servers show Lumi Dev as owner and a profile with username `@raj` sees `Raj Community`. The old `/demo` URL should redirect to `/community`.

**Common errors:** A rules-based permission denial indicates an unauthorized path, missing Auth session, or a rule/data mismatch. `auth/unauthorized-domain` means the Vercel hostname is absent from authorized domains. `CONFIGURATION_NOT_FOUND` means Auth has not been initialized for the project. Build-time Firebase config errors name missing or mismatched web app settings; do not bypass them with placeholders.
