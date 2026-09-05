/**
 * Asteria Club Esprit — Application Constants & Configuration
 * Charte Graphique 2026 · v2.1
 */

export const BRAND_COLORS = {
  dark: "#0A3A40",
  primary: "#11606E",
  light: "#60C8D4",
  accent: "#E5A93C",
  surface: "#FFFFFF",
  bg: "#F4F9FA",
  line: "#D2E4E6",
  ink: "#0A3A40",
  inkSoft: "#4A6B70",
} as const;

export const SESSION_CONFIG = {
  cookieName: "asteria_session_token",
  maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  tokenExpiry: "7d",
} as const;

export const DEFAULT_ACADEMIC_CYCLE = {
  name: "Academic Year 2025-2026 · Semester 2",
  status: "ACTIVE",
  startDate: "2025-09-01",
  endDate: "2026-06-30",
} as const;

export const FREELANCE_READINESS_THRESHOLD = 5;

export const CLUB_LINKS = {
  email: "contact@asteria.tn",
  github: "https://github.com/itshydraaaaaa/Asteria-Club-Esprit",
  instagram: "https://instagram.com/asteria.club",
  linkedin: "https://linkedin.com/company/asteria-club",
  freelancePlatform: "https://asteria-freelance-prelaunch.vercel.app/",
} as const;

export const APP_METADATA = {
  name: "Asteria Club Esprit",
  shortName: "Asteria",
  description: "Official Operating Platform of Asteria Club Esprit",
  defaultSiteUrl: "https://asteria-club-esprit.vercel.app",
} as const;
