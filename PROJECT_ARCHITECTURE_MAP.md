# Asteria Club Esprit — System Architecture Map

**System:** Asteria Club Esprit Management Platform & Incubator OS  
**Architecture Model:** Hybrid Serverless Full-Stack Web Application  
**Primary Framework:** Next.js 15 / 16 (App Router)  
**Database Model:** Dual-tier (Prisma ORM SQLite / Supabase PostgreSQL)  

---

## 1. High-Level System Architecture

```mermaid
flowchart TB
    subgraph Users ["Users & Client Personas"]
        Visitor["Public Visitor<br/>(Prospective Student)"]
        Member["Active Club Member<br/>(4 Creative Tracks)"]
        HoD["Head of Department<br/>(Track Leader)"]
        Board["Executive Board<br/>(President / VP / Superuser)"]
    end

    subgraph ClientLayer ["Client Presentation Layer (Browser)"]
        PublicPages["Public Portal<br/>• Landing Page (/ )<br/>• Recruitment Form (/apply)<br/>• Auth Screens (/login, /signup)"]
        DashboardPages["Authenticated OS (/dashboard)<br/>• Task Kanban (/tasks)<br/>• QR Attendance (/attendance)<br/>• Event Calendar (/calendar)<br/>• Department Hubs (/departments)<br/>• Member Dossiers (/members)<br/>• Governance & Audit (/admin)"]
        ClientState["Client State & Contexts<br/>• LanguageProvider (EN/FR)<br/>• ThemeProvider (Dark/Light)<br/>• SmoothScrollProvider (Lenis)<br/>• AmbientCanvas (Three.js)"]
    end

    subgraph NextServer ["Next.js Server Runtime (App Router)"]
        Middleware["Next.js Middleware<br/>(src/middleware.ts)"]
        
        subgraph ServerComponents ["React Server Components (RSC)"]
            RSC_Layout["Root & Dashboard Layouts"]
            RSC_Dashboard["Dashboard SSR Aggregator"]
        end

        subgraph RouteHandlers ["REST API Route Handlers (/api/*)"]
            API_Auth["/api/auth/*<br/>(login, logout, me, switch-role)"]
            API_Core["/api/tasks, /api/events,<br/>/api/attendance, /api/departments"]
            API_Admin["/api/admin, /api/applications,<br/>/api/stats, /api/members"]
        end

        AuthModule["Auth & Session Guard<br/>(src/lib/auth.ts)"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        PrismaORM["Prisma ORM 6.1<br/>(src/lib/db.ts)"]
        LocalDB[("Active SQLite Database<br/>prisma/dev.db or /tmp/dev.db")]
        SupabaseCloud[("Supabase Cloud Database<br/>PostgreSQL Pooler / Direct")]
    end

    subgraph ExternalEcosystem ["External Services & Integrations"]
        FreelanceSite["Asteria Freelance PreLaunch<br/>(asteria-freelance-prelaunch.vercel.app)"]
        DiscordBot["Discord Webhook<br/>(Planned / Simulated)"]
        SupabaseWS["Supabase Realtime WebSocket<br/>(tasks, attendance, bulletins)"]
    end

    Visitor --> PublicPages
    Member & HoD & Board --> DashboardPages
    PublicPages & DashboardPages --> ClientState
    PublicPages & DashboardPages --> Middleware

    Middleware --> ServerComponents
    Middleware --> RouteHandlers

    ServerComponents & RouteHandlers --> AuthModule
    AuthModule --> PrismaORM
    RouteHandlers --> PrismaORM

    PrismaORM -->|Current Active Target| LocalDB
    PrismaORM -.->|Target Production Migration| SupabaseCloud

    DashboardPages -.->|Subscribes to WebSockets| SupabaseWS
    DashboardPages -->|Graduation / Portfolio Bridge| FreelanceSite
    RouteHandlers -.->|Echoed payload| DiscordBot
```

---

## 2. Core Modules Breakdown

