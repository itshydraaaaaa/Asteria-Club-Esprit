# Asteria Club Esprit — In-Depth Security Audit Report

**Application:** Asteria Club Esprit Management Platform  
**Target Repository:** `itshydraaaaaa/Asteria-Club-Esprit`  
**Security Standard:** OWASP Top 10 (2021/2025), OWASP API Security Top 10, ASVS Level 2  
**Audit Date:** September 2026  

---

## Overall Security Evaluation

```
┌─────────────────────────────────────────────────────────────┐
│                 SECURITY HEALTH SCORE: 18 / 100             │
│                     STATUS: CRITICAL RISK                   │
└─────────────────────────────────────────────────────────────┘
```

The application has multiple catastrophic security vulnerabilities that allow **unauthenticated administrative takeover, complete authentication bypass, arbitrary role elevation, public exposure of bcrypt password hashes, and persistent data loss**.

### Vulnerability Distribution

| Severity Level | Count | Primary Impact |
| :--- | :---: | :--- |
| **CRITICAL** | **5** | Total authentication bypass, arbitrary role elevation to President, unauthenticated password hash exfiltration, unauthenticated user mutation, database destruction on deploy. |
| **HIGH** | **5** | Hardcoded JWT secret, hardcoded Supabase keys in client bundle, check-in code enumeration, unrecoverable account credentials, absence of rate limiting. |
| **MEDIUM** | **6** | Insecure cookies (missing `Secure` flag), missing account lifecycle status checks, auto-excusing absence justifications, unbatched queries, missing security headers. |
| **LOW** | **4** | Unused `gsap` dependency, unassociated form labels, unvalidated external URLs in profiles, swallowed exceptions. |
| **INFORMATIONAL** | **3** | Unconfigured Discord webhook, simulated QR scanner, missing CSP directives. |

---

## 1. Vulnerability Findings by Severity

### CRITICAL Vulnerabilities

