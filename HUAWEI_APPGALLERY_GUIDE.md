# Huawei AppGallery Deployment Guide

## Overview
This guide covers publishing Ultimate Fitness Challenge to Huawei AppGallery, Huawei's official app distribution platform with over 580 million monthly active users worldwide.

---

## Why Publish to Huawei AppGallery?

- **Massive Reach**: 580M+ monthly active users globally
- **Market Access**: Essential for Chinese market (Google Play not available)
- **Growing Ecosystem**: Huawei devices sold in 170+ countries
- **HMS Core**: Access to Huawei's mobile services (alternative to Google Play Services)
- **Lower Competition**: Fewer apps than Google Play = better discoverability

---

## Prerequisites

### Required
- [ ] **Huawei Developer Account** (FREE)
  - Sign up at: https://developer.huawei.com
  - Individual or Company account
  - Verification takes 1-2 business days

- [ ] **Android Studio** installed
  - Download from: https://developer.android.com/studio

- [ ] **Signed APK or AAB file**
  - Build using Android Studio (covered in this guide)

### Optional but Recommended
- [ ] **HMS Core Integration** (for better Huawei device support)
  - Push notifications via HMS Push
  - Location services via HMS Location
  - Analytics via HMS Analytics

---

## Step 1: Create Huawei Developer Account

### A. Register Account

1. **Visit Huawei Developer Console:**
   - Go to: https://developer.huawei.com
   - Click "Register" in top right

2. **Choose Account Type:**
   - **Individual**: For solo developers (ID verification required)
   - **Company**: For businesses (business license required)
   - Recommend: Individual for faster approval

3. **Complete Registration:**
   - Email verification
   - Phone verification (SMS code)
   - Upload ID document (passport or national ID)
   - Wait 1-2 business days for approval

4. **Sign Developer Agreement:**
   - After approval, sign the Huawei Developer Service Agreement
   - Accept terms and conditions

---

## Step 2: Build Android App Bundle

### A. Prepare Build Environment

1. **Open Android Project:**
   ```bash
   npx cap open android
   ```

2. **Update Version Info:**
   - Open `android/app/build.gradle`
   - Update version details:
     ```gradle
     android {
         defaultConfig {
             applicationId "com.ufc.fitness"
             versionCode 1
             versionName "1.0.0"
             // ... other config
         }
     }
     ```

### B. Generate Signing Key (First Time Only)

