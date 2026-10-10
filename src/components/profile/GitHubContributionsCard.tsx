"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ExternalLink,
  Flame,
  Trophy,
  Calendar,
  GitCommit,
  BookOpen,
  Users,
  Code2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface GitHubContributionsCardProps {
  userId?: string;
  githubUsername?: string;
  portfolioLink?: string;
  isOwner?: boolean;
  className?: string;
}

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface GitHubData {
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl: string;
  publicRepos: number;
  followers: number;
  following: number;
  totalContributionsLastYear: number;
  currentStreak: number;
  longestStreak: number;
  activeDaysCount: number;
  topLanguages: string[];
  chartSvgUrl: string;
  weeks: ContributionDay[][];
}

function extractUsernameFromUrl(input?: string): string | null {
  if (!input) return null;
  const match = input.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (match) return match[1];
  const cleaned = input.trim().replace(/^@/, "");
  if (/^[a-zA-Z0-9_-]+$/.test(cleaned) && !cleaned.includes(".")) return cleaned;
  return null;
}

// Day color mapping adhering to Asteria Club teal/cyan theme
function getLevelClass(level: number): string {
  switch (level) {
    case 1:
      return "bg-teal-200 dark:bg-teal-900/90 border-teal-300 dark:border-teal-800";
    case 2:
      return "bg-teal-400 dark:bg-teal-700 border-teal-500 dark:border-teal-600";
    case 3:
      return "bg-teal-600 dark:bg-teal-500 border-teal-700 dark:border-teal-400";
    case 4:
      return "bg-teal-800 dark:bg-teal-300 border-teal-900 dark:border-teal-200";
    default:
      return "bg-slate-100 dark:bg-teal-950/40 border-slate-200/60 dark:border-teal-900/40";
  }
}

