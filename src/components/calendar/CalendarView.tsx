"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Users,
  QrCode,
} from "lucide-react";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface CalendarViewProps {
  currentUser: any;
}

export function CalendarView({ currentUser }: CalendarViewProps) {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [events, setEvents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // New Event Modal
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [newEventForm, setNewEventForm] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
    departmentId: "",
    checkInCode: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (scopeFilter !== "all") {
        if (scopeFilter === "club") query.set("scope", "club");
        else if (scopeFilter === "my") query.set("scope", "my");
        else query.set("departmentId", scopeFilter);
      }
      const res = await fetch(`/api/events?${query.toString()}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((r) => setDepartments(r.departments || []));
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [scopeFilter]);

  const handleCreateEvent = async () => {
    if (!newEventForm.title || !newEventForm.startTime || !newEventForm.endTime || !newEventForm.location) {
      return;
    }
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEventForm,
          departmentId: newEventForm.departmentId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsNewEventOpen(false);
        setConflictWarning(null);
        setNewEventForm({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          location: "",
          departmentId: "",
          checkInCode: "",
        });
        fetchEvents();
      } else if (data.conflictWarning) {
        setConflictWarning(
          `Schedule conflict detected with existing event in ${newEventForm.location}.`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRsvp = async (eventId: string, status: "GOING" | "MAYBE" | "DECLINED") => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchEvents();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-vague-in">
      {/* Top Filter & Create Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setScopeFilter("all")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                scopeFilter === "all"
                  ? "bg-teal-900 text-white border-teal-900"
                  : "bg-surface-alt text-ink-soft border-line hover:text-ink"
              }`}
            >
              {isFr ? "Tous les Événements" : "All Events"}
            </button>
            <button
              onClick={() => setScopeFilter("my")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                scopeFilter === "my"
                  ? "bg-teal-900 text-white border-teal-900"
                  : "bg-surface-alt text-ink-soft border-line hover:text-ink"
              }`}
            >
              {isFr ? "Mes Événements" : "My Events"}
            </button>
            <button
              onClick={() => setScopeFilter("club")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold font-body border transition-all ${
                scopeFilter === "club"
                  ? "bg-teal-900 text-white border-teal-900"
                  : "bg-surface-alt text-ink-soft border-line hover:text-ink"
              }`}
            >
              {isFr ? "Assemblées Générales" : "Club-Wide Assemblies"}
            </button>

            <Select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="w-48 text-xs py-1.5"
            >
              <option value="all">{isFr ? "Filtrer par pôle..." : "Filter Department..."}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {isFr ? "Uniquement" : "Only"}
                </option>
              ))}
            </Select>
          </div>

          {(currentUser?.role === "BOARD" || currentUser?.role === "HOD") && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsNewEventOpen(true)}
            >
              {isFr ? "Planifier un Événement" : "Schedule Event"}
            </Button>
          )}
        </div>
      </Card>

      {/* Events List Cards */}
      {loading ? (
        <div className="p-12 text-center text-ink-soft">
          <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="font-display text-xs uppercase tracking-wider">Loading Events Schedule...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center text-ink-soft bg-surface rounded-2xl border border-line">
          <CalendarIcon className="w-10 h-10 text-ink-faint mx-auto mb-2" />
          <h4 className="font-display font-bold text-sm text-ink uppercase">No Scheduled Sessions</h4>
          <p className="text-xs text-ink-soft mt-1">Check back later or schedule a new workshop.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-vague-in">
          {events.map((evt) => {
            const userRsvp = evt.rsvps?.find((r: any) => r.userId === currentUser?.id);
            const goingCount = evt.rsvps?.filter((r: any) => r.status === "GOING").length || 0;
            const maybeCount = evt.rsvps?.filter((r: any) => r.status === "MAYBE").length || 0;

            return (
              <Card key={evt.id} hoverable className="p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={evt.department ? "accent" : "primary"}>
                      {evt.department ? evt.department.name : "Club-Wide Assembly"}
                    </Badge>
                    <span className="text-xs font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-mono">
                      Code: {evt.checkInCode}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-base uppercase tracking-wider text-ink">
                    {evt.title}
                  </h3>

                  <p className="font-body text-xs text-ink-soft leading-relaxed">
                    {evt.description}
                  </p>

                  <div className="space-y-1.5 pt-2 text-xs text-ink-soft font-body">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-900 flex-shrink-0" />
                      <span>{formatDateTime(evt.startTime)} — {formatTime(evt.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-900 flex-shrink-0" />
                      <span>{evt.location}</span>
                    </div>
                  </div>

                  {/* Attendees RSVP list preview */}
                  <div className="pt-2 flex items-center justify-between text-xs text-ink-soft font-body">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-ink-faint" />
                      <span>
                        <strong>{goingCount}</strong> Going • <strong>{maybeCount}</strong> Maybe
                      </span>
                    </div>
                    <div className="flex -space-x-1.5">
                      {evt.rsvps?.slice(0, 4).map((r: any, idx: number) => (
                        <Avatar
                          key={idx}
                          name={r.user?.name}
                          src={r.user?.avatarUrl}
                          size="xs"
                          className="border-2 border-surface"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* RSVP Action Bar */}
                <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRsvp(evt.id, "GOING")}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold font-body border transition-all ${
                        userRsvp?.status === "GOING"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-surface-alt text-ink-soft border-line hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Going
                    </button>
                    <button
                      onClick={() => handleRsvp(evt.id, "MAYBE")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-body border transition-all ${
                        userRsvp?.status === "MAYBE"
                          ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                          : "bg-surface-alt text-ink-soft border-line hover:bg-amber-50 hover:text-amber-700"
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Maybe
                    </button>
                    <button
                      onClick={() => handleRsvp(evt.id, "DECLINED")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold font-body border transition-all ${
                        userRsvp?.status === "DECLINED"
                          ? "bg-red-500 text-white border-red-500 shadow-sm"
                          : "bg-surface-alt text-ink-soft border-line hover:bg-red-50 hover:text-red-700"
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>

                  <Link href="/attendance">
                    <Button variant="outline" size="sm" className="text-xs" leftIcon={<QrCode className="w-3.5 h-3.5" />}>
                      Check-In
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Event Modal */}
      <Modal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        title="Schedule Club or Department Event"
        description="Check for classroom and schedule conflicts automatically"
      >
        <div className="space-y-4">
          {conflictWarning && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-body flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{conflictWarning}</span>
            </div>
          )}

          <Input
            label="Event Title *"
            placeholder="e.g. Next.js Full-Stack Architecture Workshop"
            value={newEventForm.title}
            onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
          />

          <Textarea
            label="Agenda & Details"
            placeholder="Key topics, prerequisites, and preparation materials..."
            value={newEventForm.description}
            onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="datetime-local"
              label="Start Time *"
              value={newEventForm.startTime}
              onChange={(e) => setNewEventForm({ ...newEventForm, startTime: e.target.value })}
            />

            <Input
              type="datetime-local"
              label="End Time *"
              value={newEventForm.endTime}
              onChange={(e) => setNewEventForm({ ...newEventForm, endTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Location / Room *"
              placeholder="e.g., Lab 3.4 / Amphithéâtre B"
              value={newEventForm.location}
              onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
            />

            <Select
              label="Scope / Department"
              value={newEventForm.departmentId}
              onChange={(e) => setNewEventForm({ ...newEventForm, departmentId: e.target.value })}
            >
              <option value="">Club-Wide (All Departments)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Custom Check-in Code (Optional)"
            placeholder="e.g., AST-WORK26"
            value={newEventForm.checkInCode}
            onChange={(e) => setNewEventForm({ ...newEventForm, checkInCode: e.target.value })}
          />

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsNewEventOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreateEvent}>
              Schedule Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
