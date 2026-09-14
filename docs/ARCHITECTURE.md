# Lumi Architecture

## Product Shape

Lumi is a social app that blends:
- Instagram-style home feed, stories, reels, profile, explore
- Snapchat-style snaps, streaks, avatar identity, camera/filter layer
- WhatsApp + Telegram-style chat, groups, media sharing, disappearing messages
- Threads/Twitter-style text posts and nested discussion
- LinkedIn-style optional jobs and portfolio layers
- AI-powered creation, moderation, feed personalization, and chat assistance

## Recommended Production Stack

- Frontend: Next.js App Router + TypeScript + Tailwind CSS
- API layer: Next.js Route Handlers for app-adjacent APIs
- Background workers: Node.js worker service for media processing, notifications, moderation, recommendations
- Database: PostgreSQL + Prisma
- Realtime chat/presence: WebSockets or Socket.IO gateway
- Media: Cloudinary or S3-compatible object storage
- Auth: JWT session strategy + Google OAuth + refresh token handling
- AI: OpenAI-compatible provider or local model gateway
- Search: PostgreSQL full-text search for MVP, Meilisearch/Elastic later

## App Domains

### 1. Identity
- user accounts
- creator/recruiter/business roles
- privacy settings
- XP, streaks, badges

### 2. Social Graph
- followers/following
- communities
- recommendations

### 3. Content
- posts
- reels
- stories
- snaps
- threads
- media pipeline

### 4. Messaging
- one-to-one chat
- group chat
- disappearing messages
- media messages
- reactions
- voice notes

### 5. Jobs
- recruiter accounts
- listings
- skill matching
- apply from profile

### 6. AI Layer
- captions
- hashtags
- moderation
- smart replies
- feed ranking
- profile insights

## Backend Modules

- `auth`
- `users`
- `profiles`
- `feeds`
- `posts`
- `reels`
- `stories`
- `chat`
- `communities`
- `jobs`
- `notifications`
- `ai`
- `moderation`
- `analytics`
- `media`

## Scalability Notes

- Feed ranking should move to async pipelines after MVP
- Media ingestion should be event-driven
- Chat should be separated from request/response APIs
- AI moderation and recommendations should be queued
- Notifications should use worker jobs and push providers

## Security Notes

- E2E encryption requires a dedicated protocol design and key management strategy
- screenshot detection is platform-specific and strongest on native mobile
- JWT auth must include rotation and revocation strategy
- media uploads need signed URLs and server-side validation
