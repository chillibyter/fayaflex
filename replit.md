# Ultimate Fitness Challenge (UFC)

## Overview

Ultimate Fitness Challenge is a team-based fitness tracking and competition platform. Users can track their daily fitness activities (calories, steps, workouts), join or create teams, and compete against other teams in monthly challenges. The application features real-time leaderboards, progress tracking, and device integrations for automated data syncing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React with TypeScript for type-safe component development
- Vite as the build tool and dev server for fast development experience
- Wouter for lightweight client-side routing
- TanStack Query for server state management and data fetching

**UI System**
- Shadcn UI component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows fitness-optimized Material Design principles
- Dark mode support with theme toggle functionality
- Custom color palette focused on fitness/motivational aesthetics (teal-green primary, energetic accents)

**State Management Strategy**
- TanStack Query handles all server state (user data, teams, activities, leaderboards)
- Local component state for UI interactions
- Session-based authentication state managed via API queries
- No global state management library needed due to server-first approach

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- RESTful API design pattern
- Session-based authentication using Replit Auth (OpenID Connect)

**API Structure**
- `/api/auth/*` - Authentication endpoints (user session, login/logout)
- `/api/teams` - Team CRUD operations and member management
- `/api/activities` - Activity logging and retrieval with filtering
- `/api/leaderboard` - Ranking calculations for individuals and teams
- Middleware for authentication and request logging

**Authentication & Authorization**
- Replit Auth integration via OpenID Connect/Passport.js
- Session storage in PostgreSQL via connect-pg-simple
- Protected routes using `isAuthenticated` middleware
- User sessions tied to database for persistence across server restarts

### Data Storage

**Database**
- PostgreSQL via Neon serverless with WebSocket support
- Drizzle ORM for type-safe database queries and schema management
- Schema includes: users, teams, team_members, activities, device_connections, sessions

**Key Relationships**
- Users can own multiple teams (one-to-many)
- Users can belong to multiple teams via team_members junction table (many-to-many)
- Activities belong to individual users with team association (one-to-many)
- Device connections link users to external fitness services (one-to-many)

**Data Access Patterns**
- Storage abstraction layer (IStorage interface) for testability
- Parameterized queries for filtering (monthly/yearly activity aggregation)
- Invite code system for team joining functionality

### External Dependencies

**Third-Party Services**
- Replit Auth: OpenID Connect authentication provider
- Neon Database: Serverless PostgreSQL hosting
- Google Fonts: Inter font family for typography

**Device Integrations** (MVP placeholder UI implemented)
- Apple Health for iOS users - automatic activity syncing (placeholder)
- Google Fit / Android Health for Android users - automatic activity syncing (placeholder)
- Garmin Connect for fitness device integration (placeholder)
- Device connection storage with provider-specific tokens and sync status tracking

**Development Tools**
- Replit-specific Vite plugins for error overlay, cartographer, and dev banner
- ESBuild for production server bundling
- Drizzle Kit for database migrations

**Key NPM Dependencies**
- Recharts for data visualization (progress charts)
- React Hook Form with Zod for form validation
- date-fns for date manipulation
- Radix UI components for accessible UI primitives
- Class Variance Authority for component variant management