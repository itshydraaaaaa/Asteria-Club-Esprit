import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: "Forbidden in production" },
      { status: 403 }
    );
  }

  try {
    const { targetRole, email } = await req.json();

    let user;
    if (email) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { department: true, boardSeat: true },
      });
    } else if (targetRole) {
      if (targetRole === "BOARD") {
        user = await prisma.user.findFirst({
          where: { role: "BOARD" },
          include: { department: true, boardSeat: true },
        });
      } else if (targetRole === "HOD") {
        user = await prisma.user.findFirst({
          where: { role: "HOD" },
          include: { department: true, boardSeat: true },
        });
      } else if (targetRole === "MEMBER") {
        user = await prisma.user.findFirst({
          where: { role: "MEMBER" },
          include: { department: true, boardSeat: true },
        });
      } else if (targetRole === "APPLICANT") {
        user = await prisma.user.findFirst({
          where: { role: "APPLICANT" },
          include: { department: true, boardSeat: true },
        });
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as any,
    });

    let skills = [];
    try {
      skills = JSON.parse(user.skills || "[]");
    } catch {
      skills = [];
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        departmentName: user.department?.name,
        boardTitle: user.boardSeat?.title,
        avatarUrl: user.avatarUrl,
        skills,
        status: user.status,
        freelanceReady: user.freelanceReady,
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
    console.error("Switch role error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
