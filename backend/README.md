# Oppora — Backend API

[![Node.js](https://img.shields.io/badge/Node.js-20.x%20%7C%2022.x-339933?style=flat&logo=node.js)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.2-000000?style=flat&logo=express)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-9.9-880000?style=flat&logo=mongoose)](https://mongoosejs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

The core RESTful API service powering **Oppora**. Built with Node.js, Express v5, TypeScript, and MongoDB/Mongoose. Designed with security-first engineering principles: hardened role-based access control (RBAC), multi-layer IDOR defenses, compound unique database constraints, dual-token JWT authentication with password peppering, and sanitized file uploads.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture & Modular Structure](#architecture--modular-structure)
- [Database Models & Indexing](#database-models--indexing)
- [Authentication & Security Architecture](#authentication--security-architecture)
- [API Reference](#api-reference)
  - [System & Health](#system--health)
  - [Authentication (`/api/v1/auth`)](#authentication-apiv1auth)
  - [User Management (`/api/v1/user`)](#user-management-apiv1user)
  - [Opportunity Management (`/api/v1/opportunity`)](#opportunity-management-apiv1opportunity)
  - [Application Tracking (`/api/v1/application`)](#application-tracking-apiv1application)
  - [Saved Opportunities (`/api/v1/saved-opportunities`)](#saved-opportunities-apiv1saved-opportunities)
- [File Upload Pipeline](#file-upload-pipeline)
- [Error Handling & API Responses](#error-handling--api-responses)
- [Environment Configuration](#environment-configuration)
- [Getting Started & Local Development](#getting-started--local-development)
- [Available Scripts & Testing](#available-scripts--testing)
- [Deployment Guidance](#deployment-guidance)

---

## Overview

The Oppora backend provides a resilient, type-safe API for students searching and tracking educational opportunities and for administrators managing the catalog. Key design considerations include:

- **Express 5 Core**: Leveraging modern route handling and promise rejection catching in Express v5.
- **Strict Authorization**: Multi-stage middleware verifying identity, role capabilities, and resource ownership.
- **Race Condition Immunity**: Database-level compound unique indexes preventing duplicate applications or saves under concurrent workloads.
- **Zero Information Leakage**: Password hashes, server peppers, and internal stack traces are systematically stripped from client responses.

---

## Technology Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>=20.x` | JavaScript runtime environment |
| **Framework** | Express.js | `^5.2.1` | REST API routing and middleware pipeline |
| **Language** | TypeScript | `^7.0.2` | Static type checking and interface contracts |
| **Execution** | tsx | `^4.23.12` | High-performance TypeScript execution engine |
| **Database** | MongoDB & Mongoose | `^9.9.4` | Document store with ODM schema modeling |
| **Schema Validation** | Zod | `^4.5.4` | Runtime schema validation for request payloads |
| **Authentication** | JWT & bcrypt | `jsonwebtoken: ^9.0.3`, `bcrypt: ^6.0.0` | Dual-token authentication with peppered password hashing |
| **File Uploads** | Multer & Cloudinary | `multer: ^2.4.0`, `cloudinary: ^2.11.0` | Multi-part parsing with cloud asset storage |
| **Email Service** | Resend | `^6.25.0` | Transactional email delivery for verification & password resets |
| **Security Utilities** | CORS & cookie-parser | `cors: ^2.8.6`, `cookie-parser: ^1.4.7` | Cross-origin headers and signed cookie extraction |

---

## Architecture & Modular Structure

The backend follows a domain-driven, modular architecture where each feature encapsulates its own models, types, routes, controllers, and validation schemas:

```
backend/
├── public/
│   └── temp/                         # Temporary buffer for Multer file uploads before Cloudinary sync
├── src/
│   ├── application/                  # Student application submission & tracking domain
│   │   ├── application controller.ts # Handlers for create, update, delete, get, and user list
│   │   ├── application model.ts      # Mongoose schema with { user: 1, opportunity: 1 } unique index
│   │   ├── application routes.ts     # Express router for /api/v1/application
│   │   ├── application types.ts      # TypeScript interfaces for Application
│   │   └── application validation.ts # Zod validation schemas
│   ├── auth/                         # Authentication & token verification domain
│   │   ├── auth.controller.ts        # Register, login, logout, refresh, reset password handlers
│   │   ├── auth.middleware.ts        # `verifyJWT` cookie extraction & user hydration
│   │   ├── auth.routes.ts            # Express router for /api/v1/auth
│   │   ├── auth.service.ts           # Token verification & Resend email delivery logic
│   │   ├── auth.types.ts             # Auth request types and JWT payload definitions
│   │   ├── auth.validation.ts        # Zod input schemas for auth endpoints
│   │   └── verificationToken.model.ts# Verification token schema with TTL expiry
│   ├── db/
│   │   └── index.ts                  # Mongoose connection bootstrapper
│   ├── opportunity/                  # Opportunity catalog & search domain
│   │   ├── opportunity.controller.ts # CRUD, status filters, admin stats, and full-text search
│   │   ├── opportunity.middleware.ts # Multer upload config (5MB limit, MIME whitelist, safe names)
│   │   ├── opportunity.model.ts      # Opportunity schema (categories, eligibility, deadlines)
│   │   ├── opportunity.routes.ts     # Express router for /api/v1/opportunity
│   │   ├── opportunity.types.ts      # Opportunity data contracts
│   │   └── opportunity.validation.ts # Zod schema validation
│   ├── saved Opportunity/            # Student bookmarking domain
│   │   ├── saved opportunity controller.ts # Save, unsave, check status, list with filters
│   │   ├── saved opportunity model.ts      # Schema with { user: 1, opportunity: 1 } unique index
│   │   ├── saved opportunity routes.ts     # Express router for /api/v1/saved-opportunities
│   │   ├── saved opportunity types.ts      # Bookmark interfaces
│   │   └── saved opportunity validation.ts # Zod schemas
│   ├── user/                         # User profile and admin directory domain
│   │   ├── user.controller.ts        # Profile management, admin user search, role toggling
│   │   ├── user.middleware.ts        # `isAdmin` and `isUser` authorization guards
│   │   ├── user.model.ts             # User schema with peppered bcrypt pre-save hook
│   │   ├── user.routes.ts            # Express router for /api/v1/user
│   │   ├── user.types.ts             # User document types
│   │   └── user.validation.ts        # Profile updates and role schemas
│   ├── utils/                        # Cross-cutting infrastructure utilities
│   │   ├── ApiError.ts               # Custom operational error class
│   │   ├── ApiResponse.ts            # Uniform standard API response wrapper
│   │   ├── asyncHandler.ts           # Async promise wrapper for Express handlers
│   │   ├── cloudinary.ts             # Cloudinary asset uploader with safe local file cleanup
│   │   ├── error.middleware.ts       # Global error handling middleware (Zod, E11000, Multer)
│   │   └── token.ts                  # Crypto random token generator
│   ├── app.ts                        # Express app initialization, CORS, and route mounting
│   ├── constant.ts                   # Global constants (DB_NAME fallback)
│   └── server.ts                     # Database connection & HTTP server entry point
├── .env.example                      # Documented template of required environment variables
├── package.json                      # Scripts and dependencies
└── tsconfig.json                     # Compiler options for backend TypeScript build
```

---

## Database Models & Indexing

All models are defined with Mongoose schemas and strict TypeScript interfaces:

### 1. `User` ([`src/user/user.model.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/user/user.model.ts))
- **Fields:** `FullName`, `email` (unique, lowercase, indexed), `password` (bcrypt hash with server pepper), `role` (`"user" | "admin"`), `avatar`, `college`, `branch`, `year`, `skills`, `interests`, `isEmailVerified`, `refreshToken`.
- **Pre-Save Hook:** Automatically peppers and hashes passwords using bcrypt with a work factor of 10 (`password + PASSWORD_PEPPER`).
- **Methods:** `isPasswordCorrect(password)`, `generateAccessToken()`, `generateRefreshToken()`.

### 2. `Opportunity` ([`src/opportunity/opportunity.model.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/opportunity/opportunity.model.ts))
- **Fields:** `title`, `description`, `category` (enum: `Scholarship`, `intership`, `hackathon`, `competition`, `fellowship`, `research`, `open-source`, `workshop`), `organization`, `organizationType`, `organizationLogo`, `deadline`, `requiredDocuments`, `eligibility`, `gender`, `educationLevel`, `status`, `publicationStatus`, `createdBy`.
- **Indexes:** Indexed on `category`, `deadline`, `organizationType`, `educationLevel`, `publicationStatus`, and `createdBy`.

### 3. `Application` ([`src/application/application model.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/application/application%20model.ts))
- **Fields:** `user` (ref: `User`), `opportunity` (ref: `Opportunity`), `status` (enum: `applied`, `under-review`, `interviewing`, `offered`, `accepted`, `rejected`, `withdrawn`).
- **Compound Unique Index:**
  ```typescript
  applicationSchema.index({ user: 1, opportunity: 1 }, { unique: true });
  ```
  *Ensures that a user can never submit duplicate applications to the same opportunity, even under concurrent network bursts.*

### 4. `SavedOpportunity` ([`src/saved Opportunity/saved opportunity model.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/saved%20Opportunity/saved%20opportunity%20model.ts))
- **Fields:** `user` (ref: `User`), `opportunity` (ref: `Opportunity`), `savedAt`.
- **Compound Unique Index:**
  ```typescript
  savedOpportunitySchema.index({ user: 1, opportunity: 1 }, { unique: true });
  ```
  *Guarantees idempotency for opportunity bookmarking.*

### 5. `VerificationEmail` ([`src/auth/verificationToken.model.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/auth/verificationToken.model.ts))
- **Fields:** `userId` (ref: `User`), `token` (hashed unique token), `expiresAt` (Date).

---

## Authentication & Security Architecture

### Dual-Token Architecture
- **Access Token:** Short-lived JWT (`ACCESS_TOKEN_EXPIRY`, e.g., `1h`), signed with `ACCESS_TOKEN_SECRET`. Contains minimal non-sensitive user identity (`_id`, `email`, `FullName`). Delivered via secure, `httpOnly` cookie named `accessToken`.
- **Refresh Token:** Long-lived JWT (`REFRESH_TOKEN__EXPIRY`, e.g., `2d`), signed with `REFRESH_TOKEN_SECRET`. Stored hashed in the MongoDB `User` document and transmitted in an `httpOnly` cookie named `refreshToken`. Allows seamless session rotation without exposing credentials to JavaScript.

### Password Hardening
Oppora applies a two-layer defense against credential compromise:
1. **Bcrypt Work Factor 10**: Protects against rapid offline dictionary attacks.
2. **Server-Side Secret Pepper (`PASSWORD_PEPPER`)**: Appended to all passwords before hashing. If a database dump is leaked, hashes cannot be cracked with precomputed rainbow tables without the external pepper from environment variables.

### Role-Based Access Control (RBAC) & IDOR Defenses
- **`verifyJWT`**: Parses incoming cookies/headers, verifies cryptographic signature, fetches active user from database, and attaches user document to `req.user`.
- **`isAdmin`**: Strictly asserts `req.user.role === "admin"`. Denies student access to administrative analytics, opportunity creation, or user management.
- **`isUser`**: Ensures valid authenticated user with `role === "user"` or `role === "admin"`.
- **In-Depth IDOR Ownership Verification**:
  In both `application controller.ts` and `saved opportunity controller.ts`, all write, delete, and lookup operations enforce ownership:
  ```typescript
  // Example from application controller:
  const application = await Application.findOne({
    _id: applicationId,
    user: req.user._id, // Enforces strict resource ownership
  });
  ```
- **Self-Lockout Protections**: When updating administrative roles (`toogleUserRoleByEmail`), administrators cannot demote their own account or remove the final remaining platform administrator.

---

## API Reference

Base URL prefix: `/api/v1` (with standard cookies enabled: `credentials: true`).

### System & Health

#### Database Health Probe
- **Endpoint:** `GET /health/db`
- **Access:** Public
- **Description:** Verifies active Mongoose connection state and executes a lightweight MongoDB admin ping.
- **Success (200):**
  ```json
  {
    "status": "ok",
    "database": "connected",
    "timestamp": "2026-10-22T15:30:00.000Z"
  }
  ```
- **Failure (503):** Returns `503 Service Unavailable` if disconnected.

---

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new user account with email and password. |
| `GET` | `/api/v1/auth/verify-email` | Public | Verify account email using `?token=` query parameter. |
| `POST` | `/api/v1/auth/resend-verification-email` | Public | Resend verification email to unverified user. |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user; sets `accessToken` & `refreshToken` cookies. |
| `POST` | `/api/v1/auth/logout` | Authenticated | Clears auth cookies and nullifies user refresh token in DB. |
| `POST` | `/api/v1/auth/refresh-token` | Public (Cookie) | Rotates and issues fresh `accessToken` using `refreshToken` cookie. |
| `POST` | `/api/v1/auth/forgot-password` | Public | Send password-reset link to registered email address. |
| `POST` | `/api/v1/auth/reset-password` | Public | Set new password using reset token. |
| `POST` | `/api/v1/auth/change-password` | Authenticated | Change current password (requires current + new password). |

---

### User Management (`/api/v1/user`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/user/profile` | Authenticated | Retrieve authenticated user's profile details. |
| `PUT` | `/api/v1/user/profile` | Authenticated | Update user profile metadata (supports `avatar` multipart upload). |
| `GET` | `/api/v1/user` | Admin Only | List all registered users (paginated). |
| `GET` | `/api/v1/user/search` | Admin Only | Search and filter users by name, email, or role. |
| `GET` | `/api/v1/user/admins` | Admin Only | List all platform administrators. |
| `PATCH` | `/api/v1/user/toggle-role` | Admin Only | Toggle user role between `user` and `admin` (with safety guards). |
| `GET` | `/api/v1/user/:id` | Admin Only | Retrieve detailed user record by ID. |

---

### Opportunity Management (`/api/v1/opportunity`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/opportunity` | Admin Only | Create opportunity listing (supports `organizationLogo` upload). |
| `GET` | `/api/v1/opportunity/search` | Authenticated | Search, filter, and paginate active published opportunities. |
| `GET` | `/api/v1/opportunity/stats` | Admin Only | Retrieve aggregated metrics (total, active, draft, closed). |
| `GET` | `/api/v1/opportunity/status/:status` | Admin Only | Filter opportunities by status (`active`, `draft`, `closed`). |
| `GET` | `/api/v1/opportunity/:id` | Authenticated | Retrieve full opportunity details by ID. |
| `PATCH` | `/api/v1/opportunity/:id` | Admin Only | Update opportunity metadata or organization logo. |
| `DELETE` | `/api/v1/opportunity/:id` | Admin Only | Delete opportunity listing. |

---

### Application Tracking (`/api/v1/application`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/application/:opportunityId` | Authenticated User | Submit application for opportunity (protected by unique index). |
| `GET` | `/api/v1/application` | Authenticated User | List current user's applications with status filter and search. |
| `GET` | `/api/v1/application/:applicationId` | Authenticated User | Retrieve application details (with IDOR ownership check). |
| `PATCH` | `/api/v1/application/:applicationId` | Authenticated User | Update application status (e.g. withdraw application). |
| `DELETE` | `/api/v1/application/:applicationId` | Authenticated User | Delete/cancel application (with IDOR ownership check). |

---

### Saved Opportunities (`/api/v1/saved-opportunities`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/saved-opportunities/:opportunityId` | Authenticated User | Bookmark opportunity (protected by unique compound index). |
| `DELETE` | `/api/v1/saved-opportunities/:opportunityId` | Authenticated User | Remove bookmark for opportunity. |
| `POST` | `/api/v1/saved-opportunities/check/:opportunityId`| Authenticated User | Check if opportunity is bookmarked by current user. |
| `GET` | `/api/v1/saved-opportunities` | Authenticated User | List all bookmarked opportunities for current user. |
| `GET` | `/api/v1/saved-opportunities/:savedOpportunityId` | Authenticated User | Get single saved opportunity record (with ownership check). |

---

## File Upload Pipeline

Multer is configured in [`src/opportunity/opportunity.middleware.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/opportunity/opportunity.middleware.ts) with strict security boundaries:
1. **Safe Filenames**: User-supplied filenames are never written to disk. Instead, files receive an unguessable 16-byte random hex prefix:
   ```typescript
   crypto.randomBytes(16).toString("hex") + ext
   ```
2. **File Size Limit**: Strictly enforced at **5 MB** (`5 * 1024 * 1024` bytes). Exceeding uploads trigger standard HTTP 400 errors.
3. **MIME-Type Whitelist**: Validates file MIME types against `image/jpeg`, `image/png`, `image/webp`, `image/gif`, and `image/svg+xml`. Executable or arbitrary binary uploads are rejected immediately.
4. **Cloudinary Offloading & Local Cleanup**:
   Files are buffered in `./public/temp` and uploaded directly to Cloudinary via [`src/utils/cloudinary.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/utils/cloudinary.ts). Once uploaded (or upon failure), the temporary file is unlinked safely using `fs.unlinkSync` wrapped in an existence check to eliminate orphaned disk files.

---

## Error Handling & API Responses

### Standard Response Structure
All responses are formatted consistently using the [`ApiResponse`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/utils/ApiResponse.ts) wrapper:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "Resource fetched successfully",
  "data": { ... }
}
```

### Centralized Error Middleware ([`src/utils/error.middleware.ts`](file:///Users/meegadasameerreddy/Documents/web%20%20development/opportunity_radar_repo/backend/src/utils/error.middleware.ts))
All unhandled errors pass into the global error handler:
- **MongoDB Duplicate Key (Code 11000)**: Automatically mapped to HTTP 409 Conflict with friendly messages (`"You have already applied to or saved this opportunity"`).
- **Multer Errors**: `LIMIT_FILE_SIZE` mapped to HTTP 400 (`"File size exceeds the 5MB maximum limit"`).
- **Mongoose CastError**: Invalid MongoDB ObjectIds mapped to HTTP 400.
- **Production Information Masking**: When `NODE_ENV === "production"`, raw 500 error messages and stack traces are suppressed and replaced with `"Internal server error. Please try again later."`

---

## Environment Configuration

Copy the example file to `.env` inside the `backend/` directory:

```bash
cp .env.example .env
```

### Environment Variable Reference

| Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3000` | Port on which the HTTP server listens |
| `NODE_ENV` | Recommended | `"development"` | Set to `"production"` in production environments |
| `CORS_ORIGIN` | Required | `http://localhost:5173` | Allowed frontend origin for CORS headers |
| `FRONTEND_URL` | Required | `http://localhost:5173` | Target domain for verification & reset email links |
| `MONGODB_URI` | Required | `mongodb+srv://...` | MongoDB connection string (Atlas or local) |
| `DB_NAME` | Optional | `Oppora` | Target database name |
| `PASSWORD_PEPPER` | Required | *Random string (<= 18 chars)* | Server-side secret pepper for password hashing |
| `ACCESS_TOKEN_SECRET` | Required | *Random string (>= 10 chars)* | JWT signing secret for access tokens |
| `ACCESS_TOKEN_EXPIRY` | Optional | `"1h"` | Expiration timeframe for access tokens |
| `REFRESH_TOKEN_SECRET`| Required | *Random string (>= 10 chars)* | JWT signing secret for refresh tokens |
| `REFRESH_TOKEN__EXPIRY`| Optional| `"2d"` | Expiration timeframe for refresh tokens |
| `RESEND_API_KEY` | Optional* | `re_...` | API key from [Resend](https://resend.com) for sending emails |
| `RESEND_FROM_EMAIL` | Optional* | `onboarding@resend.dev` | Sender address verified in your Resend account |
| `CLOUDINARY_CLOUD_NAME`| Required*| `your_cloud_name` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Required*| `your_api_key` | Cloudinary API key |
| `CLOUDINARY_API_SECRET`| Required*| `your_api_secret` | Cloudinary API secret |

*\* Required for file uploads and email delivery.*

---

## Getting Started & Local Development

### Prerequisites
- **Node.js**: `v20.x` or `v22+`
- **MongoDB**: Local MongoDB instance or free MongoDB Atlas cluster connection string.

### Setup Instructions

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure `.env` as described above.

4. Start the development server with live reload:
   ```bash
   npm run dev
   ```

5. Verify server and database connectivity:
   ```bash
   curl http://localhost:3000/health/db
   ```

---

## Available Scripts & Testing

Inside `backend/package.json`, the following scripts are configured:

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Runs the development server via `nodemon` and `tsx` with `.env` preloaded. |
| `npm run build` | Compiles TypeScript source files to JavaScript via `tsc`. |
| `npm run start` | Executes the production entry point via `tsx src/server.ts`. |
| `npm test` | Runs Node.js native test runner via `tsx --test src/__tests__/**/*.test.ts`. |
| `npm run format` | Auto-formats backend source code using Prettier. |
| `npm run format:check` | Verifies code formatting compliance without modifying files. |

---

## Deployment Guidance

### Production Deployment Checklist
1. **Environment Mode**: Ensure `NODE_ENV=production` is set so stack traces are suppressed and secure cookie flags are honored.
2. **CORS Configuration**: Set `CORS_ORIGIN` to the exact production frontend domain (e.g. `https://oppora-iota.vercel.app`). Do not use wildcard `*` with credentials.
3. **Database Health Monitoring**: Configure your cloud provider (Render, Railway, AWS ECS) health check probe to point to `GET /health/db`.
4. **Cloudinary & Resend Credentials**: Ensure production keys with verified sender domains are injected via secure platform secret managers.

