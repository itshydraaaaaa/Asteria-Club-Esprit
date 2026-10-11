"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Clock,
  Plus,
  ArrowLeft,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Layers,
} from "lucide-react";

interface PlannerCalendarClientProps {
  currentUser: any;
}

type CalendarViewMode = "MONTH" | "WEEK" | "TIMELINE";

export function PlannerCalendarClient({
  currentUser,
}: PlannerCalendarClientProps) {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [viewMode, setViewMode] = useState<CalendarViewMode>("MONTH");
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [ownerFilter, setOwnerFilter] = useState("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ovRes, deptRes, memRes] = await Promise.all([
          fetch("/api/planner/overview").then((r) => r.json()),
          fetch("/api/departments").then((r) => r.json()),
          fetch("/api/members").then((r) => r.json()),
        ]);
        setActivities(ovRes.activities || []);
        setActivityTypes(ovRes.activityTypes || []);
        setDepartments(deptRes.departments || []);
        setMembers(memRes.members || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (typeFilter !== "ALL" && a.activityTypeId !== typeFilter) return false;
      if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
      if (deptFilter !== "ALL" && a.departmentId !== deptFilter) return false;
      if (ownerFilter !== "ALL" && a.ownerId !== ownerFilter) return false;
      return true;
    });
  }, [activities, typeFilter, statusFilter, deptFilter, ownerFilter]);

  // Navigation helpers
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "MONTH") {
      d.setMonth(d.getMonth() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "MONTH") {
      d.setMonth(d.getMonth() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const handleToday = () => setCurrentDate(new Date());

  // Generate 42 calendar cells for Month view
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const startDate = new Date(year, month, 1 - startDayOfWeek);

    const days: { date: Date; isCurrentMonth: boolean; items: any[] }[] = [];
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + i);
      const y = cellDate.getFullYear();
      const m = cellDate.getMonth();
      const d = cellDate.getDate();

      const items = filteredActivities.filter((act) => {
        const st = new Date(act.startAt);
        return (
          st.getFullYear() === y && st.getMonth() === m && st.getDate() === d
        );
      });

      days.push({
        date: cellDate,
        isCurrentMonth: m === month,
        items,
      });
    }
    return days;
  }, [currentDate, filteredActivities]);

  // Generate 7 days for Week view
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek);

    const days: { date: Date; items: any[] }[] = [];
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(monday);
      cellDate.setDate(monday.getDate() + i);
      const y = cellDate.getFullYear();
      const m = cellDate.getMonth();
      const day = cellDate.getDate();

      const items = filteredActivities.filter((act) => {
        const st = new Date(act.startAt);
        return (
          st.getFullYear() === y && st.getMonth() === m && st.getDate() === day
        );
      });

      days.push({ date: cellDate, items });
    }
    return days;
  }, [currentDate, filteredActivities]);

  const monthLabel = currentDate.toLocaleDateString(
    isFr ? "fr-FR" : "en-US",
    { month: "long", year: "numeric" }
  );

  const dayHeaders = isFr
    ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/planner"
            className="p-2 rounded-xl border border-line bg-surface hover:bg-surface-alt text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-display font-bold text-ink">
              {isFr
                ? "Calendrier Exécutif des Projets & Activités"
                : "Executive Activity & Project Calendar"}
            </h2>
            <p className="text-xs text-ink-soft font-body">
              {isFr
                ? "Vue consolidée des activités en préparation, validées et publiées"
                : "Consolidated view of activities in preparation, approved, and published"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-line bg-surface p-1">
            {(
              [
                { id: "MONTH", labelFr: "Mois", labelEn: "Month", icon: CalendarIcon },
                { id: "WEEK", labelFr: "Semaine", labelEn: "Week", icon: Clock },
                { id: "TIMELINE", labelFr: "Chronologie", labelEn: "Timeline", icon: List },
              ] as const
            ).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setViewMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-body flex items-center gap-1.5 transition-all ${
                    viewMode === m.id
                      ? "bg-ast-primary text-white shadow-sm"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {isFr ? m.labelFr : m.labelEn}
                </button>
              );
            })}
          </div>

          <Link
            href="/planner/activities/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-ast-primary text-white hover:bg-teal-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isFr ? "Nouvelle Activité" : "New Activity"}
          </Link>
        </div>
      </div>

      {/* Filters & Month Controls */}
      <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2 rounded-xl border border-line bg-surface-alt hover:bg-surface text-ink"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-line bg-surface-alt hover:bg-surface text-xs font-mono font-bold text-ink"
          >
            {isFr ? "Aujourd'hui" : "Today"}
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-xl border border-line bg-surface-alt hover:bg-surface text-ink"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-display font-bold capitalize text-ink ml-2">
            {monthLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-40 text-xs py-1.5"
          >
            <option value="ALL">{isFr ? "Tous Types" : "All Types"}</option>
            {activityTypes.map((t: any) => (
              <option key={t.id} value={t.id}>
                {isFr ? t.nameFr : t.name}
              </option>
            ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40 text-xs py-1.5"
          >
            <option value="ALL">{isFr ? "Tous Statuts" : "All Statuses"}</option>
            <option value="IDEA">IDEA</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="BRIEF_APPROVED">BRIEF_APPROVED</option>
            <option value="ADMIN_REQUESTS">ADMIN_REQUESTS</option>
            <option value="LOGISTICS_CONFIRMED">LOGISTICS_CONFIRMED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="PROMOTION">PROMOTION</option>
            <option value="LIVE">LIVE</option>
            <option value="CLOSED">CLOSED</option>
          </Select>

          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full sm:w-40 text-xs py-1.5"
          >
            <option value="ALL">{isFr ? "Tous Pôles" : "All Departments"}</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>

          <Select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="w-full sm:w-44 text-xs py-1.5"
          >
            <option value="ALL">{isFr ? "Tous Responsables" : "All Owners"}</option>
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Calendar Views */}
      {loading ? (
        <div className="p-12 bg-surface rounded-2xl border border-line text-center text-xs text-ink-soft">
          {isFr ? "Chargement du calendrier exécutif..." : "Loading executive calendar..."}
        </div>
      ) : viewMode === "MONTH" ? (
        <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line bg-surface-alt">
            {dayHeaders.map((day) => (
              <div
                key={day}
                className="py-2.5 text-center text-[11px] font-mono font-bold uppercase tracking-wider text-ink-soft"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 divide-x divide-y divide-line">
            {monthDays.map((cell, idx) => {
              const isToday =
                cell.date.toDateString() === new Date().toDateString();
              const isoDate = cell.date.toISOString().split("T")[0];

              return (
                <div
                  key={idx}
                  className={`min-h-[115px] p-2 transition-colors flex flex-col justify-between group ${
                    cell.isCurrentMonth
                      ? "bg-surface"
                      : "bg-surface-alt/50 text-ink-faint"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? "bg-ast-primary text-white"
                            : "text-ink-soft"
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      <Link
                        href={`/planner/activities/new?date=${isoDate}`}
                        className="opacity-0 group-hover:opacity-100 text-[10px] font-mono text-ast-primary hover:underline transition-opacity"
                        title={isFr ? "Planifier à cette date" : "Plan on this date"}
                      >
                        + {isFr ? "Créer" : "Add"}
                      </Link>
                    </div>

                    <div className="space-y-1">
                      {cell.items.map((act: any) => (
                        <Link
                          key={act.id}
                          href={`/planner/activities/${act.id}`}
                          className="block p-1.5 rounded-lg text-[11px] font-body border hover:shadow-sm transition-all truncate"
                          style={{
                            borderLeftWidth: "3px",
                            borderLeftColor:
                              act.activityType?.color || "#11606E",
                          }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-ink truncate">
                              {act.title}
                            </span>
                            {act.attentionFlags?.length > 0 && (
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                          </div>
                          <div className="text-[9px] font-mono text-ink-soft flex items-center justify-between">
                            <span>{act.status}</span>
                            <span>{act.readiness?.progressPercent ?? 0}%</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === "WEEK" ? (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border ${
                  isToday
                    ? "border-ast-primary bg-teal-50/20 dark:bg-teal-950/20"
                    : "border-line bg-surface"
                } min-h-[260px] space-y-3`}
              >
                <div className="pb-2 border-b border-line flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-ink">
                    {dayHeaders[idx]}
                  </span>
                  <span className="text-xs font-mono text-ink-soft">
                    {day.date.getDate()}/{day.date.getMonth() + 1}
                  </span>
                </div>

                <div className="space-y-2">
                  {day.items.length === 0 ? (
                    <p className="text-[11px] text-ink-faint italic text-center py-6">
                      —
                    </p>
                  ) : (
                    day.items.map((act: any) => (
                      <Link
                        key={act.id}
                        href={`/planner/activities/${act.id}`}
                        className="block p-2.5 rounded-xl bg-surface-alt border border-line hover:border-ast-primary transition-all space-y-1"
                      >
                        <span className="text-[9px] font-mono font-bold uppercase text-ast-primary block">
                          {act.status}
                        </span>
                        <p className="text-xs font-bold text-ink line-clamp-2">
                          {act.title}
                        </p>
                        <p className="text-[10px] text-ink-soft font-mono">
                          {act.location}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="space-y-3">
          {filteredActivities.map((act: any) => (
            <div
              key={act.id}
              className="p-4 bg-surface rounded-2xl border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-ast-primary">
                    {formatDate(act.startAt)}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-alt border border-line">
                    {act.status}
                  </span>
                  {act.eventId && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {isFr ? "Publié" : "Published"}
                    </span>
                  )}
                </div>
                <Link
                  href={`/planner/activities/${act.id}`}
                  className="text-sm font-display font-bold text-ink hover:text-ast-primary block"
                >
                  {act.title}
                </Link>
                <div className="flex flex-wrap items-center gap-3 text-xs text-ink-soft">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {act.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {act.expectedAttendance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />{" "}
                    {act.stats?.completedTasks || 0}/{act.stats?.totalTasks || 0}{" "}
                    {isFr ? "tâches" : "tasks"}
                  </span>
                </div>
              </div>

              <Link
                href={`/planner/activities/${act.id}`}
                className="px-4 py-2 rounded-xl bg-ast-primary text-white text-xs font-bold text-center hover:bg-teal-800 transition-colors"
              >
                {isFr ? "Ouvrir" : "Open"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
