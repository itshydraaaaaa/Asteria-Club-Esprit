import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { UserRole, UserSession } from "./types";
import { createClient } from "./supabase/server";

const JWT_SECRET = process.env.JWT_SECRET || "asteria-super-secret-jwt-key-2026";
export const COOKIE_NAME = "asteria_session_token";

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  // 1. Attempt Supabase Auth session first
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: authUser.id },
            { email: authUser.email?.toLowerCase().trim() || "" },
          ],
        },
        include: {
          department: true,
          boardSeat: true,
        },
      });

      if (user) {
        let skills: string[] = [];
        try {
          skills = JSON.parse(user.skills || "[]");
        } catch {
          skills = [];
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          departmentId: user.departmentId,
          departmentName: user.department?.name,
          boardTitle: user.boardSeat?.title,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          skills,
          status: user.status as any,
          freelanceReady: user.freelanceReady,
        };
      }
    }
  } catch {
    // Continue to local session token check
  }

  // 2. Local JWT session token fallback
  let token: string | undefined;
  try {
    const cookieStore = await cookies();
    token = cookieStore.get(COOKIE_NAME)?.value;
  } catch {
    token = undefined;
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      department: true,
      boardSeat: true,
    },
  });

  if (!user) return null;

  let skills: string[] = [];
  try {
    skills = JSON.parse(user.skills || "[]");
  } catch {
    skills = [];
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    departmentId: user.departmentId,
    departmentName: user.department?.name,
    boardTitle: user.boardSeat?.title,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    skills,
    status: user.status as any,
    freelanceReady: user.freelanceReady,
  };
}

export function hasPermission(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  if (userRole === "BOARD") return true; // Board has superuser access
  return allowedRoles.includes(userRole);
}