| Module | Route(s) | Primary Purpose | User Roles | Data Entities |
| :--- | :--- | :--- | :--- | :--- |
| **Public Showcase & FAQ** | `/` | Club brand introduction, specialization track highlights, curriculum, stats counters, and FAQ. | Public | `Department`, `Task`, `User` (aggregated) |
| **Recruitment Portal** | `/apply` | Public student application submission for seasonal recruitment. | Public / Applicant | `Application` |
| **Authentication & Persona** | `/login`, `/signup` | User login, JWT token minting, session cookie persistence. | All | `User`, `Department`, `BoardSeat` |
| **Executive & Member Dashboards** | `/dashboard` | Role-specific console: Board KPIs, HoD track sprint meters, Member assigned tickets and attendance health. | Board, HoD, Member, Applicant | All entities |
| **Task Kanban Board** | `/tasks` | 4-column agile sprint board (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`), priorities, comments, and member assignments. | Board, HoD, Member | `Task`, `TaskComment`, `Department`, `User` |
| **Attendance & QR Check-In** | `/attendance` | Dynamic QR code generation, 6-digit passcode validation, camera simulation, absence justification. | Board, HoD, Member | `Event`, `AttendanceRecord`, `User` |
| **Shared Event Calendar** | `/calendar` | Scheduled workshops, general assemblies, conflict warnings, and 1-click RSVP (`GOING`, `MAYBE`, `DECLINED`). | Board, HoD, Member | `Event`, `RSVP`, `Department` |
| **Department Hubs & Org Chart** | `/departments`, `/departments/[id]` | Interactive hierarchical org chart (Tier 1 Board to Tier 2 Leads & members) and dedicated department sprint hubs. | Board, HoD, Member | `Department`, `BoardSeat`, `User`, `Task` |
| **Member Directory & Dossiers** | `/members`, `/members/[id]` | Searchable member catalog, skill tags, freelance readiness badges, and dossier profile editing. | Board, HoD, Member | `User`, `Department`, `AttendanceRecord` |
| **Announcements & Bulletins** | `/announcements` | Scoped broadcast notices (Club-wide vs Departmental), pinned bulletins, Discord embed preview. | All authenticated | `Announcement`, `Department`, `User` |
| **Recruitment Review & Onboarding** | `/applications` | Pipeline review of applicant portfolios and 1-click instant member provisioning. | Board, HoD | `Application`, `User`, `Department` |
| **System Governance & Audit** | `/admin` | Academic year cycle rollovers, board seat assignments, track management, and audit log inspection. | Board | `BoardSeat`, `Department`, `AuditLog` |

---

## 3. Frontend Architecture

### Component Hierarchy

```mermaid
flowchart TD
    RootLayout["RootLayout (src/app/layout.tsx)"]
    
    subgraph Providers ["Context Providers"]
        TP["ThemeProvider (Dark / Light)"]
        LP["LanguageProvider (EN / FR)"]
        SSP["SmoothScrollProvider (Lenis)"]
    end

    subgraph Pages ["Application Pages"]
        Home["HomePage (src/app/page.tsx)"]
        DashLayout["DashboardLayout (src/app/(dashboard)/layout.tsx)"]
    end

    subgraph Shell ["Dashboard Shell Components"]
        Switcher["RoleSwitcherBar (Demo persona switcher)"]
        Sidebar["Sidebar (Desktop navigation & profile card)"]
        Header["Header (Title, Theme, Lang, HelpModal, Notifications)"]
        MobileNav["MobileNav (Bottom bar for mobile viewports)"]
        ContentArea["Dynamic Page Content"]
    end

    RootLayout --> TP
    TP --> LP
    LP --> SSP
    SSP --> Home
    SSP --> DashLayout

    DashLayout --> Switcher
    DashLayout --> Sidebar
    DashLayout --> Header
    DashLayout --> ContentArea
    DashLayout --> MobileNav
```

### Design System Implementation
* **Design Token Configuration**: Defined in `tailwind.config.ts` adhering strictly to **Asteria Charte Graphique 2026 (v2.1)**.
* **Palette**:
  * Primary Accent: `teal-900` (`#11606E`)
  * Complementary Accent: `teal-400` (`#60C8D4`)
  * Dark Canvas: `ast-dark` (`#0A3A40`), `ast-darker` (`#062327`)
  * Text Ink: `ink` (`#12201F`), `ink-soft` (`#4B5C5C`), `ink-faint` (`#8A9695`)
* **Typography**:
  * Headings: `Exo 2` (`var(--font-exo2)`)
  * Body: `Plus Jakarta Sans` (`var(--font-jakarta)`)
  * Data/Monospace: `JetBrains Mono` (`var(--font-jetbrains)`)
* **Motion Tokens**:
  * `vague`: `cubic-bezier(0.16, 1, 0.3, 1)` (300ms modal entrances, card reveals)
  * `courant`: `cubic-bezier(0.65, 0, 0.35, 1)` (300ms tab switches, state transitions)
  * `maree`: `cubic-bezier(0.37, 0, 0.63, 1)` (500ms dismissals, collapses)

---

## 4. Backend Architecture & API Gateway

The backend is built using Next.js Route Handlers (`src/app/api/**/route.ts`).

### Request Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Client as Browser Client
    participant MW as Next.js Middleware
    participant Route as Route Handler (/api/*)
    participant Auth as Auth Resolver (auth.ts)
    participant DB as Prisma Client (db.ts)
    participant Store as SQLite / PostgreSQL

    Client->>MW: HTTP Request (Cookie: asteria_session_token)
    MW->>Route: Pass-through request
    Route->>Auth: getCurrentUser()
    Auth->>Auth: Verify JWT Token
    alt Token Valid
        Auth->>DB: prisma.user.findUnique({ id })
        DB->>Store: Query User
        Store-->>DB: Return Record
        DB-->>Auth: User Entity
        Auth-->>Route: UserSession Object
    else Token Missing or Invalid
        Auth-->>Route: null (or President fallback in flawed code)
    end

    Route->>Route: Check Permissions (hasPermission / inline)
    Route->>DB: prisma.<model>.<action>()
    DB->>Store: SQL Execution
    Store-->>DB: Result Set
    DB-->>Route: Data Object
    Route-->>Client: JSON Response (HTTP 200 / 201 / 401 / 403)
```

---

## 5. Database Architecture

### Entity-Relationship Model

```mermaid
erDiagram
    User ||--o| Department : "belongs to"
    User ||--o| Department : "is Head of (HoD)"
    User ||--o| BoardSeat : "occupies"
    User ||--o{ Task : "created by"
    User ||--o{ Task : "assigned to"
    User ||--o{ TaskComment : "authored"
    User ||--o{ Event : "created by"
    User ||--o{ RSVP : "submitted"
    User ||--o{ AttendanceRecord : "logged"
    User ||--o{ Announcement : "broadcasted"
    User ||--o{ AuditLog : "performed"

    Department ||--o{ User : "members"
    Department ||--o{ Task : "contains"
    Department ||--o{ Event : "hosts"
    Department ||--o{ Announcement : "scoped to"

    Event ||--o{ RSVP : "receives"
    Event ||--o{ AttendanceRecord : "tracks"
    
    Task ||--o{ TaskComment : "has"

    User {
        string id PK "cuid()"
        string name
        string email UK
        string passwordHash
        string role "BOARD | HOD | MEMBER | APPLICANT"
        string departmentId FK
        string avatarUrl
        string bio
        string skills "JSON string"
        string status "ACTIVE | INACTIVE | ALUMNI"
        boolean freelanceReady
        datetime joinDate
        datetime createdAt
        datetime updatedAt
    }

    Department {
        string id PK "cuid()"
        string name UK
        string slug UK
        string description
        string icon
        string hodUserId FK, UK
        datetime createdAt
        datetime updatedAt
    }

    BoardSeat {
        string id PK "cuid()"
        string title
        string userId FK, UK
        int order
        datetime createdAt
    }

    Event {
        string id PK "cuid()"
        string title
        string description
        datetime startTime
        datetime endTime
        string location
        string departmentId FK
        string recurrenceRule
        string checkInCode
        string createdById FK
        datetime createdAt
        datetime updatedAt
    }

    RSVP {
        string id PK "cuid()"
        string eventId FK
        string userId FK
        string status "GOING | MAYBE | DECLINED"
        datetime createdAt
        datetime updatedAt
    }

    AttendanceRecord {
        string id PK "cuid()"
        string eventId FK
        string userId FK
        datetime checkedInAt
        string method "QR | CODE | MANUAL"
        string status "PRESENT | ABSENT | EXCUSED"
        string justification
        datetime createdAt
    }

    Task {
        string id PK "cuid()"
        string title
        string description
        string departmentId FK
        string assigneeId FK
        string createdById FK
        string status "TODO | IN_PROGRESS | REVIEW | DONE"
        string priority "LOW | MEDIUM | HIGH | URGENT"
        datetime dueDate
        datetime createdAt
        datetime updatedAt
    }

    TaskComment {
        string id PK "cuid()"
        string taskId FK
        string userId FK
        string body
        datetime createdAt
    }

    Announcement {
        string id PK "cuid()"
        string title
        string body
        string scope "CLUB | DEPARTMENT"
        string departmentId FK
        string authorId FK
        boolean isPinned
        datetime createdAt
        datetime updatedAt
    }

    Application {
        string id PK "cuid()"
        string name
        string email
        string phone
        string departmentPreference
        string motivation
        string portfolioLink
        string status "PENDING | ACCEPTED | REJECTED"
        string reviewerNotes
        datetime createdAt
        datetime updatedAt
    }

    AuditLog {
        string id PK "cuid()"
        string userId FK
        string action
        string details
        datetime createdAt
    }
```

---

## 6. Authentication & Session Architecture

1. **Credentials Verification**: Passwords hashed with `bcryptjs` (salt rounds: 10).
2. **Session Token**: Signed JSON Web Token (JWT) containing `userId`, `email`, and `role`. Signed with `JWT_SECRET` (default 7-day expiration).
3. **Cookie Storage**: Stored in `asteria_session_token` cookie with flags `HttpOnly`, `Path=/`, `SameSite=Lax`. (Missing: `Secure=true` in production).
4. **Session Resolution Flow**:
   * API handlers call `getCurrentUser()`.
   * Reads cookie via `cookies().get("asteria_session_token")`.
   * Verifies JWT with `verifyToken()`.
   * Queries Prisma for live user data.

---

## 7. Authorization & Role-Based Access Control (RBAC)

The system defines 4 hierarchical personas:

```mermaid
graph TD
    BOARD["1. BOARD (Executive Board)<br/>Superuser access across all departments, tasks, members, and admin governance."]
    HOD["2. HOD (Head of Department)<br/>Access to manage own department tasks, members, attendance, and recruitment pipeline."]
    MEMBER["3. MEMBER (Active Creator)<br/>Access to personal assigned tasks, event RSVPs, check-in portal, and member directory."]
    APPLICANT["4. APPLICANT (Recruit in Review)<br/>Restricted access: public announcements, application status screen."]

    BOARD --> HOD
    HOD --> MEMBER
    MEMBER --> APPLICANT
```

---

## 8. External Services & Talent Bridge

1. **Asteria Freelance PreLaunch Bridge**:
   * URL: `https://asteria-freelance-prelaunch.vercel.app/`
   * Role: The primary commercial incubator target. Students completing sprint tickets and maintaining high attendance health receive the `freelanceReady: true` credential, qualifying them for paid commercial client contracts.
2. **Supabase Cloud (PostgreSQL / Auth / Realtime)**:
   * Target production database and realtime WebSocket service.
3. **Discord Integration**:
   * Documented as rich embed notification engine for `#announcements`. Currently implemented as a UI simulation without backend webhook dispatch.

---

## 9. Deployment & Infrastructure Architecture

```mermaid
flowchart LR
    subgraph Repo ["GitHub Repository"]
        GitMain["main branch"]
    end

    subgraph CI ["Build & Deploy (Vercel)"]
        BuildStep["1. prisma generate<br/>2. prisma db push (FLAWED)<br/>3. seed.ts (FLAWED)<br/>4. next build"]
        Lambdas["Serverless Functions<br/>(Node.js 20 Runtime)"]
        EdgeStatic["Vercel Edge Network<br/>(Static Chunks & Assets)"]
    end

    subgraph Storage ["Active Persistent Storage"]
        TmpFS["/tmp/dev.db (EPHEMERAL)"]
        SupabaseTarget[("Supabase Cloud DB (RECOMMENDED)")]
    end

    GitMain -->|Git Push| BuildStep
    BuildStep --> Lambdas
    BuildStep --> EdgeStatic
    Lambdas -->|Current writes| TmpFS
    Lambdas -.->|Remediated writes| SupabaseTarget
```

* **Hosting Provider**: Vercel Serverless Platform
* **Serverless Caveat**: Because SQLite writes to `/tmp`, database state is not shared across Lambda invocations and resets upon cold restart. Migrating to Supabase PostgreSQL is required for persistent production deployment.
