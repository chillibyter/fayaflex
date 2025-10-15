# Ultimate Fitness Challenge (UFC)

## Overview
Ultimate Fitness Challenge (UFC) is a team-based fitness tracking and competition platform designed to foster engagement and healthy competition. Users can track daily fitness activities (calories, steps, workouts), form or join teams, and compete in monthly challenges. The platform features real-time leaderboards, personalized progress tracking, and integration capabilities for various fitness devices. UFC aims to provide a motivating and interactive experience to encourage consistent fitness activity among its users.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework & Tooling**: React with TypeScript, Vite, Wouter for routing, TanStack Query for server state.
- **UI System**: Shadcn UI (built on Radix UI) with Tailwind CSS for utility-first styling. Adheres to fitness-optimized Material Design principles with a custom color palette and dark mode support.
- **State Management**: Primarily TanStack Query for server state; local component state for UI; session-based auth via API.
- **PWA Implementation**: Full PWA support with offline capabilities, service worker (network-first API, cache-first assets), responsive design, touch-friendly UI, and platform-specific meta tags.

### Backend Architecture
- **Server Framework**: Express.js with TypeScript, following a RESTful API design.
- **Authentication**: Multi-method authentication system:
  - Username/password using Passport.js local strategy with Scrypt hashing
  - WebAuthn/Passkey authentication for biometric login (fingerprint, Face ID)
  - Supports both session cookies (web) and JWT tokens (mobile)
  - Session storage in PostgreSQL, Zod validation on auth endpoints
- **API Structure**: Comprehensive API for user, team, activity, leaderboard, notification, and passkey management. Includes dedicated endpoints for mobile token generation and device integrations.
- **Core Features**:
    - **Team Management**: CRUD operations for teams, member management, and challenge archiving.
    - **Activity Tracking**: Logging and retrieval of user activities, with support for evidence uploads (compressed WebP, 24-hour retention).
    - **Leaderboards**: Real-time leaderboards for individuals and teams, with team-scoped and global rankings.
    - **Notifications**: Personalized daily motivational messages based on user progress and leaderboard status.
    - **Interactive Dashboard**: Clickable stat cards leading to detailed daily breakdowns and workout calendars using Recharts.

### Data Storage
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe queries.
- **Schema**: Includes users, teams, team_members, activities, device_connections, passkeys, and sessions.
- **Relationships**: Supports complex relationships like users owning multiple teams, many-to-many team memberships, activities linked to users/teams, and passkeys linked to users.

## External Dependencies

### Third-Party Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Google Fonts**: Inter font family for typography.

### Device Integrations
- **Apple Health**: Placeholder for iOS health data syncing.
- **Google Fit / Android Health**: Placeholder for Android health data syncing.
- **Garmin Connect**: Placeholder for fitness device integration, including OAuth infrastructure and webhook receiver.

### Development Tools
- **Replit-specific Vite plugins**: For error overlay, cartographer, and dev banner.
- **ESBuild**: For production server bundling.
- **Drizzle Kit**: For database migrations.

### Key NPM Dependencies
- **Recharts**: For data visualization on the dashboard.
- **React Hook Form with Zod**: For robust form validation.
- **date-fns**: For date manipulation utilities.
- **Radix UI**: For accessible UI primitives.
- **Class Variance Authority**: For managing component variants.
- **Sharp**: For server-side image compression.
- **SimpleWebAuthn**: For WebAuthn/passkey authentication (server and browser libraries).

## Recent Changes

**Case-Insensitive Usernames** (October 15, 2025)
- Implemented case-insensitive username authentication
- **Login**: Users can now login with any case variation of their username (e.g., "JohnDoe", "johndoe", "JOHNDOE" all work)
- **Registration**: Prevents duplicate usernames with different casing (e.g., cannot register "testuser" if "TestUser" exists)
- **Implementation**: Uses SQL LOWER() function for case-insensitive comparison in database queries
- Tested and verified with multiple case variations

**Dashboard Performance & Bug Fix** (October 15, 2025)
- Fixed critical dashboard loading error in production
- **Issue**: Dashboard stats endpoint was failing for users not in teams and making inefficient database queries
- **Solution**: Refactored global rank calculation to use all users instead of only team members
- **Performance**: Reduced N+1 database queries by implementing getAllUsers() method
- **Behavior**: Users with no activities now correctly show rank #0; users with activities get proper rankings
- Tested and verified with both empty and active user accounts

**OAuth Social Login Removal** (October 15, 2025)
- Removed OAuth social login implementation (Google, Facebook, Apple) per user request
- Removed migrate account feature from AuthPage
- Cleaned up OAuth database schema, routes, storage methods, and dependencies
- Dropped oauth_providers table and removed 94 legacy Replit auth users from database
- Updated authentication to support only username/password and passkey/biometric login

**WebAuthn/Passkey Authentication** (October 14, 2025)
- Biometric login support using WebAuthn/Passkey authentication (fingerprint, Face ID, etc.)
- Implementation:
  - Backend: SimpleWebAuthn server library for registration/authentication
  - Frontend: SimpleWebAuthn browser library for WebAuthn API interaction
  - Database: Passkeys table storing credentialID, publicKey, counter, device metadata
  - Storage layer: CRUD methods for passkey operations
  - Routes: Four endpoints (register/verify for registration, login/verify for authentication)
  - AuthPage: "Sign in with Passkey" button on login tab with username input
  - Profile page: Security section for passkey registration and management
- Password generator utility:
  - Cryptographically secure password generation using Web Crypto API
  - 16-character passwords with mixed case, numbers, and special characters
  - Copy-to-clipboard functionality in Profile security section
- Security: Challenge-response flow prevents replay attacks, counter tracking prevents credential cloning

**Activity Source Indicators** (October 14, 2025)
- Visual badges show whether activities were logged manually or synced from devices
- Source types supported:
  - Manual Entry: Edit3 icon + "Manual Entry" label
  - Apple Health: Apple icon + "Apple Health" label  
  - Garmin: Garmin icon + "Garmin" label
  - Android Health: Smartphone icon + "Android Health" label
- Implementation:
  - Database: Activities table has "source" field (defaults to 'manual')
  - Helper function getSourceInfo() maps source values to icons/labels
  - Dashboard: Shows source badge in Recent Activity section
  - UserProfile (/users/:userId/profile): Shows source badge on activity cards
  - Profile (/profile): Shows stats and progress chart only (no activity list)
- Route update: Fixed UserProfile route from /user/:userId to /users/:userId/profile
- E2E tested: Manual entry displays correct badge on Dashboard