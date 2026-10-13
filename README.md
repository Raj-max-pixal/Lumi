# Lumi

Lumi is a Next.js social app with Firebase Authentication, Realtime Database, and Storage. The first working social layer includes accounts, profiles, posts, photo stories, video reels, follows, likes, saves, comments, notifications, and direct messages. Content comes from user accounts; the app does not seed fake posts or conversations.

## Firebase setup

1. In Firebase project `lumi-fb051`, reactivate the Realtime Database. As of 13 October 2026 the database endpoint returns HTTP 423: `The Firebase database 'lumi-fb051-default-rtdb' has been deactivated.`
2. Enable Firebase Authentication providers for Email/Password and Google. Add the Vercel production domain to Authentication → Settings → Authorized domains.
3. Enable Cloud Storage for Firebase and verify the default bucket is `lumi-fb051.firebasestorage.app`.
4. Publish [database.rules.json](database.rules.json) in Realtime Database → Rules and [storage.rules](storage.rules) in Storage → Rules. Review the rules for your moderation and privacy requirements before inviting users.
5. Copy `.env.example` to `.env.local` for local development. Firebase web config is public, but any server secrets must stay outside `NEXT_PUBLIC_` variables.

The live Vercel project `maxmax/lumi` has the public Firebase variables configured for Production and Preview. A new deployment is required after changing public environment variables.

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
