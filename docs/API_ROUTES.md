# Lumi API Routes

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `GET /api/auth/me`

## Feed + Explore

- `GET /api/feed`
- `GET /api/feed/recommended`
- `GET /api/explore`
- `GET /api/trending`
- `GET /api/search`

## Posts / Reels / Stories / Threads

- `POST /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts/:id/like`
- `POST /api/posts/:id/comment`
- `POST /api/posts/:id/save`
- `POST /api/reels`
- `GET /api/reels`
- `POST /api/stories`
- `GET /api/stories`
- `POST /api/threads`

## Chat

- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:id/messages`
- `POST /api/conversations/:id/messages`
- `POST /api/conversations/:id/reactions`
- `POST /api/conversations/:id/disappear`

## Communities

- `GET /api/communities`
- `POST /api/communities`
- `POST /api/communities/:id/join`
- `GET /api/communities/:slug/feed`

## Jobs

- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`
- `POST /api/jobs/:id/apply`
- `GET /api/jobs/recommended`

## AI

- `POST /api/ai/captions`
- `POST /api/ai/hashtags`
- `POST /api/ai/smart-replies`
- `POST /api/ai/moderation`
- `POST /api/ai/feed-score`
- `POST /api/ai/profile-insights`

## Analytics + Notifications

- `GET /api/analytics/profile`
- `GET /api/analytics/posts/:id`
- `GET /api/notifications`
- `POST /api/notifications/read`

## Media

- `POST /api/media/sign-upload`
- `POST /api/media/complete`

## WebSocket Channels

- `/ws/chat`
- `/ws/presence`
- `/ws/typing`
- `/ws/live`
