# Contact Management App - Project Context & Architecture

## 1. Project Overview

- **Goal**: Full-stack Contact Management application.
- **Tech Stack**:
  - **Frontend**: Next.js 16 (App Router, TypeScript), Tailwind CSS, Shadcn UI, Lucide React icons.
  - **Backend**: Next.js API Routes (Internal API), MongoDB (Mongoose ODM).
  - **Authentication**: Custom JWT (JSON Web Tokens) implementation.
  - **State Management**: React Hooks (`useState`, `useEffect`) + Context-like Auth pattern.

## 2. Backend Architecture

**Location**: `src/app/api`, `src/lib`, `src/models`

### Database

- **Technology**: MongoDB.
- **Connection**: `src/lib/db.ts` - Singleton pattern for Mongoose connection handling (optimised for serverless/Next.js HMR).
- **ODM**: Mongoose 9.x.

### Data Models

**Location**: `src/models`

1.  **User** (`User.ts`)
    - `username` (String, unique, required)
    - `email` (String, unique, required)
    - `password` (String, required - likely hashed)
    - `role` (Enum: 'member', 'superadmin', default: 'member')
    - `contacts` (Virtual field: One-to-Many relation with Contact)

2.  **Contact** (`Contact.ts`)
    - `name` (String, required)
    - `email` (String)
    - `phone` (String, required)
    - `age` (Number)
    - `profileImage` (String - URL path)
    - `owner` (ObjectId, Ref: 'User', required) - Links contact to specific user.

### API Routes

**Location**: `src/app/api`

- **Base URL**: `/api`
- **Authentication**: Most routes are protected using `getUserFromRequest` helper (`src/lib/jwt.ts`).
- **Endpoints**:
  - `POST /api/auth/login`: Authenticates user, returns JWT and user info.
  - `POST /api/auth/signup`: Registers new user, returns JWT.
  - `GET /api/contacts`: Fetches contacts for the logged-in user (filtered by `owner`).
  - `POST /api/contacts`: Creates a new contact linked to the logged-in user.
  - `PUT /api/contacts/[id]`: Updates a specific contact (ensures ownership).
  - `DELETE /api/contacts/[id]`: Deletes a specific contact (ensures ownership).
  - `POST /api/upload`: Handles file uploads (images) to `public/uploads`, returns URL.

### Security

- **JWT**: Tokens signed/verified using `jsonwebtoken` library. Secret key from `process.env.JWT_SECRET`.
- **Middleware-like Logic**: `getUserFromRequest` extracts and validates Bearer token from headers.

## 3. Frontend Architecture

**Location**: `src/app`, `src/components`

### Core Features

- **Dashboard (`/`)**:
  - Lists all user contacts.
  - Search/Filter not explicitly seen but contacts fetched via API.
  - Create/Edit/Delete/View Modals for contact management.
- **Authentication Pages**:
  - Login (`/login`)
  - Signup (`/signup`)
- **Private Routes**:
  - Implementation: HOC/Wrapper pattern `ProtectedRoute` in `src/components/auth-wrappers.tsx`.
  - Logic: Checks for `jwt` in `localStorage`. Redirects to `/login` if missing.
- **Public Routes**:
  - `PublicRoute` wrapper ensures authenticated users are redirected to Dashboard if they visit Login/Signup.

### Key Components

- **Auth Wrappers** (`auth-wrappers.tsx`): Handles client-side route protection.
- **UI Library**: Shadcn UI components (Dialog, Card, Button, Input, Toast) located in `src/components/ui`.
- **Icons**: Lucide React.
- **Forms**: React Hook Form + Zod validation.

### Data Flow

1.  **Auth**: User logs in -> API returns JWT -> Client stores in `localStorage`.
2.  **API Calls**: `axios` is used for HTTP requests. `Authorization: Bearer <token>` header added for protected routes.
3.  **State**: Local state manages modal visibility (`isCreateOpen`, `isEditOpen`, etc.) and data (`contacts` array).

## 4. Environment Variables

Required `.env` or `.env.local` variables:

- `MONGODB_URI`: Connection string for MongoDB.
- `JWT_SECRET`: Secret key for token signing.

## 5. Current Status

- [x] Database Connection (MongoDB)
- [x] Authentication (Login/Signup/JWT)
- [x] CRUD Operations for Contacts
- [x] Image Upload (Local Filesystem)
- [x] Client-side Route Protection
- [x] Responsive UI with Tailwind & Shadcn

# Next.js Project Context

## Project Initialization

**Date**: 2026-01-17

### 1. Initial Setup

Executed `create-next-app` to scaffold the project:

```bash
npx create-next-app@latest nextjs-contact-app \
  --typescript \
  --tailwind \
  --app \
  --use-npm \
  --no-eslint \
  --src-dir \
  --import-alias "@/*"
```

### 2. Dependencies

Installed core libraries for forms, HTTP, and dates:

```bash
cd nextjs-contact-app
npm install react-hook-form zod @hookform/resolvers axios date-fns
npm install -D @types/node
```

### 3. UI Configuration (shadcn/ui)

Initialized shadcn-ui for component styling:

```bash
npx shadcn@latest init
```

- **Base Color**: Neutral
- **CSS Variables**: Enabled
- **Components File**: `components.json`
- **Utils**: `src/lib/utils.ts`

### Current Stack Summary

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Forms**: React Hook Form + Zod
- **Data Fetching**: Axios
- **Utils**: date-fns
