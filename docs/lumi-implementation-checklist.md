# Lumi implementation checklist

Checked against the existing repository on 2026-10-14. A code path marked implemented still needs live user testing after Firebase access is restored.

## Architecture

- Next.js 15 App Router, React 19, TypeScript, Tailwind CSS.
- Firebase Authentication, Realtime Database, and Storage. This project does not use Cloud Firestore.
- Vercel deploys GitHub `main` to `lumi-maxmax.vercel.app`.
- Main routes: `/`, `/clips`, `/explore`, `/profile`, `/profile/[userId]`, `/hackathon`, `/hackathon/project/[projectId]`, `/team-finder`.

## Feature status

| Area | Status | Next verification or work |
| --- | --- | --- |
| Developer reels | Implemented in code | Upload a topic tagged reel and verify an interested student sees it in For you. |
| Main feed loading | Improved | Check empty, denied, slow, and healthy database responses with real accounts. |
| Project publishing and details | Implemented in code | Verify image upload, write rules, edit, delete, and direct links with two accounts. |
| Project search and discovery | Implemented in code | Verify filters, sorting, bookmarks, and incremental loading with real projects. |
| Developer profiles and follows | Implemented in code | Verify public/private fields, featured projects, and follow records across accounts. |
| Team Finder | Partial | Verify join requests and capacity rules; add missing recruitment controls. |
| Public servers | Partial | Verify membership and messages; owner moderation and private servers remain missing. |
| Official hackathon voting | Missing | Requires trusted backend validation, organiser roles, audit logs, and separate competition records. Social likes are not votes. |
| Firebase rules | Local only | Publish and test Database and Storage rules after project access is restored. |

## Current blocker

The configured Firebase Realtime Database returns HTTP 423. The current Firebase CLI account also lacks access to project `lumi-fb051`. Real user workflows and security rules cannot be verified or published until both are resolved.

## Explicit browser demo and external developer videos

- `/demo` is a separate, fictional browser demo. It persists to localStorage only; it never reads or writes Firebase. Users can switch among five labeled demo identities to test server membership, discussions, team join requests, and project publishing.
- Demo records are isolated from production records. Browser localStorage is a presentation aid, not secure authorization or shared persistence. Firebase server/team rules and trusted operations still need implementation and testing after access is restored.
- `/clips` shows creator-hosted YouTube embeds and Lumi Originals in separate source views. Without `YOUTUBE_API_KEY`, it uses a few explicitly curated YouTube picks. With a server-only key, the API searches embeddable short developer videos by topic with a one-hour cache. Search `videoDuration=short` means under four minutes, not necessarily a YouTube Short.
- Instagram automatic public-account discovery is not enabled. The official API needs a professional account, permissions, and approved access for hashtag media. No scraping, copying, or fictional Instagram content is used.
- The existing Firebase-backed Team Finder and Hackathon Showcase remain real-data routes; their database failures still surface honestly. The demo hub does not prove that the real security rules or persistence work.
