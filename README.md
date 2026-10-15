# Lumi

Lumi is a Next.js social app with Firebase Authentication, Realtime Database, and Storage. The first working social layer includes accounts, profiles, posts, photo stories, video reels, follows, likes, saves, comments, notifications, and direct messages. Content comes from user accounts; the app does not seed fake posts or conversations.

## Firebase setup

1. Use Firebase project `lumi-f0d6b` and Realtime Database `https://lumi-f0d6b-default-rtdb.firebaseio.com`. Its currently locked rules reject anonymous reads with HTTP 401.
2. Enable Firebase Authentication providers for Email/Password and Google. Add the Vercel production domain to Authentication → Settings → Authorized domains.
3. Create or verify Cloud Storage for Firebase and copy the **exact** bucket name from the new project. Do not reuse the previous project's bucket.
4. Review and publish [database.rules.json](database.rules.json) in Realtime Database → Rules and [storage.rules](storage.rules) in Storage → Rules. Run `npm run test:rules` locally before publishing.
5. Copy `.env.example` to `.env.local` and obtain every remaining web app value from the new project's Firebase Console. Firebase web config is public, but server secrets must stay outside `NEXT_PUBLIC_` variables.

The live Vercel project `maxmax/lumi` still needs the **new project's** public Firebase variables for Production and Preview. Update them together, then redeploy; a Git push does not replace stored Vercel environment values.

See [production setup and verification](docs/SETUP.md) for the required variables, exact Firebase Console steps, and two-account security checks. This app currently stores production records in Realtime Database, not Firestore.

## Develop

```bash
npm install
npm run dev
```

`npm run build` verifies the production bundle. Firebase features require an active database and storage bucket, so build success alone does not prove that posting or messaging works.

## Data model

- `publicProfiles/{uid}`: display name, username, avatar, bio, city
- `privateProfiles/{uid}`: account settings
- `community/posts/{postId}`: posts, reels, comments, likes, saves
- `stories/{storyId}`: image stories with a 24-hour expiry timestamp
- `relationships/following` and `relationships/followers`: social graph
- `directMessages/{roomId}`: participant list and messages
- `notifications/{uid}`: per-user activity

Existing records under the old `profiles/{uid}/public` path need migration to `publicProfiles/{uid}` if that database contains previous user profiles. The migration should happen after the database is restored and its contents are inspected.
