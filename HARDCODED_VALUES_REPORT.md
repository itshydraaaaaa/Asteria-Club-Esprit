# Asteria Club Esprit — Hardcoded Values & Environment Audit Report

**Application:** Asteria Club Esprit Management Platform  
**Target Repository:** `itshydraaaaaa/Asteria-Club-Esprit`  
**Scope:** Exhaustive search across all repository files for hardcoded configuration strings, secrets, URLs, IDs, business thresholds, default passcodes, and localization strings.

---

## 1. Complete Hardcoded Values Inventory Table

| File | Line | Hardcoded Value | Category | Risk | Recommended Replacement |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `src/lib/auth.ts` | 6 | `"asteria-super-secret-jwt-key-2026"` | **SECRET** | **CRITICAL** | Validate and enforce `process.env.JWT_SECRET`; crash on startup if missing. |
| `.env` | 12 | `"asteria-super-secret-jwt-key-2026"` | **SECRET** | **CRITICAL** | Generate a cryptographically random 256-bit secret string for production. |
| `.env.local` | 12 | `"asteria-super-secret-jwt-key-2026"` | **SECRET** | **CRITICAL** | Separate local dev secret from production credentials. |
| `.env.example` | 17 | `"asteria-super-secret-jwt-key-2026"` | **SECRET** | **HIGH** | Replace with `"generate-random-secret-here"`. |
| `src/lib/supabase/client.ts` | 5 | `"sb_publishable_CslYLGLgxIk7b_UZEPasIA_iPquc6r9"` | **SECRET** | **HIGH** | Remove hardcoded fallback; read strictly from `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `.env` | 3, 4 | `"sb_publishable_CslYLGLgxIk7b_UZEPasIA_iPquc6r9"` | **CONFIG** | **MEDIUM** | Rotate and manage exclusively in production hosting environment variables. |
| `.env.local` | 3, 4 | `"sb_publishable_CslYLGLgxIk7b_UZEPasIA_iPquc6r9"` | **CONFIG** | **MEDIUM** | Standardize variable names (remove redundant `PUBLISHABLE_KEY` vs `ANON_KEY`). |
| `.env` | 5, 6 | `"sb_secret_VDupNWapqIUnqnC4zbiB8w_tBP4QDzj"` | **SECRET** | **HIGH** | Keep strictly uncommitted; rotate in Supabase console if ever exposed. |
| `.env.local` | 5, 6 | `"sb_secret_VDupNWapqIUnqnC4zbiB8w_tBP4QDzj"` | **SECRET** | **HIGH** | Standardize variable name to `SUPABASE_SERVICE_ROLE_KEY`. |
| `src/lib/supabase/client.ts` | 4 | `"https://asteria-club-esprit.supabase.co"` | **CONFIG** | **MEDIUM** | Require `process.env.NEXT_PUBLIC_SUPABASE_URL` without code fallback. |
| `src/lib/supabase/server.ts` | 9, 41 | `"https://asteria-club-esprit.supabase.co"` | **CONFIG** | **MEDIUM** | Require `process.env.NEXT_PUBLIC_SUPABASE_URL` without code fallback. |
| `src/lib/supabase/middleware.ts` | 11 | `"https://asteria-club-esprit.supabase.co"` | **CONFIG** | **MEDIUM** | Require `process.env.NEXT_PUBLIC_SUPABASE_URL` without code fallback. |
| `.env` | 2 | `"https://asteria-club-esprit.supabase.co"` | **CONFIG** | **LOW** | Valid configuration location. |
| `.env.local` | 2 | `"https://asteria-club-esprit.supabase.co"` | **CONFIG** | **LOW** | Valid configuration location. |
| `prisma/schema.prisma` | 3 | `"file:./dev.db"` | **CONFIG** | **CRITICAL** | Change to `env("DATABASE_URL")` with PostgreSQL provider. |
| `.env` | 9 | `"file:./dev.db"` | **CONFIG** | **CRITICAL** | Update to Supabase connection pooler URL string. |
| `src/lib/db.ts` | 13 | `"/tmp/dev.db"` | **CONFIG** | **HIGH** | Remove serverless `/tmp` workaround upon PostgreSQL migration. |
| `prisma/schema.prisma` | 76 | `"AST-2026"` | **BUSINESS LOGIC** | **HIGH** | Remove static default check-in code; generate dynamic random code per event. |
| `supabase/migrations/20260228_initial_schema.sql` | 62 | `'AST-2026'` | **BUSINESS LOGIC** | **HIGH** | Remove static default in database DDL. |
| `src/components/attendance/AttendanceHub.tsx` | 346 | `"e.g. AST-2026 / WEB-DEV26"` | **LOCALIZATION** | **LOW** | User guidance placeholder; acceptable. |
| `src/components/dashboard/MemberDashboard.tsx` | 46 | `const FREELANCE_THRESHOLD = 5;` | **BUSINESS LOGIC** | **MEDIUM** | Move to `src/lib/constants.ts` or database club settings table. |
| `src/app/api/admin/route.ts` | 35 | `"Academic Year 2025-2026 · Semester 2"` | **MOCK DATA** | **MEDIUM** | Store active academic cycles in database model `AcademicCycle`. |
| `src/app/(dashboard)/admin/page.tsx` | 38 | `"Academic Year 2026-2027 · Semester 1"` | **MOCK DATA** | **MEDIUM** | Read current and next cycles dynamically from database. |
| `src/app/api/admin/route.ts` | 37, 38 | `"2025-09-01"`, `"2026-06-30"` | **MOCK DATA** | **MEDIUM** | Store semester start/end dates in database. |
| `src/app/layout.tsx` | 30 | `"https://asteria-club-esprit.vercel.app"` | **URL** | **LOW** | Read from `process.env.NEXT_PUBLIC_SITE_URL`. |
| `src/app/robots.ts` | 4 | `"https://asteria-club-esprit.vercel.app"` | **URL** | **LOW** | Read from `process.env.NEXT_PUBLIC_SITE_URL`. |
| `src/app/sitemap.ts` | 4 | `"https://asteria-club-esprit.vercel.app"` | **URL** | **LOW** | Read from `process.env.NEXT_PUBLIC_SITE_URL`. |
| `src/app/page.tsx` | 687 | `"https://asteria-freelance-prelaunch.vercel.app/"` | **URL** | **LOW** | Read from `process.env.NEXT_PUBLIC_FREELANCE_URL`. |
| `src/app/page.tsx` | 621 | `"https://github.com/itshydraaaaaa/Asteria-Club-Esprit"` | **URL** | **LOW** | Read from `process.env.NEXT_PUBLIC_GITHUB_REPO_URL`. |
| `src/app/page.tsx` | 603 | `"https://instagram.com"` | **MOCK DATA** | **LOW** | Replace with official club handle: `https://instagram.com/asteria.club`. |
| `src/app/page.tsx` | 612 | `"https://linkedin.com"` | **MOCK DATA** | **LOW** | Replace with official club page: `https://linkedin.com/company/asteria-club`. |
| `src/app/page.tsx` | 630, 715 | `"mailto:contact@asteria.tn"` | **CONFIG** | **LOW** | Centralize in contact constants. |
| `src/components/layout/RoleSwitcherBar.tsx` | 24 | `"president@asteria.tn"` | **ID** | **HIGH** | Gated to demo mode; should not exist in production code. |
| `src/components/layout/RoleSwitcherBar.tsx` | 31 | `"hod.web@asteria.tn"` | **ID** | **HIGH** | Gated to demo mode; should not exist in production code. |
| `src/components/layout/RoleSwitcherBar.tsx` | 38 | `"hod.design@asteria.tn"` | **ID** | **HIGH** | Gated to demo mode; should not exist in production code. |
| `src/components/layout/RoleSwitcherBar.tsx` | 45 | `"karim.chaabane@asteria.tn"` | **ID** | **HIGH** | Gated to demo mode; should not exist in production code. |
| `src/components/layout/RoleSwitcherBar.tsx` | 52 | `"mehdi.applicant@esprit.tn"` | **ID** | **HIGH** | Gated to demo mode; should not exist in production code. |
| `README.md` | 93-97 | `"password123"` | **SECRET** | **HIGH** | Document that default passwords must be changed immediately upon setup. |
| `prisma/seed.ts` | 20 | `"password123"` | **SECRET** | **HIGH** | Block execution of seed script against production database. |
| `src/lib/auth.ts` | 7 | `COOKIE_NAME = "asteria_session_token"` | **CONFIG** | **LOW** | Acceptable constant definition. |
| `src/lib/auth.ts` | 16 | `expiresIn: "7d"` | **LIMIT** | **MEDIUM** | Centralize session duration in security configuration. |
| `src/app/api/auth/login/route.ts` | 99 | `maxAge: 7 * 24 * 60 * 60` | **LIMIT** | **MEDIUM** | Centralize cookie lifetime in security configuration. |
| `src/app/api/auth/switch-role/route.ts` | 79 | `maxAge: 7 * 24 * 60 * 60` | **LIMIT** | **MEDIUM** | Centralize cookie lifetime in security configuration. |
| `src/app/api/admin/route.ts` | 27 | `take: 20` | **LIMIT** | **LOW** | Parameterize query limit with query param fallback. |
| `src/app/api/dashboard/route.ts` | 30 | `take: 6` | **LIMIT** | **LOW** | Acceptable dashboard UI limit. |
| `src/app/api/dashboard/route.ts` | 37, 62, 106 | `take: 4` | **LIMIT** | **LOW** | Acceptable dashboard UI limit. |
| `src/app/api/events/route.ts` | 118 | ``AST-${Math.floor(1000 + Math.random() * 9000)}`` | **BUSINESS LOGIC** | **HIGH** | Use cryptographically secure random token generation (`crypto.randomInt`). |
| `src/components/ui/AmbientCanvas.tsx` | 14 | `particleCount = 45` | **CONFIG** | **LOW** | Acceptable default prop value. |
| `src/components/ui/AmbientCanvas.tsx` | 61 | `0x11606e`, `0x60c8d4` | **CONFIG** | **LOW** | Brand hex colors used directly in Three.js materials. |

