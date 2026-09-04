# Asteria Club Esprit — Dead Code & Static / Placeholder Data Report

**Repository:** `itshydraaaaaa/Asteria-Club-Esprit`  
**Scope:** Exhaustive audit of all unused, unreachable, deprecated, or disconnected code and mock/placeholder UI elements across the codebase.

---

## 1. Dead Files

| File Path | Description | Why It Is Dead | Action |
| :--- | :--- | :--- | :--- |
| `src/lib/motion.ts` | Water-inspired motion easing curves (`MOTION_EASINGS`, `MOTION_DURATIONS`, `fadeInUp`, `modalVariants`). | Never imported or referenced in any file in `src/`. All active motion styling is defined directly in `tailwind.config.ts`. | **SAFE TO DELETE** |
| `supabase/migrations/20260228_initial_schema.sql` | PostgreSQL schema migration for Supabase. | Active application runtime exclusively queries local SQLite database `prisma/dev.db`. | **REVIEW BEFORE DELETE** (Keep if migrating to PostgreSQL) |

---

## 2. Dead Functions & Unused Exports

| File | Line | Function / Export | Why It Is Dead | Action |
| :--- | :---: | :--- | :--- | :--- |
| `src/lib/auth.ts` | 102 | `export function hasPermission(...)` | Exported utility for role-based authorization, but never imported or called in any API route or component. | **REVIEW BEFORE DELETE** (Should be integrated into API authorization checks) |
| `src/components/ui/Card.tsx` | 68 | `export function CardDescription(...)` | Exported card subcomponent; never imported or used across any screen. | **SAFE TO DELETE** |
| `src/components/ui/Card.tsx` | 92 | `export function CardFooter(...)` | Exported card subcomponent; never imported or used across any screen. | **SAFE TO DELETE** |
| `src/components/ui/Skeleton.tsx` | 31 | `export function CardSkeleton(...)` | Pre-built card skeleton loading component; never imported in any page or component. | **REVIEW BEFORE DELETE** (Should be integrated for suspense fallbacks) |
| `src/components/ui/Skeleton.tsx` | 8 | `export function Skeleton(...)` | Base skeleton pulse component; never imported in any active view. | **REVIEW BEFORE DELETE** |

---

## 3. Unused Dependencies

| Package | Version | Location | Why It Is Dead | Action |
| :--- | :--- | :--- | :--- | :--- |
| `gsap` | `^3.15.0` | `package.json:22` | GreenSock Animation Platform installed in `dependencies`, but never imported in any TypeScript or CSS file in `src/`. | **SAFE TO DELETE** (`npm uninstall gsap`) |

---

## 4. Unused Database Fields & Attributes

| Model | Field | File | Description | Impact |
| :--- | :--- | :--- | :--- | :--- |
| `Event` | `recurrenceRule` | `prisma/schema.prisma:75` | String storing e.g. `"WEEKLY"`, `"MONTHLY"`. | Never evaluated by calendar views or scheduling recurrence engines. All events are treated as one-off instances. |
| `AuditLog` | `userId` | `prisma/schema.prisma:178` | Optional foreign key to User. | In `AuditLog` table, several log entries are inserted without `userId` or never joined for user activity auditing. |

---

## 5. Commented-Out Code & Inactive Blocks

| File | Line(s) | Code / Pattern | Description | Action |
| :--- | :---: | :--- | :--- | :--- |
| `src/app/api/auth/logout/route.ts` | 9 | `} catch {}` | Completely empty catch block swallowing Supabase sign-out errors silently. | Add proper error logging. |
| `src/lib/supabase/server.ts` | 53 | `} catch {}` | Completely empty catch block swallowing cookie mutation exceptions in Server Components. | Add structured logger. |
| `src/app/api/auth/me/route.ts` | 60 | `// Fallback to local session / demo mode user...` | Leftover comment from earlier dev audit pass. | Clean up comment. |

---

## 6. Static / Mock Data Presented to Users

