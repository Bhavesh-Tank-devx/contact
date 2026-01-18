# Project Context & Architecture

## Overview

This project is a full-stack **Contact Management Application** built using **Next.js 16 (App Router)**. It leverages a monolithic architecture where both the frontend UI and the backend API routes coexist within the same repository. The application focuses on data integrity, user security, and a fluid user experience.

## Technology Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (React Framework)
- **Language:** JavaScript/TypeScript
- **Database:** MongoDB
- **ORM:** Mongoose
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix Primitives + Tailwind)
- **Authentication:** Custom JWT (JSON Web Tokens)
- **HTTP Client:** Axios

## System Architecture

### 1. Database Schema (MongoDB/Mongoose)

The data model consists of two primary collections:

- **User Model (`src/models/User.ts`)**
  - **Fields:** `username`, `email` (unique), `password` (hashed), `role` (default: 'member', admin: 'superadmin'), `profileImage`.
  - **Relationships:** A User is the "Owner" of multiple Contacts.
  - **Security:** Passwords are never returned in API responses.

- **Contact Model (`src/models/Contact.ts`)**
  - **Fields:** `name`, `email`, `phone`, `age`, `profileImage`, `owner`.
  - **Relationships:** The `owner` field references a `User` ObjectId.
  - **Constraint:** Contacts are strictly isolated by their `owner` (except for Superadmin access).

### 2. API Layer (`src/app/api/...`)

The backend is implemented using Next.js Route Handlers.

- **Authentication & Security (`src/lib/jwt.ts`)**
  - Stateless authentication using JWTs stored in `localStorage` on the client.
  - Middleware-like utility `getUserFromRequest` extracts and validates tokens from headers.
  - **Role-Based Access Control (RBAC):** API endpoints explicitly check `userPayload.role === 'superadmin'` for sensitive operations (e.g., viewing all users, editing other users' data).

- **Key Endpoints:**
  - `/api/auth/register` & `/api/auth/login`: Handle user lifecycle.
  - `/api/contacts`: CRUD for the logged-in user's personal contacts.
  - `/api/contacts/[id]`: Operations on a specific contact (with ownership/admin verification).
  - `/api/users`: Admin-only list of all users.
  - `/api/users/[id]`: Admin-only user management (Update/Delete).
  - `/api/profile`: Self-service profile management for the logged-in user.
  - `/api/upload`: Handles image uploads to the local filesystem (`public/uploads`).

### 3. Frontend Architecture

The frontend is a Single Page Application (SPA) experience powered by Next.js.

- **State Management:**
  - Uses React `useState` and `useEffect` for local UI state and data fetching.
  - `localStorage` is used to persist the user session (JWT and basic user info).

- **Navigation & Routing:**
  - `/`: Landing page / Home.
  - `/login` & `/signup`: Auth pages (redirect to dashboard if already logged in).
  - `/dashboard`: Main user interface for managing contacts.
  - `/users`: Superadmin interface for managing the user base.

- **Component Design:**
  - **Smart Components:** Pages (e.g., `UsersPage`) handle data fetching and orchestration.
  - **Dumb/UI Components:** Reusable pieces like `Card`, `Button`, `Dialog` (mostly from Shadcn UI).
  - **Feature Components:** High-level widgets like `UserProfileDialog` and `EditContactDialog` encapsulate complex logic (form handling, API calls, error states) to keep pages clean.

## Workflows & Logic

### Authentication Flow

1.  User submits credentials.
2.  Server validates and returns a JWT.
3.  Client stores JWT in `localStorage`.
4.  Subsequent Axios requests include `Authorization: Bearer <token>` header.

### Data Privacy & Isolation

- **Standard Operation:** When a generic user requests `/api/contacts`, the server queries MongoDB for contacts where `owner == currentUserId`.
- **Admin Override:** If the requester is a `superadmin`, specific endpoints allow bypassing this check to manage data globally.

### Deletion Logic (Cascading Delete)

To maintain database hygiene:

- **Deleting a User:** When a user is deleted (either by themselves or an admin), the backend _first_ deletes all `Contact` documents where `owner == userId`, _then_ deletes the `User` document. This prevents "orphaned" data.

### Security Measures

- **Input Validation:** Mongoose schemas enforce data types and requirements.
- **Sanitization:** Passwords are excluded from query results (`.select('-password')`).
- **Safe Writes:** Endpoints verify the existence of the user (even with a valid token) before allowing Creates/Updates/Deletes to prevent actions from stale sessions of deleted accounts.
