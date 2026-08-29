import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Attempt Supabase Auth login
    try {
      const supabase = await createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (!authError && authData.user) {
        const { data: profile } = (await supabase
          .from("profiles")
          .select("id, name, email, role, department_id")
          .eq("id", authData.user.id)
          .single()) as any;

        return NextResponse.json({
          success: true,
          user: profile
            ? {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                departmentName: null,
              }
            : {
                id: authData.user.id,
                email: authData.user.email,
              },
        });
      }
    } catch (sbErr) {
      console.warn("Supabase Auth sign-in attempted, checking database:", sbErr);
    }

    // 2. Database user check with bcrypt hash verification
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        department: true,
        boardSeat: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Strict bcrypt password verification — no backdoors or shortcuts
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentName: user.department?.name,
        boardTitle: user.boardSeat?.title,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
