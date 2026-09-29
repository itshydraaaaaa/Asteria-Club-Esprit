import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { parseSkills } from "@/lib/supabase/queries";
import {
  getClientIp,
  checkRateLimit,
  isLoginLocked,
  recordFailedLogin,
  resetFailedLogins,
} from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const clientIp = getClientIp(req);

    // Global IP rate limit: 20 login attempts per 5 minutes
    const ipCheck = checkRateLimit(`login_ip:${clientIp}`, 20, 5 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts from this network. Please retry in ${ipCheck.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check account lockout
    const emailLock = isLoginLocked(`login_user:${cleanEmail}`);
    if (emailLock.locked) {
      return NextResponse.json(
        {
          error: `Account temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(emailLock.retryAfterSeconds / 60)} minute(s).`,
        },
        { status: 423 }
      );
    }

    const supabase = await createClient();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (authError || !authData.user) {
      const { attempts, locked } = recordFailedLogin(`login_user:${cleanEmail}`);
      recordFailedLogin(`login_ip:${clientIp}`);

      if (locked) {
        return NextResponse.json(
          {
            error: "Too many consecutive failed login attempts. Your account has been temporarily locked for 15 minutes.",
          },
          { status: 423 }
        );
      }

      const remaining = Math.max(0, 5 - attempts);
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Invalid credentials. (${remaining} attempt${remaining > 1 ? "s" : ""} remaining before temporary lockout)`
            : "Invalid credentials.",
        },
        { status: 401 }
      );
    }

    // Successful login: reset failed login counters
    resetFailedLogins(`login_user:${cleanEmail}`);
    resetFailedLogins(`login_ip:${clientIp}`);

    // Fetch profile for additional data to return to client
    const admin = getAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select(`
        id, name, email, role, department_id, avatar_url, bio, skills, status, freelance_ready,
        departments:department_id (id, name),
        board_seats!board_seats_user_id_fkey (id, title)
      `)
      .eq("id", authData.user.id)
      .single();

    const p = profile as any;

    return NextResponse.json({
      success: true,
      user: p
        ? {
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            departmentId: p.department_id,
            departmentName: p.departments?.name ?? null,
            boardTitle: p.board_seats?.title ?? null,
            avatarUrl: p.avatar_url ?? null,
            bio: p.bio ?? null,
            skills: parseSkills(p.skills),
            status: p.status,
            freelanceReady: p.freelance_ready,
          }
        : {
            id: authData.user.id,
            email: authData.user.email,
          },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