### 1. Admin Supabase Cloud Status Card
* **File:** [`src/app/(dashboard)/admin/page.tsx:145-179`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/%28dashboard%29/admin/page.tsx#L145-L179)
* **Lines:** 145–179
* **Static Content:**
  * *"★ Supabase Cloud Connected"*
  * *"Row Level Security (RLS) Active"* (Pulsing green dot)
  * *"Realtime WebSockets Synchronized"* (Pulsing green dot)
  * *"Live & Protected"*
* **Issue:** Completely hardcoded static JSX. It renders green "Active" and "Connected" indicators regardless of network status, database connectivity, or whether RLS is actually configured.
* **Remediation:** Connect to a real health check endpoint (`/api/health`) that verifies live PostgreSQL ping and RLS policy status.

### 2. Discord Synchronization Badge
* **File:** [`src/components/announcements/AnnouncementsFeed.tsx:238-241`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/components/announcements/AnnouncementsFeed.tsx#L238-L241)
* **Lines:** 238–241
* **Static Content:**
  * `<span ...><Bot ... /> Synced to Discord #announcements</span>`
* **Issue:** Every single announcement card renders this badge unconditionally. The backend route `POST /api/announcements` merely echoes back `discordSynced: syncDiscord` without contacting Discord APIs or Webhooks.
* **Remediation:** Either implement actual Discord Webhook execution via `fetch(process.env.DISCORD_WEBHOOK_URL)` or remove the misleading badge until the integration is live.

### 3. Header Notifications Popover
* **File:** [`src/components/layout/Header.tsx:105-128`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/components/layout/Header.tsx#L105-L128)
* **Lines:** 105–128
* **Static Content:**
  * Card saying *"Real-Time Bulletins · Supabase Live"*
  * Text: *"All announcements and sprint notifications are synced live across your devices."*
* **Issue:** Clicking the bell icon opens a popover containing static promotional text instead of real, dynamic user notifications.
* **Remediation:** Fetch notifications from an actual notification table or link directly to `/announcements`.

### 4. Camera QR Scanner Simulator
* **File:** [`src/components/attendance/AttendanceHub.tsx:309-315`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/components/attendance/AttendanceHub.tsx#L309-L315)
* **Lines:** 309–315
* **Static Content:**
  * Button labeled: *"⚡ Simulate Member Camera Scan"*
* **Issue:** Documentation promises a camera scanner; in reality, this button simply submits the selected event's check-in code directly via POST.
* **Remediation:** Implement a real HTML5 camera scanner using `@zxing/library` or `html5-qrcode`, or accurately label the feature as a demonstration tool.

### 5. Academic Cycle Data
* **File:** [`src/app/api/admin/route.ts:34-40`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/admin/route.ts#L34-L40)
* **Lines:** 34–40
* **Static Content:**
  ```typescript
  currentCycle: {
    name: "Academic Year 2025-2026 · Semester 2",
    status: "ACTIVE",
    startDate: "2025-09-01",
    endDate: "2026-06-30",
  }
  ```
* **Issue:** Academic cycle details are hardcoded in the API route response rather than stored in a database table.
* **Remediation:** Create an `AcademicCycle` model in Prisma to persist and manage semesters dynamically.

---

## 7. Hardcoded Business Values

| Value | File Location | Line | Category | Why It Is a Problem | Recommended Placement |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `FREELANCE_THRESHOLD = 5` | `src/components/dashboard/MemberDashboard.tsx` | 46 | Business Logic | Hardcodes that 5 completed tasks are required for Asteria Freelance readiness. Cannot be altered by Board or changed per track. | Centralized business configuration or database club settings. |
| `checkInCode = "AST-2026"` | `prisma/schema.prisma` | 76 | Business Logic | Default check-in code for all events. All newly created events share the identical passcode. | Cryptographically generated per-event random token. |
| `maxAge: 7 * 24 * 60 * 60` | `src/app/api/auth/login/route.ts` | 99 | Auth / Session | 7-day session lifetime hardcoded inline in multiple route files. | `src/lib/constants.ts` (`SESSION_MAX_AGE`). |
| `particleCount = 45` | `src/components/ui/AmbientCanvas.tsx` | 14 | UI / Performance | Fixed particle count rendered regardless of client GPU capabilities or device tier. | Adaptive prop based on device memory / user agent. |

---

## 8. Placeholder Functionality & Stubs

1. **Cycle Rollover Action** ([`src/app/api/admin/route.ts:74-88`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/admin/route.ts#L74-L88)):
   * Clicking "Rollover Cycle" creates an `AuditLog` entry, but performs no archival of completed tasks, attendance records, or member semester progression.
2. **Social Links** ([`src/app/page.tsx:603, 612`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/page.tsx#L603)):
   * Anchor tags point to root `https://instagram.com` and `https://linkedin.com` instead of club profile URLs.
3. **Absence Justification Attachment**:
   * Absence justifications only allow entering a text string; there is no ability to attach medical certificates or academic conflict proofs.
