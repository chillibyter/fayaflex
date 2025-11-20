# Ultimate Fitness Challenge (UFC)

## Overview
Ultimate Fitness Challenge (UFC) is a team-based fitness tracking and competition platform designed to foster engagement and healthy competition. Users can track daily fitness activities (calories, steps, workouts), form or join teams, and compete in monthly challenges. The platform features real-time leaderboards, personalized progress tracking, and integration capabilities for various fitness devices. UFC aims to provide a motivating and interactive experience to encourage consistent fitness activity among its users.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Tooling**: React with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI System**: Shadcn UI (built on Radix UI) with Tailwind CSS, adhering to fitness-optimized Material Design principles with custom color palette and dark mode.
- **State Management**: TanStack Query for server state; local component state for UI; session-based auth via API.
- **PWA Implementation**: Full PWA support with offline capabilities, service worker, responsive design, and touch-friendly UI.

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

### Data Storage
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe queries.
- **Schema**: Includes users, teams, team_members, activities, device_connections, passkeys, sessions, activityReactions, activityComments, monthly_winners, and passwordResetTokens.
- **Relationships**: Supports complex relationships for user, team, activity, and passkey data.

### Mobile Application
- **Platform**: Capacitor for iOS and Android native app deployment.

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts**: Inter font family for typography.

### Device Integrations
- **Apple Health**: Native iOS health data syncing via capacitor-health plugin.
- **Android Health Connect**: Native Android health data syncing via capacitor-health plugin.
- **Native-Only Approach**: Simplified direct device access without complex OAuth flows.

### Key NPM Dependencies
- **Recharts**: Data visualization.
- **React Hook Form with Zod**: Form validation.
- **date-fns**: Date manipulation utilities.
- **Radix UI**: Accessible UI primitives.
- **Class Variance Authority**: Component variant management.
- **Sharp**: Server-side image compression.
- **SimpleWebAuthn**: WebAuthn/passkey authentication (server and browser libraries).

## Recent Changes

**Native Health Integration Implemented** (November 20, 2025)
- Implemented simplified native-only health integration (Option 3) with Apple Health and Android Health Connect
- **Architecture Decision**: Direct device access only via Capacitor Health plugin, no OAuth complexity
- **Backend Implementation**:
  - Removed complex OAuth code (Google Fit, Garmin) from server
  - Three clean API endpoints supporting only apple_health and android_health:
    - GET /api/devices - Returns native device connections
    - POST /api/devices/sync - Auto-creates connections on first sync, imports health data
    - POST /api/devices/toggle - Disconnect device
  - Backend auto-creates device connections on first sync (no pre-connection required)
- **Frontend Implementation**:
  - Created native health service using capacitor-health plugin
  - Built HealthDevices UI component with connect/sync/disconnect functionality
  - Integrated into Profile page with web platform guards (hidden on web builds)
  - Manual sync triggered by user button press
- **Mobile Configuration**:
  - Android: Health Connect permissions added to AndroidManifest.xml
  - iOS: Capacitor Health plugin configured for Apple Health access
- **Platform Guards**: HealthDevices checks Capacitor.isNativePlatform() to show only on iOS/Android
- **Documentation**: HEALTH_INTEGRATIONS_STATUS.md documents the simplified approach
- **Schema**: Device connections support apple_health and android_health providers

**Required Team Selection on Signup** (October 18, 2025)
- Implemented mandatory team selection flow for new users
- **User Experience**:
  - After signup/login, users without teams are redirected to team selection page
  - Cannot access main app (dashboard, tracking, leaderboard) until on a team
  - Team selection page offers two options: join existing team or create new team
- **Frontend Changes**:
  - Created `TeamSelection.tsx` page with tabbed interface (Join/Create)
  - Join tab: Search and browse available teams, see member counts
  - Create tab: Form to create new team with name and optional description
  - Updated `App.tsx` router to check user's team membership and enforce team selection
- **Routing Logic**:
  - Checks `/api/teams` endpoint to see if user has any teams
  - If `teams.length === 0`, all routes redirect to `/team-selection`
  - After joining/creating team, redirects to dashboard and invalidates team queries
- **Design**: Clean, welcoming UI with Trophy icon, clear instructions, search functionality