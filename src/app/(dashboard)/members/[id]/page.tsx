"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge, StatusBadge, PriorityBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  Edit,
  Mail,
  Award,
  Trash2,
  Ban,
  ShieldAlert,
  AlertCircle,
  Phone,
  Globe,
  ExternalLink,
  Camera,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";
import { SocialConnectionsList } from "@/components/profile/SocialConnectionsList";
import { GitHubContributionsCard } from "@/components/profile/GitHubContributionsCard";

export default function MemberProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [member, setMember] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    phone: "",
    portfolioLink: "",
    avatarUrl: "",
    bannerUrl: "",
    skills: "",
    status: "ACTIVE",
    role: "MEMBER",
    departmentId: "",
    freelanceReady: false,
    boardTitle: "",
  });

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Moderation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchMember = () => {
    if (!id) return;
    fetch(`/api/members/${id}`)
      .then((res) => res.json())
      .then((res) => {
        setMember(res.member);
        if (res.member) {
          const skillsStr = Array.isArray(res.member.skills)
            ? res.member.skills.join(", ")
            : (typeof res.member.skills === "string" ? res.member.skills : "");

          setEditForm({
            name: res.member.name || "",
            bio: res.member.bio || "",
            phone: res.member.phone || "",
            portfolioLink: res.member.portfolioLink || "",
            avatarUrl: res.member.avatarUrl || "",
            bannerUrl: res.member.bannerUrl || "",
            skills: skillsStr,
            status: res.member.status || "ACTIVE",
            role: res.member.role || "MEMBER",
            departmentId: res.member.departmentId || res.member.department?.id || "",
            boardTitle: res.member.boardSeat?.title || "",
            freelanceReady: res.member.freelanceReady || false,
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMember();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUser(data.user))
      .catch(() => {});
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }, [id]);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "avatar") setIsUploadingAvatar(true);
    if (target === "banner") setIsUploadingBanner(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        if (target === "avatar") {
          setEditForm((prev) => ({ ...prev, avatarUrl: data.url }));
        } else {
          setEditForm((prev) => ({ ...prev, bannerUrl: data.url }));
        }
      } else {
        alert(data.error || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Error uploading image");
    } finally {
      if (target === "avatar") setIsUploadingAvatar(false);
      if (target === "banner") setIsUploadingBanner(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setEditError(null);
    try {
      const skillsArray = editForm.skills
        ? editForm.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        ...editForm,
        skills: skillsArray,
      };

      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setIsEditOpen(false);
        fetchMember();
      } else {
        setEditError(data.error || "Failed to update member profile");
      }
    } catch (e: any) {
      console.error(e);
      setEditError(e?.message || "Network error updating member");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBanToggle = async () => {
    if (!member) return;
    const isCurrentlyBanned =
      member.status === "INACTIVE" &&
      (member.bio?.includes("[BANNED]") || member.status === "BANNED");
    const nextBanned = !isCurrentlyBanned;

    setIsBanning(true);
    setActionFeedback(null);
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "BAN_MEMBER",
          payload: { memberId: id, banned: nextBanned },
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionFeedback({
          type: "success",
          message: nextBanned
            ? "Member account has been suspended and banned from accessing the platform."
            : "Member account has been restored and unbanned.",
        });
        await fetchMember();
      } else {
        setActionFeedback({
          type: "error",
          message: data.error || "Failed to update ban status",
        });
      }
    } catch (e: any) {
      setActionFeedback({
        type: "error",
        message: e?.message || "Network error updating ban status",
      });
    } finally {
      setIsBanning(false);
    }
  };

  const handleDeleteMember = async () => {
    setIsDeleting(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        router.push("/members");
      } else {
        setActionFeedback({
          type: "error",
          message: data.error || "Failed to delete account",
        });
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
      }
    } catch (e: any) {
      setActionFeedback({
        type: "error",
        message: e?.message || "Network error deleting member",
      });
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-ink-soft">
        <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="font-display text-xs uppercase tracking-wider">Loading Profile...</p>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="p-8 text-center">
        <p className="text-ink-soft">Member not found.</p>
        <Link href="/members" className="mt-4 inline-block text-teal-900 font-bold">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  const isExecutive =
    currentUser?.role === "BOARD" ||
    currentUser?.role === "PRESIDENT" ||
    currentUser?.role === "VICE_PRESIDENT";
  const isSelf = currentUser?.id === member?.id;
  const canEdit = isExecutive || isSelf;

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title={`${member.name} · Profile`}
        subtitle="Member dossier, skill certifications, attendance records, and sprint tasks"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6 animate-vague-in">
        <Link
          href="/members"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-teal-900 transition-colors font-body"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Member Directory
        </Link>

        {/* Profile Dossier Hero */}
        <Card className="overflow-hidden bg-surface border-line dark:border-teal-900 shadow-md">
          {/* Cover Banner */}
          <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-gradient-to-r from-[#03171a] via-[#09353c] to-[#11606E]">
            {member.bannerUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.bannerUrl}
                alt={`${member.name} Cover Banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Sparkles className="w-20 h-20 text-white" />
              </div>
            )}

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 transition-all shadow-lg"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Changer la bannière</span>
              </button>
            )}
          </div>

          <div className="px-6 sm:px-8 pb-6 sm:pb-8 relative">
            {/* Top row: Avatar (overlapping banner) on left, Action buttons on right */}
            <div className="flex items-end justify-between gap-4 -mt-12 sm:-mt-16 mb-4">
              {/* Overlapping Avatar */}
              <div className="relative group flex-shrink-0">
                <div className="p-1 rounded-full bg-surface dark:bg-[#052024] shadow-2xl inline-block">
                  <Avatar
                    name={member.name}
                    src={member.avatarUrl}
                    size="xl"
                    className="w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl ring-4 ring-surface dark:ring-[#052024]"
                  />
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    title="Modifier la photo"
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-ast-primary text-white hover:bg-teal-700 shadow-lg border-2 border-surface dark:border-[#052024] transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              {canEdit && (
                <div className="flex items-center gap-2 pb-1 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit className="w-3.5 h-3.5" />}
                    onClick={() => setIsEditOpen(true)}
                  >
                    Modifier le Profil
                  </Button>

                  {isSelf && (
                    <Link href="/settings/connected-accounts">
                      <Button variant="outline" size="sm" leftIcon={<Globe className="w-3.5 h-3.5" />}>
                        Comptes Connectés
                      </Button>
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Member Identity & Details (cleanly inside card, no overlap) */}
            <div className="space-y-1.5 mb-6">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-ink dark:text-white">
                  {member.name}
                </h2>
                <RoleBadge role={member.role} />
                <Badge variant={member.status === "ACTIVE" ? "success" : "neutral"}>
                  {member.status}
                </Badge>
              </div>

              {member.boardSeat?.title && (
                <p className="font-display font-semibold text-xs sm:text-sm text-amber-700 dark:text-amber-400">
                  ★ {member.boardSeat.title}
                </p>
              )}

              {member.department && (
                <p className="font-body font-semibold text-xs sm:text-sm text-ast-primary dark:text-teal-300">
                  Division:{" "}
                  <Link href={`/departments/${member.department.id}`} className="hover:underline">
                    {member.department.name}
                  </Link>
                </p>
              )}
            </div>

            {/* Contact & Portfolio Quick Bar */}
            <div className="flex flex-wrap items-center gap-4 py-3 px-4 rounded-xl bg-surface-alt/70 dark:bg-teal-950/60 border border-line dark:border-teal-900 text-xs text-ink-soft dark:text-teal-200">
              {member.email && (
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1.5 hover:text-ast-primary dark:hover:text-teal-300 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                  <span>{member.email}</span>
                </a>
              )}

              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="flex items-center gap-1.5 hover:text-ast-primary dark:hover:text-teal-300 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                  <span>{member.phone}</span>
                </a>
              )}

              {member.portfolioLink && (
                <a
                  href={member.portfolioLink.startsWith("http") ? member.portfolioLink : `https://${member.portfolioLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-ast-primary dark:text-ast-light font-semibold hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Portfolio & Réalisations</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <span className="font-mono text-[11px] text-ink-soft dark:text-teal-400/60 ml-auto">
                Inscrit le {formatDate(member.joinDate || member.created_at)}
              </span>
            </div>

            {/* Connected Accounts & Social Profiles */}
            <div className="mt-5 pt-4 border-t border-line dark:border-teal-900 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-300 font-display">
                  Réseaux & Profils Connectés
                </h4>
                {isSelf && (
                  <Link
                    href="/settings/connected-accounts"
                    className="text-[11px] font-semibold text-ast-primary dark:text-teal-400 hover:underline inline-flex items-center gap-1"
                  >
                    Gérer mes comptes →
                  </Link>
                )}
              </div>
              <SocialConnectionsList
                userId={member.id}
                isOwner={isSelf}
                currentUser={currentUser}
              />
            </div>

            {member.bio && (
              <div className="mt-5 pt-4 border-t border-line dark:border-teal-900">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-300 font-display mb-1">
                  Biographie & Présentation
                </h4>
                <p className="font-body text-xs text-ink dark:text-teal-100/90 leading-relaxed whitespace-pre-line">
                  {member.bio}
                </p>
              </div>
            )}

            {/* Skill tags */}
            {member.skills?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-line dark:border-teal-900">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-300 font-display mb-2">
                  Compétences & Outils Techniques
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="text-xs bg-teal-50 dark:bg-teal-950/80 text-teal-900 dark:text-teal-200 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-lg font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* GitHub Contributions & Live Developer Activity */}
        <GitHubContributionsCard
          userId={member.id}
          portfolioLink={member.portfolioLink}
          isOwner={isSelf}
        />

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                  Attendance Health
                </p>
                <h4 className="font-display font-bold text-2xl text-teal-900 mt-1">
                  {member.attendanceRate}%
                </h4>
                <p className="text-[11px] text-ink-soft font-body mt-0.5">
                  {member.attendedEvents} sessions attended
                </p>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-900">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                  Asteria Freelance PreLaunch
                </p>
                <h4 className="font-display font-bold text-base text-ink mt-1">
                  {member.freelanceReady ? "Qualified ★" : "In Progress"}
                </h4>
                <p className="text-[11px] text-ink-soft font-body mt-0.5">
                  {member.freelanceReady ? "Client contract certified" : "Under departmental mentor track"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-teal-400/20 border border-teal-400/40 text-teal-900">
                <Briefcase className="w-5 h-5" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body">
                  Sprint Tasks
                </p>
                <h4 className="font-display font-bold text-2xl text-ink mt-1">
                  {member.tasks?.length || 0}
                </h4>
                <p className="text-[11px] text-ink-soft font-body mt-0.5">
                  Active tickets assigned
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface-alt border border-line text-ink-soft">
                <Layers className="w-5 h-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tasks & Recent Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned Tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Sprint Tasks</CardTitle>
              <span className="text-xs text-ink-soft font-body">{member.tasks?.length || 0} Total</span>
            </CardHeader>
            <CardContent className="divide-y divide-line/60">
              {member.tasks?.length > 0 ? (
                member.tasks.map((t: any) => (
                  <div key={t.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <h5 className="font-body font-bold text-xs text-ink">{t.title}</h5>
                    </div>
                    <span className="text-[11px] text-ink-faint font-body whitespace-nowrap">
                      {formatDate(t.dueDate)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-soft text-center py-6">No tasks assigned.</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Event Check-Ins</CardTitle>
              <span className="text-xs text-ink-soft font-body">{member.recentAttendance?.length || 0} Logs</span>
            </CardHeader>
            <CardContent className="divide-y divide-line/60">
              {member.recentAttendance?.length > 0 ? (
                member.recentAttendance.map((rec: any) => (
                  <div key={rec.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div>
                      <h5 className="font-body font-bold text-xs text-ink">{rec.event?.title}</h5>
                      <p className="text-[11px] text-ink-soft font-body">
                        Method: <strong className="uppercase">{rec.method}</strong> • {formatDateTime(rec.checkedInAt)}
                      </p>
                      {rec.justification && (
                        <p className="text-[11px] text-amber-700 italic mt-0.5">
                          Justification: {rec.justification}
                        </p>
                      )}
                    </div>
                    <Badge variant={rec.status === "PRESENT" ? "success" : "warning"} size="sm">
                      {rec.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-xs text-ink-soft text-center py-6">No attendance records yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Feedback Banner */}
        {actionFeedback && (
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-body ${
              actionFeedback.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <span>{actionFeedback.message}</span>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="font-bold px-2 py-0.5 rounded hover:bg-black/5"
            >
              ✕
            </button>
          </div>
        )}

        {/* Executive Danger Zone */}
        {(currentUser?.role === "BOARD" || currentUser?.role === "PRESIDENT" || currentUser?.role === "VICE_PRESIDENT") && currentUser?.id !== member?.id && (
          <Card className="border-rose-200 bg-rose-50/20">
            <CardHeader className="border-b border-rose-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <CardTitle className="text-rose-900">Executive Account Moderation & Danger Zone</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-line">
                <div>
                  <h5 className="font-bold text-xs text-ink">Account Suspension & Ban</h5>
                  <p className="text-[11px] text-ink-soft">
                    {member.status === "INACTIVE" && (member.bio?.includes("[BANNED]") || member.status === "BANNED")
                      ? "This member account is currently banned and blocked from authenticating."
                      : "Suspend this member's credentials and revoke portal access immediately."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={member.status === "INACTIVE" && (member.bio?.includes("[BANNED]") || member.status === "BANNED") ? "secondary" : "danger"}
                  onClick={handleBanToggle}
                  isLoading={isBanning}
                  leftIcon={<Ban className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  {member.status === "INACTIVE" && (member.bio?.includes("[BANNED]") || member.status === "BANNED")
                    ? "Unban Member"
                    : "Ban / Suspend Account"}
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-surface border border-rose-200">
                <div>
                  <h5 className="font-bold text-xs text-rose-950">Permanent Account Deletion</h5>
                  <p className="text-[11px] text-ink-soft">
                    Permanently delete this user, their profile, credentials, and unlink all activities.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setIsDeleteModalOpen(true)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  Delete Account Permanently
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditError(null);
        }}
        title="Edit Member Dossier & Governance"
      >
        <div className="space-y-4">
          {editError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {editError}
            </div>
          )}

          {/* Photos: Avatar & Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-surface-alt/50 border border-line rounded-2xl">
            {/* Avatar upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink dark:text-teal-200 block">
                Photo de Profil (Avatar)
              </label>
              <div className="flex items-center gap-3">
                <Avatar name={editForm.name || "U"} src={editForm.avatarUrl} size="md" />
                <div className="flex-1">
                  <input
                    type="file"
                    ref={avatarInputRef}
                    onChange={(e) => handleUploadFile(e, "avatar")}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => avatarInputRef.current?.click()}
                    isLoading={isUploadingAvatar}
                    leftIcon={<Camera className="w-3.5 h-3.5" />}
                  >
                    {isUploadingAvatar ? "Téléversement..." : "Changer photo"}
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Ou URL directe (https://...)"
                value={editForm.avatarUrl}
                onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                className="text-xs"
              />
            </div>

            {/* Banner upload */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-ink dark:text-teal-200 block">
                Bannière de Couverture
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-10 rounded-lg overflow-hidden border border-line bg-gradient-to-r from-teal-950 to-teal-800 flex items-center justify-center flex-shrink-0">
                  {editForm.bannerUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editForm.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-white/50" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={bannerInputRef}
                    onChange={(e) => handleUploadFile(e, "banner")}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => bannerInputRef.current?.click()}
                    isLoading={isUploadingBanner}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    {isUploadingBanner ? "Téléversement..." : "Changer bannière"}
                  </Button>
                </div>
              </div>
              <Input
                placeholder="Ou URL directe (https://...)"
                value={editForm.bannerUrl}
                onChange={(e) => setEditForm({ ...editForm, bannerUrl: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Numéro de Téléphone"
              placeholder="+216 99 999 999"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />

            <Input
              label="Lien Portfolio / LinkedIn / GitHub"
              placeholder="https://mon-portfolio.dev"
              value={editForm.portfolioLink}
              onChange={(e) => setEditForm({ ...editForm, portfolioLink: e.target.value })}
            />
          </div>

          <Input
            label="Compétences Techniques (séparées par des virgules)"
            placeholder="React, TypeScript, Next.js, UI/UX Design, Supabase..."
            value={editForm.skills}
            onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
          />

          <Textarea
            label="Bio & Spécialisation"
            placeholder="Parlez-nous de vos projets, expériences et passions..."
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
          />

          {(currentUser?.role === "BOARD" || currentUser?.role === "PRESIDENT" || currentUser?.role === "VICE_PRESIDENT") && (
            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 font-mono">
                  ★ Executive Governance Controls
                </span>
                <span className="text-[10px] bg-teal-900 text-white px-2 py-0.5 rounded font-bold">
                  ADMIN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Role"
                  value={editForm.role}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    let nextTitle = editForm.boardTitle;
                    if (nextRole === "PRESIDENT" && !nextTitle) nextTitle = "President & Executive Lead";
                    if (nextRole === "VICE_PRESIDENT" && !nextTitle) nextTitle = "Vice President & Operations Lead";
                    if (nextRole === "BOARD" && !nextTitle) nextTitle = "Board Member — PR (Relations Publiques)";
                    setEditForm({ ...editForm, role: nextRole, boardTitle: nextTitle });
                  }}
                >
                  <option value="PRESIDENT">👑 President (PRESIDENT)</option>
                  <option value="VICE_PRESIDENT">⚜️ Vice President (VICE_PRESIDENT)</option>
                  <option value="BOARD">★ Executive Board (BOARD — PR/HR/CM/CRD)</option>
                  <option value="HOD">◆ Head of Department (HOD)</option>
                  <option value="MEMBER">● Active Member (MEMBER)</option>
                  <option value="WAITING_FOR_INTERVIEW">⏳ Waiting for Interview</option>
                  <option value="DECLINED">✕ Application Declined</option>
                  <option value="APPLICANT">○ Applicant (APPLICANT)</option>
                </Select>

                <Select
                  label="Department Division"
                  value={editForm.departmentId}
                  onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                >
                  <option value="">Club-Wide / General</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>

              {editForm.role === "BOARD" && (
                <div className="space-y-2 p-3 bg-white/80 rounded-xl border border-teal-200">
                  <label className="text-[11px] font-mono uppercase tracking-wider text-teal-900 font-bold block">
                    Board Track Selection:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, boardTitle: "Board Member — PR (Relations Publiques)" })}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        editForm.boardTitle?.includes("PR")
                          ? "bg-teal-900 text-white border-teal-900 font-bold"
                          : "bg-surface hover:bg-surface-alt border-line text-ink"
                      }`}
                    >
                      <p className="font-bold">📢 PR</p>
                      <p className="text-[10px] opacity-80">Public Relations</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, boardTitle: "Board Member — HR (Ressources Humaines)" })}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        editForm.boardTitle?.includes("HR")
                          ? "bg-teal-900 text-white border-teal-900 font-bold"
                          : "bg-surface hover:bg-surface-alt border-line text-ink"
                      }`}
                    >
                      <p className="font-bold">🤝 HR</p>
                      <p className="text-[10px] opacity-80">Human Resources</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, boardTitle: "Board Member — CM (Community Management)" })}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        editForm.boardTitle?.includes("CM")
                          ? "bg-teal-900 text-white border-teal-900 font-bold"
                          : "bg-surface hover:bg-surface-alt border-line text-ink"
                      }`}
                    >
                      <p className="font-bold">📱 CM</p>
                      <p className="text-[10px] opacity-80">Community Management</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditForm({ ...editForm, boardTitle: "Board Member — CRD (Relations Entreprises & Sponsoring)" })}
                      className={`p-2 rounded-lg text-left text-xs border transition-all ${
                        editForm.boardTitle?.includes("CRD")
                          ? "bg-teal-900 text-white border-teal-900 font-bold"
                          : "bg-surface hover:bg-surface-alt border-line text-ink"
                      }`}
                    >
                      <p className="font-bold">💼 CRD</p>
                      <p className="text-[10px] opacity-80">Corporate Relations</p>
                    </button>
                  </div>

                  <Input
                    label="Board Seat Title"
                    placeholder="e.g. Head of Public Relations..."
                    value={editForm.boardTitle}
                    onChange={(e) => setEditForm({ ...editForm, boardTitle: e.target.value })}
                    className="mt-2"
                  />
                </div>
              )}

              {(editForm.role === "PRESIDENT" || editForm.role === "VICE_PRESIDENT") && (
                <Input
                  label="Executive Seat Title"
                  value={editForm.boardTitle}
                  onChange={(e) => setEditForm({ ...editForm, boardTitle: e.target.value })}
                />
              )}
            </div>
          )}

          <Select
            label="Club Status"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
          >
            <option value="ACTIVE">Active Member</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ALUMNI">Alumni</option>
          </Select>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="freelanceCheck"
              checked={editForm.freelanceReady}
              onChange={(e) => setEditForm({ ...editForm, freelanceReady: e.target.checked })}
              className="w-4 h-4 text-teal-900 rounded border-line focus:ring-teal-400"
            />
            <label htmlFor="freelanceCheck" className="text-xs font-bold font-body text-ink cursor-pointer">
              Certify as Asteria Freelance PreLaunch Ready
            </label>
          </div>

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsEditOpen(false);
                setEditError(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              isLoading={isSaving}
              disabled={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          if (!isDeleting) setIsDeleteModalOpen(false);
        }}
        title="Permanently Delete Member Account"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h5 className="font-bold text-sm text-rose-950 font-display uppercase tracking-wide">
                Warning: Irreversible Deletion!
              </h5>
              <p className="leading-relaxed">
                You are about to permanently delete <strong>{member.name}</strong> ({member.email}). All their credentials, portfolio bio, and attendance associations will be permanently purged.
              </p>
            </div>
          </div>

          <p className="text-xs text-ink-soft">
            Are you sure you want to proceed with permanent account deletion? This action cannot be undone.
          </p>

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteMember}
              isLoading={isDeleting}
              disabled={isDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
