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
  GraduationCap,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  AlertCircle,
  KeyRound,
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
    stage?: "INTERVIEW" | "ACCEPTED";
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Direct Reset Link & Access Generation
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null);
  const [generatedAccess, setGeneratedAccess] = useState<{
    id?: string;
    name: string;
    email: string;
    department: string;
    actionLink?: string;
    temporaryPassword?: string;
    stage?: string;
  } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tempPassCopied, setTempPassCopied] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);
  const [editGmail, setEditGmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

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

  const handleUpdateStatus = async (id: string, status: "ACCEPTED" | "REJECTED" | "INTERVIEW") => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewerNotes }),
      });
      const data = await res.json();
      if (res.ok) {
        const app = selectedApp || applications.find((a) => a.id === id);
        if (data.temporaryPassword || status === "INTERVIEW" || status === "ACCEPTED") {
          setOnboardingSuccess(
            data.message || (status === "INTERVIEW"
              ? `Candidat convoqué à l'entretien ! Email envoyé à ${app?.email}.`
              : `Candidature acceptée ! Email envoyé à ${app?.email}.`)
          );
          if (data.temporaryPassword) {
            setCreatedCredentials({
              name: app?.name || data.application?.name || "Nouveau Membre",
              email: app?.email || data.application?.email,
              department: app?.departmentPreference || data.application?.departmentPreference || "Asteria Club",
              temporaryPassword: data.temporaryPassword,
              emailDelivery: data.emailDelivery,
              stage: status === "INTERVIEW" ? "INTERVIEW" : "ACCEPTED",
            });
          }
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
            name: app?.name || data.user?.name || "Candidat",
            email: app?.email || data.user?.email,
            department: app?.departmentPreference || "Asteria Club",
            temporaryPassword: data.temporaryPassword,
            emailDelivery: data.emailDelivery,
            stage: "INTERVIEW",
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
    const isInterview = createdCredentials.stage === "INTERVIEW";
    const text = isInterview
      ? `Asteria Club Esprit — Convocation Entretien & Accès Candidat\n\nFixer votre date et heure d'entretien (Lien Cally) :\nhttps://cally.com/p4xaq6duarbxjfxu\n\nPortail: ${portalUrl}\nEmail: ${createdCredentials.email}\nMot de passe temporaire: ${createdCredentials.temporaryPassword}\n\nPôle: ${createdCredentials.department}\nStatut: Entretien Programmé (Rôle: WAITING_FOR_INTERVIEW)`
      : `Asteria Club Esprit — Vos Identifiants Membre Officiel\n\nPortail: ${portalUrl}\nEmail: ${createdCredentials.email}\nMot de passe temporaire: ${createdCredentials.temporaryPassword}\n\nBienvenue dans le pôle ${createdCredentials.department} !`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleGenerateAccessLink = async (app: any, overrideEmail?: string) => {
    try {
      setGeneratingLinkId(app.id);
      const res = await fetch(`/api/applications/${app.id}/reset-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideEmail ? { newEmail: overrideEmail } : {}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGeneratedAccess({
          id: app.id,
          name: data.name || app.name,
          email: data.email || overrideEmail || app.email,
          department: data.department || app.departmentPreference,
          actionLink: data.actionLink,
          temporaryPassword: data.temporaryPassword,
          stage: data.stage || app.status,
        });
        setEditGmail("");
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#11606E", "#60C8D4", "#F59E0B"],
        });
        fetchApplications();
      } else {
        alert(data.error || "Impossible de générer le lien d'accès.");
      }
    } catch (err) {
      console.error("Error generating reset link:", err);
      alert("Erreur lors de la génération du lien d'accès.");
    } finally {
      setGeneratingLinkId(null);
    }
  };

  const handleUpdateToGmail = async () => {
    if (!generatedAccess?.id || !editGmail.toLowerCase().trim().endsWith("@gmail.com")) {
      alert("Veuillez saisir une adresse se terminant par @gmail.com");
      return;
    }
    setUpdatingEmail(true);
    try {
      await handleGenerateAccessLink(
        {
          id: generatedAccess.id,
          name: generatedAccess.name,
          departmentPreference: generatedAccess.department,
          status: generatedAccess.stage,
        },
        editGmail.toLowerCase().trim()
      );
    } finally {
      setUpdatingEmail(false);
    }
  };

  const handleCopyText = (text: string, type: "link" | "pass" | "message") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === "link") {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } else if (type === "pass") {
      setTempPassCopied(true);
      setTimeout(() => setTempPassCopied(false), 2500);
    } else if (type === "message") {
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2500);
    }
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
              className="w-52 text-xs py-1.5"
            >
              <option value="all">{isFr ? "Tous les Statuts" : "All Application Statuses"}</option>
              <option value="PENDING">{isFr ? "⏳ En Attente d'Examen" : "⏳ Pending Review"}</option>
              <option value="INTERVIEW">{isFr ? "📅 Convoqué à l'Entretien" : "📅 Interview Stage"}</option>
              <option value="ACCEPTED">{isFr ? "✓ Accepté (Membre Officiel)" : "✓ Accepted (Official Member)"}</option>
              <option value="REJECTED">{isFr ? "✕ Refusé" : "✕ Rejected"}</option>
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
                        : app.status === "INTERVIEW"
                        ? "accent"
                        : app.status === "REJECTED"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {app.status === "INTERVIEW"
                      ? (isFr ? "📅 Entretien Convoqué" : "📅 Interview Stage")
                      : app.status === "ACCEPTED"
                      ? (isFr ? "✓ Membre Officiel" : "✓ Official Member")
                      : app.status === "REJECTED"
                      ? (isFr ? "✕ Candidature Refusée" : "✕ Rejected")
                      : (isFr ? "⏳ En Attente" : "⏳ Pending Review")}
                  </Badge>
                  <span className="text-[11px] text-ink-faint font-body">
                    {formatDate(app.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="font-body font-bold text-base text-ink">{app.name}</h3>
                  <div className="space-y-1 mt-1 font-body">
                    <p className="text-xs text-ink-soft flex items-center gap-1.5 flex-wrap">
                      <Mail className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400 shrink-0" />
                      <span className="font-mono">{app.email}</span>
                      {app.email.toLowerCase().endsWith("@gmail.com") ? (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-teal-50 dark:bg-teal-900/60 text-ast-primary dark:text-teal-300 rounded font-bold">
                          Gmail
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded font-bold border border-amber-300 dark:border-amber-700">
                          ⚠️ Non-Gmail (ESPRIT)
                        </span>
                      )}
                    </p>
                    {(app.studentEmail || app.student_email) && (
                      <p className="text-xs text-ink-soft flex items-center gap-1.5 flex-wrap">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="text-ink-faint">{app.studentEmail || app.student_email}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-bold">
                          ESPRIT
                        </span>
                      </p>
                    )}
                    {app.phone && (
                      <p className="text-xs text-ink-soft flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-ink-faint shrink-0" /> {app.phone}
                      </p>
                    )}
                  </div>
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
              <div className="pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs w-full sm:w-auto"
                    onClick={() => {
                      setSelectedApp(app);
                      setReviewerNotes(app.reviewerNotes || "");
                    }}
                  >
                    {isFr ? "Examiner Dossier" : "Review Dossier"}
                  </Button>

                  {(currentUser?.role === "BOARD" ||
                    currentUser?.role === "PRESIDENT" ||
                    currentUser?.role === "VICE_PRESIDENT" ||
                    currentUser?.role === "HOD") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-teal-500/50 text-teal-900 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/60 font-semibold flex items-center justify-center gap-1.5 w-full sm:w-auto"
                      disabled={generatingLinkId === app.id}
                      onClick={() => handleGenerateAccessLink(app)}
                      title={
                        isFr
                          ? "Générer un lien direct de réinitialisation / code d'accès pour ce candidat"
                          : "Generate direct password reset / access link for this applicant"
                      }
                    >
                      {generatingLinkId === app.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <KeyRound className="w-3.5 h-3.5 text-ast-accent" />
                      )}
                      <span>{isFr ? "Lien d'Accès" : "Access Link"}</span>
                    </Button>
                  )}
                </div>

                {(currentUser?.role === "BOARD" || currentUser?.role === "PRESIDENT" || currentUser?.role === "VICE_PRESIDENT") && (
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {app.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="accent"
                        className="text-xs font-bold w-full sm:w-auto"
                        onClick={() => handleAutoOnboard(app.id, app)}
                      >
                        📅 {isFr ? "Convoquer Entretien" : "Invite Interview"}
                      </Button>
                    )}
                    {app.status === "INTERVIEW" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs font-bold w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleUpdateStatus(app.id, "ACCEPTED")}
                      >
                        ⭐ {isFr ? "Valider Membre" : "Accept Member"}
                      </Button>
                    )}
                  </div>
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
              <div className="flex justify-between items-center">
                <span className="font-bold text-ink">Gmail (Compte & Auto-Mails) :</span>
                <span className="font-mono text-ast-primary dark:text-teal-300 font-semibold">{selectedApp.email}</span>
              </div>
              {(selectedApp.studentEmail || selectedApp.student_email) && (
                <div className="flex justify-between items-center">
                  <span className="font-bold text-ink">Email Étudiant ESPRIT :</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{selectedApp.studentEmail || selectedApp.student_email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-bold text-ink">Preferred Department:</span>
                <span className="font-semibold text-teal-900 dark:text-teal-300">{selectedApp.departmentPreference}</span>
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
              {selectedApp.status !== "REJECTED" && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedApp.id, "REJECTED")}
                >
                  {isFr ? "✕ Refuser Candidature" : "Reject Application"}
                </Button>
              )}

              <div className="flex items-center gap-2 ml-auto flex-wrap">
                {(currentUser?.role === "BOARD" ||
                  currentUser?.role === "PRESIDENT" ||
                  currentUser?.role === "VICE_PRESIDENT" ||
                  currentUser?.role === "HOD") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-teal-500/50 text-teal-900 dark:text-teal-300 font-semibold flex items-center gap-1.5"
                    disabled={generatingLinkId === selectedApp.id}
                    onClick={() => handleGenerateAccessLink(selectedApp)}
                    title={
                      isFr
                        ? "Générer un lien direct de réinitialisation / code d'accès"
                        : "Generate direct password reset / access link"
                    }
                  >
                    {generatingLinkId === selectedApp.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <KeyRound className="w-3.5 h-3.5 text-ast-accent" />
                    )}
                    <span>{isFr ? "Lien d'Accès / Code" : "Access Link / Code"}</span>
                  </Button>
                )}

                {(currentUser?.role === "BOARD" || currentUser?.role === "PRESIDENT" || currentUser?.role === "VICE_PRESIDENT") && selectedApp.status === "PENDING" && (
                  <Button
                    variant="accent"
                    size="sm"
                    className="font-bold"
                    onClick={() => handleAutoOnboard(selectedApp.id, selectedApp)}
                  >
                    📅 {isFr ? "Convoquer Entretien & Accès Portail" : "Invite to Interview & Portal"}
                  </Button>
                )}

                {(currentUser?.role === "BOARD" || currentUser?.role === "PRESIDENT" || currentUser?.role === "VICE_PRESIDENT") && selectedApp.status !== "ACCEPTED" && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleUpdateStatus(selectedApp.id, "ACCEPTED")}
                  >
                    ⭐ {isFr ? "Valider comme Membre Officiel" : "Approve as Official Member"}
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
          title={
            createdCredentials.stage === "INTERVIEW"
              ? (isFr ? "Candidat Convoqué · Accès Entretien Prêt" : "Applicant Invited · Interview Access Ready")
              : (isFr ? "Candidat Accepté · Accès Membre Confirmé" : "Applicant Accepted · Member Access Confirmed")
          }
          maxWidth="md"
        >
          <div className="space-y-4 font-body">
            {createdCredentials.emailDelivery?.success ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm font-display uppercase tracking-wide">
                    {createdCredentials.stage === "INTERVIEW"
                      ? (isFr ? "Email d'Entretien Expédié !" : "Interview Email Dispatched!")
                      : (isFr ? "Email d'Intégration Envoyé !" : "Acceptance Email Dispatched!")}
                  </h5>
                  <p className="text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                    {createdCredentials.stage === "INTERVIEW"
                      ? (isFr
                          ? `Un email officiel avec la convocation à l'entretien et les identifiants d'accès au portail candidat a été délivré à ${createdCredentials.email}.`
                          : `An official interview invitation with portal access credentials has been successfully delivered to ${createdCredentials.email}.`)
                      : (isFr
                          ? `Un email officiel avec les instructions de membre officiel et les identifiants a été délivré à ${createdCredentials.email}.`
                          : `An official acceptance email with credentials was successfully delivered to ${createdCredentials.email}.`)}
                  </p>
                  {createdCredentials.emailDelivery?.provider && (
                    <div className="mt-2 space-y-1.5">
                      <span className="inline-block font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
                        Service: {createdCredentials.emailDelivery.provider.toUpperCase()} {createdCredentials.emailDelivery.messageId ? `(${createdCredentials.emailDelivery.messageId})` : ""}
                      </span>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-100/70 dark:bg-emerald-900/40 p-2 rounded-lg">
                        {isFr
                          ? "💡 Note : Si le candidat ne trouve pas l'email dans sa boîte de réception principale, rappelez-lui de vérifier son dossier « Courrier indésirable / Spam » ou l'onglet « Promotions »."
                          : "💡 Note: If the recipient does not see the email in their main inbox, please advise them to check their Spam/Junk or Promotions folders."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-amber-900 dark:text-amber-200 text-sm font-display uppercase tracking-wide">
                    {isFr ? "Compte Prêt · Note d'Envoi Email" : "Account Ready · Email Delivery Note"}
                  </h5>
                  <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    {createdCredentials.emailDelivery?.error || (isFr ? "Le compte a été créé. Vérifiez votre configuration Resend dans .env." : "Account created. Verify your Resend setup in .env.")}
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    {isFr ? "Vous pouvez copier les identifiants ci-dessous pour les transmettre au candidat." : "You can copy the credentials below to share them directly with the candidate."}
                  </p>
                </div>
              </div>
            )}

            {/* Cally Interview Scheduling Callout (for interview stage) */}
            {createdCredentials.stage === "INTERVIEW" && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-amber-700 dark:text-amber-400 block font-mono text-[11px] uppercase tracking-wider">
                    {isFr ? "📅 Lien Fixation Entretien (Cally)" : "📅 Interview Scheduling Link (Cally)"}
                  </span>
                  <a
                    href="https://cally.com/p4xaq6duarbxjfxu"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-amber-800 dark:text-amber-300 underline font-semibold hover:text-amber-900 break-all"
                  >
                    https://cally.com/p4xaq6duarbxjfxu
                  </a>
                </div>
                <a
                  href="https://cally.com/p4xaq6duarbxjfxu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-500 text-stone-900 hover:bg-amber-400 flex items-center gap-1.5 shrink-0 transition shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isFr ? "Ouvrir" : "Open"}
                </a>
              </div>
            )}

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-[#0A3A40] text-white border border-teal-700/60 space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-teal-700/50 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ast-light">
                  {createdCredentials.stage === "INTERVIEW"
                    ? (isFr ? "Accès Portail Entretien" : "Interview Portal Access")
                    : (isFr ? "Dossier de Connexion Membre" : "Member Portal Credentials")}
                </span>
                <span className="text-[10px] font-mono bg-ast-light/20 text-ast-light px-2 py-0.5 rounded-full">
                  {createdCredentials.department} · {createdCredentials.stage === "INTERVIEW" ? "WAITING_FOR_INTERVIEW" : "MEMBER"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-teal-200/70 font-semibold">{isFr ? "Candidat :" : "Candidate Name:"}</span>
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

      {/* Generated Access Link Modal */}
      {generatedAccess && (
        <Modal
          isOpen={!!generatedAccess}
          onClose={() => setGeneratedAccess(null)}
          title={isFr ? "Accès & Réinitialisation Candidat" : "Candidate Access & Reset Link"}
          maxWidth="lg"
        >
          <div className="space-y-4 font-body">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 flex items-start gap-3">
              <KeyRound className="w-5 h-5 text-ast-primary dark:text-teal-300 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <h5 className="font-bold text-teal-900 dark:text-teal-200 text-sm font-display uppercase tracking-wide">
                  {isFr ? "Accès Candidat Prêt pour Envoi Manuel" : "Candidate Access Ready for Direct Sharing"}
                </h5>
                <p className="text-teal-800/90 dark:text-teal-300/90 leading-relaxed">
                  {isFr
                    ? `Les emails institutionnels (@esprit.tn) bloquent les emails automatiques. Vous pouvez transmettre directement ce lien d'activation ou mot de passe à ${generatedAccess.name} par WhatsApp, Discord ou SMS.`
                    : `Institutional mailboxes (@esprit.tn) block automated emails. You can share this direct link or temporary password with ${generatedAccess.name} via WhatsApp, Discord, or SMS.`}
                </p>
              </div>
            </div>

            {/* If email is NOT a Gmail address, prompt admin to migrate it */}
            {(!generatedAccess.email.toLowerCase().endsWith("@gmail.com") || generatedAccess.email.toLowerCase().includes("esprit")) && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {isFr
                      ? "Adresse ESPRIT détectée — Remplacement par Gmail Requis"
                      : "ESPRIT Address Detected — Gmail Primary Required"}
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                  {isFr
                    ? `Le candidat utilise actuellement "${generatedAccess.email}". Enregistrez son adresse Gmail personnelle comme email principal pour garantir la réception de tous les emails futurs :`
                    : `The applicant is currently using "${generatedAccess.email}". Save their personal Gmail as primary email so future portal notifications arrive safely:`}
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    type="email"
                    placeholder="etudiant.nom@gmail.com"
                    value={editGmail}
                    onChange={(e) => setEditGmail(e.target.value)}
                    className="flex-1 text-xs font-mono p-2 rounded-lg bg-white dark:bg-[#072d33] border border-amber-300 dark:border-amber-700 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-ast-primary"
                  />
                  <Button
                    size="sm"
                    variant="accent"
                    className="shrink-0 text-xs font-bold"
                    disabled={!editGmail.toLowerCase().trim().endsWith("@gmail.com") || updatingEmail}
                    onClick={handleUpdateToGmail}
                  >
                    {updatingEmail ? (
                      <div className="w-3.5 h-3.5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>{isFr ? "Enregistrer Gmail & Regénérer" : "Save Gmail & Regenerate"}</span>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Direct Reset / Magic Link */}
            {generatedAccess.actionLink && (
              <div className="p-3.5 rounded-xl bg-surface-alt border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink font-display flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {isFr ? "1. Lien Direct de Définition du Mot de Passe" : "1. Direct Password Reset Link"}
                  </span>
                  <span className="text-[10px] text-ink-faint">
                    {isFr ? "Connexion sécurisée en un clic" : "One-click secure activation"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedAccess.actionLink}
                    className="w-full text-xs font-mono p-2 rounded-lg bg-surface border border-line text-ink dark:text-white select-all overflow-hidden text-ellipsis"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    className="shrink-0 flex items-center gap-1 text-xs"
                    onClick={() => handleCopyText(generatedAccess.actionLink || "", "link")}
                  >
                    {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{linkCopied ? (isFr ? "Copié !" : "Copied!") : (isFr ? "Copier Lien" : "Copy Link")}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Temporary Password */}
            {generatedAccess.temporaryPassword && (
              <div className="p-3.5 rounded-xl bg-surface-alt border border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink font-display block">
                    {isFr ? "2. Mot de Passe Provisoire Alternatif" : "2. Alternative Temporary Password"}
                  </span>
                  <span className="text-[10px] text-ink-faint">
                    {isFr ? "Connexion directe possible" : "Direct login possible"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono font-bold text-xs text-white bg-[#0A3A40] px-3 py-2 rounded-lg border border-teal-700 text-center select-all">
                    {generatedAccess.temporaryPassword}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 flex items-center gap-1 text-xs"
                    onClick={() => handleCopyText(generatedAccess.temporaryPassword || "", "pass")}
                  >
                    {tempPassCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{tempPassCopied ? (isFr ? "Copié" : "Copied") : (isFr ? "Copier PWD" : "Copy PWD")}</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Ready-to-Send Message */}
            <div className="p-3.5 rounded-xl bg-[#0A3A40] text-white border border-teal-700/60 space-y-2.5">
              <div className="flex items-center justify-between border-b border-teal-700/50 pb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ast-light">
                  {isFr ? "Message WhatsApp / Discord Tout-en-Un" : "All-in-One Shareable Message"}
                </span>
                <span className="text-[10px] font-mono bg-ast-light/20 text-ast-light px-2 py-0.5 rounded-full">
                  {generatedAccess.email}
                </span>
              </div>
              <p className="text-xs text-teal-100/90 leading-relaxed font-mono whitespace-pre-line bg-black/30 p-2.5 rounded-lg border border-teal-800/50 max-h-36 overflow-y-auto select-all">
{`Asteria Club Esprit — Vos Accès au Portail

Bonjour ${generatedAccess.name},
Voici vos accès pour le portail Asteria Club :

🔗 Lien direct pour définir votre mot de passe :
${generatedAccess.actionLink || "https://asteria-club-esprit.vercel.app/login"}

🔑 Mot de passe provisoire : ${generatedAccess.temporaryPassword}
📧 Email de connexion : ${generatedAccess.email}

Portail : https://asteria-club-esprit.vercel.app/login`}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="w-full font-bold flex items-center justify-center gap-2"
                onClick={() => {
                  const portalUrl = typeof window !== "undefined" ? `${window.location.origin}/login` : "https://asteria-club-esprit.vercel.app/login";
                  const text = `Asteria Club Esprit — Vos Accès au Portail\n\nBonjour ${generatedAccess.name},\nVoici vos accès pour le portail Asteria Club :\n\n🔗 Lien direct pour définir votre mot de passe :\n${generatedAccess.actionLink || portalUrl}\n\n🔑 Mot de passe provisoire : ${generatedAccess.temporaryPassword}\n📧 Email de connexion : ${generatedAccess.email}\n\nPortail : ${portalUrl}`;
                  handleCopyText(text, "message");
                }}
              >
                {messageCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{messageCopied ? (isFr ? "Message Copié !" : "Message Copied!") : (isFr ? "Copier le Message Complet (WhatsApp / SMS)" : "Copy Full Message")}</span>
              </Button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setGeneratedAccess(null)}
              >
                {isFr ? "Fermer" : "Close"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
