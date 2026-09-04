# Asteria Club Esprit — Database Architecture & Query Audit Report

**ORM / Engine:** Prisma ORM 6.1  
**Datasource Provider:** SQLite (`file:./dev.db`) vs Target PostgreSQL (Supabase)  
**Schema Path:** `prisma/schema.prisma`  
**Migration Path:** `supabase/migrations/20260228_initial_schema.sql`  

---

## 1. Schema & Engine Evaluation

### The SQLite vs PostgreSQL Dichotomy
The codebase contains a fundamental contradiction between its configuration and documented architecture:
* `prisma/schema.prisma` explicitly declares `provider = "sqlite"` with `url = "file:./dev.db"`.
* `DOCUMENTATION.md` and `SETUP.md` claim the platform uses **Supabase Cloud PostgreSQL**.
* `supabase/migrations/20260228_initial_schema.sql` contains a full PostgreSQL DDL schema with UUIDs, Row Level Security (RLS) policies, and foreign keys referencing `auth.users`.
* In `src/lib/db.ts`, when running on serverless runtimes (Vercel / AWS Lambda), the code copies `dev.db` into `/tmp/dev.db`.

```
┌─────────────────────────────────────────────────────────────┐
│                       CRITICAL FINDING                      │
│  The serverless SQLite database in /tmp is ephemeral and    │
│  isolated per container. Writes made in one Lambda are      │
│  invisible to others and destroyed when instances recycle.   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Table-by-Table Architectural Audit

### 1. `User` Table (`prisma/schema.prisma:10-38`)
* **Primary Key:** `id String @id @default(cuid())` (CUID string).
* **Fields:** `name`, `email`, `passwordHash`, `role`, `departmentId`, `avatarUrl`, `bio`, `skills`, `status`, `freelanceReady`, `joinDate`, `createdAt`, `updatedAt`.
* **Findings:**
  * `skills` is stored as a plain `String` storing a JSON stringified array (`"[]"`). Every query requires manual `JSON.parse` with try/catch blocks.
  * `role` is stored as a plain `String @default("MEMBER")` instead of a native enum (`Role`).
  * `status` is stored as a plain `String @default("ACTIVE")` instead of an enum (`UserStatus`).
  * Missing index on `email` (covered by `@unique`), but missing index on `departmentId`, `role`, and `status`.

### 2. `Department` Table (`prisma/schema.prisma:40-55`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Unique Constraints:** `name @unique`, `slug @unique`, `hodUserId @unique`.
* **Findings:**
  * Deleting a user who is HoD fails foreign key constraints because `onDelete` is not set on `DepartmentHoD` relation in `Department`. Should be `onDelete: SetNull`.

### 3. `BoardSeat` Table (`prisma/schema.prisma:57-65`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Unique Constraints:** `userId @unique`.
* **Findings:**
  * No check constraint ensures that `user.role === "BOARD"`. Any user can be assigned a Board seat.

### 4. `Event` Table (`prisma/schema.prisma:67-85`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Findings:**
  * `checkInCode` defaults to `"AST-2026"`. It is NOT unique and NOT indexed. Multiple events share the exact same passcode.
  * No database check constraint ensures `endTime > startTime`.
  * Missing index on `startTime` (queried frequently with `gte: new Date()`).
  * Missing index on `departmentId`.

### 5. `RSVP` Table (`prisma/schema.prisma:87-99`)
* **Compound Unique Constraint:** `@@unique([eventId, userId])`.
* **Findings:**
  * Properly cascades on delete (`onDelete: Cascade`).
  * `status` is a `String @default("GOING")` instead of an enum.

### 6. `AttendanceRecord` Table (`prisma/schema.prisma:101-115`)
* **Compound Unique Constraint:** `@@unique([eventId, userId])`.
* **Findings:**
  * Missing index on `checkedInAt` (frequently sorted in desc order).
  * Missing index on `status` (frequently counted with `where: { status: "PRESENT" }`).
  * `method` (`QR`, `CODE`, `MANUAL`) and `status` (`PRESENT`, `ABSENT`, `EXCUSED`) are unconstrained strings.

### 7. `Task` Table (`prisma/schema.prisma:117-134`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Findings:**
  * Missing index on `departmentId`, `assigneeId`, `createdById`, and `status`.
  * `status` (`TODO`, `IN_PROGRESS`, `REVIEW`, `DONE`) and `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) are strings without enum validation.

### 8. `TaskComment` Table (`prisma/schema.prisma:136-145`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Findings:**
  * Missing index on `taskId` and `userId`.
  * Properly cascades on task/user deletion.

