# Luch Znaniy - Design Guidelines

## Authentication & Access

### Authentication Flow
**Auth Required** - Multi-user system with role-based access:
- **SSO Implementation**: Apple Sign-In (iOS required) + Google Sign-In
- **Invite Code System**: Each class has unique invite code (format: "9A-X7B3", "10B-Y8C4")
- **Onboarding Flow**:
  1. Welcome screen with app branding
  2. Sign in with SSO (Apple/Google)
  3. Enter invite code screen (validates class membership)
  4. Role selection if applicable (Student/Teacher)
  5. Profile setup (avatar, display name)

### Role-Based Access
Four distinct user roles with different app experiences:
- **Student**: Attendance check-in, view grades/homework, rate cafeteria, join events
- **Teacher**: Mark attendance, enter grades, create homework, view class analytics
- **Director**: Overview dashboard, school-wide analytics, reporting
- **Curator (Admin)**: Generate invite codes, manage users, create events, configure cafeteria menu, e-maktab sync

## Navigation Architecture

### Root Navigation: Tab Bar (5 Tabs)
Position core action in center tab:

1. **Home** (House icon) - Dashboard tailored to user role
2. **Schedule** (Calendar icon) - Timetable with even/odd week support
3. **Check-In** (Center FAB, Check icon) - Attendance marking (context-aware)
4. **Cafeteria** (Utensils icon) - Daily menu and ratings
5. **Profile** (User icon) - Settings, achievements, logout

### Secondary Navigation
- **Drawer**: Not used
- **Modals**: Event details, homework submission, QR scanner, grade entry forms
- **Stack Navigation**: News feed, events list, analytics screens

## Screen Specifications

### 1. Home Dashboard
**Purpose**: Role-specific overview and quick actions
- **Header**: Custom transparent header with school logo, notification bell (right)
- **Layout**: ScrollView with safe area insets (top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl)
- **Components**:
  - Welcome card with user name and avatar
  - Quick stats cards (attendance %, average grade, upcoming events)
  - Recent announcements list
  - Achievement badges (gamification)
- **Student View**: GPA tracker, upcoming homework, next event
- **Teacher View**: Today's classes, pending grade entries, class attendance summary
- **Director/Curator View**: School-wide metrics, pending approvals

