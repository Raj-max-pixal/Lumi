# Lumi Play Store Prep

## Status

This repository is prepared for Play Store release **prep**, but actual publishing still requires your Google Play Console account actions.

## Repo-side completion

- Expo mobile scaffold exists in `mobile/`
- Android package name configured in `mobile/app.json`
- `eas.json` added for preview and production builds
- Product roadmap, setup docs, and architecture docs exist

## Manual steps still required in Google Play Console

1. Create or use your Play Console developer account
2. Create app listing
3. Upload privacy policy
4. Upload screenshots and feature graphics
5. Fill data safety form
6. Fill content rating questionnaire
7. Create internal testing track
8. Upload signed Android App Bundle from Expo/EAS
9. Resolve pre-launch report issues
10. Submit for review

## Assets you should prepare

- app icon
- feature graphic
- phone screenshots
- short description
- full description
- privacy policy URL
- support email

## Recommended release flow

1. `cd mobile`
2. `npm install`
3. `npx expo login`
4. `npx eas build --platform android --profile preview`
5. Test internal APK
6. `npx eas build --platform android --profile production`
7. Upload AAB to Play Console
