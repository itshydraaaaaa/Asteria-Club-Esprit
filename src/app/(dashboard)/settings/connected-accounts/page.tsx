"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase/client";
import { MemberConnectionItem, ConnectionProvider, ConnectionVisibility } from "@/lib/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  Lock,
  Users,
  Eye,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const OAUTH_PROVIDERS: Array<{
  id: ConnectionProvider;
  authProvider: "github" | "linkedin_oidc" | "discord";
  name: string;
  description: string;
  iconSvg: React.ReactNode;
}> = [
  {
    id: "github",
    authProvider: "github",
    name: "GitHub",
    description: "Certification de vos contributions open-source et projets de code.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    authProvider: "linkedin_oidc",
    name: "LinkedIn",
    description: "Validation de votre parcours professionnel et réseau d'alumni.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.54a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24" />
      </svg>
    ),
  },
  {
    id: "discord",
    authProvider: "discord",
    name: "Discord",
    description: "Intégration au serveur officiel Asteria Club et rôles automatiques.",
    iconSvg: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
];

export default function ConnectedAccountsPage() {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [connections, setConnections] = useState<MemberConnectionItem[]>([]);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  // Status message / toast
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Manual Link Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [newLinkForm, setNewLinkForm] = useState({
    provider: "instagram",
    url: "",
    customLabel: "",
    visibility: "members" as ConnectionVisibility,
  });

  // Disconnect Confirmation Modal
  const [disconnectingConn, setDisconnectingConn] = useState<MemberConnectionItem | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const supabase = createClient();

  const isBoard =
    currentUser?.role === "PRESIDENT" ||
    currentUser?.role === "VICE_PRESIDENT" ||
    currentUser?.role === "BOARD";

  const fetchConnections = async () => {
    try {
      const [userRes, connRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/connections").then((r) => r.json()),
      ]);

      setCurrentUser(userRes.user || null);
      setConnections(connRes.connections || []);

      if (userRes.user?.role === "PRESIDENT" || userRes.user?.role === "BOARD" || userRes.user?.role === "VICE_PRESIDENT") {
        fetch("/api/connections/stats")
          .then((r) => r.json())
          .then((d) => setStats(d.stats || null))
          .catch(() => {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check URL parameters or hash for OAuth errors returned from redirect
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

      const error = searchParams.get("error") || hashParams.get("error");
      const errorDesc = searchParams.get("error_description") || hashParams.get("error_description");

      if (error || errorDesc) {
        let msg = decodeURIComponent(errorDesc || error || "Erreur de liaison OAuth.");
        if (
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("client_id") ||
          msg.toLowerCase().includes("app") ||
          error === "invalid_request"
        ) {
          msg = `Configuration OAuth invalide (${msg}). Le Client ID ou le Client Secret saisi dans votre console Supabase pour ce fournisseur est invalide ou n'est pas une application OAuth autorisée.`;
        }
        setFeedback({ type: "error", message: msg });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // 1. Trigger identity sync on mount (to capture return from OAuth callback)
    fetch("/api/connections/sync", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        if (data.errors && data.errors.length > 0) {
          setFeedback({ type: "error", message: data.errors.join(" • ") });
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchConnections();
      });
  }, []);

  // Initiate OAuth Link
  const handleConnectOAuth = async (authProvider: "github" | "linkedin_oidc" | "discord") => {
    try {
      setFeedback(null);
      const origin = window.location.origin;
      const { data, error } = await supabase.auth.linkIdentity({
        provider: authProvider,
        options: {
          redirectTo: `${origin}/auth/callback?next=/settings/connected-accounts`,
          scopes: authProvider === "github" ? "read:user" : undefined,
        },
      });

      if (error) {
        let errorMsg = error.message;
        if (error.message?.includes("provider is not enabled")) {
          errorMsg = `Le fournisseur "${authProvider}" n'est pas activé dans le tableau de bord Supabase (Authentication > Providers). Vous devez l'activer et renseigner les clés OAuth pour l'utiliser.`;
        } else if (error.message?.includes("Manual linking is disabled")) {
          errorMsg = "La liaison manuelle de comptes (Manual Linking) est désactivée dans Supabase Auth. Activez 'Allow manual linking' dans Authentication > Settings.";
        }
        setFeedback({
          type: "error",
          message: errorMsg,
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Erreur de connexion OAuth" });
    }
  };

  // Disconnect Account
  const handleConfirmDisconnect = async () => {
    if (!disconnectingConn) return;
    setIsDisconnecting(true);
    try {
      // 1. If OAuth identity: attempt unlinking via Supabase Auth
      if (disconnectingConn.type === "oauth") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && user.identities) {
          const matchingIdentity = user.identities.find(
            (id) =>
              id.provider === disconnectingConn.provider ||
              (disconnectingConn.provider === "linkedin" && id.provider === "linkedin_oidc")
          );

          if (matchingIdentity) {
            // Check if it's the only login method
            if (user.identities.length <= 1) {
              throw new Error(
                "Impossible de dissocier ce compte : il s'agit de votre unique moyen de connexion actif."
              );
            }
            await supabase.auth.unlinkIdentity(matchingIdentity);
          }
        }
      }

      // 2. Delete database connection record
      const res = await fetch(`/api/connections/${disconnectingConn.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Erreur lors de la suppression de la connexion.");
      }

      setFeedback({
        type: "success",
        message: `Compte ${disconnectingConn.provider} dissocié avec succès.`,
      });
      setDisconnectingConn(null);
      fetchConnections();
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message });
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Change visibility of an existing connection
  const handleVisibilityChange = async (connId: string, newVisibility: ConnectionVisibility) => {
    try {
      const res = await fetch(`/api/connections/${connId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (res.ok) {
        setFeedback({ type: "success", message: "Niveau de visibilité mis à jour." });
        setConnections((prev) =>
          prev.map((c) => (c.id === connId ? { ...c, visibility: newVisibility } : c))
        );
      } else {
        const d = await res.json();
        alert(d.error || "Échec de mise à jour");
      }
    } catch (err: any) {
      alert("Erreur réseau");
    }
  };

  // Add manual social link
  const handleAddManualLink = async () => {
    setModalError(null);
    if (!newLinkForm.url.trim()) {
      setModalError("Veuillez renseigner une URL ou un identifiant.");
      return;
    }

    setIsSubmittingLink(true);
    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLinkForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'ajouter le lien.");
      }

      setIsAddModalOpen(false);
      setNewLinkForm({
        provider: "instagram",
        url: "",
        customLabel: "",
        visibility: "members",
      });
      setFeedback({ type: "success", message: "Lien social ajouté avec succès !" });
      fetchConnections();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const manualConnections = connections.filter((c) => c.type === "manual");
  const oauthConnectionsMap = new Map<string, MemberConnectionItem>();
  connections
    .filter((c) => c.type === "oauth")
    .forEach((c) => oauthConnectionsMap.set(c.provider, c));

  return (
    <div className="flex-1 flex flex-col">
      <Header
        user={currentUser}
        title="Comptes Connectés & Profils Sociaux"
        subtitle="Identités vérifiées par OAuth officiel et liens vers vos réseaux et portfolios"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-8">
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-body animate-in fade-in-50 ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                : "bg-red-500/10 text-red-300 border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-white/60 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION A: VERIFIED OAUTH IDENTITIES */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                Sécurité & OAuth
              </Badge>
              <span className="text-xs text-ink-soft font-mono">Identités Certifiées</span>
            </div>
            <h2 className="text-xl font-display font-bold text-ink dark:text-white">
              Comptes Professionnels Vérifiés
            </h2>
            <p className="text-xs text-ink-soft font-body leading-relaxed max-w-2xl">
              Ces comptes sont authentifiés directement via le protocole OAuth de chaque fournisseur. Seules les informations de profil public (nom, avatar, identifiant) sont lues. Aucun mot de passe ni jeton d'écriture n'est conservé.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OAUTH_PROVIDERS.map((provider) => {
              const connected = oauthConnectionsMap.get(provider.id);

              return (
                <Card
                  key={provider.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    connected
                      ? "bg-surface/90 border-indigo-500/40 shadow-sm"
                      : "bg-surface-alt/70 border-line hover:border-line/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                          connected
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            : "bg-surface border-line text-ink-soft"
                        }`}
                      >
                        {provider.iconSvg}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm text-ink dark:text-white">
                            {provider.name}
                          </h3>
                          {connected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                              <ShieldCheck className="w-3 h-3" />
                              Vérifié
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-soft mt-0.5 line-clamp-1">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between gap-2">
                    {connected ? (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-mono font-semibold text-indigo-400 truncate">
                            {connected.username}
                          </span>
                          <a
                            href={connected.profileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-ink-soft hover:text-ink"
                            title="Ouvrir le profil"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={connected.visibility}
                            onChange={(e) =>
                              handleVisibilityChange(connected.id, e.target.value as ConnectionVisibility)
                            }
                            className="text-xs py-1 px-2 h-8"
                          >
                            <option value="members">👥 Membres</option>
                            <option value="public">🌍 Public</option>
                            <option value="private">🔒 Privé</option>
                          </Select>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                            onClick={() => setDisconnectingConn(connected)}
                          >
                            Dissocier
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[11px] text-ink-soft font-mono">Non connecté</span>
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs"
                          onClick={() => handleConnectOAuth(provider.authProvider)}
                        >
                          Connecter {provider.name}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SECTION B: MANUAL SOCIAL & PORTFOLIO LINKS */}
        {/* ========================================================================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="sm">
                  {manualConnections.length} / 10 Liens
                </Badge>
                <span className="text-xs text-ink-soft font-mono">Non Vérifiés</span>
              </div>
              <h2 className="text-xl font-display font-bold text-ink dark:text-white">
                Réseaux Sociaux & Portfolios Manuels
              </h2>
              <p className="text-xs text-ink-soft font-body leading-relaxed">
                Ajoutez vos comptes Instagram, TikTok, X, Behance ou site personnel. Ces liens sont signalés comme non certifiés par OAuth.
              </p>
            </div>

            <Button
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setModalError(null);
                setIsAddModalOpen(true);
              }}
              disabled={manualConnections.length >= 10}
            >
              Ajouter un lien
            </Button>
          </div>

          <Card className="p-4 sm:p-6 bg-surface/90 border border-line">
            {manualConnections.length > 0 ? (
              <div className="divide-y divide-line/60">
                {manualConnections.map((conn) => (
                  <div key={conn.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-surface-alt border border-line flex items-center justify-center text-ink-soft shrink-0">
                        <Globe className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-ink dark:text-white capitalize">
                            {conn.customLabel || conn.provider}
                          </span>
                          <span className="text-[10px] font-mono text-ink-soft">
                            (non vérifié)
                          </span>
                        </div>
                        <a
                          href={conn.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{conn.profileUrl}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={conn.visibility}
                        onChange={(e) =>
                          handleVisibilityChange(conn.id, e.target.value as ConnectionVisibility)
                        }
                        className="text-xs py-1 px-2 h-8"
                      >
                        <option value="members">👥 Membres</option>
                        <option value="public">🌍 Public</option>
                        <option value="private">🔒 Privé</option>
                      </Select>

                      <button
                        type="button"
                        onClick={() => setDisconnectingConn(conn)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                        title="Supprimer ce lien"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <Globe className="w-8 h-8 text-ink-soft mx-auto opacity-50" />
                <p className="text-xs text-ink-soft font-body max-w-sm mx-auto">
                  Aucun lien social manuel ajouté pour le moment. Cliquez sur "Ajouter un lien" pour afficher vos créations Behance, votre profil Instagram ou votre portfolio.
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* ========================================================================= */}
        {/* SECTION C: BOARD AGGREGATE STATS (BOARD ONLY) */}
        {/* ========================================================================= */}
        {isBoard && stats && (
          <section className="space-y-4 pt-4 border-t border-line">
            <div className="space-y-1">
              <Badge variant="primary" size="sm">
                Gouvernance du Club
              </Badge>
              <h2 className="text-xl font-display font-bold text-ink dark:text-white">
                Statistiques Globales des Connexions
              </h2>
              <p className="text-xs text-ink-soft font-body">
                Comptes cumulés par plateforme au sein de la communauté Asteria (données anonymisées).
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {Object.entries(stats).map(([prov, count]) => (
                <Card key={prov} className="p-3 text-center bg-surface-alt border border-line">
                  <span className="text-[10px] font-mono text-ink-soft uppercase block">{prov}</span>
                  <strong className="text-xl font-display font-bold text-indigo-400">{count}</strong>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD MANUAL LINK MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter un Profil ou Lien Social"
        description="Renseignez votre identifiant ou URL complète"
      >
        <div className="space-y-4">
          {modalError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Plateforme *</label>
            <Select
              value={newLinkForm.provider}
              onChange={(e) => setNewLinkForm({ ...newLinkForm, provider: e.target.value })}
            >
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="x">X (ex-Twitter)</option>
              <option value="behance">Behance (Design)</option>
              <option value="dribbble">Dribbble (UI/UX)</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="telegram">Telegram</option>
              <option value="website">Site Web Personnel / Portfolio</option>
              <option value="other">Autre Lien Personnalisé</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">
              Lien ou Identifiant *
            </label>
            <Input
              placeholder={
                newLinkForm.provider === "instagram"
                  ? "@nom_utilisateur ou https://instagram.com/..."
                  : newLinkForm.provider === "x"
                  ? "@pseudo ou https://x.com/..."
                  : "https://..."
              }
              value={newLinkForm.url}
              onChange={(e) => setNewLinkForm({ ...newLinkForm, url: e.target.value })}
            />
            <p className="text-[11px] text-ink-soft">
              Seules les adresses sécurisées HTTPS officielles sont autorisées.
            </p>
          </div>

          {(newLinkForm.provider === "website" || newLinkForm.provider === "other") && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">Libellé Personnalisé</label>
              <Input
                placeholder="Ex: Mon Portfolio Web, Blog Tech..."
                value={newLinkForm.customLabel}
                onChange={(e) => setNewLinkForm({ ...newLinkForm, customLabel: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Niveau de Visibilité</label>
            <Select
              value={newLinkForm.visibility}
              onChange={(e) =>
                setNewLinkForm({ ...newLinkForm, visibility: e.target.value as ConnectionVisibility })
              }
            >
              <option value="members">👥 Membres du club uniquement (recommandé)</option>
              <option value="public">🌍 Public (visible de tous)</option>
              <option value="private">🔒 Privé (visible par moi uniquement)</option>
            </Select>
          </div>

          <div className="pt-3 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Annuler
            </Button>
            <Button size="sm" onClick={handleAddManualLink} disabled={isSubmittingLink}>
              {isSubmittingLink ? "Validation..." : "Enregistrer le lien"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* DISCONNECT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(disconnectingConn)}
        onClose={() => setDisconnectingConn(null)}
        title="Dissocier ce Compte ?"
        description={`Êtes-vous sûr de vouloir dissocier votre compte ${disconnectingConn?.provider} ?`}
      >
        <div className="space-y-4">
          <p className="text-xs text-ink-soft font-body leading-relaxed">
            Ce lien sera immédiatement supprimé de votre profil. S'il s'agissait d'un compte vérifié par OAuth, son badge de certification disparaîtra.
          </p>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDisconnectingConn(null)}
              disabled={isDisconnecting}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmDisconnect}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? "Dissociation..." : "Dissocier définitivement"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
