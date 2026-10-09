"use client";

import React, { useState, useEffect } from "react";
import { MemberConnectionItem, ConnectionProvider } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import {
  ExternalLink,
  ShieldCheck,
  Globe,
  GitBranch,
  Star,
  BookOpen,
  Trash2,
  Lock,
  Users,
  Settings,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface SocialConnectionsListProps {
  userId: string;
  isOwner?: boolean;
  currentUser?: any;
  compact?: boolean;
}

// Icon mapper for social providers
function ProviderIcon({ provider, className = "w-4 h-4" }: { provider: ConnectionProvider; className?: string }) {
  switch (provider) {
    case "github":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.54a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24" />
        </svg>
      );
    case "discord":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      );
    case "x":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    default:
      return <Globe className={className} />;
  }
}

export function SocialConnectionsList({
  userId,
  isOwner = false,
  currentUser,
  compact = false,
}: SocialConnectionsListProps) {
  const [connections, setConnections] = useState<MemberConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [githubData, setGithubData] = useState<any | null>(null);

  // Moderation modal state
  const [moderatingConn, setModeratingConn] = useState<MemberConnectionItem | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isBoard =
    currentUser?.role === "PRESIDENT" ||
    currentUser?.role === "VICE_PRESIDENT" ||
    currentUser?.role === "BOARD";

  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/connections?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const list: MemberConnectionItem[] = data.connections || [];
        setConnections(list);

        // If verified GitHub is present, fetch public enrichment
        const githubConn = list.find((c) => c.provider === "github" && c.isVerified);
        if (githubConn) {
          fetchGithubEnrichment(githubConn.username);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGithubEnrichment = async (username: string) => {
    try {
      const res = await fetch(`/api/connections/github-enrichment?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const d = await res.json();
        setGithubData(d.data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (userId) {
      fetchConnections();
    }
  }, [userId]);

  const handleModerationSubmit = async () => {
    if (!moderatingConn || !moderationReason.trim()) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/connections/${moderatingConn.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: moderationReason.trim() }),
      });
      if (res.ok) {
        setModeratingConn(null);
        setModerationReason("");
        fetchConnections();
      } else {
        const d = await res.json();
        alert(d.error || "Échec de la suppression");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        <span className="text-xs text-ink-soft font-mono">Chargement des profils...</span>
      </div>
    );
  }

  if (connections.length === 0) {
    if (isOwner) {
      return (
        <div className="p-3 rounded-xl bg-surface-alt border border-line flex items-center justify-between text-xs">
          <span className="text-ink-soft">Aucun profil connecté. Liez vos comptes GitHub & LinkedIn.</span>
          <Link href="/settings/connected-accounts">
            <Button size="sm" variant="outline" className="text-xs">
              Lier mes comptes
            </Button>
          </Link>
        </div>
      );
    }
    return null;
  }

  // Compact badge row (used on member cards or org chart)
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {connections.map((conn) => (
          <a
            key={conn.id}
            href={conn.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`${conn.provider}: ${conn.username} (${conn.isVerified ? "Vérifié" : "Manuel"})`}
            className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
              conn.isVerified
                ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                : "bg-surface-alt border-line text-ink-soft hover:text-ink hover:bg-surface"
            }`}
          >
            <ProviderIcon provider={conn.provider} className="w-3.5 h-3.5" />
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Social Chips Row */}
      <div className="flex flex-wrap items-center gap-2">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
              conn.isVerified
                ? "bg-indigo-950/20 border-indigo-500/30 text-white hover:border-indigo-500/60"
                : "bg-surface-alt border-line text-ink-soft hover:text-ink"
            }`}
          >
            <ProviderIcon
              provider={conn.provider}
              className={`w-4 h-4 ${conn.isVerified ? "text-indigo-400" : "text-ink-soft"}`}
            />

            <a
              href={conn.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:underline flex items-center gap-1 text-ink dark:text-white"
            >
              <span>{conn.customLabel || conn.username}</span>
              <ExternalLink className="w-3 h-3 text-ink-soft opacity-60 group-hover:opacity-100" />
            </a>

            {conn.isVerified ? (
              <span
                title="Identité vérifiée par OAuth officiel"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold"
              >
                <ShieldCheck className="w-3 h-3" />
                Vérifié
              </span>
            ) : (
              <span
                title="Lien manuel non certifié"
                className="text-[10px] text-ink-soft font-mono opacity-60"
              >
                (manuel)
              </span>
            )}

            {/* Visibility Indicator (Owner only) */}
            {isOwner && (
              <span className="text-[10px] text-ink-soft font-mono ml-0.5" title={`Visibilité : ${conn.visibility}`}>
                {conn.visibility === "private" && <Lock className="w-3 h-3 text-amber-400 inline" />}
                {conn.visibility === "members" && <Users className="w-3 h-3 text-cyan-400 inline" />}
              </span>
            )}

            {/* Board Moderation Action for abusive manual links */}
            {!isOwner && isBoard && !conn.isVerified && (
              <button
                type="button"
                onClick={() => {
                  setModeratingConn(conn);
                  setModerationReason("");
                }}
                className="ml-1 p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                title="Modérer / Supprimer ce lien abusif (Bureau)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {isOwner && (
          <Link href="/settings/connected-accounts">
            <Button size="sm" variant="ghost" className="text-xs text-ink-soft hover:text-ink">
              <Settings className="w-3.5 h-3.5 mr-1" /> Gérer mes comptes
            </Button>
          </Link>
        )}
      </div>

      {/* GitHub Enrichment Card (If verified GitHub account present) */}
      {githubData && (
        <div className="p-3.5 rounded-2xl bg-surface-alt/70 border border-line text-xs space-y-2 max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ProviderIcon provider="github" className="w-4 h-4 text-ink dark:text-white" />
              <span className="font-semibold text-ink dark:text-white">GitHub En Direct</span>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                @{githubData.login}
              </span>
            </div>
            <div className="flex items-center gap-3 text-ink-soft text-[11px] font-mono">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-ast-primary" />
                <strong>{githubData.publicRepos}</strong> repos
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3 text-ast-primary" />
                <strong>{githubData.followers}</strong> followers
              </span>
            </div>
          </div>

          {githubData.topLanguages && githubData.topLanguages.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-line/60">
              <span className="text-[10px] text-ink-soft font-mono">Technologies :</span>
              {githubData.topLanguages.map((lang: string) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 rounded bg-surface border border-line text-[10px] font-mono text-ink font-semibold"
                >
                  {lang}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Board Moderation Modal */}
      <Modal
        isOpen={Boolean(moderatingConn)}
        onClose={() => setModeratingConn(null)}
        title="Modération de Lien Social (Action Bureau)"
        description={`Supprimer le lien ${moderatingConn?.provider} : ${moderatingConn?.profileUrl}`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
            <p>
              En tant que membre du Bureau, vous pouvez retirer un lien non conforme ou abusif. Cette action est consignée dans le journal d'audit et le membre sera notifié du motif.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">
              Motif obligatoire du retrait *
            </label>
            <Textarea
              placeholder="Ex: Lien inapproprié, renvoie vers un contenu non conforme à la charte..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="secondary" size="sm" onClick={() => setModeratingConn(null)}>
              Annuler
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={handleModerationSubmit}
              disabled={isDeleting || !moderationReason.trim()}
            >
              {isDeleting ? "Retrait en cours..." : "Retirer le lien"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
