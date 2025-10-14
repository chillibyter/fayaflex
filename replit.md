# Ultimate Fitness Challenge (UFC)

## Overview

Ultimate Fitness Challenge is a team-based fitness tracking and competition platform. Users can track their daily fitness activities (calories, steps, workouts), join or create teams, and compete against other teams in monthly challenges. The application features real-time leaderboards, progress tracking, and device integrations for automated data syncing.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (October 2025)

**Team Member Profile Viewing**
- Users can now view teammates' profiles and activities
- Evidence attachments visible to team members
- Access restricted to members who share at least one team

**Updated Leaderboard System**
- Personal leaderboard now shows only members from user's teams (team-scoped)
- Team leaderboard ranks by average daily calories per user (not total)
- Team-specific leaderboards available when clicking a team
- Global individual leaderboard hidden from UI
- User ranking remains global based on last 30 days calories

**Team Leaderboard Navigation** (October 12, 2025)
- Team cards on Teams page are now clickable - navigate to team-specific leaderboards
- Team entries in main leaderboard are clickable
- Team-specific leaderboard page shows individual member rankings
- Back navigation from team leaderboard to teams page
- All team leaderboard cards have hover effects for better UX

**Daily Motivational Notifications** (October 13, 2025)
- Personalized motivational messages displayed in notification center (bell icon in header)
- Three notification types generated daily:
  1. Daily Goal Progress - Always shown, personalized based on calorie progress
  2. Team Leader - Shown when user is leading their team in monthly calories
  3. Global Leader - Shown when user has burned most calories across all teams
- Notifications auto-generate on first app visit each day
- All messages personalized with user's first name
- Auto-refresh at midnight to clear old notifications
- Professional messaging without emojis
- Badge displays notification count in header

**Profile Avatar Selection** (October 13, 2025)
- 12 unique fitness-themed avatar icons for profile customization
- Icons include: Runner (Footprints), Cyclist (Bike), Swimmer (Wind), Weightlifter (Dumbbell), Energetic (Zap), Cardio (Heart), Climber (Mountain), Active (Activity), Champion (Trophy), Burner (Flame), Focused (Target), Endurance (Timer)
- Each avatar has distinct gradient background for visual distinction
- Avatar selector in profile edit dialog with grid layout
- Selected avatar displays on profile page with large icon
- Avatars persist across sessions and page refreshes
- All icons use Lucide React components (no emojis)

**Mobile Health Integration Backend** (October 13, 2025)
- Enhanced `/api/devices/sync` endpoint to accept bulk health data from mobile apps
- Supports Apple Health, Google Fit, and Garmin data sources
- Bulk sync up to 100 activities per request with duplicate detection
- Automatic merge/update logic: same date + same source = update existing
- Returns detailed sync results (created, updated, skipped counts)
- React Native + Expo setup guide created (see REACT_NATIVE_SETUP_GUIDE.md)
- Backend ready for mobile companion app development
- Note: Full mobile authentication requires token-based auth addition (future enhancement)

**Progressive Web App (PWA) - Mobile-Friendly Web Experience** (October 13, 2025)
- Complete PWA implementation with offline support and "Add to Home Screen" capability
- Web manifest with app metadata, theme colors, and shortcuts
- Service worker with network-first API strategy and cache-first asset loading
- Mobile-optimized responsive design across all pages
- Touch-friendly UI elements (minimum 44px touch targets)
- Mobile viewport configuration with proper scaling
- iOS and Android specific PWA meta tags
- SVG app icon with fitness-themed dumbbell design
- Activity submission now supports optional evidence attachments (fixed null handling)
- Mobile padding adjustments (16px on mobile, 24px on desktop)
- No horizontal scrolling on mobile viewports
- Tested and verified with mobile E2E tests

**Authentication Domain Fix** (October 13, 2025)
- Fixed "Unknown authentication strategy" error when logging in
- Added robust domain matching in Replit Auth configuration
- Authentication now falls back to primary domain if exact hostname match fails
- Supports both development and published domains seamlessly

**Custom Username/Password Authentication** (October 14, 2025)
- Replaced Replit Auth with custom in-app username/password authentication
- No external redirects - seamless login experience within the application
- Passport.js local strategy with scrypt password hashing (secure + timing-safe)
- Database schema updated: added nullable username/password fields to preserve 94 existing users
- Security features:
  - Password sanitization: all API responses exclude password field (even hashed)
  - Zod validation on all auth endpoints (register, login)
  - HttpOnly, secure session cookies stored in PostgreSQL
  - 7-day session TTL with automatic expiration
- Frontend: AuthProvider context, custom AuthPage with login/signup tabs
- Backend: /api/register, /api/login, /api/logout, /api/auth/user endpoints
- Session deserialization gracefully handles legacy Replit Auth users
- E2E tested: registration, login, logout, session persistence, protected routes

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
- Session-based authentication using Passport.js local strategy

**API Structure**
- `/api/register` - User registration with username/password
- `/api/login` - User login authentication
- `/api/logout` - User logout (session termination)
- `/api/auth/user` - Get current authenticated user
- `/api/teams` - Team CRUD operations and member management
- `/api/activities` - Activity logging and retrieval with filtering
- `/api/leaderboard` - Ranking calculations for individuals and teams
- `/api/notifications` - Daily motivational message generation and retrieval
- Middleware for authentication and request logging

**Authentication & Authorization**
- Custom username/password authentication via Passport.js local strategy
- Scrypt password hashing with random salt and timing-safe comparison
- Session storage in PostgreSQL via connect-pg-simple
- Zod validation on all auth endpoints (register, login)
- Password sanitization: responses never include password field
- Protected routes using `isAuthenticated` middleware
- User sessions tied to database for persistence across server restarts
- 7-day session TTL with httpOnly, secure cookies

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