### 2. Schedule Screen
**Purpose**: Display class timetable with yellow-themed design for memorization
- **Header**: Default navigation header with week toggle (Even/Odd), search disabled
- **Layout**: Custom calendar view (not scrollable root, internal scroll for time slots)
- **Visual Design**:
  - **Yellow Accent Theme**: Background uses warm yellow (#FFF8E1 to #FFECB3 gradient)
  - Subject cards have yellow borders (#FFC107) with white backgrounds
  - Current time indicator in bright yellow (#FFD700)
- **Components**:
  - Day selector (Mon-Sat horizontal scroll)
  - Time slots grid (8:00 AM - 3:00 PM)
  - Subject cards: Subject name, room number, teacher name
  - Empty slots show light yellow placeholder

### 3. Check-In Screen (Center Tab FAB)
**Purpose**: Quick attendance marking (context-aware by role)
- **Student Experience**:
  - Large "Check In" button (disabled after 9:05 AM)
  - QR code scanner button
  - Status indicator: "On Time" (green) or "Late" (red)
  - Today's attendance status
- **Teacher Experience**:
  - Class selector dropdown
  - Student list with checkboxes
  - "Mark All Present" quick action
  - Individual status toggles (Present/Absent/Late)
  - Submit button in header (right)
- **Layout**: Form layout, submit button in header
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### 4. Cafeteria Screen
**Purpose**: View daily menu, rate dishes, see predictions
- **Header**: Transparent header with date selector (left/right arrows)
- **Layout**: ScrollView
- **Components**:
  - Daily menu cards (First Course, Main Course, Salad, Drink)
  - Each card: Dish name, image placeholder, star rating (1-5)
  - Student view: Interactive star rating
  - Curator view: Edit menu button, AI prediction badge ("Expected: 247 portions")
  - Dish leaderboard (most/least popular)
- **Safe Area**: Top: headerHeight + Spacing.xl, Bottom: tabBarHeight + Spacing.xl

### 5. Events Screen (Modal from Home)
**Purpose**: Browse and manage school events
- **Header**: Default header with filter button (right)
- **Layout**: FlatList with pull-to-refresh
- **Components**:
  - Event cards: Title, date/time, type badge (School-wide/Class/Optional)
  - Participation status indicator
  - Photo thumbnails if available
  - Tap card → Event detail modal
- **Event Detail Modal**:
  - Full-screen modal with close button
  - Event image, description, participant list
  - "Confirm Attendance" button (floating, bottom)
  - Photo gallery section

### 6. Grades Screen (Nested in Home or Profile)
**Purpose**: View/manage academic performance
- **Student View**:
  - Subject cards with current average
  - Expandable to show all grades chronologically
  - Progress charts (line graph showing grade trends)
- **Teacher View**:
  - Class selector
  - Grid layout: Students (rows) × Subjects (columns)
  - Tap cell to enter grade (modal with number input)
  - Color-coded cells (green: A, yellow: B, orange: C, red: D/F)
- **Layout**: ScrollView with horizontal scroll for teacher grid
- **Safe Area**: Top: Spacing.xl (non-transparent header), Bottom: tabBarHeight + Spacing.xl

### 7. Homework Screen (Nested in Home)
**Purpose**: Assign and submit homework
- **Student View**: List of assignments with deadline countdown, status (Pending/Submitted/Graded)
- **Teacher View**: Create homework form (subject, description, deadline, attach files button)
- **Layout**: 
  - Student: FlatList
  - Teacher: ScrollView form with submit in header
- **Components**: File attachment picker, deadline date/time picker, rich text description

### 8. Profile/Settings Screen
**Purpose**: User preferences, achievements, account management
- **Header**: Default header with edit button (right)
- **Layout**: ScrollView
- **Components**:
  - User avatar (large, customizable)
  - Display name, role badge
  - Achievements section (unlocked badges with progress bars)
  - Settings sections: Notifications, Theme, Language
  - Account section (nested): Privacy policy, Terms, Delete account (double confirmation)
  - Logout button (with confirmation alert)
- **Safe Area**: Top: Spacing.xl, Bottom: tabBarHeight + Spacing.xl

## Design System

### Color Palette
**Primary Brand Colors**:
- Primary Purple: #7C3AED (buttons, active states)
- Primary Blue: #3B82F6 (links, info)
- Gradient: Purple to Blue (#7C3AED → #3B82F6)

**Schedule Yellow Theme**:
- Yellow Light: #FFF8E1 (background)
- Yellow Medium: #FFECB3 (cards)
- Yellow Accent: #FFC107 (borders, highlights)
- Yellow Bright: #FFD700 (current time indicator)

**Semantic Colors**:
- Success Green: #10B981 (on-time, good grades)
- Warning Orange: #F59E0B (late, average grades)
- Error Red: #EF4444 (absent, failing grades)
- Neutral Gray: #6B7280 (text), #F3F4F6 (backgrounds)

**Role Badge Colors**:
- Student: #3B82F6
- Teacher: #10B981
- Director: #F59E0B
- Curator: #EF4444

### Typography
- **Headlines**: System Bold, 24-28px
- **Titles**: System Semibold, 18-20px
- **Body**: System Regular, 16px
- **Captions**: System Regular, 14px
- **Labels**: System Medium, 12px (uppercase)

### Spacing System
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px

### Component Styles

**Cards**:
- White background with subtle shadow
- Border radius: 12px
- Padding: lg
- Shadow: shadowOffset (0, 2), shadowOpacity 0.10, shadowRadius 8

**Buttons**:
- Primary: Purple gradient, white text, bold, 16px
- Secondary: White background, purple border, purple text
- Floating Action Button (Check-In): Purple gradient, 56x56, shadow (offset: 0,2, opacity: 0.10, radius: 2)
- Border radius: 8px for standard, 28px for FAB
- Active state: 0.9 opacity with scale transform

**Input Fields**:
- Border: 1px solid #E5E7EB
- Focus border: 2px solid #7C3AED
- Border radius: 8px
- Padding: md vertical, lg horizontal

**List Items**:
- Touchable feedback: Light purple background (#F3E8FF) on press
- Separator: 1px solid #F3F4F6

**Status Badges**:
- Pill shape (fully rounded)
- Padding: xs horizontal, 2px vertical
- Font size: 12px, bold, uppercase

### Interactive Feedback
- All touchables: 0.7 opacity on press
- Buttons: Scale to 0.95 on press
- Floating buttons: Shadow intensity increases on press
- Lists: Background color change on press

## Critical Assets

### User Avatars (Generate 8 variations)
**Style**: Minimalist, geometric, school-themed
- Student with backpack (blue)
- Student with glasses (green)
- Teacher with book (purple)
- Teacher with apple (orange)
- Director with briefcase (gold)
- Curator with clipboard (red)
- Athlete with trophy (teal)
- Artist with palette (pink)

### Icons (Use Feather from @expo/vector-icons)
- Home: home
- Schedule: calendar
- Check-In: check-circle
- Cafeteria: coffee
- Profile: user
- Grades: bar-chart-2
- Homework: book-open
- Events: star
- Settings: settings
- Logout: log-out
- QR Scanner: maximize
- Notifications: bell
- Edit: edit-2
- Delete: trash-2
- Add: plus-circle

### Illustrations (Optional, content-driven)
- Empty state: No homework assigned (student with checkmark)
- Empty state: No events (calendar with confetti)
- Achievement unlock animation (star burst)
- Perfect attendance badge (calendar with star)

### Food Category Icons
- First Course: bowl icon
- Main Course: drumstick icon
- Salad: leaf icon
- Drink: coffee cup icon

## Accessibility
- Minimum touch target: 44x44 points
- Text contrast: WCAG AA compliance (4.5:1 for body text)
- Color is never the only indicator (use icons + text)
- VoiceOver/TalkBack labels for all interactive elements
- Dynamic type support for text scaling
- Haptic feedback for important actions (check-in success, grade saved)

## Gamification Elements
- Achievement badges: Circular, colored background, white icon
- Progress bars: Gradient fill (purple to blue)
- Leaderboard cards: Podium style (1st gold, 2nd silver, 3rd bronze)
- Streak counters: Fire icon with number
- Level indicators: Star rating system (1-5 filled stars)