1. **Create Keystore File:**
   ```bash
   # In Android Studio terminal
   keytool -genkey -v -keystore ufc-release-key.jks \
     -alias ufc-fitness \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Fill in Details:**
   - Enter password (SAVE THIS!)
   - Enter key password (can be same as keystore)
   - Enter organization details (can be generic)
   - Confirm with "yes"

3. **IMPORTANT - Backup Keystore:**
   - ⚠️ CRITICAL: Save `ufc-release-key.jks` securely
   - ⚠️ Save all passwords somewhere safe
   - You CANNOT update your app without this file!

### C. Build Signed APK/AAB

**Option 1: Build AAB (Recommended - smaller size)**

1. In Android Studio:
   - Menu: Build → Generate Signed Bundle / APK
   - Select "Android App Bundle"
   - Click "Next"

2. **Keystore Configuration:**
   - Key store path: Select your `.jks` file
   - Key store password: Enter password
   - Key alias: `ufc-fitness`
   - Key password: Enter key password
   - Click "Next"

3. **Build Configuration:**
   - Select "release" build variant
   - Check both signature versions (V1 and V2)
   - Click "Finish"

4. **Locate AAB:**
   - File will be at: `android/app/release/app-release.aab`

**Option 2: Build APK (Universal compatibility)**

1. Follow same steps but select "APK" instead of "Android App Bundle"
2. APK will be at: `android/app/release/app-release.apk`

---

## Step 3: Create App in AppGallery Connect

### A. Access AppGallery Connect

1. **Login to AppGallery Connect:**
   - Visit: https://developer.huawei.com/consumer/en/service/josp/agc/index.html
   - Use your Huawei Developer credentials

2. **Navigate to My Apps:**
   - Click "My apps" in the left menu
   - Click "Add app" or "Create"

### B. Basic App Information

1. **App Details:**
   - App name: `Ultimate Fitness Challenge`
   - Package name: `com.ufc.fitness` (must match your build.gradle)
   - App category: Sports & Health
   - Default language: English

2. **Select Services:**
   - App Services: None (unless using HMS Core)
   - Data Storage Location: Choose based on target market
     - Europe: Germany
     - Asia: Singapore
     - China: China

3. **Create App:**
   - Click "OK" or "Confirm"
   - App will be created with initial dashboard

---

## Step 4: Complete App Information

### A. Version Information

1. **Go to Version Information:**
   - In app dashboard, click "Distribute" → "Version management"
   - Click "Create version" or "Prepare"

2. **Software Version:**
   - Version number: `1.0.0`
   - Version description: Enter release notes
   - Supported devices: Select "All" or specific devices

### B. Upload APK/AAB

1. **Upload Release File:**
   - In Version Information section
   - Click "Software package management"
   - Upload your APK or AAB file
   - Wait for processing (few minutes)

2. **Automatic Processing:**
   - Huawei will extract:
     - App permissions
     - Supported architectures (ARM, x86)
     - Minimum Android version
     - App size

### C. Store Listing Information

Navigate to "Store Listing" section and complete:

1. **App Introduction (Required):**
   ```
   Ultimate Fitness Challenge - Team-Based Fitness Competition

   Join or create teams of up to 20 people and compete in monthly fitness 
   challenges! Track your daily calories, steps, and workouts, and see how 
   you rank against teammates and other teams.

   KEY FEATURES:
   • Team-based fitness competitions
   • Daily activity tracking (calories, steps, workouts)
   • Photo evidence for activities
   • Real-time leaderboards
   • Monthly challenges and victories
   • Social features - react and comment on activities
   • Dark mode support
   • Offline capable

   Whether you're competing with coworkers, friends, or family, UFC makes 
   fitness fun and engaging. Create accountability, build healthy habits, 
   and achieve your fitness goals together!
   ```

2. **App Description (Detailed):**
   - Expand on features
   - Explain team competition mechanics
   - Highlight unique selling points
   - Include user benefits
   - Max 4000 characters

3. **New Features (Version 1.0.0):**
   ```
   • Initial release
   • Team creation and management
   • Activity tracking and logging
   • Photo evidence uploads
   • Real-time leaderboards
   • Social reactions and comments
   • Monthly victory tracking
   • Biometric login support
   ```

### D. App Icon & Graphics

1. **App Icon (Required):**
   - Size: 512x512 pixels
   - Format: PNG with transparency
   - No border, full bleed design
   - Upload in "Icon" section

2. **Screenshots (Required):**
   - Minimum: 2 screenshots
   - Recommended: 4-6 screenshots
   - Sizes accepted:
     - 1080x1920 (most common)
     - 720x1280
     - 1440x2560
   - Format: PNG or JPEG
   - Show key features:
     - Dashboard
     - Activity tracking
     - Leaderboard
     - Team view

3. **Feature Graphic (Optional but Recommended):**
   - Size: 1104x552 pixels
   - Format: PNG or JPEG
   - Used in featured placements
   - Design with app branding

4. **Promotional Video (Optional):**
   - YouTube or Vimeo link
   - 30-120 seconds
   - Show app in action

### E. Privacy & Compliance

1. **Privacy Policy (Required):**
   - Enter URL to your privacy policy
   - Must be accessible HTTPS URL
   - Should explain:
     - What data you collect
     - How you use it
     - User rights
     - Contact information

2. **Age Rating:**
   - Recommended: 3+ (Everyone)
   - Fill questionnaire about:
     - Violence
     - Sexual content
     - Bad language
     - Fear content
     - Gambling
     - Drugs/alcohol

3. **App Permissions Explanation:**
   - For each permission your app requests, explain why
   - Example:
     - Camera: "To capture photo evidence of workouts"
     - Storage: "To save and display workout photos"
     - Internet: "To sync activities with team members"

4. **Content Rating:**
   - Select appropriate rating
   - Complete content questionnaire
   - Most fitness apps: Everyone/PEGI 3

### F. Pricing & Distribution

1. **Pricing:**
   - Free (recommended for fitness app)
   - Or set price per country

2. **Distribution Countries:**
   - Select "All countries" or choose specific markets
   - Popular markets:
     - China (primary Huawei market)
     - Europe (Germany, France, Spain, Italy, UK)
     - Asia (Singapore, Malaysia, Thailand)
     - Middle East (UAE, Saudi Arabia)
     - Latin America (Mexico, Brazil)

3. **Distribution Settings:**
   - Release type: Full release
   - Availability: Available to all users
   - Device restrictions: None (or specify)

### G. Copyright & Contact

1. **Copyright Information:**
   - Copyright holder name
   - Year: 2025
   - Copyright statement (optional)

2. **Contact Information:**
   - Support email: your-support@email.com
   - Website URL: (optional)
   - Phone number: (optional but helps with support)

---

## Step 5: Submit for Review

### A. Pre-Submission Checklist

Verify all sections are complete (green checkmarks):
- [ ] Version information
- [ ] APK/AAB uploaded
- [ ] Store listing complete
- [ ] App icon uploaded
- [ ] Screenshots uploaded (minimum 2)
- [ ] Privacy policy URL provided
- [ ] Age rating completed
- [ ] Pricing & distribution set
- [ ] Copyright information filled

### B. Submit

1. **Review Summary:**
   - Click "Submit for review" button
   - Review all information one last time
   - AppGallery Connect shows summary

2. **Confirm Submission:**
   - Confirm you've read all policies
   - Accept terms
   - Click final "Submit" button

3. **Review Process Begins:**
   - You'll receive confirmation email
   - Status changes to "Under review"

---

## Step 6: Review Process

### Timeline

- **Automated Review**: 1-2 hours
  - Scans for malware
  - Checks technical requirements
  - Validates metadata

- **Manual Review**: 1-3 business days
  - Content review
  - Policy compliance
  - Functionality testing
  - Quality assessment

- **Total Time**: Usually 1-5 business days
  - Faster than Google Play (3-7 days)
  - Much faster than Apple (1-2 weeks)

### Review Status

Check status in AppGallery Connect:
- **Under review**: Being evaluated
- **Rejected**: Issues found (see feedback)
- **Approved**: Ready to publish
- **Published**: Live in store

### If Rejected

1. **Check Rejection Reason:**
   - Email notification with details
   - View in AppGallery Connect
   - Common issues listed below

2. **Fix Issues:**
   - Update app or metadata as needed
   - Address all feedback points

3. **Resubmit:**
   - Click "Modify" in version management
   - Make changes
   - Submit again (faster review ~24 hours)

---

## Step 7: Post-Approval

### A. Publish App

1. **After Approval:**
   - Receive approval email
   - Status shows "Approved"

2. **Publish to Store:**
   - In AppGallery Connect
   - Click "Publish" button
   - App goes live within 1 hour

3. **Verify Publication:**
   - Search for your app in Huawei AppGallery
   - Check all countries you selected
   - Ensure metadata displays correctly

### B. App Listing URL

Your app will be available at:
```
https://appgallery.huawei.com/app/C[YOUR_APP_ID]
```

You can also search:
- In AppGallery app on Huawei devices
- In web browser: https://appgallery.huawei.com
- Search term: "Ultimate Fitness Challenge"

---

## Ongoing Management

### App Updates

When you have a new version:

1. **Build New APK/AAB:**
   - Increment `versionCode` and `versionName`
   - Example: versionCode 2, versionName "1.1.0"
   - Build signed release

2. **Create New Version:**
   - In AppGallery Connect
   - Click "Update" in version management
   - Upload new APK/AAB
   - Enter "What's new" description

3. **Submit Update:**
   - Review is faster for updates (~1-2 days)
   - Published version remains live during review
   - New version replaces old after approval

### Monitor Performance

1. **Analytics Dashboard:**
   - View downloads, active users
   - See geographic distribution
   - Track ratings and reviews

2. **Respond to Reviews:**
   - Reply to user reviews
   - Address complaints
   - Thank positive feedback

3. **Crash Reports:**
   - Monitor app stability
   - Fix critical issues quickly
   - Push updates as needed

---

## Common Rejection Reasons

### Technical Issues
1. **App Crashes**: Must work on Huawei test devices
2. **Incomplete Features**: All advertised features must work
3. **Wrong Package Name**: Must match what's registered
4. **Missing Permissions**: Declare all required permissions

### Content Issues
1. **Misleading Description**: App must match description
2. **Inappropriate Content**: No violence, adult content, etc.
3. **Copyright Violation**: Use only your own or licensed content
4. **Missing Privacy Policy**: Must be accessible URL

### Metadata Issues
1. **Low Quality Screenshots**: Must be clear, high resolution
2. **Wrong Category**: Must match app functionality
3. **Incomplete Information**: All required fields must be filled
4. **Wrong Age Rating**: Must reflect actual content

### Policy Violations
1. **Data Collection**: Must disclose in privacy policy
2. **Ads**: Must comply with advertising policies
3. **In-App Purchases**: Must be clearly described
4. **User Safety**: No apps that risk user safety

---

## HMS Core Integration (Optional)

For better Huawei device support, consider integrating HMS Core:

### Benefits
- **HMS Push**: Push notifications on Huawei devices
- **HMS Location**: Better location accuracy
- **HMS Analytics**: Track user behavior
- **HMS Account**: Huawei ID login

### Setup Process
1. Enable HMS Core in AppGallery Connect
2. Download `agconnect-services.json`
3. Add HMS dependencies to build.gradle
4. Implement HMS SDKs in your app

### Documentation
- HMS Core Guides: https://developer.huawei.com/consumer/en/hms
- Capacitor HMS Plugins: Available via community

---

## Google Play vs Huawei AppGallery Comparison

| Feature | Google Play | Huawei AppGallery |
|---------|-------------|-------------------|
| **Registration Fee** | $25 one-time | FREE |
| **Review Time** | 3-7 days | 1-5 days |
| **User Base** | 2.5B+ devices | 580M+ monthly active |
| **Market Coverage** | Global | Strong in China, Europe, Asia |
| **Update Process** | Staged rollout | Direct publish |
| **Analytics** | Google Play Console | AppGallery Connect |
| **Revenue Share** | 70% developer | 70-85% developer* |

*Revenue share depends on region and app type

---

## Multi-Store Distribution Strategy

### Recommended Approach

1. **Build Once, Deploy Everywhere:**
   - Use same APK/AAB for both stores
   - Same package name: `com.ufc.fitness`
   - Identical functionality

2. **Release Order:**
   - Week 1: Submit to Google Play
   - Week 1: Submit to Huawei AppGallery simultaneously
   - Get feedback from both platforms

3. **Maintenance:**
   - Keep versions synchronized
   - Update both stores together
   - Monitor reviews on both platforms

### Market Strategy

- **Western Markets**: Focus on Google Play
- **China**: MUST use Huawei AppGallery (Google Play blocked)
- **Europe/Asia**: Publish to both for maximum reach
- **Emerging Markets**: Both stores gaining traction

---

## Quick Command Reference

```bash
# Build web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio
npx cap open android