---

## 2. Environment Variable Inventory & Classification

| Variable Name | Present In | Server/Client | Sensitivity | Purpose | Validation Present? |
| :--- | :--- | :---: | :---: | :--- | :---: |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env`, `.env.local`, `.env.example` | Client & Server | Low (Public) | Supabase project API endpoint URL. | NO (falls back to hardcoded string) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env`, `.env.local`, `.env.example` | Client & Server | Medium (Public) | Supabase anonymous public API key. | NO (falls back to hardcoded string) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`| `.env`, `.env.local`, `.env.example`| Client & Server | Medium (Public) | Redundant alias for anon key. | NO |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env`, `.env.local`, `.env.example` | Server Only | **CRITICAL (Secret)**| Supabase admin superuser key bypassing RLS. | NO |
| `SUPABASE_SECRET_KEY` | `.env`, `.env.local`, `.env.example` | Server Only | **CRITICAL (Secret)**| Redundant alias for service role key. | NO |
| `DATABASE_URL` | `.env`, `.env.local`, `.env.example` | Server Only | **CRITICAL (Secret)**| PostgreSQL transaction connection pooler string. | NO |
| `DIRECT_URL` | `.env.example` | Server Only | **CRITICAL (Secret)**| Direct PostgreSQL connection for migrations. | NO |
| `JWT_SECRET` | `.env`, `.env.local`, `.env.example` | Server Only | **CRITICAL (Secret)**| Secret key used to sign and verify session JWTs. | NO (falls back to default string) |
| `NEXT_PUBLIC_DEMO_MODE` | `.env.example` | Client & Server | Low | Controls visibility of demo role switcher bar. | NO |

---

## 3. Recommendations for Environment & Secret Hardening

1. **Implement Runtime Environment Validation (`src/lib/env.ts`)**:
   Use Zod to validate all required environment variables on server initialization:
   ```typescript
   import { z } from "zod";

   const envSchema = z.object({
     DATABASE_URL: z.string().min(1),
     JWT_SECRET: z.string().min(32).refine(
       (s) => s !== "asteria-super-secret-jwt-key-2026",
       { message: "Default insecure JWT_SECRET must be replaced in production" }
     ),
     NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
     NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
     SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
     NEXT_PUBLIC_DEMO_MODE: z.enum(["true", "false"]).default("false"),
   });

   export const env = envSchema.parse(process.env);
   ```

2. **Remove Redundant Variable Names**:
   Eliminate redundant aliases in `.env` (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`). Standardize strictly on:
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`

3. **Never Commit Secret Fallbacks**:
   Remove all string fallbacks (`|| "asteria-super-secret-jwt-key-2026"` and `|| "https://asteria-club-esprit.supabase.co"`) from source code. If an environment variable is absent in production, the application should immediately throw an explicit startup error.
