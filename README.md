# Asteria Club Esprit — Management Platform

> Internal operating system and talent pipeline for Asteria Club Esprit: member management, org structure, agile sprint Kanban, QR attendance auditing, event scheduling, recruitment review, and Asteria Freelance readiness.

![Asteria Brand](https://img.shields.io/badge/Asteria-Charte%20Graphique%202026-11606E?style=for-the-badge)
![Next.js 15](https://img.shields.io/badge/Next.js%2015-App%20Router-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma ORM](https://img.shields.io/badge/Prisma-6.1-2D3748?style=for-the-badge&logo=prisma)
![Supabase](https://img.shields.io/badge/Supabase-Cloud%20Database-3ECF8E?style=for-the-badge&logo=supabase)

---

## 🎨 Brand Identity (Asteria Charte Graphique 2026 · v2.1)

This platform strictly adheres to Asteria's official brand guidelines:
- **Colors**:
  - **Primary**: `teal-900` (`#11606E`)
  - **Complementary**: `teal-400` (`#60C8D4`)
  - **Ink (Body Text)**: `#12201F`
  - **Line (Borders)**: `#E2E8E7`
  - **Surface Dark**: `#0B4A55`
- **Typography**:
  - **Display / Headings**: `Michroma` (uppercase Google Font substitute for Bank Gothic)
  - **Body Text**: `Manrope`
- **Fluid Water-Inspired Motion Curves**:
  - `Vague` `cubic-bezier(.16,1,.3,1)` — modal entrances & card reveals
  - `Courant` `cubic-bezier(.65,0,.35,1)` — tab switches & interactive state transitions
  - `Marée` `cubic-bezier(.37,0,.63,1)` — dismissals & modal exits

---

## 🚀 Core Modules & Capabilities

1. **Role-Based Access Control & 1-Click Demo Bar**:
   - Executive Board, Head of Department (HoD), Active Member, and Applicant personas.
   - Built-in instant persona switch banner at the top of every screen.
2. **Role-Tailored Dashboards (`/dashboard`)**:
   - **Board Dashboard**: Club KPIs, task completion velocity %, attendance analytics, and live audit feed.
   - **HoD Dashboard**: Department sprint task counters, member roster, and workshop schedule.
   - **Member Dashboard**: Personal assigned tasks, RSVP'd sessions, attendance health %, and Freelance Readiness status.
3. **Interactive Org Chart & Department Hubs (`/departments`)**:
   - Tier 1 Executive Board to Tier 2 Department Leads & student rosters.
   - Dedicated hubs for *Web Development*, *Graphic Design*, *Video Editing*, and *Photography*.
4. **Member Directory & Dossiers (`/members`)**:
   - Searchable skills, freelance badge, attendance health score, and sprint assignments.
5. **Task Kanban Board (`/tasks`)**:
   - 4-column agile workflow (*To Do*, *In Progress*, *Review*, *Done*), priorities, due dates, and threaded comments.
6. **Attendance & QR Check-in Hub (`/attendance`)**:
   - Dynamic QR Code generator for hosts, camera scanner simulator, 6-digit numeric passcodes, and absence justification portal.
7. **Shared Calendar & RSVPs (`/calendar`)**:
   - Month/week views, conflict/overlap detection, and 1-click RSVP (*Going*, *Maybe*, *Declined*).
8. **Scoped Announcements & Discord Sync (`/announcements`)**:
   - Club-wide broadcasts and department notices with Discord rich embed preview.
9. **Recruitment & 1-Click Auto-Onboarding (`/apply` & `/applications`)**:
   - Public application form with track preferences and 1-click instant member provisioning.
10. **System Governance (`/admin`)**:
    - Academic semester cycle rollovers, board seat allocations, and security audit log.

---

## 🛡️ Production Readiness & Security Health

[![Production Health](https://img.shields.io/badge/Production%20Health-96.4%2F100-brightgreen?style=for-the-badge)](PRODUCTION_READINESS_SIGN_OFF.md)
[![Security Hardened](https://img.shields.io/badge/Security-Hardened%20(98%2F100)-blue?style=for-the-badge)](PRODUCTION_READINESS_SIGN_OFF.md)
[![CI Pipeline](https://img.shields.io/badge/CI-Automated%20Workflow-teal?style=for-the-badge)](.github/workflows/ci.yml)

For full audit reports and architectural verification details, consult [PRODUCTION_READINESS_SIGN_OFF.md](PRODUCTION_READINESS_SIGN_OFF.md).

---

## 🛠️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/itshydraaaaaa/Asteria-Club-Esprit.git
cd Asteria-Club-Esprit
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase PostgreSQL credentials:
```bash
cp .env.example .env
```

### 4. Generate Prisma Client & Run Migrations
```bash
npm run prisma:generate
npm run prisma:push
```
*Optional: Seed initial test accounts (development only):*
```bash
npm run db:seed
```

### 5. Typecheck & Build for Production
```bash
npm run lint
npm run build
```

### 6. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🔑 Demo Accounts

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **President (Board)** | Yasmine Ben Ali | `president@asteria.tn` | `password123` |
| **HoD Web Dev** | Rayen Ayadi | `hod.web@asteria.tn` | `password123` |
| **HoD Graphic Design** | Maya Mahjoub | `hod.design@asteria.tn` | `password123` |
| **Active Member** | Karim Chaabane | `karim.chaabane@asteria.tn` | `password123` |
| **Applicant** | Mehdi Bouazizi | `mehdi.applicant@esprit.tn` | `password123` |