### 9. `Announcement` Table (`prisma/schema.prisma:147-160`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Findings:**
  * Missing index on `departmentId`, `authorId`, and `createdAt`.
  * Missing composite index `@@index([isPinned, createdAt])` for ordered feed fetches.

### 10. `Application` Table (`prisma/schema.prisma:162-174`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Findings:**
  * Missing unique constraint on `email`. Application route checks `findFirst({ where: { email } })` in code, but concurrent requests cause race conditions.
  * Missing index on `departmentPreference` and `status`.

### 11. `AuditLog` Table (`prisma/schema.prisma:176-184`)
* **Primary Key:** `id String @id @default(cuid())`.
* **Findings:**
  * Missing index on `userId` and `createdAt`.
  * `details` is an unstructured string; storing structured JSON data is preferable.

---

## 3. Missing Indexes Catalog

| Table | Column(s) | Current Index? | Query Use Case | Recommended Index |
| :--- | :--- | :---: | :--- | :--- |
| `Task` | `departmentId` | NO | Filter tasks by department (`/tasks`, `/departments/[id]`) | `@@index([departmentId])` |
| `Task` | `assigneeId` | NO | Filter member tasks (`/dashboard`, `/tasks`) | `@@index([assigneeId])` |
| `Task` | `status` | NO | Kanban column grouping, completion count | `@@index([status])` |
| `Event` | `startTime` | NO | Upcoming event filtering (`gte: new Date()`) | `@@index([startTime])` |
| `Event` | `departmentId` | NO | Department event filtering | `@@index([departmentId])` |
| `Event` | `checkInCode` | NO | Passcode verification lookup | `@@unique([checkInCode])` |
| `AttendanceRecord` | `checkedInAt` | NO | Sorting attendance logs | `@@index([checkedInAt])` |
| `AttendanceRecord` | `status` | NO | Attendance rate aggregation queries | `@@index([status])` |
| `Announcement` | `isPinned, createdAt` | NO | Bulletin feed sorting (`orderBy: [isPinned, createdAt]`) | `@@index([isPinned, createdAt])` |
| `Application` | `email` | NO | Duplicate application prevention | `@@unique([email])` |
| `Application` | `status` | NO | Recruitment pipeline filtering | `@@index([status])` |
| `AuditLog` | `createdAt` | NO | Audit feed reverse chronological sort | `@@index([createdAt])` |

---

## 4. Query Performance & Concurrency Audit

### 1. Sequential Unbatched Count Aggregation (`src/app/api/dashboard/route.ts:12-21`)
```typescript
// CURRENT FLAWED IMPLEMENTATION: 8 sequential network roundtrips
const totalMembers = await prisma.user.count({ where: { status: "ACTIVE" } });
const totalDepartments = await prisma.department.count();
const pendingApplications = await prisma.application.count({ where: { status: "PENDING" } });
const totalTasks = await prisma.task.count();
const completedTasks = await prisma.task.count({ where: { status: "DONE" } });
const totalEvents = await prisma.event.count();
const totalAttendance = await prisma.attendanceRecord.count({ where: { status: "PRESENT" } });
```
* **Performance Impact:** 8 serial roundtrips create a 200–500ms latency overhead under connection pool constraints.
* **Optimized Query:**
```typescript
const [totalMembers, totalDepartments, pendingApplications, totalTasks, completedTasks, totalEvents, totalAttendance] = await Promise.all([
  prisma.user.count({ where: { status: "ACTIVE" } }),
  prisma.department.count(),
  prisma.application.count({ where: { status: "PENDING" } }),
  prisma.task.count(),
  prisma.task.count({ where: { status: "DONE" } }),
  prisma.event.count(),
  prisma.attendanceRecord.count({ where: { status: "PRESENT" } }),
]);
```

### 2. Over-Fetching Without Projections
Multiple endpoints use `include: { members: true, createdBy: true }` without `select`. This causes:
* Significant memory overhead.
* Unintended exposure of sensitive columns (`passwordHash`).
* Bloated JSON payload transfer sizes.

### 3. Missing Transactions for Multi-Step Mutations
* `src/app/api/applications/[id]/onboard/route.ts`:
  1. Upserts `prisma.user`.
  2. Updates `prisma.application`.
  3. Creates `prisma.auditLog`.
  * **Risk:** If step 2 fails, a user is created but the application remains `PENDING`, allowing duplicate onboarding.
  * **Fix:** Wrap in `prisma.$transaction([ ... ])`.

