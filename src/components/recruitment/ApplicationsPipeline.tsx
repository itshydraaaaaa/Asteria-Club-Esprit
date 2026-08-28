"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  UserPlus,
  ExternalLink,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  Phone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { formatDate } from "@/lib/utils";

interface ApplicationsPipelineProps {
  currentUser: any;
}

export function ApplicationsPipeline({ currentUser }: ApplicationsPipelineProps) {
  const [applications, setApplications] = useState<any[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Review Modal
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [onboardingSuccess, setOnboardingSuccess] = useState<string | null>(null);

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

  const handleUpdateStatus = async (id: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewerNotes }),
      });
      if (res.ok) {
        setSelectedApp(null);
        fetchApplications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAutoOnboard = async (id: string) => {
    try {
      const res = await fetch(`/api/applications/${id}/onboard`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setOnboardingSuccess(data.message);
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

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Top Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-44 text-xs py-1.5"
            >
              <option value="all">All Application Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </Select>

            <Select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-48 text-xs py-1.5"
            >
              <option value="all">All Preferred Departments</option>
              <option value="Web Development">Web Development</option>
              <option value="Graphic Design">Graphic Design</option>
              <option value="Video Editing">Video Editing</option>
              <option value="Photography">Photography</option>
            </Select>
          </div>

          <div className="text-xs text-ink-soft font-body">
            <strong>{applications.length}</strong> Applicants in Review Pipeline
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
                        : app.status === "REJECTED"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {app.status}
                  </Badge>
                  <span className="text-[11px] text-ink-faint font-body">
                    {formatDate(app.createdAt)}
                  </span>
                </div>

                <div>
                  <h3 className="font-body font-bold text-base text-ink">{app.name}</h3>
                  <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-0.5 font-body">
                    <Mail className="w-3.5 h-3.5 text-ink-faint" /> {app.email}
                  </p>
                  {app.phone && (
                    <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-0.5 font-body">
                      <Phone className="w-3.5 h-3.5 text-ink-faint" /> {app.phone}
                    </p>
                  )}
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
              <div className="pt-4 border-t border-line/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setSelectedApp(app);
                    setReviewerNotes(app.reviewerNotes || "");
                  }}
                >
                  Review Dossier
                </Button>

                {currentUser?.role === "BOARD" && app.status !== "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="accent"
                    className="text-xs font-bold"
                    onClick={() => handleAutoOnboard(app.id)}
                  >
                    ★ 1-Click Onboard
                  </Button>
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
              <div className="flex justify-between">
                <span className="font-bold text-ink">Applicant Email:</span>
                <span>{selectedApp.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-ink">Preferred Department:</span>
                <span className="font-semibold text-teal-900">{selectedApp.departmentPreference}</span>
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
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleUpdateStatus(selectedApp.id, "REJECTED")}
              >
                Reject Application
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus(selectedApp.id, "ACCEPTED")}
                >
                  Mark Accepted
                </Button>
                {currentUser?.role === "BOARD" && (
                  <Button
                    variant="accent"
                    size="sm"
                    className="font-bold"
                    onClick={() => handleAutoOnboard(selectedApp.id)}
                  >
                    Accept & Auto-Onboard Account
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
