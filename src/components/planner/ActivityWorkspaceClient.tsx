"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import {
  LogisticsTab,
  EmailsTab,
  AgendaTab,
  FilesAndCommentsTab,
  ReportAndClosureTab,
} from "./WorkspaceTabsSecondary";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  Users,
  Layers,
  Package,
  Mail,
  Clock,
  FileText,
  BarChart3,
  Sparkles,
  Plus,
  Trash2,
  QrCode,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

interface ActivityWorkspaceClientProps {
  activityId: string;
  currentUser: any;
}

type WorkspaceTabId =
  | "BRIEF"
  | "TASKS"
  | "LOGISTICS"
  | "EMAILS"
  | "AGENDA"
  | "FILES"
  | "REPORT";

const LIFECYCLE_STATUSES = [
  "IDEA",
  "SUBMITTED",
  "BRIEF_APPROVED",
  "ADMIN_REQUESTS",
  "LOGISTICS_CONFIRMED",
  "APPROVED",
  "LOGISTICS_READY",
  "PROMOTION",
  "LIVE",
  "CLOSED",
  "ON_HOLD",
  "CANCELLED",
];

export function ActivityWorkspaceClient({
  activityId,
  currentUser,
}: ActivityWorkspaceClientProps) {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [activeTab, setActiveTab] = useState<WorkspaceTabId>("BRIEF");
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Status / Action feedback banners
  const [actionBanner, setActionBanner] = useState<{
    type: "SUCCESS" | "ERROR";
    text: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);

  // Brief Form State
  const [briefForm, setBriefForm] = useState<any>(null);

  // Organizing Team Member Add State
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("SPEAKER");

  // Tasks Tab State
  const [taskViewMode, setTaskViewMode] = useState<"PHASE" | "KANBAN">("PHASE");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    phase: "PREPARATION",
    priority: "MEDIUM",
    assigneeId: "",
    dueDate: "",
  });

  const toLocalDateTimeInput = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const fetchWorkspace = useCallback(async () => {
    try {
      const [wsRes, deptRes, memRes] = await Promise.all([
        fetch(`/api/planner/activities/${activityId}`).then((r) => r.json()),
        fetch("/api/departments").then((r) => r.json()),
        fetch("/api/members").then((r) => r.json()),
      ]);

      if (!wsRes.error && wsRes.activity) {
        setWorkspace(wsRes);
        const act = wsRes.activity;
        setBriefForm({
          title: act.title || "",
          description: act.description || "",
          objectives: act.objectives || "",
          deliverablesText: (act.deliverables || []).join("\n"),
          notes: act.notes || "",
          startAt: toLocalDateTimeInput(act.startAt),
          endAt: toLocalDateTimeInput(act.endAt),
          location: act.location || "",
          roomDetails: act.roomDetails || "",
          facilitators: act.facilitators || "",
          expectedAttendance: act.expectedAttendance || 30,
          departmentId: act.departmentId || "",
          audienceScope: act.audienceScope || "CLUB",
          ownerId: act.ownerId || "",
          budgetRequested: act.budgetRequested || 0,
          budgetApproved: act.budgetApproved || 0,
        });
      }
      setDepartments(deptRes.departments || []);
      setMembers(memRes.members || []);
    } catch (e) {
      console.error("Failed to load workspace:", e);
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  if (loading) {
    return (
      <div className="p-12 bg-surface rounded-2xl border border-line text-center text-xs text-ink-soft">
        {isFr
          ? "Chargement de l'espace de travail exécutif..."
          : "Loading executive activity workspace..."}
      </div>
    );
  }

  if (!workspace?.activity) {
    return (
      <div className="p-12 bg-surface rounded-2xl border border-line text-center space-y-3">
        <p className="text-sm font-bold text-ink">
          {isFr ? "Activité introuvable" : "Activity not found"}
        </p>
        <Link
          href="/planner"
          className="inline-flex items-center gap-2 text-xs font-bold text-ast-primary hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {isFr ? "Retour au Planificateur" : "Back to Planner"}
        </Link>
      </div>
    );
  }

  const {
    activity,
    tasks = [],
    requirements = [],
    emails = [],
    agenda = [],
    agendaConflicts = [],
    report,
    comments = [],
    files = [],
    auditLogs = [],
    attendanceStats,
    readiness,
    resourceConflicts = {},
    lookup = {},
    permissions = {},
  } = workspace;

  const canEdit = Boolean(permissions.canEdit);
  const canApproveOrPublish = Boolean(permissions.canApproveOrPublish);
  const isBoard = Boolean(permissions.isBoard);

  // Handlers
  const handleStatusChange = async (
    newStatus: string,
    forceOverride = false
  ) => {
    setActionBanner(null);
    const res = await fetch(`/api/planner/activities/${activity.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, forceOverride }),
    });
    const data = await res.json();
    if (!res.ok) {
      setActionBanner({
        type: "ERROR",
        text: data.error || "Status transition blocked by readiness gate.",
      });
    } else {
      setActionBanner({
        type: "SUCCESS",
        text: isFr
          ? `Statut mis à jour vers ${newStatus}.`
          : `Status updated to ${newStatus}.`,
      });
      fetchWorkspace();
    }
  };

  const handlePublishToCalendar = async (forceOverride = false) => {
    setPublishing(true);
    setActionBanner(null);
    try {
      const res = await fetch(`/api/planner/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "PUBLISH_TO_CALENDAR",
          forceOverride,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setActionBanner({
          type: "ERROR",
          text:
            data.error ||
            (isFr
              ? "Conditions de publication non remplies."
              : "Publication readiness requirements not met."),
        });
      } else {
        setActionBanner({
          type: "SUCCESS",
          text: isFr
            ? "Activité publiée et synchronisée avec le Calendrier Officiel & l'Émargement QR !"
            : "Activity published and synced with Official Club Calendar & QR Attendance!",
        });
        fetchWorkspace();
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveBrief = async () => {
    if (!briefForm) return;
    setSavingBrief(true);
    setActionBanner(null);
    try {
      const deliverables = briefForm.deliverablesText
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/planner/activities/${activity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: briefForm.title,
          description: briefForm.description,
          objectives: briefForm.objectives,
          deliverables,
          notes: briefForm.notes,
          startAt: new Date(briefForm.startAt).toISOString(),
          endAt: new Date(briefForm.endAt).toISOString(),
          location: briefForm.location,
          roomDetails: briefForm.roomDetails,
          facilitators: briefForm.facilitators,
          expectedAttendance: Number(briefForm.expectedAttendance || 30),
          departmentId: briefForm.departmentId || null,
          audienceScope: briefForm.audienceScope,
          ownerId: briefForm.ownerId,
          budgetRequested: Number(briefForm.budgetRequested || 0),
          budgetApproved: Number(briefForm.budgetApproved || 0),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const reschedCount = data.rescheduleSummary?.updatedCount || 0;
        setActionBanner({
          type: "SUCCESS",
          text:
            reschedCount > 0
              ? isFr
                ? `Brief enregistré. ${reschedCount} tâche(s) J-X non terminées ont été automatiquement reprogrammées !`
                : `Brief saved. ${reschedCount} incomplete T-minus task(s) were automatically rescheduled!`
              : isFr
              ? "Brief et paramètres enregistrés avec succès."
              : "Brief and settings saved successfully.",
        });
        fetchWorkspace();
      } else {
        setActionBanner({
          type: "ERROR",
          text: data.error || "Failed to save brief",
        });
      }
    } finally {
      setSavingBrief(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newMemberUserId) return;
    const res = await fetch(`/api/planner/activities/${activity.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: newMemberUserId,
        roleInActivity: newMemberRole,
      }),
    });
    if (res.ok) {
      setNewMemberUserId("");
      fetchWorkspace();
    }
  };

  const handleRemoveTeamMember = async (userId: string) => {
    await fetch(
      `/api/planner/activities/${activity.id}/members?userId=${userId}`,
      { method: "DELETE" }
    );
    fetchWorkspace();
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    const res = await fetch(`/api/planner/activities/${activity.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTask),
    });
    if (res.ok) {
      setNewTask({
        title: "",
        description: "",
        phase: "PREPARATION",
        priority: "MEDIUM",
        assigneeId: "",
        dueDate: "",
      });
      fetchWorkspace();
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    updates: Record<string, any>
  ) => {
    await fetch(`/api/planner/activities/${activity.id}/tasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, ...updates }),
    });
    fetchWorkspace();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(
      `/api/planner/activities/${activity.id}/tasks?taskId=${taskId}`,
      { method: "DELETE" }
    );
    fetchWorkspace();
  };

  const tabs: {
    id: WorkspaceTabId;
    labelFr: string;
    labelEn: string;
    icon: any;
    badge?: string | number;
  }[] = [
    {
      id: "BRIEF",
      labelFr: "1. Vue d'Ensemble & Brief",
      labelEn: "1. Overview & Brief",
      icon: Sparkles,
    },
    {
      id: "TASKS",
      labelFr: "2. Plan d'Action & Tâches",
      labelEn: "2. Action Plan & Tasks",
      icon: Layers,
      badge: `${tasks.filter((t: any) => t.status === "DONE").length}/${
        tasks.length
      }`,
    },
    {
      id: "LOGISTICS",
      labelFr: "3. Logistique & Besoins",
      labelEn: "3. Logistics & Needs",
      icon: Package,
      badge: requirements.length,
    },
    {
      id: "EMAILS",
      labelFr: "4. Emails Administratifs",
      labelEn: "4. Admin Emails",
      icon: Mail,
      badge: emails.length,
    },
    {
      id: "AGENDA",
      labelFr: "5. Déroulé (Agenda)",
      labelEn: "5. Run-of-Show Agenda",
      icon: Clock,
      badge: agenda.length,
    },
    {
      id: "FILES",
      labelFr: "6. Fichiers & Discussion",
      labelEn: "6. Files & Comments",
      icon: FileText,
      badge: files.length + comments.length,
    },
    {
      id: "REPORT",
      labelFr: "7. Rapport & Clôture",
      labelEn: "7. Report & Closure",
      icon: BarChart3,
      badge: report ? "✓" : "!",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Executive Workspace Header */}
      <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link
              href="/planner"
              className="p-2 rounded-xl border border-line bg-surface-alt hover:bg-surface text-ink-soft hover:text-ink transition-colors mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {activity.activityType && (
                  <span
                    className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border"
                    style={{
                      borderColor: activity.activityType.color || "#11606E",
                      color: activity.activityType.color || "#11606E",
                    }}
                  >
                    {isFr
                      ? activity.activityType.nameFr
                      : activity.activityType.name}
                  </span>
                )}
                {activity.department && (
                  <span className="px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-teal-950 text-ast-primary dark:text-ast-light text-[10px] font-mono font-bold">
                    {activity.department.name}
                  </span>
                )}
                <span className="text-xs font-mono text-ink-soft flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-ast-primary" />
                  {formatDate(activity.startAt)}
                </span>
                <span className="text-xs font-mono text-ink-soft flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-ast-primary" />
                  {activity.location}
                </span>
              </div>

              <h1 className="text-xl font-display font-bold text-ink">
                {activity.title}
              </h1>
            </div>
          </div>

          {/* Lifecycle Status Selector & Calendar Publication Handoff */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-ink-soft">
                {isFr ? "Phase :" : "Stage:"}
              </span>
              <select
                disabled={!canEdit}
                value={activity.status}
                onChange={(e) => handleStatusChange(e.target.value, false)}
                className="px-3 py-2 rounded-xl border border-line bg-surface-alt text-xs font-mono font-bold text-ink"
              >
                {LIFECYCLE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {activity.eventId ? (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/calendar"
                  className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isFr ? "Publié au Calendrier" : "Published on Calendar"}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Link
                  href="/attendance"
                  className="px-3 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-ast-primary dark:text-ast-light border border-teal-200 dark:border-teal-800 text-xs font-bold flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  {isFr ? "Présence QR" : "QR Check-In"}
                </Link>
              </div>
            ) : (
              canApproveOrPublish && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={publishing}
                    leftIcon={<ShieldCheck className="w-4 h-4" />}
                    onClick={() => handlePublishToCalendar(false)}
                  >
                    {publishing
                      ? isFr
                        ? "Publication..."
                        : "Publishing..."
                      : isFr
                      ? "Publier au Calendrier Officiel"
                      : "Publish to Club Calendar"}
                  </Button>

                  {isBoard && !readiness?.canPublishToEvents && (
                    <button
                      onClick={() => handlePublishToCalendar(true)}
                      disabled={publishing}
                      className="px-2.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-[11px] font-mono font-bold hover:bg-amber-100 transition-colors"
                      title={
                        isFr
                          ? "Forcer la publication (Dérogation Bureau Exécutif)"
                          : "Force publish (Executive Board override)"
                      }
                    >
                      {isFr ? "Forcer (Bureau)" : "Force Override"}
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {/* Readiness Gate Bar & Actionable Blockers */}
        {readiness && (
          <div className="pt-3 border-t border-line space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-ink">
                  {isFr ? "Indice de Préparation :" : "Readiness Score:"}{" "}
                  <span className="text-ast-primary dark:text-ast-light">
                    {readiness.progressPercent}%
                  </span>
                </span>
                {[
                  {
                    ok: readiness.checklist.briefComplete,
                    labelFr: "Brief",
                    labelEn: "Brief",
                    tab: "BRIEF" as WorkspaceTabId,
                  },
                  {
                    ok: readiness.checklist.tasksReady,
                    labelFr: "Tâches",
                    labelEn: "Tasks",
                    tab: "TASKS" as WorkspaceTabId,
                  },
                  {
                    ok: readiness.checklist.adminEmailsApproved,
                    labelFr: "Emails Admin",
                    labelEn: "Admin Emails",
                    tab: "EMAILS" as WorkspaceTabId,
                  },
                  {
                    ok: readiness.checklist.logisticsConfirmed,
                    labelFr: "Logistique & Salle",
                    labelEn: "Logistics & Space",
                    tab: "LOGISTICS" as WorkspaceTabId,
                  },
                  {
                    ok: readiness.checklist.reportSubmitted,
                    labelFr: "Bilan",
                    labelEn: "Report",
                    tab: "REPORT" as WorkspaceTabId,
                  },
                ].map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTab(item.tab)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
                      item.ok
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                        : "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                    }`}
                  >
                    {item.ok ? "✓" : "•"} {isFr ? item.labelFr : item.labelEn}
                  </button>
                ))}
              </div>

              {readiness.blockers?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {readiness.blockers.map((b: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(b.tab as WorkspaceTabId)}
                      className="text-[11px] font-body text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{isFr ? b.messageFr : b.messageEn}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {actionBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            actionBanner.type === "SUCCESS"
              ? "bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <span>{actionBanner.text}</span>
          <button
            onClick={() => setActionBanner(null)}
            className="text-xs ml-4 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 7-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-line">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs font-body font-bold whitespace-nowrap flex items-center gap-2 border-b-2 transition-all ${
                isActive
                  ? "border-ast-primary text-ast-primary dark:text-ast-light bg-teal-50/50 dark:bg-teal-950/40"
                  : "border-transparent text-ink-soft hover:text-ink hover:bg-surface-alt"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{isFr ? tab.labelFr : tab.labelEn}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-surface-alt border border-line">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & BRIEF */}
      {activeTab === "BRIEF" && briefForm && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Brief Editor (Left 2/3) */}
          <div className="lg:col-span-2 p-6 bg-surface rounded-2xl border border-line shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold text-ink">
                {isFr
                  ? "Cahier des Charges & Paramètres de l'Activité"
                  : "Activity Brief & Core Parameters"}
              </h3>
              {canEdit && (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={savingBrief}
                  onClick={handleSaveBrief}
                >
                  {savingBrief
                    ? isFr
                      ? "Enregistrement..."
                      : "Saving..."
                    : isFr
                    ? "Enregistrer les Modifications"
                    : "Save Brief Changes"}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label={isFr ? "Titre de l'Activité" : "Activity Title"}
                  disabled={!canEdit}
                  value={briefForm.title}
                  onChange={(e) =>
                    setBriefForm({ ...briefForm, title: e.target.value })
                  }
                />
              </div>

              <Input
                type="datetime-local"
                label={
                  isFr
                    ? "Début (Reprogramme automatiquement les tâches J-X)"
                    : "Start Time (Auto-reschedules T-minus tasks)"
                }
                disabled={!canEdit}
                value={briefForm.startAt}
                onChange={(e) =>
                  setBriefForm({ ...briefForm, startAt: e.target.value })
                }
              />

              <Input
                type="datetime-local"
                label={isFr ? "Fin" : "End Time"}
                disabled={!canEdit}
                value={briefForm.endAt}
                onChange={(e) =>
                  setBriefForm({ ...briefForm, endAt: e.target.value })
                }
              />

              <Input
                label={isFr ? "Lieu / Salle" : "Location / Venue"}
                disabled={!canEdit}
                value={briefForm.location}
                onChange={(e) =>
                  setBriefForm({ ...briefForm, location: e.target.value })
                }
              />

              <Input
                label={isFr ? "Intervenants / Formateurs" : "Facilitators / Speakers"}
                disabled={!canEdit}
                value={briefForm.facilitators}
                onChange={(e) =>
                  setBriefForm({ ...briefForm, facilitators: e.target.value })
                }
              />

              <Select
                label={isFr ? "Responsable Principal" : "Lead Organizer"}
                disabled={!canEdit}
                value={briefForm.ownerId}
                onChange={(e) =>
                  setBriefForm({ ...briefForm, ownerId: e.target.value })
                }
              >
                {members.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </Select>

              <Select
                label={isFr ? "Pôle / Département" : "Department"}
                disabled={!canEdit}
                value={briefForm.departmentId}
                onChange={(e) =>
                  setBriefForm({ ...briefForm, departmentId: e.target.value })
                }
              >
                <option value="">
                  {isFr ? "Club Entier" : "Whole Club"}
                </option>
                {departments.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>

              <Input
                type="number"
                label={isFr ? "Participants Attendus" : "Expected Attendance"}
                disabled={!canEdit}
                value={String(briefForm.expectedAttendance)}
                onChange={(e) =>
                  setBriefForm({
                    ...briefForm,
                    expectedAttendance: Number(e.target.value || 0),
                  })
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  label={isFr ? "Budget Demandé" : "Budget Req."}
                  disabled={!canEdit}
                  value={String(briefForm.budgetRequested)}
                  onChange={(e) =>
                    setBriefForm({
                      ...briefForm,
                      budgetRequested: Number(e.target.value || 0),
                    })
                  }
                />
                <Input
                  type="number"
                  label={isFr ? "Budget Approuvé" : "Budget Appr."}
                  disabled={!isBoard}
                  value={String(briefForm.budgetApproved)}
                  onChange={(e) =>
                    setBriefForm({
                      ...briefForm,
                      budgetApproved: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
            </div>

            <Textarea
              label={isFr ? "Description & Contexte" : "Description & Context"}
              disabled={!canEdit}
              value={briefForm.description}
              onChange={(e) =>
                setBriefForm({ ...briefForm, description: e.target.value })
              }
            />

            <Textarea
              label={isFr ? "Objectifs Pédagogiques" : "Objectives"}
              disabled={!canEdit}
              value={briefForm.objectives}
              onChange={(e) =>
                setBriefForm({ ...briefForm, objectives: e.target.value })
              }
            />

            <Textarea
              label={
                isFr
                  ? "Livrables Attendus (un par ligne)"
                  : "Deliverables (one per line)"
              }
              disabled={!canEdit}
              value={briefForm.deliverablesText}
              onChange={(e) =>
                setBriefForm({
                  ...briefForm,
                  deliverablesText: e.target.value,
                })
              }
            />
          </div>

          {/* Right 1/3: Organizing Team & Audit Trail */}
          <div className="space-y-5">
            <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-ast-primary" />
                {isFr
                  ? `Équipe d'Organisation (${(activity.members || []).length})`
                  : `Organizing Team (${(activity.members || []).length})`}
              </h3>

              <div className="space-y-2">
                {(activity.members || []).map((m: any) => (
                  <div
                    key={m.userId}
                    className="p-2.5 rounded-xl bg-surface-alt border border-line flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        name={m.user?.name || "Member"}
                        src={m.user?.avatarUrl}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">
                          {m.user?.name}
                        </p>
                        <span className="text-[10px] font-mono text-ast-primary">
                          {m.roleInActivity}
                        </span>
                      </div>
                    </div>
                    {canEdit && m.userId !== activity.ownerId && (
                      <button
                        onClick={() => handleRemoveTeamMember(m.userId)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEdit && (
                <div className="pt-3 border-t border-line space-y-2">
                  <Select
                    value={newMemberUserId}
                    onChange={(e) => setNewMemberUserId(e.target.value)}
                  >
                    <option value="">
                      {isFr ? "— Ajouter un membre —" : "— Add member —"}
                    </option>
                    {members.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </Select>
                  <div className="flex items-center gap-2">
                    <Select
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                    >
                      <option value="CO_LEAD">CO_LEAD</option>
                      <option value="SPEAKER">SPEAKER</option>
                      <option value="LOGISTICS">LOGISTICS</option>
                      <option value="COMMS">COMMS</option>
                      <option value="MODERATOR">MODERATOR</option>
                    </Select>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleAddTeamMember}
                    >
                      {isFr ? "Ajouter" : "Add"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Audit Trail */}
            <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink">
                {isFr ? "Journal d'Audit" : "Activity Audit Trail"}
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {auditLogs.slice(0, 12).map((log: any) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-surface-alt border border-line/70 text-[11px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[10px] text-ast-primary">
                      <span>{log.action}</span>
                      <span>{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-ink-soft">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTION PLAN & TASKS */}
      {activeTab === "TASKS" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-xl border border-line bg-surface p-1">
              <button
                onClick={() => setTaskViewMode("PHASE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskViewMode === "PHASE"
                    ? "bg-ast-primary text-white"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {isFr ? "Liste par Phase (J-X)" : "Phase Checklist (T-Minus)"}
              </button>
              <button
                onClick={() => setTaskViewMode("KANBAN")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskViewMode === "KANBAN"
                    ? "bg-ast-primary text-white"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {isFr ? "Vue Kanban 4 Colonnes" : "4-Column Kanban"}
              </button>
            </div>

            <Link
              href="/tasks"
              className="text-xs font-mono font-bold text-ast-primary hover:underline flex items-center gap-1"
            >
              {isFr
                ? "Voir dans le Tableau Kanban Global"
                : "Open in Global Club Kanban"}
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {taskViewMode === "PHASE" ? (
            <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
              {tasks.length === 0 ? (
                <p className="text-xs text-ink-soft py-6 text-center">
                  {isFr ? "Aucune tâche planifiée." : "No tasks scheduled."}
                </p>
              ) : (
                tasks.map((t: any) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-surface-alt border border-line flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {typeof t.offsetDays === "number" && (
                          <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-ast-primary text-[10px] font-mono font-bold">
                            {t.offsetDays >= 0
                              ? `J+${t.offsetDays}`
                              : `J${t.offsetDays}`}
                          </span>
                        )}
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-line">
                          {t.phase || "PREPARATION"}
                        </span>
                        {t.wasShifted && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                            {isFr ? "Vendredi (Week-end évité)" : "Friday Shift"}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold ${
                            t.status === "DONE"
                              ? "line-through text-ink-faint"
                              : "text-ink"
                          }`}
                        >
                          {t.title}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-[11px] text-ink-soft">
                          {t.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {t.dueDate && (
                        <span className="text-[11px] font-mono text-ink-soft">
                          {formatDate(t.dueDate)}
                        </span>
                      )}

                      <select
                        disabled={!canEdit && t.assigneeId !== currentUser?.id}
                        value={t.assigneeId || ""}
                        onChange={(e) =>
                          handleUpdateTask(t.id, {
                            assigneeId: e.target.value || null,
                          })
                        }
                        className="px-2 py-1 rounded-lg border border-line bg-surface text-xs font-body text-ink max-w-[150px]"
                      >
                        <option value="">Unassigned</option>
                        {members.map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>

                      <select
                        disabled={!canEdit && t.assigneeId !== currentUser?.id}
                        value={t.status}
                        onChange={(e) =>
                          handleUpdateTask(t.id, { status: e.target.value })
                        }
                        className="px-2.5 py-1 rounded-lg border border-line bg-surface text-xs font-mono font-bold text-ink"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="REVIEW">REVIEW</option>
                        <option value="DONE">DONE ✓</option>
                      </select>

                      {canEdit && (
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}

              {/* Add Task Form */}
              {canEdit && (
                <div className="pt-4 border-t border-line space-y-3">
                  <h4 className="text-xs font-display font-bold uppercase text-ink-soft">
                    {isFr ? "Ajouter une Tâche au Plan d'Action" : "Add Task to Action Plan"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    <div className="lg:col-span-2">
                      <Input
                        placeholder={isFr ? "Titre de la tâche *" : "Task title *"}
                        value={newTask.title}
                        onChange={(e) =>
                          setNewTask({ ...newTask, title: e.target.value })
                        }
                      />
                    </div>
                    <Select
                      value={newTask.phase}
                      onChange={(e) =>
                        setNewTask({ ...newTask, phase: e.target.value })
                      }
                    >
                      <option value="PREPARATION">PREPARATION</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="LOGISTICS">LOGISTICS</option>
                      <option value="PROMOTION">PROMOTION</option>
                      <option value="EXECUTION">EXECUTION</option>
                      <option value="CLOSURE">CLOSURE</option>
                    </Select>
                    <Select
                      value={newTask.assigneeId}
                      onChange={(e) =>
                        setNewTask({ ...newTask, assigneeId: e.target.value })
                      }
                    >
                      <option value="">
                        {isFr ? "— Responsable —" : "— Assignee —"}
                      </option>
                      {members.map((m: any) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleCreateTask}
                    >
                      {isFr ? "Créer la Tâche" : "Create Task"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 4-COLUMN KANBAN VIEW */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {(["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const).map(
                (col) => {
                  const colTasks = tasks.filter((t: any) => t.status === col);
                  return (
                    <div
                      key={col}
                      className="p-4 rounded-2xl bg-surface border border-line space-y-3 min-h-[320px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-display font-bold text-ink">
                          {col}
                        </span>
                        <span className="text-xs font-mono text-ink-soft">
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="space-y-2.5">
                        {colTasks.map((t: any) => (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl bg-surface-alt border border-line space-y-2"
                          >
                            <p className="text-xs font-bold text-ink">
                              {t.title}
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-mono text-ink-soft">
                              <span>{t.phase}</span>
                              <select
                                value={t.status}
                                onChange={(e) =>
                                  handleUpdateTask(t.id, {
                                    status: e.target.value,
                                  })
                                }
                                className="bg-surface border border-line rounded px-1.5 py-0.5 text-[10px]"
                              >
                                <option value="TODO">TODO</option>
                                <option value="IN_PROGRESS">IN_PROGRESS</option>
                                <option value="REVIEW">REVIEW</option>
                                <option value="DONE">DONE</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LOGISTICS & REQUIREMENTS */}
      {activeTab === "LOGISTICS" && (
        <LogisticsTab
          isFr={isFr}
          activity={activity}
          requirements={requirements}
          resources={lookup.resources || []}
          resourceConflicts={resourceConflicts}
          members={members}
          canEdit={canEdit}
          onRefresh={fetchWorkspace}
        />
      )}

      {/* TAB 4: COMMUNICATIONS & ADMIN EMAILS */}
      {activeTab === "EMAILS" && (
        <EmailsTab
          isFr={isFr}
          activity={activity}
          emails={emails}
          emailTemplates={lookup.emailTemplates || []}
          adminContacts={lookup.adminContacts || []}
          canEdit={canEdit}
          onRefresh={fetchWorkspace}
        />
      )}

      {/* TAB 5: AGENDA & RUN-OF-SHOW */}
      {activeTab === "AGENDA" && (
        <AgendaTab
          isFr={isFr}
          activity={activity}
          agenda={agenda}
          agendaConflicts={agendaConflicts}
          members={members}
          canEdit={canEdit}
          onRefresh={fetchWorkspace}
        />
      )}

      {/* TAB 6: FILES & COMMENTS */}
      {activeTab === "FILES" && (
        <FilesAndCommentsTab
          isFr={isFr}
          activity={activity}
          files={files}
          comments={comments}
          canEdit={canEdit}
          onRefresh={fetchWorkspace}
        />
      )}

      {/* TAB 7: REPORT & CLOSURE */}
      {activeTab === "REPORT" && (
        <ReportAndClosureTab
          isFr={isFr}
          activity={activity}
          report={report}
          attendanceStats={attendanceStats}
          canEdit={canEdit}
          onRefresh={fetchWorkspace}
        />
      )}
    </div>
  );
}
