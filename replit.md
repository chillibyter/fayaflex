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

## Branding

- **App Name**: FayaFlex
- **App ID**: com.fayaflex.app
- **Support Email**: support@fayaflex.com
- **Feedback Email**: feedback@fayaflex.com
- **Logo**: /fayaflex-logo.png
- **Production Domain**: https://www.fayaflex.com