---

## 5. Recommended Production Schema (`schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  BOARD
  HOD
  MEMBER
  APPLICANT
}

enum UserStatus {
  ACTIVE
  INACTIVE
  ALUMNI
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  REVIEW
  DONE
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum RsvpStatus {
  GOING
  MAYBE
  DECLINED
}

enum AttendanceMethod {
  QR
  CODE
  MANUAL
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  EXCUSED
  EXCUSED_PENDING
}

enum AnnouncementScope {
  CLUB
  DEPARTMENT
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

model User {
  id             String     @id @default(cuid())
  name           String
  email          String     @unique
  passwordHash   String
  role           Role       @default(MEMBER)
  departmentId   String?
  avatarUrl      String?
  bio            String?
  skills         String     @default("[]") // or Json on Postgres
  status         UserStatus @default(ACTIVE)
  freelanceReady Boolean    @default(false)
  joinDate       DateTime   @default(now())
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt

  department     Department? @relation("DepartmentMembers", fields: [departmentId], references: [id], onDelete: SetNull)
  hodOf          Department? @relation("DepartmentHoD")
  boardSeat      BoardSeat?

  tasksAssigned     Task[]             @relation("TaskAssignee")
  tasksCreated      Task[]             @relation("TaskCreator")
  taskComments      TaskComment[]
  eventsCreated     Event[]            @relation("EventCreator")
  rsvps             RSVP[]
  attendanceRecords AttendanceRecord[]
  announcements     Announcement[]
  auditLogs         AuditLog[]

  @@index([departmentId])
  @@index([role])
  @@index([status])
}

model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String
  icon        String?
  hodUserId   String?  @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  hod           User?          @relation("DepartmentHoD", fields: [hodUserId], references: [id], onDelete: SetNull)
  members       User[]         @relation("DepartmentMembers")
  tasks         Task[]
  events        Event[]
  announcements Announcement[]
}

model BoardSeat {
  id        String   @id @default(cuid())
  title     String
  userId    String   @unique
  order     Int      @default(0)
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Event {
  id             String    @id @default(cuid())
  title          String
  description    String
  startTime      DateTime
  endTime        DateTime
  location       String
  departmentId   String?
  recurrenceRule String?
  checkInCode    String    @unique
  createdById    String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  department        Department?        @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  createdBy         User               @relation("EventCreator", fields: [createdById], references: [id], onDelete: Cascade)
  rsvps             RSVP[]
  attendanceRecords AttendanceRecord[]

  @@index([startTime])
  @@index([departmentId])
}

model RSVP {
  id        String     @id @default(cuid())
  eventId   String
  userId    String
  status    RsvpStatus @default(GOING)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
}

model AttendanceRecord {
  id            String           @id @default(cuid())
  eventId       String
  userId        String
  checkedInAt   DateTime         @default(now())
  method        AttendanceMethod @default(MANUAL)
  status        AttendanceStatus @default(PRESENT)
  justification String?
  createdAt     DateTime         @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([checkedInAt])
  @@index([status])
}

model Task {
  id           String       @id @default(cuid())
  title        String
  description  String?
  departmentId String
  assigneeId   String?
  createdById  String
  status       TaskStatus   @default(TODO)
  priority     TaskPriority @default(MEDIUM)
  dueDate      DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  department Department    @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  assignee   User?         @relation("TaskAssignee", fields: [assigneeId], references: [id], onDelete: SetNull)
  createdBy  User          @relation("TaskCreator", fields: [createdById], references: [id], onDelete: Cascade)
  comments   TaskComment[]

  @@index([departmentId])
  @@index([assigneeId])
  @@index([status])
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  body      String
  createdAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
}

model Announcement {
  id           String            @id @default(cuid())
  title        String
  body         String
  scope        AnnouncementScope @default(CLUB)
  departmentId String?
  authorId     String
  isPinned     Boolean           @default(false)
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  department Department? @relation(fields: [departmentId], references: [id], onDelete: SetNull)
  author     User        @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@index([isPinned, createdAt])
  @@index([departmentId])
}

model Application {
  id                   String            @id @default(cuid())
  name                 String
  email                String            @unique
  phone                String?
  departmentPreference String
  motivation           String
  portfolioLink        String?
  status               ApplicationStatus @default(PENDING)
  reviewerNotes        String?
  createdAt            DateTime          @default(now())
  updatedAt            DateTime          @updatedAt

  @@index([status])
  @@index([departmentPreference])
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  details   String
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([createdAt])
  @@index([userId])
}
```
