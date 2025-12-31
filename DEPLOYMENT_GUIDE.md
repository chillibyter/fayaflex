# FayaFlex Mobile App Deployment Guide

Complete step-by-step instructions for deploying FayaFlex to iOS App Store and Google Play Store.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Getting Your Replit Git URL](#getting-your-replit-git-url)
3. [iOS App Store Deployment](#ios-app-store-deployment)
4. [Google Play Store Deployment](#google-play-store-deployment)
5. [Huawei AppGallery Deployment](#huawei-appgallery-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For iOS Deployment
- Mac computer (required - cannot build iOS on Windows/Linux)
- Xcode installed from Mac App Store (free)
- Apple Developer Account ($99/year) - https://developer.apple.com

### For Android Deployment
- Computer with Android Studio installed (Windows, Mac, or Linux)
- Java Development Kit (JDK) 11 or higher
- Google Play Developer Account ($25 one-time) - https://play.google.com/console

### For Huawei Deployment
- Computer with Android Studio installed
- Huawei Developer Account (free) - https://developer.huawei.comgit

---

## Getting Your Replit Git URL

Every Replit project has a built-in Git repository. Here's how to find your URL:

### Step 1: Open Your Replit Project
**Location: Replit website (replit.com)**

1. Go to https://replit.com and sign in
2. Open your FayaFlex project

### Step 2: Find the Git URL
**Location: Replit website**

**Option A - From the Git pane:**
1. Click the "Git" icon in the left sidebar (branch icon)
2. Look for "Clone URL" or click the settings gear
3. Copy the HTTPS URL

**Option B - From project URL:**
Your Git URL follows this pattern:
```
https://replit.com/@YOUR_USERNAME/YOUR_PROJECT_NAME.git
```

For example, if your Replit username is "johnsmith" and project is "FayaFlex":
```
https://replit.com/@johnsmith/FayaFlex.git
```

**Option C - Using SSH (if configured):**
```
git@replit.com:YOUR_USERNAME/YOUR_PROJECT_NAME.git
```

### Step 3: Clone on Your Local Machine
**Location: Your computer (Terminal/Command Prompt)**

```bash
git clone https://replit.com/@YOUR_USERNAME/FayaFlex.git
cd FayaFlex
```

You may be prompted for your Replit credentials.

---

## iOS App Store Deployment

### Phase 1: Apple Developer Setup

#### Step 1.1: Create Apple Developer Account
**Location: Web browser**

1. Go to https://developer.apple.com
2. Click "Account" in the top menu
3. Sign in with your Apple ID (or create one)
4. Enroll in the Apple Developer Program ($99/year)
5. Wait for approval (usually instant for individuals)

#### Step 1.2: Create Bundle ID
**Location: Apple Developer Portal (developer.apple.com)**

1. Sign in to https://developer.apple.com
2. Click "Account" > "Certificates, Identifiers & Profiles"
3. In left sidebar, click "Identifiers"
4. Click the "+" button
5. Select "App IDs" > Click "Continue"
6. Select "App" > Click "Continue"
7. Fill in:
   - **Description:** `FayaFlex Fitness App`
   - **Bundle ID:** Select "Explicit"
   - **Bundle ID value:** `com.fayaflex.app`
8. Scroll down and enable these capabilities:
   - [x] HealthKit
   - [x] Push Notifications (optional, for future use)
9. Click "Continue" > "Register"

---

### Phase 2: Build the App

#### Step 2.1: Clone the Project
**Location: Your Mac (Terminal)**

```bash
# Navigate to where you want the project
cd ~/Documents

# Clone from Replit
git clone https://replit.com/@YOUR_USERNAME/FayaFlex.git

# Enter the project folder
cd FayaFlex
```

#### Step 2.2: Install Dependencies
**Location: Your Mac (Terminal, inside project folder)**

```bash
npm install
```

#### Step 2.3: Build Web Assets
**Location: Your Mac (Terminal, inside project folder)**

```bash
npm run build
```

#### Step 2.4: Sync to iOS
**Location: Your Mac (Terminal, inside project folder)**

```bash
npx cap sync ios
```

#### Step 2.5: Open in Xcode
**Location: Your Mac (Terminal, inside project folder)**

```bash
npx cap open ios
```

This opens Xcode with your iOS project.

---

### Phase 3: Configure Xcode

#### Step 3.1: Select Your Project
**Location: Xcode**

1. In the left sidebar, click the blue "App" project icon (top item)
2. In the center panel, select "App" under TARGETS

#### Step 3.2: Configure Signing
**Location: Xcode > Signing & Capabilities tab**

1. Click the "Signing & Capabilities" tab
2. Check "Automatically manage signing"
3. Team: Select your Apple Developer account from dropdown
4. Bundle Identifier: Verify it shows `com.fayaflex.app`

If you see errors, ensure your Apple Developer account is properly enrolled.

#### Step 3.3: Verify HealthKit
**Location: Xcode > Signing & Capabilities tab**

1. Scroll down to see "HealthKit" capability
2. If not present, click "+ Capability" and add "HealthKit"

#### Step 3.4: Set Version Number
**Location: Xcode > General tab**

1. Click the "General" tab
2. Set:
   - **Display Name:** `FayaFlex`
   - **Version:** `1.0.0`
   - **Build:** `1`

---

### Phase 4: Create App Store Listing

#### Step 4.1: Create App in App Store Connect
**Location: Web browser (appstoreconnect.apple.com)**

1. Go to https://appstoreconnect.apple.com
2. Sign in with your Apple ID
3. Click "My Apps"
4. Click "+" > "New App"
5. Fill in:
   - **Platforms:** iOS (check the box)
   - **Name:** `FayaFlex`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** Select `com.fayaflex.app` from dropdown
   - **SKU:** `fayaflex001`
   - **User Access:** Full Access
6. Click "Create"

---

### Phase 5: Build and Upload

#### Step 5.1: Select Build Target
**Location: Xcode (top toolbar)**

1. In the top toolbar, click the device selector (next to the Play button)
2. Select "Any iOS Device (arm64)"

#### Step 5.2: Create Archive
**Location: Xcode (menu bar)**

1. Go to menu: Product > Archive
2. Wait for build to complete (2-5 minutes)
3. When done, the Organizer window opens automatically

#### Step 5.3: Upload to App Store Connect
**Location: Xcode (Organizer window)**

1. Select your archive in the list
2. Click "Distribute App"
3. Select "App Store Connect" > Click "Next"
4. Select "Upload" > Click "Next"
5. Keep default options checked:
   - [x] Upload your app's symbols
   - [x] Manage version and build number
6. Click "Next"
7. Select "Automatically manage signing" > Click "Next"
8. Review the summary > Click "Upload"
9. Wait for upload to complete (5-10 minutes)

---

### Phase 6: Submit for Review

#### Step 6.1: Complete App Information
**Location: App Store Connect (appstoreconnect.apple.com)**

Navigate to your app and complete each section:

**App Information:**
- Category: Health & Fitness
- Content Rights: Confirm you have rights

**Pricing and Availability:**
- Price: Free
- Availability: Select countries

**Version Information (1.0):**
- Screenshots: Upload for each required size
  - iPhone 6.7" (1290 x 2796 px) - Required
  - iPhone 6.5" (1284 x 2778 px) - Required  
  - iPhone 5.5" (1242 x 2208 px) - Required
- Description: Your app description
- Keywords: `fitness,challenge,team,calories,steps,workout,health,leaderboard`
- Support URL: `https://www.fayaflex.com/support`
- Privacy Policy URL: `https://www.fayaflex.com/privacy`

**App Review Information:**
- Sign-in required: Yes
- Provide demo account username and password
- Contact Information: Your email and phone
- Notes: Explain HealthKit usage

#### Step 6.2: Select Build
**Location: App Store Connect > Version Information**

1. Scroll to "Build" section
2. Click "+" next to Build
3. Select your uploaded build
4. Click "Done"

#### Step 6.3: Submit
**Location: App Store Connect**

1. Review all information is complete (no warnings)
2. Click "Submit for Review"
3. Answer export compliance: "No" (uses standard HTTPS)
4. Confirm content rights
5. Click "Submit"

**Review Time:** 1-3 business days (first submission may take longer)

---

## Google Play Store Deployment

### Phase 1: Google Play Setup

#### Step 1.1: Create Developer Account
**Location: Web browser**

1. Go to https://play.google.com/console
2. Sign in with your Google account
3. Pay the one-time $25 registration fee
4. Complete account details

---

### Phase 2: Build the App

#### Step 2.1: Clone the Project
**Location: Your computer (Terminal/Command Prompt)**

```bash
# Navigate to where you want the project
cd ~/Documents    # Mac/Linux
# or
cd C:\Users\YourName\Documents    # Windows

# Clone from Replit
git clone https://replit.com/@YOUR_USERNAME/FayaFlex.git

# Enter the project folder
cd FayaFlex
```

#### Step 2.2: Install Dependencies
**Location: Your computer (Terminal, inside project folder)**

```bash
npm install
```

#### Step 2.3: Build Web Assets
**Location: Your computer (Terminal, inside project folder)**

```bash
npm run build
```

#### Step 2.4: Sync to Android
**Location: Your computer (Terminal, inside project folder)**

```bash
npx cap sync android
```

#### Step 2.5: Open in Android Studio
**Location: Your computer (Terminal, inside project folder)**

```bash
npx cap open android
```

Wait for Gradle sync to complete (first time takes several minutes).

---

### Phase 3: Create Signing Key

#### Step 3.1: Generate Keystore
**Location: Your computer (Terminal)**

Run this command (remember all passwords you enter!):

```bash
keytool -genkey -v -keystore fayaflex-release.keystore -alias fayaflex -keyalg RSA -keysize 2048 -validity 10000
```

You'll be prompted for:
- **Keystore password:** Create and remember this!
- **Re-enter password:** Same as above
- **First and last name:** Your name
- **Organizational unit:** (Press Enter to skip)
- **Organization:** Your company name or your name
- **City:** Your city
- **State:** Your state/province
- **Country code:** Two-letter code (e.g., US, UK, NG)
- **Is this correct?** Type `yes`
- **Key password:** Press Enter to use same as keystore password

**IMPORTANT:** Save the keystore file and passwords securely! You cannot update your app without them.

#### Step 3.2: Move Keystore to Safe Location
**Location: Your computer (Terminal)**

```bash
# Create a secure folder
mkdir -p ~/FayaFlexKeys

# Move the keystore
mv fayaflex-release.keystore ~/FayaFlexKeys/

# Note the full path for later:
# ~/FayaFlexKeys/fayaflex-release.keystore
```

---

### Phase 4: Configure Android Studio

#### Step 4.1: Update Signing Config
**Location: Android Studio**

1. In Android Studio, open file: `android/app/build.gradle`
2. Find the `android {` section
3. Add signing config (replace with your actual path and passwords):

```gradle
android {
    ...
    
    signingConfigs {
        release {
            storeFile file('/Users/YOURNAME/FayaFlexKeys/fayaflex-release.keystore')
            storePassword 'YOUR_KEYSTORE_PASSWORD'
            keyAlias 'fayaflex'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

#### Step 4.2: Update Version Numbers
**Location: Android Studio (android/app/build.gradle)**

Find `defaultConfig` and update:

```gradle
defaultConfig {
    applicationId "com.fayaflex.app"
    versionCode 1          // Increment for each release
    versionName "1.0.0"    // User-visible version
    ...
}
```

#### Step 4.3: Sync Gradle
**Location: Android Studio**

1. Click "Sync Now" in the yellow bar at top
2. Wait for sync to complete

---

### Phase 5: Generate Signed Bundle

#### Step 5.1: Build Signed AAB
**Location: Android Studio (menu bar)**

1. Go to menu: Build > Generate Signed Bundle / APK
2. Select "Android App Bundle" > Click "Next"
3. Key store path: Browse to your keystore file
4. Enter Key store password
5. Key alias: `fayaflex`
6. Enter Key password
7. Click "Next"
8. Build Variants: Select "release"
9. Click "Create"
10. Wait for build to complete

#### Step 5.2: Locate the AAB File
**Location: Your computer (File Explorer/Finder)**

The signed file is at:
```
FayaFlex/android/app/release/app-release.aab
```

---

### Phase 6: Create Google Play Listing

#### Step 6.1: Create App
**Location: Google Play Console (play.google.com/console)**

1. Go to https://play.google.com/console
2. Click "Create app"
3. Fill in:
   - **App name:** FayaFlex
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
4. Accept policies
5. Click "Create app"

#### Step 6.2: Complete Dashboard Tasks
**Location: Google Play Console > Dashboard**

Complete each required task:

**Set up your app:**

1. **App access**
   - Select: All functionality is available without special access
   - OR: Restricted (provide test login credentials)

2. **Ads**
   - Select: No, my app does not contain ads

3. **Content rating**
   - Start questionnaire
   - Answer questions about app content
   - Usually results in "Everyone" or "Teen" rating

4. **Target audience**
   - Select: 18 and over (recommended for fitness apps)

5. **News apps**
   - Select: My app is not a news app

6. **Data safety**
   - Data types collected:
     - [x] Personal info > Email address
     - [x] Personal info > Name
     - [x] Health and fitness > Fitness info
     - [x] App activity
   - Data is not shared with third parties
   - Data is encrypted in transit

7. **Government apps**
   - Select: Not a government app

#### Step 6.3: Set Up Store Listing
**Location: Google Play Console > Store presence > Main store listing**

Fill in:
- **App name:** FayaFlex
- **Short description:** Team fitness challenges - track calories, steps & workouts
- **Full description:** (Your detailed app description)
- **App icon:** Upload 512 x 512 PNG
- **Feature graphic:** Upload 1024 x 500 PNG
- **Phone screenshots:** Upload at least 2 screenshots
- **Tablet screenshots:** Optional but recommended

---

### Phase 7: Upload and Release

#### Step 7.1: Create Internal Test Release (Recommended)
**Location: Google Play Console > Testing > Internal testing**

1. Click "Internal testing" in left menu
2. Click "Create new release"
3. Click "Upload" > Select your `app-release.aab` file
4. Wait for upload and processing
5. Release name: `1.0.0`
6. Release notes: "Initial release"
7. Click "Save"
8. Click "Review release"
9. Click "Start rollout to Internal testing"

#### Step 7.2: Add Testers
**Location: Google Play Console > Internal testing > Testers**

1. Click "Testers" tab
2. Create email list with tester email addresses
3. Copy the opt-in URL
4. Share URL with testers

#### Step 7.3: Production Release
**Location: Google Play Console > Production**

After testing is complete:

1. Click "Production" in left menu
2. Click "Create new release"
3. Click "Add from library" > Select your tested build
4. Add release notes
5. Click "Save"
6. Click "Review release"
7. Click "Start rollout to Production"

**Review Time:** 1-7 days (first app may take longer)

---

## Huawei AppGallery Deployment

### Step 1: Create Huawei Developer Account
**Location: Web browser**

1. Go to https://developer.huawei.com
2. Click "Register" and create account
3. Complete identity verification

### Step 2: Build the App
Same process as Android (use the same signed AAB or generate an APK):

```bash
cd FayaFlex
npm run build
npx cap sync android
npx cap open android
```

### Step 3: Create App in AppGallery Connect
**Location: AppGallery Connect (developer.huawei.com/consumer/en/appgallery)**

1. Go to AppGallery Connect
2. Click "My apps" > "New app"
3. Fill in app details similar to Google Play

### Step 4: Upload and Submit
1. Upload your AAB or APK file
2. Complete store listing
3. Submit for review

**Note:** Huawei accepts the same Android build, but you may need to integrate HMS (Huawei Mobile Services) for Huawei Health Kit if you want health data on Huawei devices.

---

## Troubleshooting

### Common iOS Issues

| Problem | Solution |
|---------|----------|
| "No signing certificate" | Ensure Xcode is signed into your Apple Developer account |
| "Bundle ID not registered" | Create the Bundle ID in Apple Developer Portal first |
| Archive fails | Clean build folder: Product > Clean Build Folder |
| Upload fails | Check internet connection, try again |

### Common Android Issues

| Problem | Solution |
|---------|----------|
| Gradle sync fails | Check internet, click "Try Again" |
| Keystore not found | Verify the file path in build.gradle |
| Wrong key password | Double-check passwords, they're case-sensitive |
| Build fails | Clean project: Build > Clean Project |

### Getting Help

- **FayaFlex Support:** support@fayaflex.com
- **Apple Developer Support:** https://developer.apple.com/support
- **Google Play Support:** https://support.google.com/googleplay/android-developer

---

## Quick Reference

### App Details
- **App Name:** FayaFlex
- **Bundle ID / Package Name:** com.fayaflex.app
- **Support URL:** https://www.fayaflex.com/support
- **Privacy Policy:** https://www.fayaflex.com/privacy

### Version History
| Version | Build | Date | Notes |
|---------|-------|------|-------|
| 1.0.0 | 1 | | Initial release |

---

*Document created for FayaFlex - 2025*
*Copyright 2025 FayaFlex. All rights reserved.*
