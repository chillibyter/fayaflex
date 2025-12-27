# Ultimate Fitness Challenge - Complete Designer Guide

## App Overview
UFC is a team-based fitness tracking and competition platform. Users track daily fitness activities, form/join teams, and compete in monthly challenges.

---

## 1. Authentication Journey

### Pages: `/auth`, `/reset-password`

| Screen | Purpose | Key Elements |
|--------|---------|--------------|
| **Login** | Existing user sign-in | Username + password fields, "Forgot password?" link, Passkey login button |
| **Register** | New user signup | Username, password, email (required), first/last name (optional) |
| **Forgot Password** | Request password reset | Email input, sends reset link (via email when configured) |
| **Reset Password** | Set new password | New password input, confirm password, token validation |

**Backend Capabilities:**
- `POST /api/login` - Username/password auth
- `POST /api/register` - Create new account
- `POST /api/auth/forgot-password` - Request reset email
- `POST /api/auth/reset-password` - Update password with token
- Passkey/biometric authentication support

---

## 2. Onboarding Journey

### Triggered: After first login (if no activities logged)

| Step | Content |
|------|---------|
| 1 | Welcome message, app purpose |
| 2 | Scoring explanation: 1 point per calorie + 1 point per step |
| 3 | Team vs Individual leaderboards |
| 4 | Monthly reset timeline |
| 5 | Victory Wall concept |

**Note:** Stored in localStorage as `ufc_onboarding_seen_{userId}`

---

## 3. Team Selection Journey

### Page: `/team-selection` (Required for new users)

| Tab | Action | Backend |
|-----|--------|---------|
| **Join Team** | Search existing teams, enter invite code | `POST /api/teams/join` |
| **Create Team** | Enter team name + description | `POST /api/teams` |

**Business Rules:**
- Users MUST be on at least one team to access the app
- Teams can have up to 20 members
- Each team has a unique invite code

---

## 4. Dashboard Journey

### Page: `/` (Home)

| Section | Data Available | Backend Endpoint |
|---------|----------------|------------------|
| **Stats Cards** | Calories, Steps, Workouts, Rank, Percentile | `GET /api/dashboard/stats` |
| **Progress Chart** | Weekly calories visualization | `GET /api/progress/chart` |
| **Recent Activities** | Last 3 logged activities | `GET /api/activities` |
| **Goal Journeys** | Active goals with progress | `GET /api/goals/active` |
| **Quick Start Card** | Shows if no activities logged (CTA to log first activity) | - |

**Stats Card Data Fields:**
| Field | Description |
|-------|-------------|
| `totalCalories` | Total this month |
| `totalSteps` | Total this month |
| `workoutCount` | Days with workouts |
| `rank` | Global position |
| `percentile` | Top X% |
| `caloriesTrend` | % change vs last month |
| `stepsTrend` | % change vs last month |
| `badgeCount` | Total badges earned |
| `personalBests` | Record values for calories/steps/score |

**Clickable Elements:**
- Stats cards → Daily breakdown pages
- Recent activities → Full activity list

---

## 5. Track Activity Journey

### Page: `/track`

| Tab | Purpose | Backend |
|-----|---------|---------|
| **Manual Entry** | Log calories, steps, workout type | `POST /api/activities` |
| **Fitness Devices** | Connect/sync health devices | `POST /api/devices/sync` |

**Activity Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `date` | Date | Yes | YYYY-MM-DD format |
| `calories` | Number | Yes | Min 0 |
| `steps` | Number | Yes | Min 0 |
| `workoutType` | String | No | e.g., "running", "weights" |
| `notes` | String | No | User notes |
| `evidenceUrl` | String | No | Photo upload path |

**Device Providers:**
- `apple_health` - iOS only
- `android_health` - Android only
- `huawei_health` - Huawei devices

---

## 6. Leaderboard Journey

### Page: `/leaderboard`

| Tab | Shows | Backend Endpoint |
|-----|-------|------------------|
| **Teams** | Team rankings by avg calories | `GET /api/leaderboard/teams` |
| **Calories** | Individual by total calories | `GET /api/leaderboard/category/calories` |
| **Steps** | Individual by total steps | `GET /api/leaderboard/category/steps` |
| **Workouts** | Individual by workout days | `GET /api/leaderboard/category/workouts` |

**Leaderboard Entry Fields:**
| Field | Description |
|-------|-------------|
| `rank` | Position number |
| `name` | User/team name |
| `calories` | Total calories |
| `steps` | Total steps |
| `workouts` | Workout day count |
| `avatarId` | For profile picture |
| `isCurrentUser` | Highlight current user |

**Important:** Leaderboards reset on the 1st of each month

---

## 7. Teams Journey

