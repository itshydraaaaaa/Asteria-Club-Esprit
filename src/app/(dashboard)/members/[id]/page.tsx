"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function MemberProfilePage() {
  const params = useParams();
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
    status: "ACTIVE",
    role: "MEMBER",
    departmentId: "",
    boardTitle: "",
    freelanceReady: false,
  });

  const fetchMember = () => {
    if (!id) return;
    fetch(`/api/members/${id}`)
      .then((res) => res.json())
      .then((res) => {
        setMember(res.member);
        if (res.member) {
          setEditForm({
            name: res.member.name,
            bio: res.member.bio || "",
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

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
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
        <Card className="p-6 sm:p-8 bg-surface">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              <Avatar name={member.name} src={member.avatarUrl} size="xl" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-wider text-ink">
                    {member.name}
                  </h2>
                  <RoleBadge role={member.role} />
                  <Badge variant={member.status === "ACTIVE" ? "success" : "neutral"}>
                    {member.status}
                  </Badge>
                </div>

                <p className="font-body text-xs text-ink-soft flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-ink-faint" /> {member.email}
                </p>

                {member.department && (
                  <p className="font-body font-semibold text-xs text-teal-900">
                    Division:{" "}
                    <Link href={`/departments/${member.department.id}`} className="hover:underline">
                      {member.department.name}
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Profile
            </Button>
          </div>

          {member.bio && (
            <div className="mt-6 pt-5 border-t border-line">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body mb-1">
                About / Biography
              </h4>
              <p className="font-body text-xs text-ink leading-relaxed">
                {member.bio}
              </p>
            </div>
          )}

          {/* Skill tags */}
          {member.skills?.length > 0 && (
            <div className="mt-5 pt-4 border-t border-line">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-soft font-body mb-2">
                Technical Skills & Tools
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {member.skills.map((s: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-1 rounded-lg font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

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

          <Input
            label="Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />

          <Textarea
            label="Bio & Specialization"
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
          />

          {currentUser?.role === "BOARD" && (
            <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-900 font-mono">
                  ★ Board Governance Controls
                </span>
                <span className="text-[10px] bg-teal-900 text-white px-2 py-0.5 rounded font-bold">
                  ADMIN
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Role"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="BOARD">Executive Board (BOARD)</option>
                  <option value="HOD">Head of Department (HOD)</option>
                  <option value="MEMBER">Active Member (MEMBER)</option>
                  <option value="APPLICANT">Applicant (APPLICANT)</option>
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
                <Input
                  label="Board Seat Title (Optional)"
                  placeholder="e.g. President, Vice President, Treasurer..."
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
    </div>
  );
}
