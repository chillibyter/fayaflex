# FayaFlex

## Overview
FayaFlex is a team-based fitness tracking and competition platform designed to foster engagement and healthy competition. Users can track daily fitness activities (calories, steps, workouts), form or join teams, and compete in monthly challenges. The platform features real-time leaderboards, personalized progress tracking, and integration capabilities for various fitness devices. FayaFlex aims to provide a motivating and interactive experience to encourage consistent fitness activity among its users.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Tooling**: React with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI System**: Shadcn UI (built on Radix UI) with Tailwind CSS, adhering to fitness-optimized Material Design principles with custom color palette and dark mode.
- **State Management**: TanStack Query for server state; local component state for UI; session-based auth via API.
- **PWA Implementation**: Full PWA support with offline capabilities, service worker, responsive design, and touch-friendly UI.
- **Mobile-First**: Horizontal bottom navigation used as primary navigation for both web and mobile builds.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, following a RESTful API design.
- **Authentication**: Multi-method authentication including username/password (Passport.js local strategy, Scrypt hashing) and WebAuthn/Passkey for biometric login. Supports session cookies (web) and JWT tokens (mobile). Zod validation used on auth endpoints.
- **API Structure**: Comprehensive RESTful API for user, team, activity, leaderboard, notification, and passkey management.
- **Core Features**:
    - **Team Management**: CRUD operations for teams, member management, and challenge archiving.
    - **Activity Tracking**: Logging and retrieval of user activities, with support for evidence uploads (compressed WebP).
    - **Leaderboards**: Real-time leaderboards for individuals and teams, with team-scoped and global rankings.
    - **Notifications**: Personalized daily motivational messages.
    - **Interactive Dashboard**: Clickable stat cards leading to detailed daily breakdowns and workout calendars.
    - **Social Features**: Reactions (thumbs up/down) and comments on activity submissions with real-time counts and user-specific actions.
    - **Victory Wall**: Team-based victory wall to showcase monthly champions, with owner-only calculation.
    - **Email Privacy**: User emails are sanitized and hidden from other users across the platform.
    - **Goal Journeys**: Daily/weekly fitness goals with progress tracking.

### Data Storage
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe queries.
- **Schema**: Includes users, teams, team_members, activities, device_connections, passkeys, sessions, activityReactions, activityComments, monthly_winners, passwordResetTokens, and userGoals.
- **Relationships**: Supports complex relationships for user, team, activity, and passkey data.

### Mobile Application
- **Platform**: Capacitor for iOS and Android native app deployment.
- **App ID**: com.fayaflex.app
- **Production Server**: https://www.fayaflex.com

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts**: Inter font family for typography.

### Device Integrations
- **Apple Health**: Native iOS health data syncing via custom HealthKit Swift plugin.
- **Android Health Connect**: Native Android health data syncing via capacitor-health plugin.
- **Huawei Health Kit**: HMS-based health data syncing for Huawei/Honor devices (requires HMS SDK setup).
- **Native-Only Approach**: Simplified direct device access without complex OAuth flows.

### Key NPM Dependencies
- **Recharts**: Data visualization.
- **React Hook Form with Zod**: Form validation.
- **date-fns**: Date manipulation utilities.
- **Radix UI**: Accessible UI primitives.
- **Class Variance Authority**: Component variant management.
- **Sharp**: Server-side image compression.
- **SimpleWebAuthn**: WebAuthn/passkey authentication (server and browser libraries).
- **Framer Motion**: Animations for onboarding and UI transitions.

## Recent Changes

**For You Feed** (March 21, 2026)
- Added "For You" social feed page at /feed — shows posts from teammates and yourself
- Instagram-style: text posts with optional photo, heart likes, comment threads
- Users can create posts with text and/or an uploaded image
- Like toggle with optimistic UI update (instant feedback, server synced)
- Collapsible comment section per post with add/delete own comments
- Feed is scoped to teammates (users sharing at least one team) + yourself
- Auto-refreshes every 30 seconds
- Feed tab added to bottom navigation (replaced Teams; Teams still accessible from Dashboard)
- New database tables: feed_posts, feed_post_likes, feed_post_comments
- New API endpoints: GET/POST /api/feed, POST/DELETE /api/feed/posts/:id, like toggle, comments CRUD, image upload
- New image upload endpoint: POST /api/upload/feed-image (same compression pipeline as evidence photos)



**Registration Location Fix** (January 1, 2026)
- Fixed bug where city/location data was captured in frontend but not saved to database during registration
- Updated /api/register endpoint to include location fields (continentId, countryId, regionId, townId)
- Users no longer need to manually update their location in Profile after registering

**City Search for Registration** (December 30, 2025)
- Added CitySearch component with autocomplete for finding cities during registration
- Search API endpoint /api/locations/search/cities returns cities with full location hierarchy
- Selecting a city auto-populates continent, country, region, and town location fields
- City selection is REQUIRED during registration (validation enforced)
- Users can change their city in Profile settings using the same CitySearch component
- searchCities storage method supports case-insensitive matching with minimum 2 characters