export function GitHubContributionsCard({
  userId,
  githubUsername,
  portfolioLink,
  isOwner = false,
  className = "",
}: GitHubContributionsCardProps) {
  const [resolvedUsername, setResolvedUsername] = useState<string | null>(
    githubUsername || extractUsernameFromUrl(portfolioLink) || null
  );
  const [data, setData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);

  // 1. Resolve username from member connections if not already found
  useEffect(() => {
    let isMounted = true;

    async function resolve() {
      if (githubUsername) {
        if (isMounted) setResolvedUsername(githubUsername);
        return;
      }

      const fromPortfolio = extractUsernameFromUrl(portfolioLink);
      if (fromPortfolio) {
        if (isMounted) setResolvedUsername(fromPortfolio);
        return;
      }

      if (userId) {
        try {
          const res = await fetch(`/api/connections?userId=${userId}`);
          if (res.ok) {
            const json = await res.json();
            const githubConn = (json.connections || []).find((c: any) => c.provider === "github");
            if (githubConn && isMounted) {
              const u = githubConn.username || extractUsernameFromUrl(githubConn.profileUrl);
              setResolvedUsername(u);
              return;
            }
          }
        } catch {
          // ignore error
        }
      }

      if (isMounted) setLoading(false);
    }

    resolve();
    return () => {
      isMounted = false;
    };
  }, [userId, githubUsername, portfolioLink]);

  // 2. Fetch GitHub contributions data once username is resolved
  useEffect(() => {
    if (!resolvedUsername) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/connections/github-contributions?username=${encodeURIComponent(resolvedUsername)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load GitHub activity");
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [resolvedUsername]);

  // If no GitHub username found:
  if (!resolvedUsername && !loading) {
    if (isOwner) {
      return (
        <Card className={`overflow-hidden border-dashed border-teal-300 dark:border-teal-800/80 bg-teal-50/40 dark:bg-teal-950/20 p-5 ${className}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="p-3 rounded-2xl bg-teal-100 dark:bg-teal-900/60 text-ast-primary dark:text-teal-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink dark:text-white uppercase tracking-wider">
                  Mettre en valeur vos Contributions GitHub
                </h4>
                <p className="text-xs text-ink-soft dark:text-teal-200/80 font-body">
                  Liez votre compte GitHub pour afficher en direct vos commits, calendrier de contributions et technologies.
                </p>
              </div>
            </div>

            <Link href="/settings/connected-accounts" className="shrink-0">
              <Button size="sm" variant="accent" className="text-xs font-bold font-display uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Connecter GitHub
              </Button>
            </Link>
          </div>
        </Card>
      );
    }
    return null;
  }

  return (
    <Card className={`overflow-hidden bg-surface border-line dark:border-teal-900 shadow-md ${className}`}>
      <CardHeader className="pb-3 border-b border-line dark:border-teal-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              />
            </svg>
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold font-display uppercase tracking-wider flex items-center gap-2">
              Activité & Contributions GitHub
            </CardTitle>
            <p className="text-[11px] text-ink-soft dark:text-teal-300 font-mono">
              @{resolvedUsername}
            </p>
          </div>
        </div>

        {data && (
          <a
            href={data.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-alt dark:bg-teal-950/80 hover:bg-teal-50 dark:hover:bg-teal-900 border border-line dark:border-teal-800 text-xs font-semibold text-ast-primary dark:text-teal-300 transition-all shadow-sm"
          >
            <span>Ouvrir sur GitHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {loading ? (
          <div className="py-10 text-center text-ink-soft flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-ast-primary dark:border-teal-400 border-t-transparent animate-spin" />
            <p className="text-xs font-mono">Synchronisation des contributions GitHub...</p>
          </div>
        ) : error && !data ? (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200">
            Impossible de charger les données GitHub pour @{resolvedUsername}. Le profil est peut-être privé ou le quota d&apos;API est atteint.
          </div>
        ) : data ? (
          <>
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-surface-alt dark:bg-teal-950/60 border border-line dark:border-teal-900/80 space-y-1">
                <div className="flex items-center justify-between text-ink-soft dark:text-teal-300 text-[11px] font-mono">
                  <span>Contributions (12m)</span>
                  <GitCommit className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                </div>
                <p className="font-display font-black text-xl text-ink dark:text-white">
                  {data.totalContributionsLastYear.toLocaleString()}
                </p>
                <span className="text-[10px] text-ink-faint dark:text-teal-400/60 block">
                  {data.activeDaysCount} jours actifs
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-alt dark:bg-teal-950/60 border border-line dark:border-teal-900/80 space-y-1">
                <div className="flex items-center justify-between text-ink-soft dark:text-teal-300 text-[11px] font-mono">
                  <span>Série Actuelle</span>
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="font-display font-black text-xl text-ink dark:text-white">
                  {data.currentStreak} {data.currentStreak === 1 ? "jour" : "jours"}
                </p>
                <span className="text-[10px] text-ink-faint dark:text-teal-400/60 block">
                  {data.currentStreak > 0 ? "🔥 Série en cours" : "Pas de commit aujourd'hui"}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-alt dark:bg-teal-950/60 border border-line dark:border-teal-900/80 space-y-1">
                <div className="flex items-center justify-between text-ink-soft dark:text-teal-300 text-[11px] font-mono">
                  <span>Meilleure Série</span>
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <p className="font-display font-black text-xl text-ink dark:text-white">
                  {data.longestStreak} {data.longestStreak === 1 ? "jour" : "jours"}
                </p>
                <span className="text-[10px] text-ink-faint dark:text-teal-400/60 block">
                  Record consécutif
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-alt dark:bg-teal-950/60 border border-line dark:border-teal-900/80 space-y-1">
                <div className="flex items-center justify-between text-ink-soft dark:text-teal-300 text-[11px] font-mono">
                  <span>Dépôts & Abonnés</span>
                  <BookOpen className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                </div>
                <p className="font-display font-black text-xl text-ink dark:text-white">
                  {data.publicRepos} <span className="text-xs font-normal text-ink-soft">repos</span>
                </p>
                <span className="text-[10px] text-ink-faint dark:text-teal-400/60 block">
                  {data.followers} followers
                </span>
              </div>
            </div>

            {/* Contribution Calendar Heatmap */}
            <div className="p-4 rounded-2xl bg-surface-alt/70 dark:bg-teal-950/40 border border-line dark:border-teal-900 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-ink dark:text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                  Calendrier d&apos;activité annuelle
                </span>

                {hoveredDay ? (
                  <span className="text-[11px] font-mono font-medium text-ast-primary dark:text-teal-300 animate-vague-in">
                    {hoveredDay.count} contribution{hoveredDay.count > 1 ? "s" : ""} le{" "}
                    {new Date(hoveredDay.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                ) : (
                  <span className="text-[11px] font-mono text-ink-faint dark:text-teal-400/60">
                    Survolez une case pour voir le détail
                  </span>
                )}
              </div>

              {/* Heatmap Grid (Interactive if weeks available, or high-res SVG fallback) */}
              {data.weeks && data.weeks.length > 0 ? (
                <div className="overflow-x-auto pb-2 scrollbar-thin">
                  <div className="inline-flex gap-1 min-w-[640px] pt-1">
                    {data.weeks.map((week, wIdx) => (
                      <div key={wIdx} className="flex flex-col gap-1">
                        {week.map((day, dIdx) => (
                          <div
                            key={dIdx}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            title={`${day.count} contributions le ${day.date}`}
                            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm border cursor-pointer transition-transform hover:scale-125 hover:z-10 ${getLevelClass(
                              day.level
                            )}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap Legend */}
                  <div className="flex items-center justify-between pt-3 text-[10px] font-mono text-ink-faint dark:text-teal-400/60">
                    <span>52 dernières semaines</span>
                    <div className="flex items-center gap-1.5">
                      <span>Moins</span>
                      <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-teal-950/40 border border-slate-200/60 dark:border-teal-900/40" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-200 dark:bg-teal-900 border border-teal-300 dark:border-teal-800" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-400 dark:bg-teal-700 border border-teal-500 dark:border-teal-600" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-600 dark:bg-teal-500 border border-teal-700 dark:border-teal-400" />
                      <div className="w-2.5 h-2.5 rounded-sm bg-teal-800 dark:bg-teal-300 border border-teal-900 dark:border-teal-200" />
                      <span>Plus</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Fallback SVG Chart */
                <div className="overflow-x-auto py-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.chartSvgUrl}
                    alt={`Graphique des contributions de ${data.username}`}
                    className="w-full max-w-full h-auto min-w-[600px] rounded"
                  />
                </div>
              )}
            </div>

            {/* Technologies & Languages Tag Bar */}
            {data.topLanguages && data.topLanguages.length > 0 && (
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] font-mono text-ink-soft dark:text-teal-300 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                  Langages Principaux :
                </span>
                {data.topLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 text-ast-primary dark:text-teal-200 border border-teal-200 dark:border-teal-800 text-xs font-mono font-semibold"
                  >
                    {lang}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
