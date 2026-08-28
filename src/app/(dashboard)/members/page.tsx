"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { Search, Filter, Users, Briefcase, Award, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("all");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((res) => setDepartments(res.departments || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams({
      search,
      departmentId,
      role,
      status,
    });
    fetch(`/api/members?${query.toString()}`)
      .then((res) => res.json())
      .then((res) => setMembers(res.members || []))
      .finally(() => setLoading(false));
  }, [search, departmentId, role, status]);

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Member Directory"
        subtitle="Search club members, board seats, department leads, and freelance-ready talent"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {/* Filters Bar */}
        <Card className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search by name, email, skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />

            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="all">All Roles</option>
              <option value="BOARD">Executive Board</option>
              <option value="HOD">Head of Department</option>
              <option value="MEMBER">Active Member</option>
              <option value="APPLICANT">Applicant</option>
            </Select>

            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ALUMNI">Alumni</option>
            </Select>
          </div>
        </Card>

        {/* Members Grid */}
        {loading ? (
          <div className="p-12 text-center text-ink-soft">
            <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="font-display text-xs uppercase tracking-wider">Loading Directory...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center text-ink-soft bg-surface rounded-2xl border border-line">
            <Users className="w-10 h-10 text-ink-faint mx-auto mb-2" />
            <h4 className="font-display font-bold text-sm text-ink uppercase">No Members Found</h4>
            <p className="text-xs text-ink-soft mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-vague-in">
            {members.map((member) => (
              <Card
                key={member.id}
                hoverable
                className="p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <Avatar name={member.name} src={member.avatarUrl} size="lg" />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-body font-bold text-sm text-ink truncate">
                          {member.name}
                        </h4>
                        <RoleBadge role={member.role} />
                      </div>
                      <p className="text-xs text-ink-soft font-body truncate mt-0.5">
                        {member.email}
                      </p>
                      {member.departmentName && (
                        <p className="text-[11px] font-semibold text-teal-900 mt-1">
                          {member.departmentName}
                        </p>
                      )}
                    </div>
                  </div>

                  {member.bio && (
                    <p className="text-xs text-ink-soft font-body mt-3 line-clamp-2 leading-relaxed">
                      {member.bio}
                    </p>
                  )}

                  {/* Skills badges */}
                  {member.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {member.skills.slice(0, 4).map((s: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-surface-alt text-ink-soft px-2 py-0.5 rounded border border-line"
                        >
                          {s}
                        </span>
                      ))}
                      {member.skills.length > 4 && (
                        <span className="text-[10px] text-ink-faint px-1">
                          +{member.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-line/60 flex items-center justify-between">
                  <div>
                    {member.freelanceReady ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-900 bg-teal-400/20 px-2 py-0.5 rounded border border-teal-400/40">
                        ★ Freelance Ready
                      </span>
                    ) : (
                      <span className="text-[10px] text-ink-faint">
                        Joined {formatDate(member.joinDate)}
                      </span>
                    )}
                  </div>

                  <Link href={`/members/${member.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
