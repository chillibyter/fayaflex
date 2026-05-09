# FayaFlex

## Overview
FayaFlex is a team-based fitness tracking and competition platform designed to foster engagement and healthy competition. Users can track daily fitness activities, form or join teams, and compete in monthly challenges. The platform features real-time leaderboards, personalized progress tracking, and extensive integration capabilities for various fitness devices. FayaFlex aims to provide a motivating and interactive experience to encourage consistent fitness activity.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Tooling**: React with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI System**: Shadcn UI (built on Radix UI) with Tailwind CSS, adhering to fitness-optimized Material Design principles with a custom color palette and dark mode.
- **State Management**: TanStack Query for server state; local component state for UI.
- **PWA Implementation**: Full PWA support with offline capabilities, service worker, responsive design, and a touch-friendly UI.
- **Mobile-First**: Horizontal bottom navigation is the primary navigation.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, following a RESTful API design.
- **Authentication**: Multi-method authentication including username/password (Passport.js local strategy, Scrypt hashing) and WebAuthn/Passkey for biometric login. Supports session cookies (web) and JWT tokens (mobile). Zod validation is used on auth endpoints.
- **API Structure**: Comprehensive RESTful API for user, team, activity, leaderboard, notification, and passkey management.
- **Core Features**:
    - **Team Management**: CRUD operations for teams and member management.
    - **Activity Tracking**: Logging and retrieval of user activities, with support for evidence uploads.
    - **Leaderboards**: Real-time leaderboards for individuals and teams.
    - **Notifications**: Personalized daily motivational messages.
    - **Interactive Dashboard**: Clickable stat cards leading to detailed daily breakdowns and workout calendars.
    - **Social Features**: Reactions and comments on activity submissions with real-time counts.
    - **Victory Wall**: Team-based victory wall to showcase monthly champions.
    - **Email Privacy**: User emails are sanitized and hidden from other users.
    - **Goal Journeys**: Daily/weekly fitness goals with progress tracking.
    - **Auto-Posted Workouts**: Logging an activity with a workout type automatically creates a feed post summarizing duration, distance, calories, avg heart rate, elevation, and avg speed.

### Data Storage
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe queries.
- **Schema**: Includes users, teams, team_members, activities, device_connections, passkeys, sessions, activityReactions, activityComments, monthly_winners, passwordResetTokens, and userGoals.
- **Relationships**: Supports complex relationships for user, team, activity, and passkey data.

### Mobile Application
- **Platform**: Capacitor for iOS and Android native app deployment.
- **App ID**: com.fayaflex.app
- **Production Server**: https://fayaflex.com

## Security Notes

### Safe-by-design keys in `attached_assets/`
The following values look like secrets but are safe to commit. Future secret sweeps should not re-flag them:
- **Firebase iOS `API_KEY`** in `attached_assets/GoogleService-Info_*.plist` (e.g. values starting with `AIzaSy...`). Firebase iOS API keys are mobile-client identifiers, not secrets — Google expects them to ship inside iOS app bundles. Access is gated by Firebase Security Rules and the iOS bundle ID restriction, not by the key itself.

Anything else that looks like a credential in `attached_assets/` (OAuth tokens, JWTs, Bearer tokens, `AIza...` server keys, GitHub `gh*_` tokens, OpenAI `sk-` keys, Stripe keys, private keys, DB URLs with credentials, etc.) should be treated as a real leak — redact it from the working tree and rotate the underlying secret.

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts**: Inter font family for typography.

### Device Integrations
- **Apple Health**: Native iOS health data syncing via custom HealthKit Swift plugin.
- **Android Health Connect**: Native Android health data syncing via capacitor-health plugin.
- **Huawei Health Kit**: HMS-based health data syncing for Huawei/Honor devices.
- **Garmin Connect**: Direct Garmin API integration via OAuth 1.0a. Requires `GARMIN_CONSUMER_KEY` and `GARMIN_CONSUMER_SECRET` environment variables. Syncs activeKilocalories, steps, and workout sessions. A bridge option is available for users without API keys, directing them to sync Garmin via Apple Health or Health Connect.

### Key NPM Dependencies
- **Recharts**: Data visualization.
- **React Hook Form with Zod**: Form validation.
- **date-fns**: Date manipulation utilities.
- **Radix UI**: Accessible UI primitives.
- **Class Variance Authority**: Component variant management.
- **Sharp**: Server-side image compression.
- **SimpleWebAuthn**: WebAuthn/passkey authentication.
- **Framer Motion**: Animations for onboarding and UI transitions.
- **@southdevs/capacitor-google-auth**: Google authentication for Capacitor.
- **@capacitor-community/apple-sign-in**: Apple Sign-In for Capacitor.