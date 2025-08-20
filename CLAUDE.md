# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```
Access at http://localhost:3001

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm run start
```

**Lint code:**
```bash
npm run lint
```

## Architecture Overview

This is a Next.js 15 todo/task management application called "CarpeDoEm" built with:
- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript with strict mode
- **Authentication:** Google OAuth via Passport.js
- **Backend Integration:** FastAPI backend at `http://0.0.0.0:8080`

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # Internal API routes (proxy to backend)
│   ├── dashboard/         # Main dashboard page
│   ├── login/            # Authentication pages
│   └── layout.tsx        # Root layout with Inter font
├── components/           # Reusable React components
│   ├── Layout.tsx        # Generic page layout wrapper
│   ├── Sidebar.tsx       # Navigation sidebar
│   ├── Topbar.tsx        # Top navigation bar
│   └── [Create*.tsx]     # Form components for creating resources
└── lib/                  # Business logic and API clients
    ├── tasks.ts          # Task management API functions
    ├── lists.ts          # List management API functions
    ├── users.ts          # User management API functions
    ├── passport.js       # Google OAuth configuration
    └── session.js        # Session management
```

### Key Components

**DashboardClient** (`src/app/dashboard/DashboardClient.tsx`):
- Main application interface with three-panel layout
- Left sidebar: Navigation and user profile
- Center: Task list view with inline editing
- Right sidebar: Task details panel
- Uses hardcoded mock data currently (lines 49-55)
- Implements task completion toggling and inline name editing

**API Integration** (`src/lib/`):
- Complete TypeScript API client for FastAPI backend
- Task operations: CRUD, toggle completion/priority/recurring
- List operations: create, update, delete, version management
- User operations: authentication, profile management
- All functions include proper error handling

### Backend Integration

The application connects to a FastAPI backend documented in `backend_api.md`:
- **Base URL:** `http://0.0.0.0:8080`
- **Authentication:** Google OAuth + JWT tokens
- **Resources:** Users, Lists, Tasks with full CRUD operations
- **Features:** Task versioning, list rollover, priority/recurring flags

### Development Notes

- Uses `@/*` path alias for `./src/*` imports
- TypeScript strict mode enabled
- Tailwind CSS v4 with PostCSS processing
- Google OAuth integration requires environment variables
- Session management handled via Express sessions
- Internal API routes in `src/app/api/` proxy requests to FastAPI backend

### Current State

The dashboard displays mock task data and needs integration with the backend API functions that are already implemented in the `lib/` directory. Authentication flow is set up but the dashboard doesn't yet use real user session data for API calls.