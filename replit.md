# Luch Znaniy - School Management Mobile App

## Overview

Luch Znaniy is a comprehensive school management mobile application built with React Native (Expo) and Express.js. The app provides a unified platform for students, teachers, directors, and curators to manage academic activities including attendance tracking, grades, homework, cafeteria services, and school events. The system uses role-based access control with invite codes for class enrollment and supports both even/odd week scheduling common in educational institutions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54 (new architecture enabled)
- **Navigation**: React Navigation v7 with a hybrid structure:
  - Bottom tab navigator for main sections (Home, Schedule, Check-In, Cafeteria, Profile)
  - Native stack navigators for each tab's screen hierarchy
  - Modal presentations for secondary content (Homework, Events, Announcements)
- **State Management**: 
  - React Context for auth state (`AuthContext`) and app data (`AppContext`)
  - TanStack React Query for server state management
- **Styling**: Custom theming system with light/dark mode support, consistent spacing/border radius tokens
- **Animations**: React Native Reanimated for smooth UI interactions

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Design**: RESTful endpoints prefixed with `/api`
- **Storage**: Abstracted storage interface (`IStorage`) with in-memory implementation for development

### Authentication Flow
- Invite code-based enrollment (format: "9A-X7B3", "10B-Y8C4")
- Four user roles: Student, Teacher, Director, Curator
- Mock authentication currently implemented in `AuthContext`

### Key Design Patterns
- Path aliases (`@/` for client, `@shared/` for shared code)
- Shared schema definitions between frontend and backend using Drizzle + Zod
- Component-based UI with reusable themed components (ThemedText, ThemedView, Card, Button)
- Error boundary pattern for graceful error handling

### Project Structure
```
client/           # React Native app code
  components/     # Reusable UI components
  screens/        # Screen components
  navigation/     # Navigation configuration
  context/        # React Context providers
  hooks/          # Custom React hooks
  constants/      # Theme and design tokens
  lib/            # Utilities (API client, query client)
server/           # Express.js backend
  routes.ts       # API route definitions
  db.ts           # Database connection
  storage.ts      # Data storage abstraction
shared/           # Shared code (schema definitions)
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (configured via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries with schema validation via drizzle-zod

### Mobile Platform
- **Expo**: Managed workflow with custom native modules
- **Expo Modules**: blur, haptics, image, linear-gradient, splash-screen, status-bar, web-browser

### Key Libraries
- **React Navigation**: Tab and stack navigation
- **TanStack React Query**: Server state caching and synchronization
- **React Native Reanimated**: High-performance animations
- **React Native Gesture Handler**: Touch gesture handling
- **Zod**: Runtime type validation for API schemas

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint + Prettier**: Code quality and formatting
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development server