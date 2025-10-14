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
- **Authentication**: Custom username/password authentication using Passport.js local strategy with Scrypt hashing. Supports both session cookies (web) and JWT tokens (mobile) for authentication. Session storage in PostgreSQL. Zod validation on auth endpoints.
- **API Structure**: Comprehensive API for user, team, activity, leaderboard, and notification management. Includes dedicated endpoints for mobile token generation and device integrations.
- **Core Features**:
    - **Team Management**: CRUD operations for teams, member management, and challenge archiving.
    - **Activity Tracking**: Logging and retrieval of user activities, with support for evidence uploads (compressed WebP, 24-hour retention).
    - **Leaderboards**: Real-time leaderboards for individuals and teams, with team-scoped and global rankings.
    - **Notifications**: Personalized daily motivational messages based on user progress and leaderboard status.
    - **Interactive Dashboard**: Clickable stat cards leading to detailed daily breakdowns and workout calendars using Recharts.

### Data Storage
- **Database**: PostgreSQL (Neon serverless) managed with Drizzle ORM for type-safe queries.
- **Schema**: Includes users, teams, team_members, activities, device_connections, and sessions.
- **Relationships**: Supports complex relationships like users owning multiple teams, many-to-many team memberships, and activities linked to users/teams.

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

## Recent Changes

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