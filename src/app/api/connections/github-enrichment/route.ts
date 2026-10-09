import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
    }

    const clean = username.replace(/^@/, "").trim();

    // 1. Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(clean)}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "Asteria-Club-Esprit",
      },
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Profil GitHub introuvable ou limite d'API atteinte." },
        { status: userRes.status === 404 ? 404 : 502 }
      );
    }

    const userData = await userRes.json();

    // 2. Fetch recent public repos to determine top languages
    let topLanguages: string[] = [];
    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(clean)}/repos?sort=updated&per_page=10`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Asteria-Club-Esprit",
          },
          next: { revalidate: 3600 },
        }
      );
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        const langCounts: Record<string, number> = {};
        if (Array.isArray(reposData)) {
          reposData.forEach((r: any) => {
            if (r.language) {
              langCounts[r.language] = (langCounts[r.language] || 0) + 1;
            }
          });
          topLanguages = Object.entries(langCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([lang]) => lang);
        }
      }
    } catch {
      // Ignore repo fetch error
    }

    return NextResponse.json({
      success: true,
      data: {
        login: userData.login,
        name: userData.name,
        bio: userData.bio,
        avatarUrl: userData.avatar_url,
        publicRepos: userData.public_repos || 0,
        followers: userData.followers || 0,
        topLanguages,
      },
    });
  } catch (error: any) {
    console.error("Error in github-enrichment:", error);
    return NextResponse.json({ error: "Failed to fetch GitHub enrichment" }, { status: 500 });
  }
}
