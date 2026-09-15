"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Settings,
  ShieldAlert,
  RotateCcw,
  Plus,
  Layers,
  Activity,
  Award,
  CheckCircle,
  Users,
  Search,
  UserCheck,
  Shield,
  Edit,
  AlertCircle,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { BOARD_TRACK_LABELS, BoardTrack, UserRole } from "@/lib/types";

export default function AdminPage() {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", icon: "Code2" });

  // Cycle Rollover Modal
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleName, setCycleName] = useState(
    isFr ? "Année Universitaire 2026-2027 · Semestre 1" : "Academic Year 2026-2027 · Semester 1"
  );

  // Member Governance State
  const [memberSearch, setMemberSearch] = useState("");
  const [memberRoleFilter, setMemberRoleFilter] = useState("all");
  const [memberDeptFilter, setMemberDeptFilter] = useState("all");
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [memberRoleForm, setMemberRoleForm] = useState({
    role: "MEMBER",
    departmentId: "",
    status: "ACTIVE",
    boardTitle: "",
  });
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [healthData, setHealthData] = useState<any>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [res, healthRes] = await Promise.all([
        fetch("/api/admin"),
        fetch("/api/health"),
      ]);
      const resData = await res.json();
      const healthJson = await healthRes.json();
      setData(resData);
      setHealthData(healthJson);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateDepartment = async () => {
    if (!deptForm.name) return;
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CREATE_DEPARTMENT",
          payload: deptForm,
        }),
      });
      if (res.ok) {
        setIsDeptModalOpen(false);
        setDeptForm({ name: "", description: "", icon: "Code2" });
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRolloverCycle = async () => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ROLLOVER_CYCLE",
          payload: { cycleName },
        }),
      });
      if (res.ok) {
        setIsCycleModalOpen(false);
        fetchAdminData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditRole = (member: any) => {
    setEditingMember(member);
    let resolvedRole = member.role || "MEMBER";
    if (member.role === "BOARD") {
      if (member.boardTitle?.toLowerCase().includes("president") && !member.boardTitle?.toLowerCase().includes("vice")) {
        resolvedRole = "PRESIDENT";
      } else if (member.boardTitle?.toLowerCase().includes("vice")) {
        resolvedRole = "VICE_PRESIDENT";
      }
    }
    setMemberRoleForm({
      role: resolvedRole,
      departmentId: member.departmentId || "",
      status: member.status || "ACTIVE",
      boardTitle: member.boardTitle || "",
    });
    setRoleFeedback(null);
  };

  const handleSaveMemberRole = async () => {
    if (!editingMember) return;
    setIsUpdatingRole(true);
    setRoleFeedback(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_MEMBER_ROLE",
          payload: {
            memberId: editingMember.id,
            role: memberRoleForm.role,
            departmentId: memberRoleForm.departmentId || null,
            status: memberRoleForm.status,
            boardTitle: memberRoleForm.boardTitle,
          },
        }),
      });
      const resJson = await res.json();
      if (res.ok) {
        setRoleFeedback({
          type: "success",
          message: isFr
            ? `Rôle mis à jour pour ${editingMember.name} avec succès !`
            : `Role updated for ${editingMember.name} successfully!`,
        });
        setEditingMember(null);
        await fetchAdminData();
      } else {
        setRoleFeedback({
          type: "error",
          message: resJson.error || "Failed to update role",
        });
      }
    } catch (err: any) {
      console.error(err);
      setRoleFeedback({
        type: "error",
        message: err?.message || "Network error updating role",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleQuickRoleChange = async (member: any, newRole: string) => {
    if (member.role === newRole) return;
    let autoBoardTitle = member.boardTitle || "";
    if (newRole === "PRESIDENT") autoBoardTitle = "President & Executive Lead";
    if (newRole === "VICE_PRESIDENT") autoBoardTitle = "Vice President & Operations Lead";
    if (newRole === "BOARD" && !autoBoardTitle) autoBoardTitle = "Executive Board Member";

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_MEMBER_ROLE",
          payload: {
            memberId: member.id,
            role: newRole,
            departmentId: member.departmentId || null,
            status: member.status || "ACTIVE",
            boardTitle: autoBoardTitle,
          },
        }),
      });
      if (res.ok) {
        setRoleFeedback({
          type: "success",
          message: isFr
            ? `${member.name} est maintenant : ${newRole}`
            : `${member.name} is now: ${newRole}`,
        });
        await fetchAdminData();
      } else {
        const errJson = await res.json();
        setRoleFeedback({
          type: "error",
          message: errJson.error || "Quick role update failed",
        });
      }
    } catch (e: any) {
      console.error(e);
      setRoleFeedback({
        type: "error",
        message: e?.message || "Network error updating role",
      });
    }
  };

  const filteredMembers = (data?.members || []).filter((m: any) => {
    const matchesSearch =
      !memberSearch ||
      m.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email?.toLowerCase().includes(memberSearch.toLowerCase());

    let matchesRole = memberRoleFilter === "all";
    if (memberRoleFilter !== "all") {
      if (memberRoleFilter === "PRESIDENT") {
        matchesRole = m.role === "PRESIDENT" || (m.role === "BOARD" && m.boardTitle?.toLowerCase().includes("president") && !m.boardTitle?.toLowerCase().includes("vice"));
      } else if (memberRoleFilter === "VICE_PRESIDENT") {
        matchesRole = m.role === "VICE_PRESIDENT" || (m.role === "BOARD" && m.boardTitle?.toLowerCase().includes("vice"));
      } else if (memberRoleFilter === "BOARD") {
        matchesRole = m.role === "BOARD" || m.role === "PRESIDENT" || m.role === "VICE_PRESIDENT";
      } else {
        matchesRole = m.role === memberRoleFilter;
      }
    }

    const matchesDept = memberDeptFilter === "all" || m.departmentId === memberDeptFilter;
    return matchesSearch && matchesRole && matchesDept;
  });

  if (loading) {
    return (
      <div className="p-12 text-center text-ink-soft">
        <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="font-display text-xs uppercase tracking-wider">{isFr ? "Chargement des Contrôles Admin..." : "Loading Admin Controls..."}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={isFr ? "Administration & Gouvernance Système" : "Admin & System Governance"}
        subtitle={isFr ? "Gestion des cycles, sièges du bureau, pôles techniques et journaux d'audit" : "Cycle management, board seat allocations, department management, and security audit logs"}
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-vague-in">
        {/* Academic Year Cycle Card */}
        <Card className="p-6 bg-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  {isFr ? "Cycle Actif" : "Active Cycle"}
                </Badge>
                <span className="text-xs text-ink-soft font-body">{isFr ? "Période Semestrielle Courante" : "Current Semester Period"}</span>
              </div>
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-ink">
                {data?.currentCycle?.name || (isFr ? "Année Universitaire 2025–2026" : "Academic Year 2025–2026")}
              </h3>
              <p className="text-xs text-ink-soft font-body">
                {data?.currentCycle?.startDate ? `${formatDate(data.currentCycle.startDate)} – ${formatDate(data.currentCycle.endDate)}` : (isFr ? "Semestre Académique Actif" : "Active Academic Semester")} • {data?.departments?.length || 4} {isFr ? "Pôles Techniques Opérationnels" : "Technical Tracks Operational"}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setIsCycleModalOpen(true)}
            >
              {isFr ? "Basculer / Archiver le Cycle" : "Rollover / Archive Cycle"}
            </Button>
          </div>
        </Card>

        {/* Supabase Cloud Integration Status Card */}
        <Card className="p-6 bg-surface border-teal-900/30 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant={healthData?.status === "healthy" ? "accent" : "warning"}
                  size="sm"
                  className="font-bold"
                >
                  {healthData?.database?.connected
                    ? "★ Database Online"
                    : "⚠ Database Checking"}
                </Badge>
                <span className="text-xs text-ink-soft font-body">
                  {isFr
                    ? "Base de Données PostgreSQL & Stockage Cloud"
                    : "PostgreSQL Database & Storage Engine"}
                </span>
              </div>
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-ink">
                Asteria Club Esprit · Cloud Production Backend
              </h3>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-body text-ink-soft">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      healthData?.database?.connected
                        ? "bg-emerald-500 animate-pulse"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="font-mono text-[11px] text-teal-900 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    PostgreSQL {healthData?.database?.latencyMs ? `(${healthData.database.latencyMs}ms)` : "Connecting"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      healthData?.supabase?.realtime
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span className="font-mono text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {healthData?.supabase?.realtime
                      ? "Realtime WebSockets Synchronized"
                      : "Realtime Initializing"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  healthData?.status === "healthy"
                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                    : "text-amber-800 bg-amber-50 border-amber-200"
                }`}
              >
                <CheckCircle
                  className={`w-4 h-4 ${
                    healthData?.status === "healthy" ? "text-emerald-600" : "text-amber-600"
                  }`}
                />{" "}
                {healthData?.status === "healthy"
                  ? isFr ? "En Ligne & Sécurisé" : "Live & Protected"
                  : isFr ? "Configuration Validée" : "Config Verified"}
              </span>
            </div>
          </div>
        </Card>

        {/* Board Seats & Departments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Executive Board Seats */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-teal-900" />
                <CardTitle>{isFr ? "Sièges du Bureau Exécutif" : "Executive Board Seats"}</CardTitle>
              </div>
              <span className="text-xs text-ink-soft font-body">
                {data?.boardSeats?.length || 0} {isFr ? "Configurés" : "Configured"}
              </span>
            </CardHeader>
            <CardContent className="divide-y divide-line/60">
              {data?.boardSeats?.map((seat: any) => (
                <div key={seat.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={seat.user?.name} src={seat.user?.avatarUrl} size="sm" />
                    <div>
                      <h4 className="font-body font-bold text-xs text-ink">{seat.user?.name}</h4>
                      <p className="text-[11px] text-teal-900 font-semibold font-body">
                        {seat.title}
                      </p>
                    </div>
                  </div>
                  <Badge variant="primary" size="sm">
                    {isFr ? "Siège n°" : "Seat #"}{seat.order}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Technical Departments */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-900" />
                <CardTitle>{isFr ? "Pôles & Divisions" : "Department Divisions"}</CardTitle>
              </div>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsDeptModalOpen(true)}
              >
                {isFr ? "Ajouter un Pôle" : "Add Track"}
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-line/60">
              {data?.departments?.map((dept: any) => (
                <div key={dept.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                      {dept.name}
                    </h4>
                    <p className="text-[11px] text-ink-soft font-body">
                      {isFr ? "Responsable :" : "Lead:"} <strong>{dept.hod?.name || (isFr ? "Non assigné" : "Unassigned")}</strong> • {dept._count?.members || 0} {isFr ? "Membres" : "Members"}
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {dept._count?.tasks || 0} {isFr ? "Tâches" : "Tasks"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Member Role Governance & Permissions Card */}
        <Card className="p-6 bg-surface">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-900" />
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-ink">
                  {isFr ? "Gestion des Membres & Attribution des Rôles" : "Member Role Governance & Assignments"}
                </h3>
              </div>
              <p className="text-xs text-ink-soft font-body mt-0.5">
                {isFr
                  ? "Modifiez directement les rôles (Bureau, Responsable de pôle, Membre, Candidat), départements et statuts des comptes"
                  : "Assign Board seats, promote members to Head of Department (HOD), or manage account permissions"}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-900 font-bold border border-teal-200">
                {data?.members?.length || 0} {isFr ? "Total Membres" : "Total Members"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 font-bold border border-amber-300">
                {data?.members?.filter((m: any) => m.role === "PRESIDENT" || (m.role === "BOARD" && m.boardTitle?.toLowerCase().includes("president") && !m.boardTitle?.toLowerCase().includes("vice"))).length || 0} 👑 {isFr ? "Président" : "President"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 font-bold border border-indigo-200">
                {data?.members?.filter((m: any) => m.role === "VICE_PRESIDENT" || (m.role === "BOARD" && m.boardTitle?.toLowerCase().includes("vice"))).length || 0} ⚜️ {isFr ? "Vice-Président" : "Vice President"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {data?.members?.filter((m: any) => m.role === "BOARD").length || 0} ★ Board
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-900 font-bold border border-cyan-200">
                {data?.members?.filter((m: any) => m.role === "HOD").length || 0} ◆ HoD
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-teal-50/70 text-teal-800 font-semibold border border-teal-200">
                {data?.members?.filter((m: any) => m.role === "MEMBER").length || 0} ● {isFr ? "Membres" : "Members"}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                {data?.members?.filter((m: any) => m.role === "WAITING_FOR_INTERVIEW").length || 0} ⏳ {isFr ? "En Entretien" : "Interview"}
              </span>
            </div>
          </div>

          {/* Feedback banner */}
          {roleFeedback && (
            <div
              className={`mt-4 p-3 rounded-xl flex items-center justify-between text-xs font-body ${
                roleFeedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <span>{roleFeedback.message}</span>
              <button
                type="button"
                onClick={() => setRoleFeedback(null)}
                className="font-bold px-2 py-0.5 rounded hover:bg-black/5"
              >
                ✕
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
            <Input
              placeholder={isFr ? "Rechercher un membre par nom ou email..." : "Search member by name or email..."}
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-ink-soft" />}
              className="text-xs py-1.5"
            />

            <Select
              value={memberRoleFilter}
              onChange={(e) => setMemberRoleFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">{isFr ? "Tous les Rôles" : "All Roles"}</option>
              <option value="PRESIDENT">{isFr ? "👑 Président (PRESIDENT)" : "👑 President (PRESIDENT)"}</option>
              <option value="VICE_PRESIDENT">{isFr ? "⚜️ Vice-Président (VICE_PRESIDENT)" : "⚜️ Vice President (VICE_PRESIDENT)"}</option>
              <option value="BOARD">{isFr ? "★ Bureau Exécutif (BOARD - PR/HR/CM/CRD)" : "★ Executive Board (BOARD - PR/HR/CM/CRD)"}</option>
              <option value="HOD">{isFr ? "◆ Responsable de Pôle (HOD)" : "◆ Head of Dept (HOD)"}</option>
              <option value="MEMBER">{isFr ? "● Membre Actif (MEMBER)" : "● Active Member (MEMBER)"}</option>
              <option value="WAITING_FOR_INTERVIEW">{isFr ? "⏳ En Attente d'Entretien (WAITING_FOR_INTERVIEW)" : "⏳ Waiting for Interview (WAITING_FOR_INTERVIEW)"}</option>
              <option value="DECLINED">{isFr ? "✕ Candidature Refusée (DECLINED)" : "✕ Declined (DECLINED)"}</option>
              <option value="APPLICANT">{isFr ? "○ Candidat Initial (APPLICANT)" : "○ Applicant (APPLICANT)"}</option>
            </Select>

            <Select
              value={memberDeptFilter}
              onChange={(e) => setMemberDeptFilter(e.target.value)}
              className="text-xs py-1.5"
            >
              <option value="all">{isFr ? "Tous les Pôles" : "All Departments"}</option>
              {data?.departments?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Members Table */}
          <div className="mt-4 border border-line rounded-xl overflow-hidden bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-alt/70 text-ink-soft uppercase text-[10px] tracking-wider font-mono border-b border-line">
                  <tr>
                    <th className="py-3 px-4">{isFr ? "Membre" : "Member"}</th>
                    <th className="py-3 px-4">{isFr ? "Pôle / Division" : "Department"}</th>
                    <th className="py-3 px-4">{isFr ? "Rôle Actuel" : "Current Role"}</th>
                    <th className="py-3 px-4">{isFr ? "Changement Rapide" : "Quick Role Change"}</th>
                    <th className="py-3 px-4 text-right">{isFr ? "Actions" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-ink-faint">
                        {isFr ? "Aucun membre ne correspond aux critères." : "No members match the selected filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m: any) => (
                      <tr key={m.id} className="hover:bg-surface-alt/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-ink truncate">{m.name}</p>
                              <p className="text-[11px] text-ink-soft truncate">{m.email}</p>
                              {m.boardTitle && (
                                <p className="text-[10px] text-teal-900 font-semibold font-mono">
                                  ★ {m.boardTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-medium text-ink-soft">
                            {m.departmentName || (isFr ? "Général / Non assigné" : "General / Club-wide")}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <RoleBadge role={m.role} />
                        </td>

                        <td className="py-3 px-4">
                          <Select
                            value={m.role}
                            onChange={(e) => handleQuickRoleChange(m, e.target.value)}
                            className="text-xs py-1 w-44"
                          >
                            <option value="PRESIDENT">👑 PRESIDENT</option>
                            <option value="VICE_PRESIDENT">⚜️ VICE_PRESIDENT</option>
                            <option value="BOARD">★ BOARD</option>
                            <option value="HOD">◆ HOD</option>
                            <option value="MEMBER">● MEMBER</option>
                            <option value="WAITING_FOR_INTERVIEW">⏳ WAITING_FOR_INTERVIEW</option>
                            <option value="DECLINED">✕ DECLINED</option>
                            <option value="APPLICANT">○ APPLICANT</option>
                          </Select>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<Edit className="w-3 h-3" />}
                            onClick={() => handleOpenEditRole(m)}
                            className="text-xs py-1"
                          >
                            {isFr ? "Modifier" : "Configure"}
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Security & Action Audit Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-900" />
              <CardTitle>{isFr ? "Gouvernance & Piste d'Audit" : "System Governance & Audit Trail"}</CardTitle>
            </div>
            <span className="text-xs text-ink-soft font-body">{isFr ? "Journalisation en temps réel" : "Real-time action logging"}</span>
          </CardHeader>
          <CardContent className="divide-y divide-line/60">
            {data?.auditLogs?.map((log: any) => (
              <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-3">
                  <Avatar name={log.user?.name || "System"} src={log.user?.avatarUrl} size="sm" />
                  <div>
                    <p className="font-body font-bold text-xs text-ink">
                      {log.user?.name || "System"} —{" "}
                      <span className="font-mono text-[11px] bg-surface-alt px-1.5 py-0.5 rounded border border-line text-teal-900">
                        {log.action}
                      </span>
                    </p>
                    <p className="font-body text-xs text-ink-soft mt-0.5">{log.details}</p>
                  </div>
                </div>
                <span className="text-[11px] text-ink-faint font-body whitespace-nowrap pl-10 sm:pl-0">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Add Department Modal */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title={isFr ? "Ajouter un Pôle Technique" : "Add Technical Department Division"}
        description={isFr ? "Créer une nouvelle division de formation pour le Club Asteria" : "Create an extensible training division for Asteria Club"}
      >
        <div className="space-y-4">
          <Input
            label={isFr ? "Nom du Pôle *" : "Department Name *"}
            placeholder={isFr ? "Ex: Animation 3D & VFX" : "e.g., 3D Animation & VFX"}
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />

          <Textarea
            label={isFr ? "Description du Programme & Mission *" : "Curriculum & Mission Description *"}
            placeholder={isFr ? "Présentez les compétences, outils et livrables attendus..." : "Outline skills, tool stack, and deliverables..."}
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDeptModalOpen(false)}>
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateDepartment}>
              {isFr ? "Créer le Pôle" : "Create Department"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rollover Cycle Modal */}
      <Modal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        title={isFr ? "Initier la Bascule de Cycle Universitaire" : "Initiate Academic Cycle Rollover"}
        description={isFr ? "Archiver les statistiques du semestre actuel et initialiser la nouvelle période" : "Archive current semester statistics and initialize the new club period"}
      >
        <div className="space-y-4">
          <Input
            label={isFr ? "Titre du Nouveau Cycle *" : "New Cycle Title *"}
            value={cycleName}
            onChange={(e) => setCycleName(e.target.value)}
          />

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-body">
            {isFr
              ? "⚠️ Cette action marquera les activités du cycle courant comme archivées et créera une entrée d'audit pour le nouveau semestre."
              : "⚠️ This action will mark current cycle activities as archived and create an audit log entry for the new semester period."}
          </div>

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsCycleModalOpen(false)}>
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="primary" size="sm" onClick={handleRolloverCycle}>
              {isFr ? "Confirmer la Bascule" : "Confirm Rollover"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Member Role & Governance Modal */}
      <Modal
        isOpen={!!editingMember}
        onClose={() => {
          setEditingMember(null);
          setRoleFeedback(null);
        }}
        title={isFr ? "Modifier le Rôle & les Permissions du Membre" : "Edit Member Role & Governance"}
        description={editingMember ? `${editingMember.name} (${editingMember.email})` : ""}
      >
        {editingMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-surface-alt rounded-2xl border border-line">
              <Avatar name={editingMember.name} src={editingMember.avatarUrl} size="md" />
              <div className="min-w-0 flex-1">
                <h4 className="font-body font-bold text-xs text-ink">{editingMember.name}</h4>
                <p className="text-[11px] text-ink-soft truncate">{editingMember.email}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-ink-faint">{isFr ? "Rôle Actuel :" : "Current:"}</span>
                  <RoleBadge role={editingMember.role} />
                </div>
              </div>
            </div>

            <Select
              label={isFr ? "Nouveau Rôle *" : "New Role *"}
              value={memberRoleForm.role}
              onChange={(e) => {
                const nextRole = e.target.value;
                let nextTitle = memberRoleForm.boardTitle;
                if (nextRole === "PRESIDENT" && !nextTitle) nextTitle = "President & Executive Lead";
                if (nextRole === "VICE_PRESIDENT" && !nextTitle) nextTitle = "Vice President & Operations Lead";
                if (nextRole === "BOARD" && !nextTitle) nextTitle = "Board Member — PR (Relations Publiques)";
                setMemberRoleForm({
                  ...memberRoleForm,
                  role: nextRole,
                  boardTitle: nextTitle,
                });
              }}
            >
              <option value="PRESIDENT">{isFr ? "👑 Président (PRESIDENT) — Direction Suprême" : "👑 President (PRESIDENT) — Executive Leadership"}</option>
              <option value="VICE_PRESIDENT">{isFr ? "⚜️ Vice-Président (VICE_PRESIDENT) — Gouvernance" : "⚜️ Vice President (VICE_PRESIDENT) — Operations"}</option>
              <option value="BOARD">{isFr ? "★ Bureau Exécutif (BOARD) — Pôles PR / HR / CM / CRD" : "★ Executive Board (BOARD) — PR / HR / CM / CRD"}</option>
              <option value="HOD">{isFr ? "◆ Responsable de Pôle (HOD) — Direction Technique" : "◆ Head of Department (HOD) — Track Lead"}</option>
              <option value="MEMBER">{isFr ? "● Membre Actif (MEMBER) — Accès Standard" : "● Active Member (MEMBER) — Standard Access"}</option>
              <option value="WAITING_FOR_INTERVIEW">{isFr ? "⏳ En Attente d'Entretien (WAITING_FOR_INTERVIEW)" : "⏳ Waiting for Interview (WAITING_FOR_INTERVIEW)"}</option>
              <option value="DECLINED">{isFr ? "✕ Candidature Refusée (DECLINED)" : "✕ Application Declined (DECLINED)"}</option>
              <option value="APPLICANT">{isFr ? "○ Candidat Initial (APPLICANT)" : "○ Applicant (APPLICANT)"}</option>
            </Select>

            {memberRoleForm.role === "BOARD" && (
              <div className="space-y-2 p-3 bg-teal-900/5 rounded-xl border border-teal-900/15">
                <label className="text-[11px] font-mono uppercase tracking-wider text-teal-900 font-bold block">
                  {isFr ? "Pôle du Bureau Exécutif (Board Track) :" : "Executive Board Track :"}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMemberRoleForm({ ...memberRoleForm, boardTitle: "Board Member — PR (Relations Publiques)" })}
                    className={`p-2 rounded-lg text-left text-xs border transition-all ${
                      memberRoleForm.boardTitle?.includes("PR")
                        ? "bg-teal-900 text-white border-teal-900 font-bold"
                        : "bg-surface hover:bg-surface-alt border-line text-ink"
                    }`}
                  >
                    <p className="font-bold">📢 PR</p>
                    <p className="text-[10px] opacity-80">{isFr ? "Relations Publiques" : "Public Relations"}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberRoleForm({ ...memberRoleForm, boardTitle: "Board Member — HR (Ressources Humaines)" })}
                    className={`p-2 rounded-lg text-left text-xs border transition-all ${
                      memberRoleForm.boardTitle?.includes("HR")
                        ? "bg-teal-900 text-white border-teal-900 font-bold"
                        : "bg-surface hover:bg-surface-alt border-line text-ink"
                    }`}
                  >
                    <p className="font-bold">🤝 HR</p>
                    <p className="text-[10px] opacity-80">{isFr ? "Ressources Humaines" : "Human Resources"}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberRoleForm({ ...memberRoleForm, boardTitle: "Board Member — CM (Community Management)" })}
                    className={`p-2 rounded-lg text-left text-xs border transition-all ${
                      memberRoleForm.boardTitle?.includes("CM")
                        ? "bg-teal-900 text-white border-teal-900 font-bold"
                        : "bg-surface hover:bg-surface-alt border-line text-ink"
                    }`}
                  >
                    <p className="font-bold">📱 CM</p>
                    <p className="text-[10px] opacity-80">{isFr ? "Community Management" : "Social & Community"}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMemberRoleForm({ ...memberRoleForm, boardTitle: "Board Member — CRD (Relations Entreprises & Sponsoring)" })}
                    className={`p-2 rounded-lg text-left text-xs border transition-all ${
                      memberRoleForm.boardTitle?.includes("CRD")
                        ? "bg-teal-900 text-white border-teal-900 font-bold"
                        : "bg-surface hover:bg-surface-alt border-line text-ink"
                    }`}
                  >
                    <p className="font-bold">💼 CRD</p>
                    <p className="text-[10px] opacity-80">{isFr ? "Relations Entreprises" : "Corporate Relations"}</p>
                  </button>
                </div>

                <Input
                  label={isFr ? "Titre Officiel du Siège Exécutif" : "Executive Seat Title"}
                  placeholder={isFr ? "Ex: Responsable Relations Publiques..." : "e.g. Head of Public Relations..."}
                  value={memberRoleForm.boardTitle}
                  onChange={(e) => setMemberRoleForm({ ...memberRoleForm, boardTitle: e.target.value })}
                  className="mt-2"
                />
              </div>
            )}

            {(memberRoleForm.role === "PRESIDENT" || memberRoleForm.role === "VICE_PRESIDENT") && (
              <Input
                label={isFr ? "Titre Officiel (Optionnel)" : "Executive Title (Optional)"}
                value={memberRoleForm.boardTitle}
                onChange={(e) => setMemberRoleForm({ ...memberRoleForm, boardTitle: e.target.value })}
              />
            )}

            <Select
              label={isFr ? "Pôle Technique Affecté" : "Assigned Technical Department"}
              value={memberRoleForm.departmentId}
              onChange={(e) => setMemberRoleForm({ ...memberRoleForm, departmentId: e.target.value })}
            >
              <option value="">{isFr ? "Général / Aucun pôle (Club-wide)" : "General / Club-Wide (No Department)"}</option>
              {data?.departments?.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label={isFr ? "Statut du Membre" : "Membership Status"}
              value={memberRoleForm.status}
              onChange={(e) => setMemberRoleForm({ ...memberRoleForm, status: e.target.value })}
            >
              <option value="ACTIVE">{isFr ? "Actif" : "Active"}</option>
              <option value="INACTIVE">{isFr ? "Inactif" : "Inactive"}</option>
              <option value="ALUMNI">{isFr ? "Ancien Membre (Alumni)" : "Alumni"}</option>
            </Select>

            <div className="pt-4 border-t border-line flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEditingMember(null);
                  setRoleFeedback(null);
                }}
                disabled={isUpdatingRole}
              >
                {isFr ? "Annuler" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveMemberRole}
                isLoading={isUpdatingRole}
                disabled={isUpdatingRole}
              >
                {isFr ? "Enregistrer les Permissions" : "Save Role & Permissions"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
