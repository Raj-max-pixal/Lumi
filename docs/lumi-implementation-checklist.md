# Lumi implementation checklist

Updated 2026-10-17 after Firebase access, Auth setup, link-only publishing, live database verification, and the Production address change.

## Architecture

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS.
- Firebase Authentication and Realtime Database. Core workflows do not use Cloud Storage or Firestore.
- Vercel deploys GitHub `main` to `lumi-max.vercel.app` (Production).
- Main routes: `/`, `/clips`, `/explore`, `/profile`, `/profile/[userId]`, `/hackathon`, `/hackathon/project/[projectId]`, `/team-finder`.

## Feature status

| Area | Status | Next verification or work |
| --- | --- | --- |
| Developer reels | Creator-hosted links | Verify YouTube embeds and interest ordering with real users. Direct uploads are unavailable. |
| Main feed loading | Improved | Check empty, denied, slow, and healthy database responses with real accounts. |
| Project publishing and details | Live smoke test passed | Two temporary accounts verified link-only publishing, public reads, and cross-user edit denial. Browser UI still needs a real-user review. |
| Project search and discovery | Implemented in code | Verify filters, sorting, bookmarks, and incremental loading with real projects. |
| Developer profiles and follows | Implemented in code | Verify public/private fields, featured projects, and follow records across accounts. |
| Team Finder | Partial | Local rules tests cover join requests. Verify with real users; hard capacity limits need a trusted server transaction. |
| Public servers | Partial | Verify membership and messages; owner moderation and private servers remain missing. |
| Official hackathon voting | Missing | Requires trusted backend validation, organiser roles, audit logs, and separate competition records. Social likes are not votes. |
| Firebase rules | Database published | Nine emulator tests pass; live temporary-account test passes. Storage rules are unused. |

## Current blocker

Cloud Storage has no bucket and would require Blaze; Lumi's supported workflows use links instead. Full Google popup sign-in, long-lived real-user sessions, and several social flows still need browser testing. See [SETUP.md](SETUP.md).

## Private Community and external developer videos

- `/community` uses Firebase Authentication and private Realtime Database records scoped to the signed-in UID. The starter spaces show Lumi Dev as owner. A user's own servers and messages are visible only to that account; the old `/demo` route redirects to `/community`.
- Previous fictional browser-local records are not imported into real accounts. Community server notes are private; shared teams and hackathon projects remain in their dedicated live routes. Trusted operations are still needed for hard team-size limits.
- `/clips` shows curated creator-hosted YouTube embeds and Lumi Originals in separate source views. No YouTube Data API key, scraping, or video rehosting is used.
- Instagram automatic public-account discovery is not enabled. The official API needs a professional account, permissions, and approved access for hashtag media. No scraping, copying, or fictional Instagram content is used.
- The existing Firebase-backed Team Finder and Hackathon Showcase remain live shared-data routes; their database failures still surface honestly.
