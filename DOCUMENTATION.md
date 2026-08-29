# Asteria Club Esprit — Comprehensive Platform Documentation

> **Official System Architecture, Feature Breakdown, Database Schema, API Reference, and Operation Manual.**
> Version: `2.0.0` · Charte Graphique `2026 v2.1` · Next.js 15 (App Router) · Supabase · Prisma ORM

---

## 📑 Table of Contents
1. [Executive Summary & Purpose](#1-executive-summary--purpose)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Design System & Brand Identity](#3-design-system--brand-identity)
4. [Authentication & Role-Based Access Control (RBAC)](#4-authentication--role-based-access-control-rbac)
5. [Database Architecture & Schema Reference](#5-database-architecture--schema-reference)
6. [Complete Module & Feature Guide](#6-complete-module--feature-guide)
   - 6.1 [Public Landing Homepage (`/`)](#61-public-landing-homepage-)
   - 6.2 [Recruitment Application Portal (`/apply`)](#62-recruitment-application-portal-apply)
   - 6.3 [Authentication Screens (`/login` & `/signup`)](#63-authentication-screens-login--signup)
   - 6.4 [Role-Tailored Dashboards (`/dashboard`)](#64-role-tailored-dashboards-dashboard)
   - 6.5 [Interactive Org Chart & Department Hubs (`/departments`)](#65-interactive-org-chart--department-hubs-departments)
   - 6.6 [Member Directory & Dossiers (`/members`)](#66-member-directory--dossiers-members)
   - 6.7 [Agile Sprint Kanban Board (`/tasks`)](#67-agile-sprint-kanban-board-tasks)
   - 6.8 [Attendance Hub & Dynamic QR Verification (`/attendance`)](#68-attendance-hub--dynamic-qr-verification-attendance)
   - 6.9 [Shared Calendar & RSVPs (`/calendar`)](#69-shared-calendar--rsvps-calendar)
   - 6.10 [Scoped Announcements & Discord Sync (`/announcements`)](#610-scoped-announcements--discord-sync-announcements)
   - 6.11 [Recruitment Review & 1-Click Auto-Onboarding (`/applications`)](#611-recruitment-review--1-click-auto-onboarding-applications)
   - 6.12 [System Governance & Admin (`/admin`)](#612-system-governance--admin-admin)
7. [REST API Endpoint Catalog](#7-rest-api-endpoint-catalog)
8. [Supabase Cloud Integration & Realtime Architecture](#8-supabase-cloud-integration--realtime-architecture)
9. [Deployment & Environment Configuration](#9-deployment--environment-configuration)

---

## 1. Executive Summary & Purpose

**Asteria Club Esprit** is the premier student-led creative and technical talent incubator at ESPRIT University. The organization trains students across four core tracks:
1. **Web Development** (Full-Stack Web Engineering)
2. **Graphic Design** (Visual Identity, Design Systems, UI/UX)
3. **Video Editing** (Cinematic Media, After Effects, Motion Graphics)
4. **Photography** (Studio Lighting, Event Photojournalism, Color Grading)

### The Talent Bridge to Asteria Freelance
The platform acts as the internal operating system managing talent progression from initial recruitment application, through weekly workshops and sprint ticket deliverables, directly into paid client contracts at **Asteria Freelance** (`asteria-freelance.vercel.app`).

---

## 2. Tech Stack & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS 15 APP ROUTER                           │
│   (React 19, TypeScript 5.7, Tailwind CSS, Lenis, Framer Motion)       │
├──────────────────────────────┬─────────────────────────────────────────┤
│        FRONTEND LAYER        │             BACKEND LAYER               │
│ • Google Fonts (Exo 2,       │ • Next.js Route Handlers (/api/*)       │
│   Plus Jakarta Sans,         │ • Prisma ORM 6.1 (PostgreSQL / SQLite)  │
│   JetBrains Mono)            │ • Supabase SSR Auth & Cookie Sessions   │
│ • Three.js Ambient Particle  │ • Supabase Realtime Channels (WebSocket)│
│   Canvas (AmbientCanvas.tsx) │ • Row Level Security (RLS) Policies     │
│ • Canvas Confetti            │ • Bcrypt Password Encryption            │
│ • QR Code Generator Engine   │ • JWT Cookie Session Refresher          │
└──────────────────────────────┴─────────────────────────────────────────┘
```

- **Framework**: Next.js 15.1 (App Router architecture with SSR & Server Components).
- **Language**: TypeScript 5.7 (Strict type-checking enabled).
- **Styling**: Tailwind CSS 3.4 with custom glassmorphism and motion tokens.
- **Database & ORM**: Prisma ORM with relational SQLite (local) / Supabase PostgreSQL (cloud).
- **Auth Layer**: `@supabase/ssr` with HttpOnly cookie session refresh and JWT token verification.
- **Realtime**: Supabase Realtime WebSocket channels (`tasks`, `attendance_records`, `announcements`).
- **3D & Motion**: Three.js WebGL particle mesh, Lenis smooth scrolling, Framer Motion layout transitions.

---

## 3. Design System & Brand Identity

The design system adheres strictly to the **Asteria Charte Graphique 2026 (v2.1)** and the aesthetic standards of **Asteria Freelance**:

### A. Color Palette
| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--ast-dark` | `#0A3A40` | Deep background, luxury hero cards, navbar backing |
| `--ast-darker` | `#062327` | Primary canvas background |
| `--ast-primary` | `#11606E` | Teal-900 primary brand accent, main buttons, active tabs |
| `--ast-light` | `#60C8D4` | Teal-400 interactive highlights, glowing badges, primary CTA |
| `surface` | `#FFFFFF` | Card surfaces in light mode |
| `surface-alt` | `#F5F8F8` | Secondary backgrounds, subtle pill tags |
| `ink` | `#12201F` | Deep dark high-contrast body text |
| `ink-soft` | `#4B5C5C` | Secondary subtitles and metadata labels |
| `ink-faint` | `#8A9695` | Muted placeholders, timestamps, border dividers |
| `line` | `#E2E8E7` | Card borders, grid separators |

### B. Typography Suite
- **Headings & Display (`font-display`)**: **`Exo 2`** (Weights: `600`, `700`, `800`, uppercase or title-case with `-0.01em` to `-0.02em` letter-spacing).
- **Body & UI Text (`font-body`)**: **`Plus Jakarta Sans`** (Weights: `400`, `500`, `600`, `700`, line-height `24px` to `26px`).
- **Data, Passcodes, IDs & Monospace (`font-mono`)**: **`JetBrains Mono`** (Weights: `400`, `600`, `700`, tabular alignment).

### C. Water-Inspired Motion Curves
- **Vague (`cubic-bezier(0.16, 1, 0.3, 1)`)**: Entrances, modal pop-ins, card reveals (Duration: `300ms`).
- **Courant (`cubic-bezier(0.65, 0, 0.35, 1)`)**: Interactive state transitions, tab switches (Duration: `300ms`).
- **Marée (`cubic-bezier(0.37, 0, 0.63, 1)`)**: Modal dismissals and dropdown collapses (Duration: `500ms`).
- **Accessibility**: Automatic fallback to zero motion under `prefers-reduced-motion: reduce`.

---

## 4. Authentication & Role-Based Access Control (RBAC)

The platform enforces 4 distinct hierarchical roles across UI navigation and API endpoints:

```
                  ┌──────────────────────────────┐
                  │        EXECUTIVE BOARD       │
                  │ (Full System Read & Write)   │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │    HEAD OF DEPARTMENT (HoD)   │
                  │ (Full Read/Write for Track)  │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │        ACTIVE MEMBER         │
                  │ (Tasks, Attendance, RSVPs)   │
                  └──────────────┬───────────────┘
                                 │
                  ┌──────────────▼───────────────┐
                  │          APPLICANT           │
                  │ (Application Dossier Status) │
                  └──────────────────────────────┘
```

### Permission Matrix
| Module / Capability | Board | HoD | Member | Applicant |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard** | Executive KPIs | Dept Console | Personal Hub | In-Review Card |
| **Manage Departments & Org** | Full CRUD | View Only | View Only | ❌ |
| **Manage Sprint Tasks** | Create/Edit/Delete | Dept Only | Self Update & Comment | ❌ |
| **Host QR Attendance** | Generate QR & Codes | Generate QR & Codes | Scan / Submit Code | ❌ |
| **Submit Absence Justification** | Approve / Audit | Approve / Audit | Submit Note | ❌ |
| **Publish Announcements** | Club-Wide & Dept | Dept Only | View Feed | View Feed |
| **Review Applications** | Review & Auto-Onboard | Review Track | ❌ | Submit `/apply` |
| **Academic Cycle Rollover** | Full Access | ❌ | ❌ | ❌ |
| **Security Audit Logs** | View All Trails | ❌ | ❌ | ❌ |

---

## 5. Database Architecture & Schema Reference

The database models are represented in Prisma (`prisma/schema.prisma`) and Supabase SQL migrations (`supabase/migrations/20260228_initial_schema.sql`):

### 1. `User` / `profiles`
Extends authentication identities:
- `id` (UUID, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `role` (`BOARD` | `HOD` | `MEMBER` | `APPLICANT`)
- `departmentId` (UUID, Foreign Key → `Department`)
- `avatarUrl` (String, Optional)
- `bio` (Text, Optional)
- `skills` (JSON array of strings)
- `status` (`ACTIVE` | `INACTIVE` | `ALUMNI`)
- `freelanceReady` (Boolean, Freelance certification flag)
- `joinDate` (DateTime)

### 2. `Department`
Technical tracks within the club:
- `id` (UUID, Primary Key)
- `name` (String, Unique — e.g. "Web Development")
- `slug` (String, Unique — e.g. "web-development")
- `description` (Text)
- `icon` (String — e.g. "Code2", "Palette", "Video", "Camera")
- `hodUserId` (UUID, Foreign Key → `User`)

### 3. `BoardSeat`
Official executive positions:
- `id` (UUID, Primary Key)
- `title` (String — e.g. "President", "Vice-President", "Secretary General", "Treasurer")
- `userId` (UUID, Foreign Key → `User`, Unique)
- `order` (Int — Display sort index `1` to `4`)

### 4. `Event`
Workshops, assemblies, and hackathons:
- `id` (UUID, Primary Key)
- `title` (String)
- `description` (Text, Optional)
- `startTime` & `endTime` (DateTime)
- `location` (String — e.g. "Lab 3.4 / Amphithéâtre B")
- `departmentId` (UUID, Nullable → Null means Club-Wide)
- `checkInCode` (String — e.g. "AST-2026", "WEB-DEV26")
- `createdById` (UUID, Foreign Key → `User`)

### 5. `RSVP`
Member event attendance declarations:
- `id` (UUID, Primary Key)
- `eventId` & `userId` (Compound Unique constraint)
- `status` (`GOING` | `MAYBE` | `DECLINED`)

### 6. `AttendanceRecord`
Verified attendance check-ins:
- `id` (UUID, Primary Key)
- `eventId` & `userId` (Compound Unique constraint)
- `checkedInAt` (DateTime)
- `method` (`QR` | `CODE` | `MANUAL`)
- `status` (`PRESENT` | `ABSENT` | `EXCUSED`)
- `justification` (Text, Optional absence reason)

### 7. `Task` & `TaskComment`
Agile Sprint Kanban deliverables:
- `id` (UUID, Primary Key)
- `title` & `description` (String/Text)
- `departmentId` (UUID, Foreign Key → `Department`)
- `assigneeId` (UUID, Nullable Foreign Key → `User`)
- `createdById` (UUID, Foreign Key → `User`)
- `status` (`TODO` | `IN_PROGRESS` | `REVIEW` | `DONE`)
- `priority` (`LOW` | `MEDIUM` | `HIGH` | `URGENT`)
- `dueDate` (DateTime, Optional)

### 8. `Announcement`
Broadcast bulletins:
- `id` (UUID, Primary Key)
- `title` & `body` (String/Text)
- `scope` (`CLUB` | `DEPARTMENT`)
- `departmentId` (UUID, Nullable)
- `authorId` (UUID, Foreign Key → `User`)
- `isPinned` (Boolean)

### 9. `Application`
Recruitment intake pipeline:
- `id` (UUID, Primary Key)
- `name`, `email`, `phone` (String)
- `departmentPreference` (String)
- `motivation` (Text)
- `portfolioLink` (String, Optional)
- `status` (`PENDING` | `ACCEPTED` | `REJECTED`)
- `reviewerNotes` (Text, Optional)

### 10. `AuditLog`
Security and administrative trail:
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → `User`)
- `action` (String — e.g. "MEMBER_ONBOARDED", "CYCLE_ROLLOVER")
- `details` (Text)
- `createdAt` (DateTime)

---

## 6. Complete Module & Feature Guide

### 6.1 Public Landing Homepage (`/`)
- **Hero Banner**: Features an interactive 3D WebGL particle starfield canvas (`AmbientCanvas.tsx`).
- **Live Stats Ribbon**: Displays live counters for technical tracks, sprint velocity, student governance, and the Asteria Freelance bridge.
- **4 Specialization Tracks Showcase**: Interactive cards detailing tools and curriculums for Web Dev, Graphic Design, Video Editing, and Photography.
- **Freelance Talent Pipeline**: Explains the 4-phase journey from audition to paid client contracts.
- **FAQ Accordion**: Interactive accordion answering frequent recruit questions.
- **CTA Ribbon**: Direct links to apply and sign in.

### 6.2 Recruitment Application Portal (`/apply`)
- **Interactive Track Selector**: Visual specialization selection cards with active glow states.
- **Applicant Dossier Form**: Collects student name, email, phone number, portfolio/GitHub URL, and motivation.
- **Database Persistence**: Directly writes to `/api/applications`.
- **Success State**: Confetti animation and instant confirmation dossier with review timeline.

### 6.3 Authentication Screens (`/login` & `/signup`)
- **Luxury Glassmorphism**: Deep dark backdrop with animated ambient starfield.
- **Supabase SSR Auth**: Secure authentication setting HttpOnly cookies.
- **1-Click Demo Evaluation Grid**: Allows rapid testing across all 4 roles (President, HoD Web, Active Member, Applicant).

### 6.4 Role-Tailored Dashboards (`/dashboard`)
- **Executive Board Console**:
  - Live metric counters for active members, operational tracks, task velocity %, and pending recruits.
  - Department breakdown table with member counts and active sprint tickets.
  - Next scheduled club sessions with RSVP counts.
  - Live system security audit log.
- **Department Head (HoD) Console**:
  - 4-stat sprint ticket velocity summary (*To Do*, *In Progress*, *Review*, *Completed*).
  - Department member roster with freelance readiness status.
  - Active sprint task list with direct link to Kanban.
- **Member Workspace**:
  - Personal assigned sprint tasks with priority badges.
  - Attendance health percentage and good standing verification.
  - Asteria Freelance readiness qualification card.
  - Upcoming workshops with 1-click check-in shortcuts.

### 6.5 Interactive Org Chart & Department Hubs (`/departments`)
- **Tier 1 Executive Board**: Grid cards displaying President, Vice-President, Secretary General, and Treasurer.
- **Tier 2 Department Divisions**: Interactive tree hierarchy and tabbed card views for all 4 tracks.
- **Department Hub Detail (`/departments/[id]`)**: Roster, sprint tasks, scheduled workshops, and announcements scoped to that track.

### 6.6 Member Directory & Dossiers (`/members`)
- **Real-Time Filtering**: Live search by member name, email, or skill keywords; filter by department, role, or status.
- **Member Dossier Page (`/members/[id]`)**:
  - Personal bio, contact info, skill pill badges, and freelance readiness star badge.
  - Assigned sprint tickets and completed deliverable history.
  - Historical attendance verification record.
  - Profile edit modal for name, bio, status, and freelance qualification.

### 6.7 Agile Sprint Kanban Board (`/tasks`)
- **4-Column Sprint Board**: *To Do*, *In Progress*, *In Review*, and *Completed*.
- **Task Card**: Priority indicator (*Low*, *Medium*, *High*, *Urgent*), assignee avatar, due date, department badge, comment count.
- **Task Creation Modal**: Allocate technical deliverables, set priority, assign members, and define due dates.
- **Ticket Detail Modal**: Change task status, read description, view creator/assignee metadata, and participate in threaded task comments.
- **Celebration Feedback**: Triggers confetti when tickets are transitioned to *Completed*.
- **Realtime Sync**: Subscribes to Supabase Realtime channel `tasks_realtime` to reflect updates across all screens live.

### 6.8 Attendance Hub & Dynamic QR Verification (`/attendance`)
- **Host Console**:
  - Dynamic QR code generation for the active session.
  - Large alphanumeric session passcode (e.g. `AST-2026`, `WEB-DEV26`).
  - Realtime attendee counter displaying live check-in count.
  - Camera scan simulation button for instant check-in demonstration.
- **Member Check-in Portal**:
  - 6-digit passcode input box with instant validation.
  - 1-click active session shortcuts.
- **Absence Justification Portal**:
  - Form allowing students to select missed sessions and submit academic, medical, or competition justifications.
- **Attendance Verification Table**:
  - Audit log listing attendee, check-in method (`QR`, `CODE`, `MANUAL`), status, timestamp, and justification notes.
- **Realtime Sync**: Subscribes to Supabase Realtime channel `attendance_realtime`.

### 6.9 Shared Calendar & RSVPs (`/calendar`)
- **Calendar Views**: Interactive month and week scheduling views.
- **Conflict Detection**: Flags overlapping workshops in the same room or timeframe.
- **RSVP Actions**: 1-click RSVP (*Going*, *Maybe*, *Declined*) with attendee counters.
- **Event Creation Modal**: Schedule club-wide or department workshops with dynamic check-in code generation.

### 6.10 Scoped Announcements & Discord Sync (`/announcements`)
- **Broadcast Scoping**: Post club-wide bulletins or department-internal notices.
- **Pinned Bulletins**: Pin critical notices to the top of the feed with highlight borders.
- **Discord Integration**: Live webhook dispatcher preview displaying how the announcement embeds into the Asteria Discord server.
- **Realtime Sync**: Subscribes to Supabase Realtime channel `announcements_realtime`.

### 6.11 Recruitment Review & 1-Click Auto-Onboarding (`/applications`)
- **Applicant Queue**: Filter candidates by department preference (*Web Development*, *Graphic Design*, *Video Editing*, *Photography*) and status (*Pending*, *Accepted*, *Rejected*).
- **Application Dossier Review**: View motivation text, student contact details, and external portfolio links.
- **1-Click Auto-Onboard**:
  - Provisions a real Supabase Auth user account (`supabaseAdmin.auth.admin.createUser`).
  - Creates the user profile and assigns them to their target department.
  - Updates application status to *Accepted* with reviewer notes.
  - Creates an audit log entry.

### 6.12 System Governance & Admin (`/admin`)
- **Academic Cycle Management**: Displays the active semester period and provides a cycle rollover/archive modal.
- **Supabase Cloud Status Card**: Displays connected cloud database and key protection status.
- **Executive Board Allocation**: Manage executive board seat assignments and ordering.
- **Department Creation**: Provision new technical tracks with custom icons, slugs, and descriptions.
- **Security Audit Trail**: Chronological log of all administrative actions, onboarding events, and role updates.

---

## 7. REST API Endpoint Catalog

All 22 backend endpoints are fully implemented in `src/app/api/`:

| Endpoint | Method | Auth Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/me` | `GET` | Optional | Returns currently authenticated user session and profile. |
| `/api/auth/login` | `POST` | Public | Authenticates via Supabase Auth or database credentials; sets session cookie. |
| `/api/auth/logout` | `POST` | Public | Clears Supabase session and removes auth cookies. |
| `/api/auth/switch-role` | `POST` | Development/Demo | Switches active session persona for testing. |
| `/api/dashboard` | `GET` | Authenticated | Aggregates role-specific KPIs, sprint metrics, upcoming events, and audit logs. |
| `/api/members` | `GET` | Authenticated | Returns member directory with search and multi-parameter filters. |
| `/api/members/[id]` | `GET`, `PATCH` | Authenticated | Fetches member profile dossier or updates bio, status, and freelance readiness. |
| `/api/departments` | `GET`, `POST` | Authenticated | Lists all departments or creates a new technical track (Board only). |
| `/api/departments/[id]` | `GET` | Authenticated | Returns department details, roster, tasks, events, and announcements. |
| `/api/departments/org-chart` | `GET` | Authenticated | Returns Tier 1 Board seats and Tier 2 department hierarchy. |
| `/api/tasks` | `GET`, `POST` | Authenticated | Lists sprint tasks with filters or creates a new sprint ticket. |
| `/api/tasks/[id]` | `GET`, `PATCH`, `DELETE` | Authenticated | Fetches ticket details, updates task status/priority, or deletes ticket. |
| `/api/tasks/[id]/comments` | `POST` | Authenticated | Adds a threaded comment to a sprint task. |
| `/api/events` | `GET`, `POST` | Authenticated | Lists calendar events with conflict checks or creates a new session. |
| `/api/events/[id]/rsvp` | `POST` | Authenticated | Sets or updates member RSVP status (*Going*, *Maybe*, *Declined*). |
| `/api/attendance` | `GET` | Authenticated | Returns attendance verification records and check-in logs. |
| `/api/attendance/check-in` | `POST` | Authenticated | Registers check-in via QR code or 6-digit numeric passcode. |
| `/api/attendance/justify` | `POST` | Authenticated | Submits an absence justification for a missed workshop. |
| `/api/announcements` | `GET`, `POST` | Authenticated | Lists bulletins or publishes a new announcement with Discord sync. |
| `/api/applications` | `GET`, `POST` | Public (`POST`) / Board (`GET`) | Submits application dossier or lists applicant queue. |
| `/api/applications/[id]` | `GET`, `PATCH` | Board/HoD | Fetches candidate dossier or updates application status. |
| `/api/applications/[id]/onboard` | `POST` | Board Only | 1-Click auto-provisions Supabase Auth account and assigns member track. |
| `/api/admin` | `GET`, `POST` | Board Only | Governance controls: cycle rollover, board seat allocations, audit trail. |

---

## 8. Supabase Cloud Integration & Realtime Architecture

### A. SQL Migration
Located in [`supabase/migrations/20260228_initial_schema.sql`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/supabase/migrations/20260228_initial_schema.sql):
- Creates all 11 relational tables with PostgreSQL extensions.
- Configures `handle_new_user()` trigger on `auth.users` to automatically populate `public.profiles`.
- Implements comprehensive Row Level Security (RLS) policies for Board, HoD, Member, and Public roles.

### B. Realtime Subscriptions
Live WebSocket subscriptions are established in:
- `KanbanBoard.tsx`: Channel `tasks_realtime` on table `tasks`.
- `AttendanceHub.tsx`: Channel `attendance_realtime` on table `attendance_records`.
- `AnnouncementsFeed.tsx`: Channel `announcements_realtime` on table `announcements`.

---

## 9. Deployment & Environment Configuration

### Environment Variables (`.env.local` / `.env`)
```env
# Supabase Cloud Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_publishable_key"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_supabase_publishable_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_secret_key"
SUPABASE_SECRET_KEY="your_supabase_secret_key"

# Database Connection (Local SQLite or Supabase PostgreSQL URI)
DATABASE_URL="file:./dev.db"

# JWT Secret
JWT_SECRET="asteria-super-secret-jwt-key-2026"

# Demo Mode (Set "true" for evaluation switcher, "false" in production)
NEXT_PUBLIC_DEMO_MODE="true"
```

### Essential CLI Commands
```bash
# 1. Install dependencies
npm install

# 2. Sync database schema
npx prisma db push

# 3. Seed initial demo data (optional for fresh databases)
npx tsx prisma/seed.ts

# 4. Build for production (verifies 0 TypeScript errors)
npm run build

# 5. Start development server
npm run dev
```

---
*© 2026 Asteria Club Esprit · ESPRIT University · Designed and Built for Asteria Freelance Talent Operations.*
