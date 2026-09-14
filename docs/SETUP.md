# Lumi Setup

## MVP Setup Order

1. Create PostgreSQL database
2. Add Prisma and generate client
3. Configure Google OAuth credentials
4. Configure JWT secrets
5. Configure Cloudinary or S3 bucket
6. Enable WebSocket gateway
7. Configure AI provider or local AI adapter
8. Run database migrations
9. Seed sample users/posts/jobs
10. Start web and worker services

## Environment Variables

```bash
DATABASE_URL=
DIRECT_URL=
NEXTAUTH_URL=
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
OPENAI_API_KEY=
WEBSOCKET_URL=
```

## Recommended Services

- PostgreSQL: Neon, Supabase, Railway, or self-hosted Postgres
- Media: Cloudinary for the fastest MVP
- Realtime: Socket.IO server or Pusher-compatible adapter
- Deployment: Vercel for web, Railway/Fly.io for worker/websocket backend

## Mobile Track

- Keep the current Expo app for parallel mobile UI work
- Reuse the same design tokens and API contracts
- Move camera, filters, screenshot detection, and streak logic to mobile-native modules later
