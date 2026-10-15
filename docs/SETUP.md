# Lumi production setup

Lumi currently uses Firebase Authentication, **Realtime Database**, and Cloud Storage for Firebase. Firestore is initialized for compatibility but no production collection reads or writes use it. The separate `/demo` route uses browser localStorage and fictional records only.

## Observed blocker (15 October 2026)

An unauthenticated read-only request to `https://lumi-fb051-default-rtdb.firebaseio.com/.json?shallow=true` returned HTTP **423 Locked** with the Firebase response `The Firebase database 'lumi-fb051-default-rtdb' has been deactivated.` This response comes from the Realtime Database service, before app security rules can grant or deny a record. It explains failed shared reads/writes. The response does **not** say why Firebase deactivated the instance; inspect the project status, billing, quota, and any Firebase notices in Console. Do not loosen rules to address this response.

The Firebase CLI account available in this workspace did not list `lumi-fb051` among its accessible projects. A direct instance-list request returned HTTP 403 with `serviceusage.services.use` and `firebasedatabase.instances.list` denied. Therefore database activation, rules publishing, and live two-account security tests require a project owner to grant suitable project access or perform the steps below. Do not infer a Storage cause from the database 423; Storage must be checked separately.

## Firebase Console steps (project owner)

1. Open Firebase Console → project `lumi-fb051` → Build → Realtime Database. Check the instance status and any displayed deactivation reason. Restore/reactivate `lumi-fb051-default-rtdb` using the Console action or Firebase Support instructions. If billing or quota is cited, resolve that specific notice. Confirm the database URL shown there matches `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.
2. Authentication → Sign-in method: enable Email/Password and Google. Authentication → Settings → Authorized domains: add `lumi-maxmax.vercel.app` and any preview domain used for live sign-in tests. Complete the Google support email requirement if shown.
3. Storage → Files/Rules: confirm the bucket is `lumi-fb051.firebasestorage.app`, that Storage is active, and whether the Console requires a billing plan or other activation step. Do not assume the RTDB 423 also affects Storage.
4. Review and publish `database.rules.json` under Realtime Database → Rules and `storage.rules` under Storage → Rules. These local files are **not** automatically deployed with the Vercel site. Alternatively, after granting the CLI account project access, run `npx firebase-tools deploy --only database,storage --project lumi-fb051` from this repository.
5. Use two real test accounts to check ownership and denial cases before inviting students. Review notification spam limits and content moderation needs before an open launch; client-origin notifications remain susceptible to abuse by authenticated accounts.

## Vercel and local environment

Set these **public Firebase web app identifiers** in Vercel Project → Settings → Environment Variables for Production and Preview, then redeploy. Locally, copy `.env.example` to `.env.local` and replace values with the Firebase Console web app settings. `lib/firebase.ts` intentionally fails initialization when required values are absent or invalid. The Firebase web API key is a public client identifier; never put Firebase Admin service account credentials, private API keys, or YouTube server keys in `NEXT_PUBLIC_` variables.

Required: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_DATABASE_URL`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.

Optional: `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`; server-only `YOUTUBE_API_KEY` for YouTube discovery.

## Verification after reactivation

1. Run `npx tsc --noEmit` and `npm run build` with the required public variables set.
2. In a fresh browser, create an Email/Password account, confirm its `publicProfiles/{uid}` record, refresh and confirm sign-in persists, then sign out. Sign in with Google and repeat. The browser uses Firebase local persistence.
3. With account A, create a post and upload an allowed small JPEG or MP4. Confirm the matching Storage path is under A's UID and the Realtime Database record is visible. Reject an oversized or unsupported file in the UI. Check Storage rules in the Rules Playground or Emulator: unauthenticated uploads, B writing to A's path, and overwriting an existing file must all fail.
4. Check Realtime Database rules with two accounts: A may write only `publicProfiles/A`; B must be denied at `publicProfiles/A`, `privateProfiles/A`, and `community/posts/{id}` when forging `authorId: A`. Check legitimate comments/likes separately. The Console Rules Playground or Local Emulator Suite can test these without changing production records.
5. Verify a real hackathon project upload and reading from a second account. Confirm `/demo` remains labeled fictional and its activity does not appear in Realtime Database. Simulate an unavailable database and confirm the real routes show an error plus the demo link.

The app does not currently use Firestore records. If a later feature adds them, create and test Firestore rules for its exact collection paths before enabling that feature. Do not set a public Firestore write rule.
