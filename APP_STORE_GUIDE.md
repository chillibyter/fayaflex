# Mobile App Store Deployment Guide

## Overview
This guide covers the steps to publish Ultimate Fitness Challenge to both Apple App Store (iOS) and Google Play Store (Android).

---

## Prerequisites

### For Both Platforms
- [ ] Production backend deployed and running on Replit
- [ ] SSL certificate configured (HTTPS required)
- [ ] App tested thoroughly on both platforms
- [ ] Privacy policy and terms of service published
- [ ] Support email/website set up

### For iOS App Store
- [ ] **Apple Developer Account** ($99/year)
  - Sign up at: https://developer.apple.com
  - Enroll in Apple Developer Program
  - Complete business/individual verification (1-2 days)

- [ ] **Mac computer** (required for Xcode and building iOS apps)
- [ ] **Xcode** installed (latest version from Mac App Store)

### For Google Play Store
- [ ] **Google Play Console Account** ($25 one-time fee)
  - Sign up at: https://play.google.com/console
  - Complete identity verification
  
- [ ] **Android Studio** installed
  - Download from: https://developer.android.com/studio

---

## Step 1: Prepare Assets

### App Icons
You'll need app icons in various sizes:

**iOS Requirements:**
- 1024x1024px (App Store)
- 180x180px (iPhone)
- 167x167px (iPad Pro)
- 152x152px (iPad)
- 120x120px (iPhone smaller models)

**Android Requirements:**
- 512x512px (Play Store)
- xxxhdpi: 192x192px
- xxhdpi: 144x144px
- xhdpi: 96x96px
- hdpi: 72x72px
- mdpi: 48x48px

### Screenshots
- Prepare screenshots from actual devices (required for submission)
- iOS: 6.7", 6.5", 5.5" display sizes
- Android: Phone and tablet screenshots

### Marketing Materials
- App description (max 4000 characters)
- Short description (80 characters for Android)
- Keywords (100 characters for iOS)
- Promotional graphics (Android: 1024x500px)

---

## Step 2: Build for Production

### Build the Web App
```bash
npm run build
```

### Sync with Capacitor
```bash
# Copy web assets to native projects
npx cap sync

# Or sync specific platform
npx cap sync ios
npx cap sync android
```

---

## Step 3: iOS App Store Submission

### A. Configure iOS Project

1. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```

2. **Configure App Settings in Xcode:**
   - Click on the project in the navigator
   - Under "General" tab:
     - Set Display Name: "Ultimate Fitness Challenge"
     - Set Bundle Identifier: `com.ufc.fitness`
     - Set Version: `1.0.0`
     - Set Build: `1`
   
3. **Configure Signing:**
   - Under "Signing & Capabilities":
     - Select your Team (Apple Developer Account)
     - Enable "Automatically manage signing"
   
4. **Add Required Capabilities:**
   - Click "+ Capability" button
   - Add: Push Notifications (if using)
   - Add: HealthKit (for Apple Health integration)
   - Add: Camera (for photo evidence)

5. **Update Info.plist permissions:**
   - Add camera usage description
   - Add photo library usage description
   - Add HealthKit usage description

### B. Create App in App Store Connect

1. **Login to App Store Connect:**
   - Visit: https://appstoreconnect.apple.com
   
2. **Create New App:**
   - Click "My Apps" → "+" → "New App"
   - Platform: iOS
   - Name: Ultimate Fitness Challenge
   - Primary Language: English
   - Bundle ID: com.ufc.fitness
   - SKU: ufc-fitness-001

3. **Fill App Information:**
   - Category: Health & Fitness
   - Subtitle: Team fitness competition tracker
   - Privacy Policy URL: [Your URL]
   - Support URL: [Your URL]

4. **Add Screenshots & App Preview:**
   - Upload screenshots for all required device sizes
   - Upload app icon (1024x1024px)

5. **Complete App Details:**
   - Description, keywords, promotional text
   - Age rating questionnaire
   - Support information

### C. Build and Upload to App Store

1. **Archive the App in Xcode:**
   - Select "Any iOS Device" as target
   - Menu: Product → Archive
   - Wait for archive to complete

2. **Upload to App Store:**
   - Window → Organizer
   - Select your archive
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow the wizard (upload, include symbols, automatically manage signing)

3. **Wait for Processing:**
   - Takes 15-60 minutes
   - You'll receive email when ready

### D. Submit for Review

1. **In App Store Connect:**
   - Select your app version
   - Add build you just uploaded
   - Complete all required fields
   - Click "Submit for Review"

2. **Review Time:**
   - Typically 24-48 hours
   - May ask for additional information
   - Check status in App Store Connect

---

## Step 4: Google Play Store Submission

### A. Configure Android Project

1. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

2. **Update App Details:**
   - Open `android/app/build.gradle`
   - Update:
     ```gradle
     applicationId "com.ufc.fitness"
     versionCode 1
     versionName "1.0.0"
     ```

3. **Add Required Permissions:**
   - Open `android/app/src/main/AndroidManifest.xml`
   - Ensure camera permissions are present

4. **Generate Signed APK/Bundle:**
   - Menu: Build → Generate Signed Bundle / APK
   - Choose "Android App Bundle" (AAB - required by Google Play)
   
5. **Create Keystore (first time only):**
   - Choose "Create new..."
   - Save keystore file securely (BACKUP THIS!)
   - Set password and alias
   - Keep these credentials safe - you'll need them for updates

6. **Build Release Bundle:**
   - Select "release" build variant
   - Finish the wizard
   - Find AAB in `android/app/release/`

### B. Create App in Google Play Console

1. **Login to Google Play Console:**
   - Visit: https://play.google.com/console

2. **Create New App:**
   - Click "Create app"
   - App name: Ultimate Fitness Challenge
   - Default language: English
   - App type: App
   - Category: Health & Fitness
   - Accept declarations

3. **Complete Dashboard Requirements:**

   **Store Listing:**
   - Short description (80 chars)
   - Full description (4000 chars)
   - App icon (512x512px)
   - Feature graphic (1024x500px)
   - Screenshots (min 2, max 8)
   - Contact details

   **App Content:**
   - Privacy policy URL
   - Data safety form
   - App access (no special access needed)
   - Ads (declare if using ads)
   - Target audience & content rating

   **Pricing & Distribution:**
   - Free or Paid
   - Available countries
   - Content guidelines acceptance

### C. Create and Submit Release

1. **Production Track:**
   - Go to "Production" under "Release"
   - Click "Create new release"

2. **Upload App Bundle:**
   - Upload your signed AAB file
   - Add release notes

3. **Review and Rollout:**
   - Review all requirements
   - Click "Review release"
   - If all green, click "Start rollout to Production"

4. **Review Time:**
   - Typically takes a few days to a week
   - Check email for updates
   - Monitor in Play Console dashboard

---

## Step 5: Post-Submission

### App Store (iOS)
- **TestFlight Beta Testing** (optional but recommended):
  - Available immediately after processing
  - Distribute to beta testers
  - Gather feedback before public release

- **Release Options**:
  - Manual release (you choose when)
  - Automatic release (live immediately after approval)

### Play Store (Android)
- **Internal/Closed Testing** (recommended):
  - Test with limited users first
  - Iron out bugs before public release

- **Staged Rollout**:
  - Release to percentage of users (10%, 25%, 50%, 100%)
  - Monitor crashes and ratings

---

## Ongoing Maintenance

### App Updates
When releasing updates:

1. **Increment Version:**
   - iOS: Update version and build number in Xcode
   - Android: Increment `versionCode` and `versionName` in `build.gradle`

2. **Build and Upload:**
   - Follow same build process
   - Upload to respective stores

3. **Release Notes:**
   - Write clear update descriptions
   - Submit for review (iOS) or rollout (Android)

### Required Updates
- **iOS**: Review every major iOS version release
- **Android**: Update targetSdkVersion annually (Google requirement)
- **Security**: Update dependencies regularly

---

## Important Configuration for Production

### Update Backend URLs

In your Capacitor configuration, ensure API calls use production URLs:

```typescript
// capacitor.config.ts
server: {
  url: 'https://your-replit-app.replit.app', // Your production Replit URL
  cleartext: false,
}
```

Or handle environment-based URLs in your app code.

### Environment Variables

Create production build with proper environment variables:
- `VITE_API_URL` - Your production Replit backend URL
- Ensure all API calls use HTTPS

---

## Common Rejection Reasons

### iOS App Store
1. App crashes or has bugs
2. Incomplete or misleading information
3. Privacy policy missing or inadequate
4. In-app purchases not implemented correctly
5. Using private APIs
6. UI doesn't match screenshots

### Google Play Store
1. Privacy policy missing or inaccessible
2. Data safety information incomplete
3. App crashes on testing
4. Content policy violations
5. Incomplete store listing
6. Broken permissions

---

## Helpful Resources

### iOS
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)

### Android
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Launch Checklist](https://developer.android.com/distribute/best-practices/launch/launch-checklist)
- [Google Play Policy Center](https://play.google.com/about/developer-content-policy/)

### Capacitor
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Deploying to App Store](https://capacitorjs.com/docs/guides/deploying-updates)

---

## Quick Command Reference

```bash
# Build web app
npm run build

# Sync with native projects
npx cap sync

# Open in native IDEs
npx cap open ios
npx cap open android

# Add/update platforms
npx cap add ios
npx cap add android
npx cap update

# Run on device/simulator
npx cap run ios
npx cap run android
```

---

## Timeline Estimates

**From Development to App Store:**
- App setup: 1-2 hours
- Asset preparation: 2-4 hours  
- Testing on devices: 1-2 days
- App Store/Play Store setup: 2-3 hours
- Review process: 2-7 days (iOS), 3-14 days (Android)

**Total: 1-3 weeks from ready-to-deploy to live in stores**

---

## Support

For issues specific to:
- **Capacitor**: https://capacitorjs.com/docs
- **iOS submissions**: https://developer.apple.com/support/
- **Android submissions**: https://support.google.com/googleplay/android-developer
