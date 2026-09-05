"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  UserPlus,
  ExternalLink,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatDate } from "@/lib/utils";

interface ApplicationsPipelineProps {
  currentUser: any;
}

export function ApplicationsPipeline({ currentUser }: ApplicationsPipelineProps) {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [applications, setApplications] = useState<any[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [onboardingSuccess, setOnboardingSuccess] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    department: string;
    temporaryPassword: string;
    emailDelivery?: any;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (departmentFilter !== "all") query.set("department", departmentFilter);
      if (statusFilter !== "all") query.set("status", statusFilter);

      const res = await fetch(`/api/applications?${query.toString()}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [departmentFilter, statusFilter]);

  const handleUpdateStatus = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewerNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        if (status === "ACCEPTED" && data.temporaryPassword) {
          const app = selectedApp || applications.find((a) => a.id === id);
          setOnboardingSuccess(
            data.message || `Candidature acceptée ! Email avec accès envoyé à ${app?.email}.`
          );
          setCreatedCredentials({
            name: app?.name || data.application?.name || "Nouveau Membre",
            email: app?.email || data.application?.email,
            department: app?.departmentPreference || data.application?.departmentPreference || "Asteria Club",
            temporaryPassword: data.temporaryPassword,
            emailDelivery: data.emailDelivery,
          });
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#11606E", "#60C8D4", "#0B4A55"],
          });
        }
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoOnboard = async (id: string, targetApp?: any) => {
    try {
      const res = await fetch(`/api/applications/${id}/onboard`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setOnboardingSuccess(data.message);
        if (data.temporaryPassword) {
          const app = targetApp || selectedApp || applications.find((a) => a.id === id);
          setCreatedCredentials({
            name: app?.name || data.user?.name || "Nouveau Membre",
            email: app?.email || data.user?.email,
            department: app?.departmentPreference || "Asteria Club",
            temporaryPassword: data.temporaryPassword,
            emailDelivery: data.emailDelivery,
          });
        }
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#11606E", "#60C8D4", "#0B4A55"],
        });
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://asteria-club-esprit.vercel.app/login";
    const text = `Asteria Club Esprit — Vos Identifiants Membre\n\nPortail: ${portalUrl}\nEmail: ${createdCredentials.email}\nMot de passe temporaire: ${createdCredentials.temporaryPassword}\n\nBienvenue dans le pôle ${createdCredentials.department} !`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Top Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44 text-xs py-1.5"
            >
              <option value="all">{isFr ? "Tous les Statuts" : "All Application Statuses"}</option>
              <option value="PENDING">{isFr ? "En Attente" : "Pending Review"}</option>
              <option value="ACCEPTED">{isFr ? "Acceptée" : "Accepted"}</option>
              <option value="REJECTED">{isFr ? "Refusée" : "Rejected"}</option>
            </Select>

            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-48 text-xs py-1.5"
            >
              <option value="all">{isFr ? "Tous les Pôles Souhaités" : "All Preferred Departments"}</option>
              <option value="Web Development">{isFr ? "Développement Web" : "Web Development"}</option>
              <option value="Graphic Design">{isFr ? "Design Graphique" : "Graphic Design"}</option>
              <option value="Video Editing">{isFr ? "Montage Vidéo" : "Video Editing"}</option>
              <option value="Photography">{isFr ? "Photographie" : "Photography"}</option>
            </Select>
          </div>

          <div className="text-xs text-ink-soft font-body">
            <strong>{applications.length}</strong> {isFr ? "Candidats dans le Pipeline" : "Applicants in Review Pipeline"}
          </div>
        </div>
      </Card>

      {onboardingSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-body flex items-center justify-between animate-vague-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{onboardingSuccess}</span>
          </div>
          <button
            onClick={() => setOnboardingSuccess(null)}
            className="text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Applications Grid */}
      {loading ? (
        <div className="p-12 text-center text-ink-soft">
          <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-display text-xs uppercase tracking-wider">Loading Applicants...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center text-ink-soft bg-surface rounded-2xl border border-line">
          <UserPlus className="w-10 h-10 text-ink-faint mx-auto mb-2" />
          <h4 className="font-display font-bold text-sm text-ink uppercase">No Applications Found</h4>
          <p className="text-xs text-ink-soft mt-1">Check back once new students submit recruitment applications.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-vague-in">
          {applications.map((app) => (
            <Card
              key={app.id}
              hoverable
              className="p-6 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      app.status === "ACCEPTED"
                        ? "success"
                        : app.status === "REJECTED"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {app.status}
                  </Badge>
                  <span className="text-[11px] text-ink-faint font-body">
                    {formatDate(app.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="font-body font-bold text-base text-ink">{app.name}</h3>
                  <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-0.5 font-body">
                    <Mail className="w-3.5 h-3.5 text-ink-faint" /> {app.email}
                  </p>
                  {app.phone && (
                    <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-0.5 font-body">
                      <Phone className="w-3.5 h-3.5 text-ink-faint" /> {app.phone}
                    </p>
                  )}
                </div>

                <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-200/80">
                  <span className="text-[10px] uppercase font-bold text-teal-900 font-display">
                    Track Preference
                  </span>
                  <p className="font-body font-bold text-xs text-teal-900 mt-0.5">
                    {app.departmentPreference}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-ink-faint font-display block mb-1">
                    Motivation / Experience
                  </span>
                  <p className="font-body text-xs text-ink-soft line-clamp-3 leading-relaxed">
                    &quot;{app.motivation}&quot;
                  </p>
                </div>

                {app.portfolioLink && (
                  <a
                    href={app.portfolioLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-teal-900 font-semibold hover:underline"
                  >
                    View Portfolio / GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                )}

                {app.reviewerNotes && (
                  <div className="p-2 bg-surface-alt rounded-lg border border-line text-[11px] text-ink-soft italic">
                    Notes: {app.reviewerNotes}
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-line/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setSelectedApp(app);
                    setReviewerNotes(app.reviewerNotes || "");
                  }}
                >
                  Review Dossier
                </Button>

                {currentUser?.role === "BOARD" && app.status !== "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="accent"
                    className="text-xs font-bold"
                    onClick={() => handleAutoOnboard(app.id, app)}
                  >
                    ★ {isFr ? "1-Click Onboard & Mail" : "1-Click Onboard"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Dossier Modal */}
      {selectedApp && (
        <Modal
          isOpen={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title={`Review Application · ${selectedApp.name}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface-alt border border-line space-y-2 text-xs font-body">
              <div className="flex justify-between">
                <span className="font-bold text-ink">Applicant Email:</span>
                <span>{selectedApp.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-ink">Preferred Department:</span>
                <span className="font-semibold text-teal-900">{selectedApp.departmentPreference}</span>
              </div>
              {selectedApp.portfolioLink && (
                <div className="flex justify-between">
                  <span className="font-bold text-ink">Portfolio Link:</span>
                  <a
                    href={selectedApp.portfolioLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-900 underline font-semibold"
                  >
                    Open Link ↗
                  </a>
                </div>
              )}
            </div>

            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body mb-1">
                Motivation Letter
              </h5>
              <p className="text-xs text-ink font-body p-3.5 bg-surface rounded-xl border border-line leading-relaxed">
                {selectedApp.motivation}
              </p>
            </div>

            <Textarea
              label="Reviewer Notes & Interview Feedback"
              placeholder="Add technical review notes, interview score, or onboarding instructions..."
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
            />

            <div className="pt-4 border-t border-line flex items-center justify-between gap-2 flex-wrap">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdateStatus(selectedApp.id, "REJECTED")}
              >
                Reject Application
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedApp.id, "ACCEPTED")}
                >
                  {isFr ? "Accepter & Envoyer Mail" : "Accept & Send Credentials"}
                </Button>
                {currentUser?.role === "BOARD" && (
                  <Button
                    variant="accent"
                    size="sm"
                    className="font-bold"
                    onClick={() => handleAutoOnboard(selectedApp.id, selectedApp)}
                  >
                    ★ {isFr ? "Auto-Onboard & Email" : "1-Click Onboard & Mail"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Generated Credentials & Email Confirmation Modal */}
      {createdCredentials && (
        <Modal
          isOpen={!!createdCredentials}
          onClose={() => setCreatedCredentials(null)}
          title={isFr ? "Candidat Accepté · Accès Membre Créé" : "Applicant Accepted · Member Access Created"}
          maxWidth="md"
        >
          <div className="space-y-4 font-body">
            {createdCredentials.emailDelivery?.success ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm font-display uppercase tracking-wide">
                    {isFr ? "Email d'Acceptation Envoyé !" : "Acceptance Email Dispatched!"}
                  </h5>
                  <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                    {isFr
                      ? `Un email officiel avec les instructions et les identifiants de connexion a été délivré à ${createdCredentials.email}.`
                      : `An acceptance email with portal instructions and login credentials was successfully delivered to ${createdCredentials.email}.`}
                  </p>
                  {createdCredentials.emailDelivery?.provider && (
                    <span className="inline-block mt-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                      Service: {createdCredentials.emailDelivery.provider.toUpperCase()} {createdCredentials.emailDelivery.messageId ? `(${createdCredentials.emailDelivery.messageId})` : ""}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-amber-900 dark:text-amber-200 text-sm font-display uppercase tracking-wide">
                    {isFr ? "Compte Créé · Avis d'Envoi Email" : "Account Created · Email Delivery Note"}
                  </h5>
                  <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    {createdCredentials.emailDelivery?.error || (isFr ? "Le compte a été créé. Vérifiez votre configuration Resend dans .env." : "Account created. Verify your Resend setup in .env.")}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    {isFr ? "Vous pouvez copier les identifiants ci-dessous pour les transmettre manuellement." : "You can copy the credentials below to share them directly with the candidate."}
                  </p>
                </div>
              </div>
            )}

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-[#0A3A40] text-white border border-teal-700/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-teal-700/50 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ast-light">
                  {isFr ? "Dossier de Connexion" : "Portal Login Credentials"}
                </span>
                <span className="text-[10px] font-mono bg-ast-light/20 text-ast-light px-2 py-0.5 rounded-full">
                  {createdCredentials.department}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-teal-200/70 font-semibold">{isFr ? "Candidat :" : "Member Name:"}</span>
                  <span className="font-bold text-white">{createdCredentials.name}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-teal-200/70 font-semibold">{isFr ? "Email de Connexion :" : "Login Email:"}</span>
                  <span className="font-mono text-white bg-teal-900/50 px-2 py-0.5 rounded border border-teal-800">
                    {createdCredentials.email}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-teal-200/70 font-semibold">{isFr ? "Mot de Passe Provisoire :" : "Temporary Password:"}</span>
                  <span className="font-mono text-ast-accent font-bold bg-black/40 px-2 py-1 rounded border border-amber-500/40 text-sm select-all">
                    {createdCredentials.temporaryPassword}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 font-bold flex items-center justify-center gap-2"
                onClick={handleCopyCredentials}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                {copied ? (isFr ? "Copié !" : "Copied to Clipboard!") : (isFr ? "Copier les Identifiants" : "Copy Login Details")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCreatedCredentials(null)}
              >
                {isFr ? "Terminer" : "Done"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
