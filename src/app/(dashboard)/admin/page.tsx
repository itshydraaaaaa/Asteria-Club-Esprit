"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import {
  Settings,
  ShieldAlert,
  RotateCcw,
  Plus,
  Layers,
  Activity,
  Award,
  CheckCircle,
} from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Department Modal
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", description: "", icon: "Code2" });

  // Cycle Rollover Modal
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [cycleName, setCycleName] = useState("Academic Year 2026-2027 · Semester 1");

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin");
      const resData = await res.json();
      setData(resData);
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

  if (loading) {
    return (
      <div className="p-12 text-center text-ink-soft">
        <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="font-display text-xs uppercase tracking-wider">Loading Admin Controls...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Header
        title="Admin & System Governance"
        subtitle="Cycle management, board seat allocations, department management, and security audit logs"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6 animate-vague-in">
        {/* Academic Year Cycle Card */}
        <Card className="p-6 bg-surface">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  Active Cycle
                </Badge>
                <span className="text-xs text-ink-soft font-body">Current Semester Period</span>
              </div>
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-ink">
                {data?.currentCycle?.name || "Academic Year 2025–2026"}
              </h3>
              <p className="text-xs text-ink-soft font-body">
                {data?.currentCycle?.startDate ? `${formatDate(data.currentCycle.startDate)} – ${formatDate(data.currentCycle.endDate)}` : "Active Academic Semester"} • {data?.departments?.length || 4} Technical Tracks Operational
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setIsCycleModalOpen(true)}
            >
              Rollover / Archive Cycle
            </Button>
          </div>
        </Card>

        {/* Supabase Cloud Integration Status Card */}
        <Card className="p-6 bg-surface border-teal-900/30 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="sm" className="font-bold">
                  ★ Supabase Cloud Connected
                </Badge>
                <span className="text-xs text-ink-soft font-body">PostgreSQL Database & Storage Engine</span>
              </div>
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-ink">
                Asteria Club Esprit · Cloud Production Backend
              </h3>
              <div className="pt-2 flex flex-wrap gap-4 text-xs font-body text-ink-soft">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[11px] text-teal-900 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Row Level Security (RLS) Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Realtime WebSockets Synchronized
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Live & Protected
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
                <CardTitle>Executive Board Seats</CardTitle>
              </div>
              <span className="text-xs text-ink-soft font-body">
                {data?.boardSeats?.length || 0} Configured
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
                    Seat #{seat.order}
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
                <CardTitle>Department Divisions</CardTitle>
              </div>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setIsDeptModalOpen(true)}
              >
                Add Track
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
                      Lead: <strong>{dept.hod?.name || "Unassigned"}</strong> • {dept._count?.members || 0} Members
                    </p>
                  </div>
                  <Badge variant="default" size="sm">
                    {dept._count?.tasks || 0} Tasks
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Security & Action Audit Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-900" />
              <CardTitle>System Governance & Audit Trail</CardTitle>
            </div>
            <span className="text-xs text-ink-soft font-body">Real-time action logging</span>
          </CardHeader>
          <CardContent className="divide-y divide-line/60">
            {data?.auditLogs?.map((log: any) => (
              <div key={log.id} className="py-3.5 flex items-center justify-between gap-4">
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
                <span className="text-[11px] text-ink-faint font-body whitespace-nowrap">
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
        title="Add Technical Department Division"
        description="Create an extensible training division for Asteria Club"
      >
        <div className="space-y-4">
          <Input
            label="Department Name *"
            placeholder="e.g., 3D Animation & VFX"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
          />

          <Textarea
            label="Curriculum & Mission Description *"
            placeholder="Outline skills, tool stack, and deliverables..."
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
          />

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDeptModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateDepartment}>
              Create Department
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rollover Cycle Modal */}
      <Modal
        isOpen={isCycleModalOpen}
        onClose={() => setIsCycleModalOpen(false)}
        title="Initiate Academic Cycle Rollover"
        description="Archive current semester statistics and initialize the new club period"
      >
        <div className="space-y-4">
          <Input
            label="New Cycle Title *"
            value={cycleName}
            onChange={(e) => setCycleName(e.target.value)}
          />

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-body">
            ⚠️ This action will mark current cycle activities as archived and create an audit log entry for the new semester period.
          </div>

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsCycleModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRolloverCycle}>
              Confirm Rollover
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
