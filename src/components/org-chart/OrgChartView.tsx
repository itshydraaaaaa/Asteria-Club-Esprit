"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge, RoleBadge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  Shield,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Code2,
  Palette,
  Video,
  Camera,
} from "lucide-react";

export function OrgChartView() {
  const [data, setData] = useState<{ board: any[]; departments: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/departments/org-chart")
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        if (res.departments && res.departments.length > 0) {
          setExpandedDept(res.departments[0].id); // Expand first department by default
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-ink-soft">
        <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="font-display font-semibold text-xs uppercase tracking-wider">
          Rendering Club Org Chart...
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 animate-vague-in">
      {/* Tier 1: Executive Board Level */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="h-[1px] w-12 bg-line" />
          <span className="font-display font-bold text-xs uppercase tracking-widest text-teal-900 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            ★ Tier 1 — Executive Board
          </span>
          <div className="h-[1px] w-12 bg-line" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {data.board.map((seat) => (
            <Card
              key={seat.id}
              hoverable
              className="p-4 bg-surface border-teal-900/20 text-center relative overflow-hidden group shadow-sm"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-900 to-teal-400" />
              <div className="pt-2">
                <Avatar
                  name={seat.user.name}
                  src={seat.user.avatarUrl}
                  size="lg"
                  className="mx-auto shadow group-hover:scale-105 transition-transform"
                />
                <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink mt-3">
                  {seat.user.name}
                </h4>
                <p className="font-body font-bold text-xs text-teal-900 mt-0.5">
                  {seat.title}
                </p>
                <p className="text-[11px] text-ink-soft font-body mt-2 line-clamp-2">
                  {seat.user.bio}
                </p>
                <div className="mt-3 pt-2 border-t border-line/60 flex justify-center">
                  <Link href={`/members/${seat.user.id}`}>
                    <Button variant="ghost" size="sm" className="text-[11px] h-7">
                      Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Visual Connector Line */}
      <div className="flex justify-center">
        <div className="w-0.5 h-8 bg-line" />
      </div>

      {/* Tier 2: Heads of Department & Member Clusters */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2">
          <div className="h-[1px] w-12 bg-line" />
          <span className="font-display font-bold text-xs uppercase tracking-widest text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            ◆ Tier 2 — Department Heads & Active Rosters
          </span>
          <div className="h-[1px] w-12 bg-line" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {data.departments.map((dept) => {
            const isExpanded = expandedDept === dept.id;
            return (
              <Card
                key={dept.id}
                className="overflow-hidden border border-line bg-surface shadow-sm"
              >
                {/* Department Header */}
                <div className="p-5 bg-surface-alt/80 border-b border-line flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-teal-900 text-white shadow-sm">
                      {dept.slug === "web-development" ? (
                        <Code2 className="w-5 h-5" />
                      ) : dept.slug === "graphic-design" ? (
                        <Palette className="w-5 h-5" />
                      ) : dept.slug === "video-editing" ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-sm uppercase tracking-wider text-ink">
                        {dept.name}
                      </h4>
                      <span className="text-[11px] text-ink-soft font-body">
                        {dept.members.length + (dept.hod ? 1 : 0)} Trained Asterians
                      </span>
                    </div>
                  </div>

                  <Link href={`/departments/${dept.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Hub <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>

                <div className="p-5 space-y-4">
                  {/* HoD Node */}
                  {dept.hod && (
                    <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={dept.hod.name} src={dept.hod.avatarUrl} size="md" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-display font-bold text-xs uppercase text-ink">
                              {dept.hod.name}
                            </span>
                            <Badge variant="accent" size="sm">
                              HoD
                            </Badge>
                          </div>
                          <p className="text-[11px] text-ink-soft font-body">
                            Head of Department & Technical Mentor
                          </p>
                        </div>
                      </div>
                      <Link href={`/members/${dept.hod.id}`}>
                        <Button variant="secondary" size="sm" className="text-[11px] h-7">
                          View
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Members Grid */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                      className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-soft font-body hover:text-ink transition-colors py-1"
                    >
                      <span>Active Members ({dept.members.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-vague-in">
                        {dept.members.map((m: any) => (
                          <Link
                            key={m.id}
                            href={`/members/${m.id}`}
                            className="p-2.5 rounded-xl border border-line bg-surface-alt/40 hover:bg-surface-alt flex items-center justify-between gap-2 transition-colors group"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <Avatar name={m.name} src={m.avatarUrl} size="sm" />
                              <div className="overflow-hidden">
                                <p className="font-body font-bold text-xs text-ink truncate group-hover:text-teal-900">
                                  {m.name}
                                </p>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {m.freelanceReady && (
                                    <span className="text-[9px] font-bold font-body text-teal-900 bg-teal-400/30 px-1 rounded">
                                      ★ Freelance
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