### Pages: `/teams`, `/teams/:teamId`, `/teams/:teamId/victory-wall`, `/create-team`

| Page | Purpose | Key Actions |
|------|---------|-------------|
| **Teams List** | View all user's teams | Join new team, share invite, view team leaderboard |
| **Team Leaderboard** | Rankings within one team | See individual scores for team members |
| **Victory Wall** | Monthly champion history | View past winners, calculate winner (owner only) |
| **Create Team** | Start new team | Set name, description |

**Team Data:**
| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `name` | Team display name |
| `description` | Optional description |
| `inviteCode` | Share to invite others |
| `ownerId` | Team creator |
| `memberCount` | Current member count |
| `isOwner` | Boolean for current user |

---

## 8. Profile Journey

### Pages: `/profile`, `/users/:userId/profile`

| Section | Data | Backend |
|---------|------|---------|
| **User Info** | Name, avatar, username | `GET /api/auth/user` |
| **Edit Profile** | Update name, choose avatar | `PATCH /api/auth/user` |
| **Stats Summary** | Total workouts, current streak | `GET /api/profile/stats` |
| **Badges** | Earned achievements | `GET /api/badges` |
| **Personal Bests** | Record values | `GET /api/personal-bests` |
| **Passkey Management** | Register biometric login | `GET /api/passkeys` |
| **Health Devices** | Connect/disconnect devices (mobile only) | `GET /api/devices` |

**Badge Types Available:**
| Badge | Trigger |
|-------|---------|
| `first_activity` | Log first activity |
| `streak_3` | 3-day streak |
| `streak_7` | 7-day streak |
| `streak_30` | 30-day streak |
| `steps_10k` | 10,000 steps in one day |
| `calories_1k` | 1,000 calories in one day |
| `workouts_10` | 10 workout days |
| `top_10` | Reach top 10 on leaderboard |
| `champion` | Win a monthly challenge |

---

## 9. Goal Journeys

### Component: Integrated into Dashboard

| Goal Type | Duration |
|-----------|----------|
| **Daily** | Single calendar day |
| **Weekly** | Monday through Sunday |

| Category | Tracks |
|----------|--------|
| **Calories** | Total burned |
| **Steps** | Total walked |
| **Workouts** | Session count |

**Goal State Fields:**
| Field | Description |
|-------|-------------|
| `targetValue` | User-set goal |
| `currentValue` | Auto-calculated progress |
| `progressPercentage` | 0-100% |
| `isCompleted` | Auto-set when target reached |
| `startDate` / `endDate` | Goal window |

**Business Rules:**
- One active goal per combination (e.g., one daily calories goal at a time)
- Max 6 active goals: 3 categories x 2 types
- Goals auto-complete when progress >= target
- Cannot edit goals after creation

---

## 10. Social Features

### Available on Activities

| Feature | Backend Endpoints |
|---------|-------------------|
| **Reactions** | `POST/DELETE /api/activities/:id/reactions` |
| **Comments** | `POST/DELETE /api/activities/:id/comments` |

**Reaction Types:** thumbs_up, thumbs_down

---

## 11. How It Works

### Page: `/how-it-works`

| Section | Content |
|---------|---------|
| Scoring formula | 1 point per calorie + 1 point per step |
| Leaderboard types | Team vs Individual |
| Monthly timeline | Resets on the 1st |
| Tips | Log activities, join teams, earn badges, set goals |
| FAQ | Common questions |

---

## Navigation Structure

**Sidebar Items:**
1. Dashboard (home)
2. Track Activity
3. Leaderboard
4. Teams
5. Profile
6. How It Works

---

## Design Consistency Notes

| Category | Color/Icon Suggestion |
|----------|----------------------|
| Calories | Orange/Flame icon |
| Steps | Blue/Footprints icon |
| Workouts | Purple/Dumbbell icon |
| Teams | Green/Users icon |
| Badges | Gold/Award icon |

Use these consistently across Dashboard, Leaderboard, Goals, and Profile pages.

---

## UX States to Design

For each feature, designers should create:

1. **Empty State** - No data yet (first-time user)
2. **Loading State** - Data being fetched
3. **Error State** - Something went wrong + retry option
4. **Success State** - Normal view with data
5. **Edge Cases** - Max limits reached, permissions denied, etc.

---

## Monthly Reset Timeline

| Date | Event |
|------|-------|
| 1st of month | All leaderboards reset to zero |
| Throughout month | Users log activities, compete |
| End of month | Team owner can calculate winner |
| After calculation | Winner added to Victory Wall |

---

## Privacy Notes

- User emails are hidden from other users
- Profile viewing limited to teammates only
- Activity viewing limited to teammates only