#### [SEC-CRIT-01] Universal Authentication Bypass via Fallback President Resolution
* **CWE**: CWE-287 (Improper Authentication), CWE-306 (Missing Authentication for Critical Function)
* **CVSS v3.1**: 9.8 (Critical) `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
* **File & Lines**: [`src/lib/auth.ts:31-42`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/lib/auth.ts#L31-L42), [`src/app/api/auth/me/route.ts:60-64`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/auth/me/route.ts#L60-L64)
* **Mechanics**:
  In `src/lib/auth.ts`, the core session resolver function `getCurrentUser()` inspects incoming HTTP request cookies for `asteria_session_token`. If the token does not exist, instead of returning `null`, it executes:
  ```typescript
  if (!token) {
    const defaultUser = await prisma.user.findFirst({
      where: { role: "BOARD" },
      include: { department: true, boardSeat: true },
    });
    return { ...defaultUser, role: defaultUser.role as UserRole };
  }
  ```
* **Impact**:
  Every unauthenticated HTTP request sent to any endpoint or dashboard page that relies on `getCurrentUser()` is automatically executed under the identity and authorization context of the club President (Executive Board). Any anonymous attacker gains immediate access to executive controls, admin routes (`/api/admin`), candidate records (`/api/applications`), and member data.
* **Remediation**:
  Immediately return `null` if `token` is missing:
  ```typescript
  if (!token) return null;
  ```

---

#### [SEC-CRIT-02] Unauthenticated Role Elevation & Token Minting Backdoor
* **CWE**: CWE-269 (Improper Privilege Management), CWE-288 (Authentication Bypass Using Alternate Path)
* **CVSS v3.1**: 9.8 (Critical) `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`
* **File & Lines**: [`src/app/api/auth/switch-role/route.ts:5-87`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/auth/switch-role/route.ts#L5-L87)
* **Mechanics**:
  The `/api/auth/switch-role` endpoint accepts `{ targetRole: "BOARD" }` or `{ email: "president@asteria.tn" }`. It locates the corresponding user in the database, signs a valid JWT session token, and sets the `asteria_session_token` cookie. The route contains **zero password verification, zero session checks, and zero environment checks**.
* **Impact**:
  An external attacker can send a single HTTP POST request from anywhere in the world and obtain an authenticated session cookie as the President or any department head.
* **Remediation**:
  Block this route entirely in production:
  ```typescript
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Unauthorized endpoint" }, { status: 403 });
  }
  ```

---

#### [SEC-CRIT-03] Unauthenticated Public Member Dossier Mutation & IDOR
* **CWE**: CWE-639 (Authorization Bypass Through User-Controlled Key), CWE-915 (Improperly Controlled Modification of Dynamically Determined Object Attributes)
* **CVSS v3.1**: 9.1 (Critical) `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:H`
* **File & Lines**: [`src/app/api/members/[id]/route.ts:87-117`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/members/%5Bid%5D/route.ts#L87-L117)
* **Mechanics**:
  The `PATCH /api/members/[id]` endpoint updates user records based on the JSON body:
  ```typescript
  const updateData: any = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.role !== undefined) updateData.role = body.role;
  if (body.departmentId !== undefined) updateData.departmentId = body.departmentId;
  if (body.freelanceReady !== undefined) updateData.freelanceReady = body.freelanceReady;
  ```
  `getCurrentUser()` is **not even called**. There is zero authentication and zero verification of whether the requester owns the profile or possesses administrative privileges.
* **Impact**:
  Anyone on the internet can elevate any member to `"BOARD"`, deactivate active members (`status: "INACTIVE"`), or arbitrarily reassign department leads.
* **Remediation**:
  Require authentication and enforce strict role boundaries:
  ```typescript
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (body.role !== undefined || body.status !== undefined || body.departmentId !== undefined) {
    if (user.role !== "BOARD") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  ```

---

#### [SEC-CRIT-04] Mass Password Hash Exfiltration via Public API Relations
* **CWE**: CWE-200 (Exposure of Sensitive Information to an Unauthorized Actor), CWE-522 (Insufficiently Protected Credentials)
* **CVSS v3.1**: 8.6 (High / Critical) `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N`
* **Files & Lines**:
  * [`src/app/api/departments/[id]/route.ts:15-23`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/departments/%5Bid%5D/route.ts#L15-L23) (lines 15, 16, 21, 22)
  * [`src/app/api/members/[id]/route.ts:109-112`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/members/%5Bid%5D/route.ts#L109-L112) (line 110)
  * [`src/app/api/events/route.ts:134`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/events/route.ts#L134) (line 134)
  * [`src/app/api/events/[id]/rsvp/route.ts:38`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/events/%5Bid%5D/rsvp/route.ts#L38) (line 38)
  * [`src/app/api/tasks/route.ts:85`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/tasks/route.ts#L85) (line 85)
  * [`src/app/api/tasks/[id]/route.ts:32-37`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/tasks/%5Bid%5D/route.ts#L32-L37) (lines 32, 33, 36)
* **Mechanics**:
  In `GET /api/departments/[id]`, Prisma queries:
  ```typescript
  include: {
    hod: true,
    members: { orderBy: [{ role: "asc" }, { name: "asc" }] },
    tasks: { include: { assignee: true, createdBy: true } }
  }
  ```
  Prisma defaults to selecting all model fields unless a `select` block is specified. Consequently, the bcrypt hash stored in `passwordHash` is included in the output JSON.
* **Impact**:
  `GET /api/departments/[id]` is completely public (no auth required). Anyone can download the bcrypt hashes of all department members, the HoD, and task creators for offline password cracking.
* **Remediation**:
  Use explicit `select` blocks on all user relations to ensure `passwordHash` is never queried or returned.

---

#### [SEC-CRIT-05] Catastrophic Database Destruction on Production Deployment
* **CWE**: CWE-400 (Uncontrolled Resource Consumption), CWE-863 (Incorrect Authorization)
* **CVSS v3.1**: 9.1 (Critical) `CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:H`
* **File & Lines**: [`package.json:7`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/package.json#L7), [`prisma/seed.ts:7-19`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/prisma/seed.ts#L7-L19)
* **Mechanics**:
  The build script configured in `package.json` is:
  `"build": "prisma generate && prisma db push --accept-data-loss && tsx prisma/seed.ts && next build"`
  `prisma/seed.ts` begins by deleting all data across all tables:
  ```typescript
  await prisma.auditLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.boardSeat.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  ```
* **Impact**:
  Every automated deployment on Vercel permanently wipes out the production database.
* **Remediation**:
  Remove `tsx prisma/seed.ts` and `prisma db push --accept-data-loss` from `"build"`.

---

### HIGH Vulnerabilities

#### [SEC-HIGH-01] Hardcoded JWT Secret with Predictable Default Fallback
* **CWE**: CWE-798 (Use of Hard-coded Credentials), CWE-321 (Use of Cryptographically Weak Pseudo-Random Number Generator)
* **CVSS v3.1**: 8.1 (High)
* **File & Lines**: [`src/lib/auth.ts:6`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/lib/auth.ts#L6), [`.env.example:17`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/.env.example#L17)
* **Details**: `const JWT_SECRET = process.env.JWT_SECRET || "asteria-super-secret-jwt-key-2026"`. The default fallback is publicly visible in the git repository and documentation.
* **Remediation**: Crash on startup if `JWT_SECRET` is missing or matches the default development key.

#### [SEC-HIGH-02] Hardcoded Supabase Anon Key in Client Source Code
* **CWE**: CWE-798 (Use of Hard-coded Credentials)
* **CVSS v3.1**: 7.5 (High)
* **File & Lines**: [`src/lib/supabase/client.ts:4-5`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/lib/supabase/client.ts#L4-L5)
* **Details**: Hardcodes `DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_CslYLGLgxIk7b_UZEPasIA_iPquc6r9"`.
* **Remediation**: Read strictly from `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`.

#### [SEC-HIGH-03] Check-In Passcode Enumeration & Backdoor Check-In
* **CWE**: CWE-330 (Use of Insufficiently Random Values), CWE-284 (Improper Access Control)
* **CVSS v3.1**: 7.3 (High)
* **File & Lines**: [`src/app/api/events/route.ts:64`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/events/route.ts#L64), [`src/app/api/attendance/check-in/route.ts:26-30`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/attendance/check-in/route.ts#L26-L30)
* **Details**: Passcodes are public in `GET /api/events`. Passcode generation uses `Math.random()`. `check-in/route.ts` accepts `{ eventId }` without requiring any passcode.
* **Remediation**: Exclude passcodes from public event listings; remove `{ eventId }` bypass; enforce event time-window validation.

#### [SEC-HIGH-04] Auto-Onboarding Generates Unrecoverable Account Passwords
* **CWE**: CWE-640 (Weak Password Recovery Mechanism for Forgotten Password)
* **CVSS v3.1**: 7.1 (High)
* **File & Lines**: [`src/app/api/applications/[id]/onboard/route.ts:38-41`](file:///c:/Users/MSI/Downloads/Asteria/Asteria%20Club/src/app/api/applications/%5Bid%5D/onboard/route.ts#L38-L41)
* **Details**: Generated passwords are never returned or sent, causing account lockout.
* **Remediation**: Return temporary credentials to Board or send via email.

#### [SEC-HIGH-05] Complete Absence of Rate Limiting
* **CWE**: CWE-307 (Improper Restriction of Excessive Authentication Attempts), CWE-799 (Improper Control of Interaction Frequency)
* **CVSS v3.1**: 7.5 (High)
* **File & Lines**: All routes under `src/app/api/`
* **Details**: No rate limiting exists on login, check-in, or application submission.
* **Remediation**: Implement rate limiting middleware.

---

## 2. Domain-Specific Security Review

### Authentication
* **Current State**: Mix of custom JWT and Supabase Auth.
* **Deficiency**: `getCurrentUser()` returns the President if unauthenticated.
* **Recommendation**: Standardize on custom JWT or Supabase Auth. Remove fallback.

### Authorization & IDOR
* **Deficiency**: `PATCH /api/tasks/[id]` and `PATCH /api/members/[id]` lack object ownership validation. Any user can modify any task or profile.
* **Recommendation**: Enforce role/ownership checks in all route handlers.

### Session & Cookie Security
* **Deficiency**: Cookies set `httpOnly: true`, but omit `secure: true`.
* **Recommendation**: Add `secure: process.env.NODE_ENV === "production"`.

### HTTP Security Headers
* **Deficiency**: `next.config.ts` configures no headers.
* **Missing**: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`.
* **Recommendation**: Implement standard security headers in `next.config.ts`.

---

## 3. Security Remediation Priority Matrix

| Issue ID | Severity | Effort | Target Phase | Action |
| :--- | :---: | :---: | :---: | :--- |
| **SEC-CRIT-01** | CRITICAL | 30m | Phase 0 | Remove President fallback in `auth.ts`. |
| **SEC-CRIT-02** | CRITICAL | 15m | Phase 0 | Disable `/api/auth/switch-role` in production. |
| **SEC-CRIT-03** | CRITICAL | 1h | Phase 0 | Authenticate & authorize `PATCH /api/members/[id]`. |
| **SEC-CRIT-04** | CRITICAL | 2h | Phase 0 | Add `select` to Prisma relation queries to strip `passwordHash`. |
| **SEC-CRIT-05** | CRITICAL | 15m | Phase 0 | Remove destructive seed command from `package.json`. |
| **SEC-HIGH-01** | HIGH | 30m | Phase 1 | Enforce strong `JWT_SECRET` validation. |
| **SEC-HIGH-02** | HIGH | 15m | Phase 1 | Remove hardcoded Supabase keys in client files. |
| **SEC-HIGH-03** | HIGH | 2h | Phase 1 | Conceal event passcodes from public event API. |
| **SEC-HIGH-04** | HIGH | 2h | Phase 2 | Return temporary credentials on applicant onboarding. |
| **SEC-HIGH-05** | HIGH | 3h | Phase 2 | Implement rate limiting middleware. |