**Location-Based Rankings** (December 30, 2025)
- Added hierarchical location system (Continent → Country → Region → Town)
- Users can set their location in Profile settings via cascading dropdown selects or CitySearch
- Leaderboard page now includes location scope filter (Global, Continent, Country, Region, Town)
- Scope options only available when user has set their location data
- Location data stored in users table (continentId, countryId, regionId, townId)
- Comprehensive geographic seed data covering 6 continents with countries, regions, and towns
- LocationPicker component for cascading selection, CitySearch for autocomplete selection

**Android Active Calorie Conversion** (February 19, 2026)
- Added BMR (Basal Metabolic Rate) field to user profile (integer, range 500-5000)
- BMR input added to Edit Profile dialog with helper text
- Android health service applies formula: Active Cal = Total Burned Cal × 1.2 - BMR
- Formula only applied when: Android platform + total-calories data type + user has BMR set
- If BMR not set, raw calorie values are used (no conversion)
- Default BMR is NOT applied - users must explicitly set their BMR in Profile
- All getHealthData call sites updated to pass user's BMR (HealthDevices, auto-sync hook)

**Health Plugin Patch Script** (February 26, 2026)
- Created scripts/patch-health-plugin.cjs to patch capacitor-health (com.fit_up.health.capacitor) Android plugin
- Targets HealthPlugin.kt in node_modules/capacitor-health/android/src/main/java/com/fit_up/health/capacitor/
- Plugin already supports: active-calories, total-calories, steps, distance, workouts, heart rate
- Patch adds BMR (BasalMetabolicRateRecord) support:
  - Adds BasalMetabolicRateRecord and Power imports
  - Adds READ_BMR to CapHealthPermission enum and permission annotations
  - Adds READ_BMR to permissionMapping (maps to android.permission.health.READ_BASAL_METABOLIC_RATE)
  - Adds "bmr" data type to getMetricAndMapper for aggregated queries
  - Adds queryBmr() method for reading individual BMR records
- Script is idempotent (safe to run multiple times) and includes post-patch validation
- Android manifest updated with READ_BASAL_METABOLIC_RATE permission
- Run manually with: node scripts/patch-health-plugin.cjs (add as postinstall in package.json for automation)

**Profile Photo Upload** (December 30, 2025)
- Users can now upload a photo or take a selfie as their profile picture
- Added POST /api/upload/profile-image endpoint with Sharp image compression
- Profile images stored in /uploads/profiles/ as WebP (500x500, optimized)
- UserAvatar component prioritizes custom photo over avatar icons
- Edit Profile dialog includes Upload and Selfie buttons with live preview
- Avatar icons remain as fallback when no custom photo is set

**FayaFlex Rebrand** (December 30, 2025)
- Complete rebrand from "Ultimate Fitness Challenge (UFC)" to "FayaFlex" due to trademark concerns
- Updated all text references, logos, email addresses (support@fayaflex.com)
- Capacitor config updated: appId: com.fayaflex.app, server URL: fayaflex.com
- Email service updated with new branding
- WebAuthn RP_NAME updated to "FayaFlex"
- PWA manifest updated with new app name
- iOS capacitor.config.json updated for native builds

**Goal Journeys Feature** (December 30, 2025)
- Added Goal Journeys component to Dashboard for daily/weekly fitness goals
- Users can set goals for calories, steps, or workouts
- Progress bars show real-time goal completion
- Integrated with existing activity tracking system

**Privacy Policy Updates** (December 30, 2025)
- Enhanced Privacy Policy to meet Apple App Store requirements
- Added HealthKit data disclosure
- Added CCPA/GDPR compliance sections
- Added account deletion process documentation

**Auto Health Sync** (December 30, 2025)
- Implemented automatic health data syncing when app comes to foreground
- Uses 5-minute cooldown between syncs to prevent excessive API calls
- Works with Apple Health, Android Health Connect, and Huawei Health Kit

**Social Login Full Implementation** (January 31, 2026)
- Complete Sign in with Google and Apple implementation for web and native
- Backend: POST /api/auth/google (google-auth-library) and POST /api/auth/apple (apple-signin-auth)
- Native plugins: @southdevs/capacitor-google-auth (v7) and @capacitor-community/apple-sign-in (v7.1)
- Web: Google Identity Services script loaded for web-based Google Sign-In
- Frontend socialAuth.ts handles both native and web authentication flows
- Native Setup Required:
  - iOS: Add "Sign in with Apple" capability in Xcode, configure GoogleService-Info.plist
  - Android: Add google-services.json with OAuth client ID, add SHA-1 fingerprint to Firebase/Google Console
- Environment Variables: VITE_GOOGLE_CLIENT_ID (for web), GOOGLE_CLIENT_ID/SECRET (for backend verification)
- Apple Sign-In only available on iOS (Apple's requirement)

## Branding

- **App Name**: FayaFlex
- **App ID**: com.fayaflex.app
- **Support Email**: support@fayaflex.com
- **Feedback Email**: feedback@fayaflex.com
- **Logo**: /fayaflex-logo.png
- **Production Domain**: https://www.fayaflex.com
