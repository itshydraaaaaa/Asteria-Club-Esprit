# Contributing to Asteria Club Esprit

Thank you for your interest in contributing to the **Asteria Club Esprit Management Platform & Incubator OS**!

This project is built and maintained by members of **Asteria Club Esprit** at **ESPRIT School of Engineering, Tunis**. Whether you are fixing a bug, adding a new feature to the agile Kanban board, improving our QR attendance algorithms, or refining the UI/UX according to our Charte Graphique 2026, we welcome your contributions.

---

## 🧭 Table of Contents

1. [Code of Conduct](#-code-of-conduct)
2. [Getting Started](#-getting-started)
3. [Branching Strategy](#-branching-strategy)
4. [Coding Standards](#-coding-standards)
5. [Commit Message Conventions](#-commit-message-conventions)
6. [Submitting a Pull Request](#-submitting-a-pull-request)
7. [Reporting Bugs & Requesting Features](#-reporting-bugs--requesting-features)

---

## 🤝 Code of Conduct

As an official student organization project:
- Treat all contributors and reviewers with respect, empathy, and professional courtesy.
- Foster an inclusive, supportive environment for students learning new technologies.
- Provide constructive, actionable feedback during code reviews.

---

## 🛠️ Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/<your-username>/Asteria-Club-Esprit.git
   cd Asteria-Club-Esprit
   ```
3. **Install project dependencies**:
   ```bash
   npm install
   ```
4. **Configure your environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your Supabase project credentials (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
5. **Verify the baseline build**:
   ```bash
   npm run lint
   npm run build
   ```

---

## 🌿 Branching Strategy

Always create a new branch from `main` using structured naming:

- **Features**: `feat/<short-description>` (e.g., `feat/discord-webhook-bridge`)
- **Bug Fixes**: `fix/<bug-description>` (e.g., `fix/qr-timestamp-validation`)
- **Documentation**: `docs/<topic>` (e.g., `docs/api-reference-update`)
- **Refactoring**: `refactor/<module-name>` (e.g., `refactor/attendance-metrics`)
- **Performance**: `perf/<optimization>` (e.g., `perf/ambient-canvas-fps`)

```bash
git checkout -b feat/my-new-feature main
```

---

## 🎨 Coding Standards

### 1. TypeScript & Type Safety
- **Strict Mode**: The project enforces strict TypeScript compilation.
- **No `any`**: Avoid the `any` type whenever possible. Define explicit interfaces or types.
- **Centralized Types**: Put shared domain entities (user roles, tasks, attendance records, applications) in [`src/lib/types.ts`](src/lib/types.ts).
- **Supabase Typing**: Keep Supabase query return types aligned with [`src/lib/supabase/types.ts`](src/lib/supabase/types.ts).

### 2. React 19 & Next.js 16 (App Router)
- **Server Components by Default**: Pages and layout components should remain React Server Components unless they require client interactivity (hooks, state, event handlers).
- **`"use client"`**: Add only to interactive components (e.g., modals, form handlers, drag-and-drop boards).
- **Hooks**: Follow standard React Hook naming rules and ensure clean dependency arrays in `useEffect`.

### 3. Styling & Asteria Charte Graphique 2026 (v2.1)
- Use Tailwind CSS utility classes defined in [`tailwind.config.ts`](tailwind.config.ts).
- Respect brand colors:
  - Deep Teal (`#0A3A40` / `ast-dark`)
  - Primary Accent (`#11606E` / `teal-900`)
  - Light Cyan (`#60C8D4` / `ast-light`)
  - Warm Amber (`#E5A93C` / `ast-accent`)
- Use fluid motion transition curves (`vague`, `courant`, `maree`) for animations and transitions.

### 4. Security & Data Protection
- **Never commit API secrets, private keys, or passwords**.
- All backend routes in `src/app/api/**` must authenticate the caller via `getCurrentUser()` or Supabase session tokens before modifying data.
- Enforce Role-Based Access Control (RBAC) so sensitive operations require `BOARD` or `HOD` privileges.

---

## 📝 Commit Message Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>

[optional body]
```

### Common Types:
- `feat`: A new user-facing feature or API capability.
- `fix`: A bug fix.
- `docs`: Documentation updates (README, CONTRIBUTING, API maps).
- `style`: Formatting, missing semicolons, whitespace (no functional code changes).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code changes that improve performance or responsiveness.
- `test`: Adding or updating test suites.
- `chore`: Build process, dependencies, or tool configuration.

### Examples:
- `feat(recruitment): add highlighted Cally interview scheduling link to invitation email`
- `fix(attendance): correct camera scanner aspect ratio on mobile viewports`
- `docs(readme): add detailed tech stack and architecture diagrams`

---

## 🚀 Submitting a Pull Request

1. **Test your code locally**:
   ```bash
   # Typecheck (must pass with 0 errors)
   npm run lint

   # Production build verification
   npm run build
   ```
2. **Push your branch to GitHub**:
   ```bash
   git push origin feat/my-new-feature
   ```
3. **Open a Pull Request** against the `main` branch of `itshydraaaaaa/Asteria-Club-Esprit`.
4. Fill in the Pull Request template:
   - Clear description of changes.
   - Associated issue numbers (e.g., `Closes #12`).
   - Screenshots or video recordings for UI changes.
5. Await code review from the Asteria development team or Executive Board leads.

---

## 🐛 Reporting Bugs & Requesting Features

- **Bugs**: Open an issue using the Bug Report template. Include your browser, steps to reproduce, expected vs actual behavior, and relevant console errors.
- **Features**: Open an issue using the Feature Request template. Explain the motivation, use case for Asteria Club members, and proposed implementation design.

Thank you for contributing to Asteria Club Esprit! 🚀