# Build from command line (advanced)
cd android
./gradlew assembleRelease  # Creates APK
./gradlew bundleRelease    # Creates AAB

# Check app signature
keytool -list -v -keystore ufc-release-key.jks

# Verify APK signature
apksigner verify --print-certs app-release.apk
```

---

## Helpful Resources

### Official Documentation
- [Huawei Developer](https://developer.huawei.com)
- [AppGallery Connect](https://developer.huawei.com/consumer/en/service/josp/agc/index.html)
- [Publishing Guidelines](https://developer.huawei.com/consumer/en/doc/distribution/app/agc-help-releaseapp-0000001146598793)
- [HMS Core](https://developer.huawei.com/consumer/en/hms)

### Developer Support
- [Huawei Developer Forum](https://forums.developer.huawei.com)
- [Submit Support Ticket](https://developer.huawei.com/consumer/en/support)
- Email: developersupport@huawei.com

### Tools
- [APK Analyzer](https://developer.android.com/studio/build/apk-analyzer)
- [App Signing](https://developer.android.com/studio/publish/app-signing)

---

## Timeline Estimate

**From Ready App to Live in AppGallery:**

- Account setup & verification: 1-2 days
- Build preparation: 2-4 hours
- Store listing creation: 2-3 hours
- Asset preparation: 2-4 hours
- Review process: 1-5 days

**Total: 3-7 days from submission to published**

---

## Support

For issues or questions:
- **Technical**: Check Capacitor docs for Android builds
- **AppGallery**: Use developer forum or support ticket
- **App Rejection**: Review feedback carefully, check guidelines

---

## Success Tips

1. ✅ **Test Thoroughly**: Especially on Huawei devices
2. ✅ **High Quality Assets**: Good screenshots increase downloads
3. ✅ **Clear Description**: Help users understand your app
4. ✅ **Respond to Reviews**: Shows you care about users
5. ✅ **Regular Updates**: Keep app fresh and bug-free
6. ✅ **Localize**: Translate for Chinese market if targeting China
7. ✅ **Monitor Analytics**: Understand your users
8. ✅ **Fast Support**: Quick response to user issues

Good luck with your AppGallery launch! 🚀
