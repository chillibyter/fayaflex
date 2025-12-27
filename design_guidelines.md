# Ultimate Fitness Challenge (UFC) - Design Guidelines

## Design Approach

**Hybrid Approach**: Fitness-Optimized Material Design
- Primary references: Strava (social fitness energy), Apple Fitness+ (clean data presentation), Peloton (motivational design)
- Foundation: Material Design principles for cross-platform consistency
- Focus: Data clarity, motivational aesthetics, and competitive engagement

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**
- Primary Brand: 142 85% 45% (vibrant teal-green - energetic, fitness-focused)
- Background Base: 220 15% 12% (deep navy-gray)
- Surface: 220 12% 18% (elevated cards)
- Text Primary: 0 0% 98%
- Text Secondary: 220 10% 65%
- Success/Achievement: 142 70% 50% (bright green)
- Warning/Goal: 25 95% 55% (energetic orange)
- Chart Accent 1: 270 80% 60% (purple for variety)
- Chart Accent 2: 200 85% 50% (cyan for contrast)

**Light Mode**
- Primary Brand: 142 75% 38%
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Text Primary: 220 20% 15%
- Text Secondary: 220 10% 45%

### B. Typography

**Font Stack**: 'Inter' (via Google Fonts) for clean readability across data-heavy interfaces
- Display/Hero: 700 weight, tracking-tight, 3xl-4xl sizes
- Headings: 600 weight, tracking-tight, xl-2xl sizes
- Body: 400 weight, normal tracking, base-lg sizes
- Data/Stats: 500-700 weight (tabular numbers), lg-3xl sizes
- Captions/Labels: 500 weight, text-sm

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: space-y-8 to space-y-12
- Card gaps: gap-4 to gap-6
- Container max-width: max-w-7xl

**Grid Structure**
- Mobile: Single column stack
- Tablet: 2-column for stats/cards (md:grid-cols-2)
- Desktop: 3-column for leaderboard cards (lg:grid-cols-3)
- Dashboard: Asymmetric grid (2/3 main content, 1/3 sidebar)

### D. Component Library

**Navigation**
- Sidebar navigation (desktop): White background, green active states
- Bottom tab bar (mobile): Home, Teams, Track, Leaderboard, Profile
- Top header with sidebar trigger and theme toggle
- Sticky positioning with subtle shadow on scroll
- Active menu items: bg-green-50 text-green-600

**Stats Cards**
- Colored icon backgrounds matching metric type:
  - Calories: bg-orange-50 with text-orange-500 icon
  - Steps: bg-blue-50 with text-blue-500 icon
  - Workouts: bg-purple-50 with text-purple-500 icon
  - Rank: bg-yellow-50 with text-yellow-500 icon
- White card background with shadow-sm
- Trend indicators: green for increase, red for decrease
- Personal best display with Award icon

**Data Entry Forms**
- Large touch targets (min 44px height)
- Green focus rings (focus:ring-green-500)
- Segmented controls for workout type selection
- Number steppers for calories/steps with quick increment buttons (+100, +500)
- Date picker with calendar view and "Today" quick select
- Prominent "Submit Entry" CTA button (full-width on mobile, bg-green-600)

**Leaderboard**
- Gradient header: bg-gradient-to-r from-yellow-500 to-orange-500
- White text on gradient header
- Pill-style tabs: bg-green-600 text-white when active, bg-gray-200 when inactive
- White card container with rounded-xl and shadow-sm
- Current user row highlighted with bg-green-50

**Auth Pages**
- Green gradient hero section: bg-gradient-to-br from-green-500 to-green-600
- White text on hero background
- Form card with shadow-lg
- Green primary buttons for actions

**Team Management**
- Team cards with cover photo area (gradient fallback)
- Member count and activity status
- Invite link generator with copy button
- Member list with avatars in overlapping stack

**Data Visualization**
- Bar chart: rounded corners, gradient fills
- Grid lines: subtle (opacity-20)
- Axes labels: text-sm, text-secondary
- Tooltip on hover: elevated card with blur background
- Monthly view selector: chip-style toggles

**Stats Dashboard**
- Metric cards: large number (3xl-4xl), label below, icon accent
- Circular progress rings for goals
- Streak indicators with flame icons
- Recent activity feed with timeline design

### E. Integration Displays

**Apple Health/Garmin Sync**
- Connection status badge (connected: green dot, disconnected: gray)
- Last sync timestamp
- Manual refresh button with spinning animation
- Data source indicator icon next to each metric

### F. Motivational Elements

**Achievements**
- Badge collection grid
- Unlock animations (scale + fade)
- Progress toward next badge
- Celebration confetti on milestones

**Progress Indicators**
- Linear progress bars with gradient fills
- Circular progress for daily goals
- Animated counter on data submission
- Comparison arrows (trending up/down)

### G. Empty States

- Illustration placeholders (use heroicons as graphics basis)
- Encouraging copy ("Start your first challenge!")
- Clear CTA to take action
- Light background pattern (subtle dots/grid)

## Images

**Hero Section**: Full-width energetic fitness imagery
- Athletes in action, diverse group workouts, or celebratory fitness moments
- Apply gradient overlay (from primary brand color) for text readability
- Height: 60vh on desktop, 40vh on mobile

**Team Cards**: Cover photos (16:9 aspect ratio)
- Team photos, workout scenes, or abstract fitness patterns
- Fallback to gradient if no image uploaded

**Empty States**: Minimalist line illustrations
- Simple icon-based graphics for "No data yet" scenarios
- Teal-green accent color matching brand

This design creates a motivating, data-rich experience that balances competitive energy with clear usability across iOS and Android platforms.