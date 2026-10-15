# Lumi

Lumi is a Next.js social app with Firebase Authentication and Realtime Database. Projects, posts, stories, and avatars use external HTTPS media links, so supported workflows do not require Firebase Storage or billing. Content comes from user accounts; the app does not seed fake posts or conversations.

## Firebase setup

1. Use Firebase project `lumi-f0d6b` and Realtime Database `https://lumi-f0d6b-default-rtdb.firebaseio.com`.
2. Email/Password and Google providers are enabled with [firebase.json](firebase.json). Verify Google popup sign-in on the production hostname before relying on it.
3. Keep Cloud Storage unconfigured. Direct uploads are unavailable; use hosted image URLs and creator-hosted YouTube links.
4. Test [database.rules.json](database.rules.json) with `npm run test:rules` before publishing updates. Storage rules remain in the repository for reference but are not used by the app.
5. Set the public Firebase web variables in `.env.local` and Vercel. Never put private credentials in `NEXT_PUBLIC_` variables.

The live Vercel project `maxmax/lumi` has the new project's public Firebase variables for Production and Preview. Redeploy after changing them; a Git push does not replace stored Vercel environment values.

See [production setup and verification](docs/SETUP.md) for the required variables, exact Firebase Console steps, and two-account security checks. This app currently stores production records in Realtime Database, not Firestore.

## Develop

```bash
npm install
npm run dev
```

`npm run build` verifies the production bundle. Use `./tests/live-firebase-smoke.ps1` for a temporary real-account publishing and rules check; the script removes its test records and users.

## Data model

- `publicProfiles/{uid}`: display name, username, avatar, bio, city
- `privateProfiles/{uid}`: account settings
- `community/posts/{postId}`: posts, reels, comments, likes, saves
- `stories/{storyId}`: image stories with a 24-hour expiry timestamp
- `relationships/following` and `relationships/followers`: social graph
- `directMessages/{roomId}`: participant list and messages
- `notifications/{uid}`: per-user activity

Existing records under the old `profiles/{uid}/public` path need migration to `publicProfiles/{uid}` if that database contains previous user profiles. The migration should happen after the database is restored and its contents are inspected.
