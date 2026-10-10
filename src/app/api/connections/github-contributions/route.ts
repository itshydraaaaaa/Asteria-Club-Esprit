import { NextResponse } from "next/server";

function extractGitHubUsername(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().replace(/^@/, "");
  const match = cleaned.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (match) return match[1];
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned) && !cleaned.includes(".")) return cleaned;
  return null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUsername = searchParams.get("username");

    if (!rawUsername) {
      return NextResponse.json({ error: "Username parameter is required" }, { status: 400 });
    }

    const cleanUsername = extractGitHubUsername(rawUsername);
    if (!cleanUsername) {
      return NextResponse.json({ error: "Invalid GitHub username or URL format" }, { status: 400 });
    }

    // 1. Fetch GitHub user public profile
    let userData: any = {
      login: cleanUsername,
      name: cleanUsername,
      bio: null,
      avatar_url: `https://github.com/${cleanUsername}.png`,
      public_repos: 0,
      followers: 0,
      following: 0,
    };

    try {
      const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Asteria-Club-Esprit",
        },
        next: { revalidate: 1800 }, // 30 minutes cache
      });
      if (userRes.ok) {
        userData = await userRes.json();
      }
    } catch (userErr) {
      console.warn("GitHub user fetch error:", userErr);
    }

    // 2. Fetch top languages from recent repos
    let topLanguages: string[] = [];
    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?sort=updated&per_page=12`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Asteria-Club-Esprit",
          },
          next: { revalidate: 1800 },
        }
      );
      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (Array.isArray(reposData)) {
          const langCounts: Record<string, number> = {};
          reposData.forEach((r: any) => {
            if (r.language) {
              langCounts[r.language] = (langCounts[r.language] || 0) + 1;
            }
          });
          topLanguages = Object.entries(langCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([lang]) => lang);
        }
      }
    } catch {
      // Ignore repo fetch error
    }

    // 3. Fetch GitHub contributions data
    let totalContributionsLastYear = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let activeDaysCount = 0;
    let weeks: Array<Array<{ date: string; count: number; level: number }>> = [];

    try {
      const contribRes = await fetch(
        `https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(cleanUsername)}?y=last`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Asteria-Club-Esprit",
          },
          next: { revalidate: 1800 },
        }
      );

      if (contribRes.ok) {
        const contribData = await contribRes.json();
        totalContributionsLastYear = contribData.total?.lastYear || 0;
        const days: Array<{ date: string; count: number; level: number }> = contribData.contributions || [];

        // Calculate active days & longest streak
        let tempStreak = 0;
        for (const day of days) {
          if (day.count > 0) {
            activeDaysCount++;
            tempStreak++;
            if (tempStreak > longestStreak) longestStreak = tempStreak;
          } else {
            tempStreak = 0;
          }
        }

        // Calculate current streak
        for (let i = days.length - 1; i >= 0; i--) {
          if (days[i].count > 0) {
            currentStreak++;
          } else if (i === days.length - 1) {
            // today might not have a commit yet, check from yesterday
            continue;
          } else {
            break;
          }
        }

        // Group into 7-day calendar weeks
        let currentWeek: Array<{ date: string; count: number; level: number }> = [];
        for (const day of days) {
          currentWeek.push(day);
          if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
          }
        }
        if (currentWeek.length > 0) weeks.push(currentWeek);
      }
    } catch (contribErr) {
      console.warn("GitHub contributions API fetch error:", contribErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        username: userData.login || cleanUsername,
        name: userData.name || userData.login || cleanUsername,
        bio: userData.bio || null,
        avatarUrl: userData.avatar_url,
        profileUrl: `https://github.com/${cleanUsername}`,
        publicRepos: userData.public_repos || 0,
        followers: userData.followers || 0,
        following: userData.following || 0,
        totalContributionsLastYear,
        currentStreak,
        longestStreak,
        activeDaysCount,
        topLanguages,
        chartSvgUrl: `https://ghchart.rshah.org/11606e/${cleanUsername}`,
        weeks,
      },
    });
  } catch (error: any) {
    console.error("Error in github-contributions API route:", error);
    return NextResponse.json({ error: "Failed to fetch GitHub contributions" }, { status: 500 });
  }
}
