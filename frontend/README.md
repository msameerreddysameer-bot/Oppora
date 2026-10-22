# Oppora — Frontend Client

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-blue?style=flat&logo=vercel)](https://oppora-iota.vercel.app)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646cff?style=flat&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.3-38b2ac?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

A modern, high-performance single-page application (SPA) for **Oppora** — the unified opportunity discovery and application management platform for students and academic administrators. Built with React 19, TypeScript, Tailwind CSS v4, and Vite 8, featuring strict client-side role guards, cookie-based session management, and resilient API communication.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture & Folder Structure](#architecture--folder-structure)
- [Routing & Access Control](#routing--access-control)
- [Authentication & API Client](#authentication--api-client)
- [State Management & Contexts](#state-management--contexts)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Development Server](#running-the-development-server)
- [Available Scripts](#available-scripts)
- [Deployment Configuration](#deployment-configuration)

---

## Overview

The Oppora frontend serves two primary user personas with dedicated responsive user interfaces:
1. **Students:** Discover vetted scholarships, internships, hackathons, and research grants; filter and search with real-time feedback; bookmark opportunities; track active application statuses; and manage educational profiles.
2. **Administrators:** Create, publish, update, and manage opportunity listings; monitor platform analytics; and manage user accounts with role-elevation protections.

---

## Technology Stack

| Category | Technology | Version / Details |
| :--- | :--- | :--- |
| **Core Framework** | React | `^19.2.8` (Concurrent features, functional components, hooks) |
| **Language** | TypeScript | `~6.0.2` (Strict type safety, custom interfaces) |
| **Bundler & Tooling** | Vite | `^8.3.0` (Fast ESM HMR, optimized rollups) |
| **CSS & Design** | Tailwind CSS | `^4.3.3` (Engineered via `@tailwindcss/vite`) |
| **Component Library** | Radix UI / Shadcn UI | `@base-ui/react`, `class-variance-authority`, `cn` helper |
| **Icons & Typography** | Lucide React & Geist | `lucide-react: ^1.48.0`, `@fontsource-variable/geist` |
| **Routing** | React Router DOM | `^7.18.4` (Nested routing, declarative guards) |
| **Networking** | Axios | `^1.20.0` (Configured instance with queue-based token refresh) |
| **Infinite Scrolling**| React Infinite Scroll | `^7.2.1` (Smooth discovery catalog feed) |
| **Code Quality** | ESLint & Prettier | `eslint: ^10.10.0`, `prettier: ^3.9.9` |

---

## Architecture & Folder Structure

```
frontend/
├── public/                     # Static assets (oppora-logo.svg, favicon.svg)
├── src/
│   ├── assets/                 # Component images, illustrations, and media
│   ├── components/             # Reusable modular UI components
│   │   ├── admin/              # Admin dashboard widgets, tables, modals
│   │   ├── layout/             # Top navigation, headers, and footer components
│   │   ├── shared/             # Cross-role reusable elements (modals, badges, search bars)
│   │   ├── student/            # Student filter drawers, cards, application widgets
│   │   ├── ui/                 # Atomic primitives (button, dialog, input, card, skeleton)
│   │   ├── AdminRoute.tsx      # Route guard strictly allowing role: "admin"
│   │   ├── AuthContext.tsx     # Session state, login/logout logic, role management
│   │   ├── GuestRoute.tsx      # Prevents authenticated users from seeing login/signup
│   │   └── ProtectedRoute.tsx  # Route guard requiring authenticated user session
│   ├── lib/
│   │   └── utils.ts            # ClassName merge helper (`clsx` + `tailwind-merge`)
│   ├── Pages/                  # Primary page views
│   │   ├── admin/              # Admin pages (Dashboard, Opportunities, Users, Profile)
│   │   ├── auth/               # Auth views (Login, Signup, VerifyEmail, Forgot/ResetPassword)
│   │   ├── LandingPage.tsx     # Public marketing homepage
│   │   ├── MyApplicationsPage.tsx # Student submitted applications tracker
│   │   ├── OpportunityDetailsPage.tsx # Deep-dive opportunity view with application CTA
│   │   ├── SavedOpportunitiesPage.tsx # Student bookmarked opportunities view
│   │   ├── StudentDashboardPage.tsx   # Discovery catalog with filters, search, and infinite feed
│   │   └── StudentProfilePage.tsx     # Student profile & skills editor
│   ├── routes/
│   │   ├── AdminRoutes.tsx     # Sub-router mapping /admin/* views
│   │   └── AppRoutes.tsx       # Master router declaring all application routes & guards
│   ├── services/
│   │   ├── api.ts              # Core Axios client with thundering-herd token refresh
│   │   ├── authApi.ts          # Auth endpoint wrappers (login, register, logout, verify)
│   │   └── opportunityService.ts # Opportunity, saved, and application API service calls
│   ├── types/
│   │   └── studentTypesData.ts # TypeScript interfaces for opportunities, applications, users
│   ├── App.css                 # Global overrides
│   ├── index.css               # Tailwind CSS v4 root imports and custom theme directives
│   └── main.tsx                # Application bootstrap rendering into root DOM node
├── .env.example                # Blueprint for frontend environment variables
├── index.html                  # HTML entry point with title and favicon link
├── package.json                # Dependencies and npm script definitions
├── tsconfig.app.json           # Frontend application TypeScript configuration
├── tsconfig.json               # Root solution TypeScript configuration
├── vercel.json                 # Vercel SPA routing rewrite rules
└── vite.config.ts              # Vite configuration with Tailwind CSS integration
```

---

## Routing & Access Control

Oppora enforces strict client-side role-based routing inside [`src/routes/AppRoutes.tsx`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/frontend/src/routes/AppRoutes.tsx) to complement the backend authorization middleware:

### Route Definitions

| Route Path | View / Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `LandingPage` | **Public** | Marketing hero, platform value proposition, categories, and FAQs. |
| `/login` | `LoginPage` | **Guest Only** | Authentication entry point. Redirects logged-in users away. |
| `/signup`, `/register` | `SignupPage` | **Guest Only** | Student registration. |
| `/verify-email` | `VerifyEmailPage` | **Guest Only** | Email verification handler via token query param. |
| `/forgot-password` | `ForgotPasswordPage`| **Guest Only** | Request password-reset email. |
| `/reset-password` | `ResetPasswordPage` | **Guest Only** | Submit new password using reset token. |
| `/discover` | `StudentDashboardPage` | **Student (Protected)** | Searchable and filterable catalog of active opportunities. |
| `/opportunities/:opportunityId` | `OpportunityDetailsPage` | **Student (Protected)** | Detailed view with requirements, benefits, and direct apply link. |
| `/saved` | `SavedOpportunitiesPage` | **Student (Protected)** | Bookmarked opportunities with unsave actions. |
| `/applications` | `MyApplicationsPage` | **Student (Protected)** | Status tracker for submitted applications (Applied, Under Review, Interviewing, etc.). |
| `/profile` | `StudentProfilePage` | **Student (Protected)** | Manage education, skills, branch, year, and profile avatar. |
| `/admin` | `AdminDashboardPage` | **Admin Only** | Overview of metrics, total opportunities, and total users. |
| `/admin/opportunities` | `AdminOpportunitiesPage` | **Admin Only** | Tabular opportunity manager with status filters and quick actions. |
| `/admin/create-opportunity` | `AdminCreateOpportunityPage` | **Admin Only** | Form to draft and publish opportunities with logo upload. |
| `/admin/opportunities/edit/:id` | `AdminCreateOpportunityPage` | **Admin Only** | Edit existing opportunity metadata. |
| `/admin/users` | `AdminUsersPage` | **Admin Only** | User directory with search, filter, and role-elevation actions. |
| `/admin/profile` | `AdminProfilePage` | **Admin Only** | Administrator account settings and avatar management. |
| `*` (Wildcard) | `FallbackRedirect` | **Dynamic** | Smart redirect: Admins -> `/admin`, Students -> `/discover`, Unauthenticated -> `/`. |

### Route Guards

1. **`AdminRoute`**: Validates whether the active session has `role === "admin"`. If not authenticated, redirects to `/login`. If authenticated as a student, redirects to `/discover`.
2. **`ProtectedRoute`**: Validates whether the user is logged in. Unauthenticated requests are redirected to `/login` preserving intended redirect target.
3. **`GuestRoute`**: Ensures logged-in users cannot re-enter `/login` or `/signup`. Automatically routes users to their respective workspace.

---

## Authentication & API Client

### Resilient Axios Client ([`src/services/api.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/frontend/src/services/api.ts))

The frontend uses a centralized Axios instance configured for secure cookie-based credentials:
- **`withCredentials: true`**: Automatically transmits secure `httpOnly` authentication cookies (`accessToken` and `refreshToken`) across requests.
- **15-Second Timeout**: Prevents UI hangs when backend cold-starts or network drops.
- **Thundering-Herd Queue Protection**:
  When multiple parallel requests fail with `401 Unauthorized` simultaneously (e.g., when loading a dashboard with 3 parallel widgets):
  1. The first `401` triggers `isRefreshing = true` and initiates a single `POST /api/v1/auth/refresh-token` call.
  2. Subsequent concurrent requests are queued in memory (`failedQueue`).
  3. Once the refresh call succeeds, the queue is drained and all original requests are automatically retried with fresh tokens.
  4. If the refresh token has expired, the queue is rejected, local cache keys are cleared, and a global `auth-session-expired` event is broadcast to redirect the user to `/login`.

---

## State Management & Contexts

### `AuthContext` ([`src/components/AuthContext.tsx`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/frontend/src/components/AuthContext.tsx))
Provides app-wide session state, containing:
- `user`: Authenticated user profile data (name, email, role, avatar, skills).
- `isAuthenticated`: Boolean status indicating if the user has an active session.
- `isLoading`: Prevents layout flicker during initial session bootstrap.
- `login(credentials)`: Authenticates user, hydrates state, and synchronizes role.
- `logout()`: Clears session via `POST /api/v1/auth/logout` and resets UI state.
- `refreshUser()`: Fetches fresh profile data from `GET /api/v1/user/profile`.

---

## Getting Started

### Prerequisites

- **Node.js**: v18.x, v20.x, or v22+
- **npm**: v9.x or higher (or `pnpm` / `yarn`)
- **Oppora Backend**: Running locally on `http://localhost:3000` or accessible via a remote staging URL.

### Installation

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Copy the example environment configuration file:
```bash
cp .env.example .env
```

Open `.env` and verify the backend API endpoint:
```env
# Backend API Base URL
VITE_API_URL="http://localhost:3000/api/v1"
```

> [!NOTE]
> Ensure that the backend `CORS_ORIGIN` matches the exact URL of this frontend application (e.g., `http://localhost:5173` during local development).

### Running the Development Server

Start the local Vite dev server with Hot Module Replacement (HMR):
```bash
npm run dev
```

The application will be accessible at:
```
http://localhost:5173
```

---

## Available Scripts

Inside `frontend/package.json`, the following scripts are available:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server with fast HMR on `localhost:5173`. |
| `npm run build` | Runs TypeScript compilation (`tsc -b`) followed by the production Vite build (`dist/`). |
| `npm run preview` | Serves the generated production build locally for verification prior to deployment. |
| `npm run lint` | Runs ESLint across all TypeScript and React source files. |
| `npm run format` | Automatically formats all `.ts`, `.tsx`, `.css`, and `.json` files via Prettier. |
| `npm run format:check` | Verifies code formatting compliance without modifying files. |

---

## Deployment Configuration

### Vercel Deployment

The frontend includes a [`vercel.json`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/frontend/vercel.json) configuration that handles client-side routing for Single Page Applications:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This prevents `404 Not Found` errors when refreshing deep URLs like `/discover` or `/admin/opportunities`.

- **Production URL:** [https://oppora-iota.vercel.app](https://oppora-iota.vercel.app)
- **Production Environment Variables:** Set `VITE_API_URL` to your production backend URL (e.g., `https://api.yourdomain.com/api/v1`) in the Vercel Project Settings.
