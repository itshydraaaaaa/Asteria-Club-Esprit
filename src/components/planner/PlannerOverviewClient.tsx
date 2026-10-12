"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Calendar as CalendarIcon,
  Compass,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  Package,
  FileText,
  ArrowRight,
  Search,
  Settings,
  BellRing,
  Sparkles,
  MapPin,
  Users,
  Layers,
  ExternalLink,
  RefreshCw,
  Trash2,
  Award,
} from "lucide-react";

interface PlannerOverviewClientProps {
  currentUser: any;
}

const STATUS_META: Record<
  string,
  { labelFr: string; labelEn: string; colorClass: string }
> = {
  IDEA: {
    labelFr: "Idée / Brouillon",
    labelEn: "Idea / Draft",
    colorClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  SUBMITTED: {
    labelFr: "Soumis",
    labelEn: "Submitted",
    colorClass:
      "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
  },
  BRIEF_APPROVED: {
    labelFr: "Brief Validé",
    labelEn: "Brief Approved",
    colorClass:
      "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
  },
  ADMIN_REQUESTS: {
    labelFr: "Demandes Admin",
    labelEn: "Admin Requests",
    colorClass:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  LOGISTICS_CONFIRMED: {
    labelFr: "Logistique Confirmée",
    labelEn: "Logistics Confirmed",
    colorClass:
      "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
  },
  APPROVED: {
    labelFr: "Approuvé (Bureau)",
    labelEn: "Board Approved",
    colorClass:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  LOGISTICS_READY: {
    labelFr: "Logistique Prête",
    labelEn: "Logistics Ready",
    colorClass:
      "bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
  },
  PROMOTION: {
    labelFr: "En Promotion",
    labelEn: "In Promotion",
    colorClass:
      "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  },
  LIVE: {
    labelFr: "En Cours (Live)",
    labelEn: "Live Now",
    colorClass:
      "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700 animate-pulse",
  },
  CLOSED: {
    labelFr: "Clôturé",
    labelEn: "Closed",
    colorClass:
      "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200 dark:border-emerald-700",
  },
  ON_HOLD: {
    labelFr: "En Pause",
    labelEn: "On Hold",
    colorClass:
      "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800",
  },
  CANCELLED: {
    labelFr: "Annulé",
    labelEn: "Cancelled",
    colorClass:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
  },
};

export function PlannerOverviewClient({ currentUser }: PlannerOverviewClientProps) {
  const { language } = useLanguage();
  const isFr = language === "fr";
  const isBoard =
    currentUser?.role === "PRESIDENT" ||
    currentUser?.role === "VICE_PRESIDENT" ||
    currentUser?.role === "BOARD";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    activities: [],
    activityTypes: [],
    templates: [],
    resources: [],
    adminContacts: [],
    emailTemplates: [],
    settings: {},
    myTasks: [],
    metrics: {
      totalActivities: 0,
      upcomingCount: 0,
      liveCount: 0,
      pendingApprovalsCount: 0,
      attentionCount: 0,
      closedCount: 0,
      statusCounts: {},
    },
  });

  const [departments, setDepartments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Governance Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [cronRunning, setCronRunning] = useState(false);
  const [cronResultMsg, setCronResultMsg] = useState<string | null>(null);

  // New Admin Contact / Resource form inside Settings Modal
  const [newContact, setNewContact] = useState({
    officeName: "",
    officeCategory: "ROOMS",
    recipientName: "",
    email: "",
    notes: "",
  });
  const [newResource, setNewResource] = useState({
    name: "",
    category: "EQUIPMENT",
    totalQuantity: 1,
    location: "Campus ESPRIT",
    notes: "",
  });

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, deptRes] = await Promise.all([
        fetch("/api/planner/overview").then((r) => r.json()),
        fetch("/api/departments").then((r) => r.json()),
      ]);
      if (!overviewRes.error) {
        setData(overviewRes);
      }
      setDepartments(deptRes.departments || []);
    } catch (e) {
      console.error("Failed to fetch planner overview:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleRunCronCheck = async () => {
    setCronRunning(true);
    setCronResultMsg(null);
    try {
      const res = await fetch("/api/planner/cron", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setCronResultMsg(
          isFr
            ? `Vérification terminée : ${json.dispatchedCount || 0} notification(s) envoyée(s).`
            : `Check complete: ${json.dispatchedCount || 0} notification(s) dispatched.`
        );
      }
    } catch {
      // ignore
    } finally {
      setCronRunning(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.officeName || !newContact.email) return;
    const res = await fetch("/api/planner/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "ADMIN_CONTACT", payload: newContact }),
    });
    if (res.ok) {
      setNewContact({
        officeName: "",
        officeCategory: "ROOMS",
        recipientName: "",
        email: "",
        notes: "",
      });
      fetchOverview();
    }
  };

  const handleAddResource = async () => {
    if (!newResource.name) return;
    const res = await fetch("/api/planner/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity: "RESOURCE", payload: newResource }),
    });
    if (res.ok) {
      setNewResource({
        name: "",
        category: "EQUIPMENT",
        totalQuantity: 1,
        location: "Campus ESPRIT",
        notes: "",
      });
      fetchOverview();
    }
  };

  const filteredActivities = (data.activities || []).filter((act: any) => {
    if (statusFilter !== "ALL" && act.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && act.activityTypeId !== typeFilter) return false;
    if (deptFilter !== "ALL" && act.departmentId !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title?.toLowerCase().includes(q);
      const matchLoc = act.location?.toLowerCase().includes(q);
      const matchOwner = act.owner?.name?.toLowerCase().includes(q);
      if (!matchTitle && !matchLoc && !matchOwner) return false;
    }
    return true;
  });

  const attentionActivities = (data.activities || []).filter(
    (act: any) => act.attentionFlags && act.attentionFlags.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="p-5 bg-gradient-to-r from-[#0A3A40] via-[#0E4D56] to-[#11606E] rounded-2xl text-white shadow-lg border border-teal-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-400/20 border border-teal-300/30 text-teal-200 text-[11px] font-mono uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            {isFr ? "Centre de Commande Exécutif" : "Executive Command Center"}
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight">
            {isFr
              ? "Planificateur d'Activités & Projets"
              : "Executive Activity & Project Planner"}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/85 font-body max-w-2xl">
            {isFr
              ? "Pilotez chaque événement, formation et session de A à Z : Overview, Tasks, Files, Emails, Logistics et Reports."
              : "Manage every club event, workshop, and session end-to-end: Overview, Tasks, Files, Emails, Logistics, and Reports."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Link
            href="/planner/activities/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-body bg-[#E5A93C] hover:bg-[#d6982b] text-[#0A3A40] shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            {isFr ? "Nouvelle Activité" : "New Activity"}
          </Link>

          <Link
            href="/planner/calendar"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-body bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
          >
            <CalendarIcon className="w-4 h-4 text-teal-300" />
            {isFr ? "Calendrier Exécutif" : "Planner Calendar"}
          </Link>

          {isBoard && (
            <>
              <button
                onClick={handleRunCronCheck}
                disabled={cronRunning}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-body bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all disabled:opacity-50"
                title={
                  isFr
                    ? "Envoyer les rappels d'échéances et de rapports"
                    : "Dispatch deadline and report reminders"
                }
              >
                <BellRing className="w-3.5 h-3.5 text-amber-300" />
                {cronRunning
                  ? isFr
                    ? "Analyse..."
                    : "Checking..."
                  : isFr
                  ? "Relances Auto"
                  : "Run Reminders"}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold font-body bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              >
                <Settings className="w-3.5 h-3.5 text-teal-200" />
                {isFr ? "Contacts & Ressources" : "Contacts & Resources"}
              </button>
            </>
          )}
        </div>
      </div>

      {cronResultMsg && (
        <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-xs font-semibold text-ast-primary dark:text-ast-light flex items-center justify-between">
          <span>{cronResultMsg}</span>
          <button
            onClick={() => setCronResultMsg(null)}
            className="text-ink-soft hover:text-ink text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* 5 Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft block">
            {isFr ? "Total Projets" : "Total Activities"}
          </span>
          <p className="text-2xl font-display font-bold text-ink mt-1">
            {data.metrics?.totalActivities || 0}
          </p>
          <span className="text-[11px] text-ink-faint font-body">
            {isFr ? "Toutes phases confondues" : "Across all lifecycle stages"}
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
            {isFr ? "À Venir" : "Upcoming"}
          </span>
          <p className="text-2xl font-display font-bold text-ast-primary dark:text-ast-light mt-1">
            {data.metrics?.upcomingCount || 0}
          </p>
          <span className="text-[11px] text-ink-faint font-body">
            {isFr ? "En préparation ou publiés" : "In preparation or published"}
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            {isFr ? "En Validation" : "In Preparation / Review"}
          </span>
          <p className="text-2xl font-display font-bold text-amber-600 dark:text-amber-400 mt-1">
            {data.metrics?.pendingApprovalsCount || 0}
          </p>
          <span className="text-[11px] text-ink-faint font-body">
            {isFr ? "Avant publication" : "Awaiting final approval"}
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-sm">
          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {isFr ? "Attention Requise" : "Attention Needed"}
          </span>
          <p className="text-2xl font-display font-bold text-rose-600 dark:text-rose-400 mt-1">
            {data.metrics?.attentionCount || 0}
          </p>
          <span className="text-[11px] text-ink-faint font-body">
            {isFr ? "Retards, emails ou salle" : "Overdue tasks, emails or space"}
          </span>
        </div>

        <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
            {isFr ? "Clôturés & Archivés" : "Completed & Closed"}
          </span>
          <p className="text-2xl font-display font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {data.metrics?.closedCount || 0}
          </p>
          <span className="text-[11px] text-ink-faint font-body">
            {isFr ? "Avec bilan post-activité" : "With post-activity report"}
          </span>
        </div>
      </div>

      {/* Attention Needed Alert Panel */}
      {attentionActivities.length > 0 && (
        <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-800/70 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {isFr
                ? `Points d'Attention Exécutifs (${attentionActivities.length})`
                : `Executive Attention Flags (${attentionActivities.length})`}
            </h3>
            <span className="text-[11px] font-mono text-amber-800/80 dark:text-amber-300/80">
              {isFr ? "Action immédiate recommandée" : "Immediate action recommended"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {attentionActivities.slice(0, 6).map((act: any) => (
              <div
                key={act.id}
                className="p-3 bg-white dark:bg-[#06252a] rounded-xl border border-amber-200 dark:border-amber-800/60 flex items-start justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <Link
                    href={`/planner/activities/${act.id}`}
                    className="font-body font-bold text-xs text-ink dark:text-white hover:text-ast-primary dark:hover:text-ast-light truncate block"
                  >
                    {act.title}
                  </Link>
                  <div className="space-y-0.5">
                    {act.attentionFlags.map((flag: any, idx: number) => (
                      <p
                        key={idx}
                        className={`text-[11px] font-body flex items-center gap-1.5 ${
                          flag.severity === "CRITICAL"
                            ? "text-rose-600 dark:text-rose-400 font-semibold"
                            : "text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        <span>•</span>
                        <span>{isFr ? flag.messageFr : flag.messageEn}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <Link
                  href={`/planner/activities/${act.id}`}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-[11px] font-bold font-body whitespace-nowrap hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  {isFr ? "Résoudre" : "Resolve"}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isFr
                  ? "Rechercher par titre, salle, responsable..."
                  : "Search by title, room, owner..."
              }
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-line bg-surface-alt text-xs font-body text-ink focus:outline-none focus:ring-2 focus:ring-ast-primary"
            />
          </div>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-44 text-xs py-2"
          >
            <option value="ALL">
              {isFr ? "Tous les Statuts" : "All Lifecycle Stages"}
            </option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {isFr ? meta.labelFr : meta.labelEn}
              </option>
            ))}
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-44 text-xs py-2"
          >
            <option value="ALL">
              {isFr ? "Tous les Types" : "All Activity Types"}
            </option>
            {(data.activityTypes || []).map((t: any) => (
              <option key={t.id} value={t.id}>
                {isFr ? t.nameFr : t.name}
              </option>
            ))}
          </Select>

          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-44 text-xs py-2"
          >
            <option value="ALL">
              {isFr ? "Tous les Pôles" : "All Departments"}
            </option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>

        <button
          onClick={fetchOverview}
          className="px-3 py-2 rounded-xl border border-line bg-surface-alt hover:bg-surface text-xs font-semibold text-ink-soft hover:text-ink flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {isFr ? "Actualiser" : "Refresh"}
        </button>
      </div>

      {/* Main Content Grid: Activities List (Left 2/3) + My Assigned Activity Tasks (Right 1/3) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Activities List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-ink">
              {isFr
                ? `Projets & Activités (${filteredActivities.length})`
                : `Activities & Projects (${filteredActivities.length})`}
            </h3>
            <Link
              href="/planner/activities/new"
              className="text-xs font-bold text-ast-primary dark:text-ast-light hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {isFr ? "Créer avec Assistant J-X" : "Create with Backward-Schedule Wizard"}
            </Link>
          </div>

          {loading ? (
            <div className="p-12 bg-surface rounded-2xl border border-line text-center text-xs text-ink-soft font-body">
              {isFr
                ? "Chargement des projets et calculs d'état de préparation..."
                : "Loading activities and readiness gates..."}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 bg-surface rounded-2xl border border-dashed border-line text-center space-y-3">
              <Compass className="w-10 h-10 text-ast-primary/50 mx-auto" />
              <h4 className="font-display font-bold text-sm text-ink">
                {isFr ? "Aucune activité trouvée" : "No activities found"}
              </h4>
              <p className="text-xs text-ink-soft font-body max-w-md mx-auto">
                {isFr
                  ? "Lancez votre première activité avec génération automatique des tâches J-21 à J+2, demandes administratives ESPRIT et réservations logistiques."
                  : "Launch your first activity with automated T-21 to T+2 task scheduling, ESPRIT admin email drafts, and logistics tracking."}
              </p>
              <div>
                <Link
                  href="/planner/activities/new"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-ast-primary text-white hover:bg-teal-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {isFr ? "Créer une Activité" : "Create Activity"}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredActivities.map((act: any) => {
                const statusInfo = STATUS_META[act.status] || STATUS_META.IDEA;
                const progress = act.readiness?.progressPercent ?? 0;

                return (
                  <div
                    key={act.id}
                    className="p-5 bg-surface rounded-2xl border border-line hover:border-ast-primary/50 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    {/* Top Row: Type badge, Status badge, Publication indicator */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {act.activityType && (
                          <span
                            className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase border"
                            style={{
                              borderColor: act.activityType.color || "#11606E",
                              color: act.activityType.color || "#11606E",
                            }}
                          >
                            {isFr
                              ? act.activityType.nameFr
                              : act.activityType.name}
                          </span>
                        )}

                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${statusInfo.colorClass}`}
                        >
                          {isFr ? statusInfo.labelFr : statusInfo.labelEn}
                        </span>

                        {act.eventId ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {isFr ? "Publié au Calendrier" : "Published to Calendar"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-ink-soft bg-surface-alt border border-line">
                            {isFr ? "En Préparation Interne" : "Internal Preparation"}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-mono text-ink-soft flex items-center gap-1.5">
                        <CalendarIcon className="w-3.5 h-3.5 text-ast-primary" />
                        <span>{formatDate(act.startAt)}</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <Link
                          href={`/planner/activities/${act.id}`}
                          className="text-base font-display font-bold text-ink hover:text-ast-primary dark:hover:text-ast-light transition-colors block truncate"
                        >
                          {act.title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft font-body">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-ast-primary/70" />
                            {act.location || "Campus ESPRIT"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-ast-primary/70" />
                            {act.expectedAttendance} {isFr ? "attendus" : "expected"}
                          </span>
                          {act.department && (
                            <span className="px-2 py-0.5 rounded bg-teal-50/80 dark:bg-teal-950/60 text-ast-primary dark:text-ast-light text-[10px] font-mono font-bold">
                              {act.department.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/planner/activities/${act.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-body bg-ast-primary text-white hover:bg-teal-800 transition-colors"
                        >
                          {isFr ? "Ouvrir le Projet" : "Open Project"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = window.confirm(
                              isFr
                                ? `Voulez-vous vraiment supprimer l'activité "${act.title}" ?`
                                : `Are you sure you want to delete activity "${act.title}"?`
                            );
                            if (!ok) return;
                            const res = await fetch(
                              `/api/planner/activities/${act.id}`,
                              { method: "DELETE" }
                            );
                            if (res.ok) {
                              fetchOverview();
                            } else {
                              const err = await res.json().catch(() => ({}));
                              alert(
                                err.error ||
                                  (isFr
                                    ? "Impossible de supprimer cette activité."
                                    : "Failed to delete activity.")
                              );
                            }
                          }}
                          title={
                            isFr ? "Supprimer cette activité" : "Delete activity"
                          }
                          className="p-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/70 dark:bg-rose-950/50 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/70 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* 6 Workspace Sections: (Overview, Tasks, Files, Emails, Logistics, Reports) */}
                    <div className="pt-3 border-t border-line/70 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-body">
                        <Link
                          href={`/planner/activities/${act.id}?tab=BRIEF`}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-line text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-ast-primary shrink-0" />
                          <span>Overview:</span>
                          <strong className="text-ink">{progress}%</strong>
                        </Link>

                        <Link
                          href={`/planner/activities/${act.id}?tab=TASKS`}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-line text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>Tasks:</span>
                          <strong className="text-ink">
                            {act.stats?.completedTasks || 0}/
                            {act.stats?.totalTasks || 0}
                          </strong>
                        </Link>

                        <Link
                          href={`/planner/activities/${act.id}?tab=FILES`}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-line text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          <span>Files:</span>
                          <strong className="text-ink">
                            {act.stats?.totalFiles || 0}
                          </strong>
                        </Link>

                        <Link
                          href={`/planner/activities/${act.id}?tab=EMAILS`}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-line text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Emails:</span>
                          <strong className="text-ink">
                            {act.stats?.approvedEmails || 0}/
                            {act.stats?.totalEmails || 0}
                          </strong>
                        </Link>

                        <Link
                          href={`/planner/activities/${act.id}?tab=LOGISTICS`}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-line text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <Package className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Logistics:</span>
                          <strong className="text-ink">
                            {act.stats?.fulfilledRequirements || 0}/
                            {act.stats?.totalRequirements || 0}
                          </strong>
                        </Link>

                        <Link
                          href={`/planner/activities/${act.id}?tab=REPORT`}
                          className="px-2.5 py-1 rounded-lg bg-surface-alt hover:bg-teal-50/70 dark:hover:bg-teal-950/50 border border-line text-ink-soft hover:text-ink flex items-center gap-1.5 transition-colors"
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Reports:</span>
                          <strong className="text-ink">
                            {act.stats?.hasReport ? "✓" : "•"}
                          </strong>
                        </Link>
                      </div>

                      {act.owner && (
                        <div
                          className="flex items-center gap-1.5"
                          title={act.owner.name}
                        >
                          <Avatar
                            name={act.owner.name}
                            src={act.owner.avatarUrl}
                            size="xs"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: My Assigned Activity Tasks & Quick Lifecycle Summary */}
        <div className="space-y-5">
          <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-ast-primary" />
                {isFr ? "Mes Tâches d'Activités" : "My Activity Tasks"}
              </h3>
              <span className="text-[11px] font-mono text-ink-soft">
                {(data.myTasks || []).length}
              </span>
            </div>

            {(data.myTasks || []).length === 0 ? (
              <p className="text-xs text-ink-soft font-body py-4 text-center border border-dashed border-line rounded-xl">
                {isFr
                  ? "Aucune tâche d'activité ne vous est assignée pour le moment."
                  : "No activity tasks currently assigned to you."}
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {(data.myTasks || []).slice(0, 10).map((t: any) => (
                  <Link
                    key={t.id}
                    href={`/planner/activities/${t.activityId}`}
                    className="block p-3 rounded-xl bg-surface-alt hover:bg-teal-50/50 dark:hover:bg-teal-950/40 border border-line transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-100/80 dark:bg-teal-900/60 text-ast-primary dark:text-ast-light">
                        {t.phase || "PREPARATION"}
                      </span>
                      <span className="text-[10px] font-mono text-ink-soft">
                        {t.status}
                      </span>
                    </div>
                    <p className="text-xs font-bold font-body text-ink line-clamp-1">
                      {t.title}
                    </p>
                    {t.dueDate && (
                      <p className="text-[11px] font-mono text-ink-faint">
                        {isFr ? "Échéance :" : "Due:"} {formatDate(t.dueDate)}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Campus Resources Summary Card */}
          <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Package className="w-4 h-4 text-ast-primary" />
                {isFr ? "Ressources & Salles ESPRIT" : "ESPRIT Campus Resources"}
              </h3>
              <span className="text-[11px] font-mono text-ink-soft">
                {(data.resources || []).length} {isFr ? "actives" : "active"}
              </span>
            </div>

            <div className="space-y-2">
              {(data.resources || []).slice(0, 6).map((res: any) => (
                <div
                  key={res.id}
                  className="p-2.5 rounded-xl bg-surface-alt border border-line/70 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-bold text-ink font-body">{res.name}</p>
                    <p className="text-[10px] text-ink-soft font-mono">
                      {res.category} · {res.location}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-surface border border-line font-mono text-[11px] font-bold text-ast-primary">
                    x{res.totalQuantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Official ESPRIT Administrative Process & 7 Golden Rules Card */}
          <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ast-primary flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              {isFr
                ? "Processus Officiel ESPRIT (M. Zied Saidi)"
                : "Official ESPRIT Procedure (M. Zied Saidi)"}
            </h3>
            <ol className="space-y-1.5 text-[11px] text-ink-soft font-body list-decimal list-inside">
              <li>
                <strong className="text-ink">Vie Estudiantine (J-7) :</strong>{" "}
                <span className="font-mono">zied.saidi@esprit.tn</span> (Tél:
                92234330)
              </li>
              <li>
                <strong className="text-ink">Scolarité / Salles (J-10) :</strong>{" "}
                <span className="font-mono">mohamedali.bouakline@Esprit.tn</span>
              </li>
              <li>
                <strong className="text-ink">Matériel & Sono (J-10) :</strong>{" "}
                <span className="font-mono">faycal.lbabda@esprit.tn</span>
              </li>
              <li>
                <strong className="text-ink">Logistique (J-10) :</strong>{" "}
                <span className="font-mono">hazem.hajji@esprit.tn</span>
              </li>
              <li>
                <strong className="text-ink">Promotion :</strong>{" "}
                <span className="font-mono">Nadia.ajailia@Esprit.tn</span>
              </li>
              <li>
                <strong className="text-ink">Achats & BC :</strong>{" "}
                <span className="font-mono">souhail.mezzi@esprit.tn</span>
              </li>
            </ol>
            <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <p>
                • <strong>CC souhaité dans tous les mails :</strong>{" "}
                <span className="font-mono">
                  zied.saidi@esprit.tn, faycal.lbabda@esprit.tn
                </span>
              </p>
              <p>
                • <strong>Devis au nom d’Esprit :</strong> MF{" "}
                <span className="font-mono font-bold">830 823 C PM 000</span>
              </p>
              <p>
                • <strong>Post-évent (≤ 3j) :</strong> Rapport d’action + rapport
                de collecte + facture originale cachetée.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Governance Settings, Admin Contacts & Resources Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={
          isFr
            ? "Contacts Administratifs ESPRIT & Inventaire Logistique"
            : "ESPRIT Admin Contacts & Logistics Inventory"
        }
        maxWidth="xl"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Admin Contacts Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-ast-primary">
              {isFr
                ? "Bureaux Administratifs ESPRIT (Destinataires Emails)"
                : "ESPRIT Administrative Offices (Email Recipients)"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(data.adminContacts || []).map((c: any) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl bg-surface-alt border border-line text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-ink">{c.officeName}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-ast-primary">
                      {c.officeCategory}
                    </span>
                  </div>
                  <p className="font-mono text-[11px] text-ink-soft">{c.email}</p>
                  {c.recipientName && (
                    <p className="text-[11px] text-ink-faint">{c.recipientName}</p>
                  )}
                </div>
              ))}
            </div>

            {isBoard && (
              <div className="p-3.5 rounded-xl bg-surface border border-line space-y-3">
                <p className="text-xs font-bold text-ink">
                  {isFr ? "Ajouter un Contact Administratif" : "Add Admin Contact"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Input
                    placeholder={isFr ? "Nom du Bureau (ex: Service Salles)" : "Office Name"}
                    value={newContact.officeName}
                    onChange={(e) =>
                      setNewContact({ ...newContact, officeName: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Email (ex: salles@esprit.tn)"
                    value={newContact.email}
                    onChange={(e) =>
                      setNewContact({ ...newContact, email: e.target.value })
                    }
                  />
                  <Select
                    value={newContact.officeCategory}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        officeCategory: e.target.value,
                      })
                    }
                  >
                    <option value="ROOMS">ROOMS (Salles & Amphis)</option>
                    <option value="EQUIPMENT">EQUIPMENT (Matériel & Son)</option>
                    <option value="SECURITY">SECURITY (Sécurité & Accès)</option>
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="BUDGET_SPONSOR">BUDGET_SPONSOR</option>
                    <option value="GENERAL_ADMIN">GENERAL_ADMIN (Direction Vie Étudiante)</option>
                  </Select>
                  <Input
                    placeholder={isFr ? "Destinataire (ex: M. le Responsable)" : "Recipient Name"}
                    value={newContact.recipientName}
                    onChange={(e) =>
                      setNewContact({
                        ...newContact,
                        recipientName: e.target.value,
                      })
                    }
                  />
                </div>
                <Button size="sm" variant="primary" onClick={handleAddContact}>
                  {isFr ? "Enregistrer Contact" : "Save Contact"}
                </Button>
              </div>
            )}
          </div>

          {/* Campus Resources Section */}
          <div className="space-y-3 pt-4 border-t border-line">
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-ast-primary">
              {isFr
                ? "Catalogue des Ressources & Salles Réservables"
                : "Bookable Resources & Rooms Catalog"}
            </h4>
            {isBoard && (
              <div className="p-3.5 rounded-xl bg-surface border border-line space-y-3">
                <p className="text-xs font-bold text-ink">
                  {isFr ? "Ajouter une Ressource ou Salle" : "Add Resource or Room"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <Input
                    placeholder={isFr ? "Nom (ex: Amphi B / Kit Micro)" : "Resource Name"}
                    value={newResource.name}
                    onChange={(e) =>
                      setNewResource({ ...newResource, name: e.target.value })
                    }
                  />
                  <Select
                    value={newResource.category}
                    onChange={(e) =>
                      setNewResource({ ...newResource, category: e.target.value })
                    }
                  >
                    <option value="SPACE">SPACE (Salle / Amphi)</option>
                    <option value="EQUIPMENT">EQUIPMENT (Matériel)</option>
                    <option value="CATERING">CATERING</option>
                    <option value="PRINTING">PRINTING</option>
                    <option value="TRANSPORT">TRANSPORT</option>
                    <option value="OTHER">OTHER</option>
                  </Select>
                  <Input
                    type="number"
                    placeholder={isFr ? "Quantité max" : "Total Quantity"}
                    value={String(newResource.totalQuantity)}
                    onChange={(e) =>
                      setNewResource({
                        ...newResource,
                        totalQuantity: Number(e.target.value || 1),
                      })
                    }
                  />
                </div>
                <Button size="sm" variant="primary" onClick={handleAddResource}>
                  {isFr ? "Ajouter au Catalogue" : "Add to Catalog"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
