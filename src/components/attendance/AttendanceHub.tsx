"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  QrCode,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Users,
  Sparkles,
  Download,
  CalendarCheck,
} from "lucide-react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { formatDate, formatDateTime } from "@/lib/utils";
import { BRAND_COLORS } from "@/lib/constants";

interface AttendanceHubProps {
  currentUser: any;
}

export function AttendanceHub({ currentUser }: AttendanceHubProps) {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [activeTab, setActiveTab] = useState<"checkin" | "history">("checkin");
  const [events, setEvents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [checkInCodeInput, setCheckInCodeInput] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [checkInStatus, setCheckInStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Justification Modal
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);
  const [justifyEventId, setJustifyEventId] = useState("");
  const [justificationNote, setJustificationNote] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, recRes] = await Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/attendance").then((r) => r.json()),
      ]);

      const evts = evtRes.events || [];
      setEvents(evts);
      setRecords(recRes.records || []);

      if (evts.length > 0) {
        setSelectedEventId((prev) => prev || evts[0].id);
        generateQr(evts[0].checkInCode);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useRealtimeSubscription({
    channelName: "attendance_realtime",
    table: "attendance_records",
    broadcastEvent: "attendance_updated",
    onUpdate: fetchData,
  });

  const generateQr = async (code: string) => {
    try {
      const url = await QRCode.toDataURL(code, {
        width: 260,
        margin: 2,
        color: {
          dark: BRAND_COLORS.primary, // ast-primary brand color
          light: BRAND_COLORS.surface,
        },
      });
      setQrDataUrl(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEventSelect = (evtId: string) => {
    setSelectedEventId(evtId);
    const evt = events.find((e) => e.id === evtId);
    if (evt) {
      generateQr(evt.checkInCode);
    }
  };

  const handleCodeCheckIn = async (codeToUse?: string) => {
    const code = codeToUse || checkInCodeInput;
    if (!code) return;

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, method: "CODE" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckInStatus({ type: "success", message: data.message });
        setCheckInCodeInput("");
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#11606E", "#60C8D4", "#0A3A40"],
        });
        fetchData();
      } else {
        setCheckInStatus({ type: "error", message: data.error });
      }
    } catch {
      setCheckInStatus({ type: "error", message: "Check-in failed." });
    }
  };

  const handleSimulateQrScan = async (code: string) => {
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, method: "QR" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckInStatus({ type: "success", message: data.message });
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#11606E", "#60C8D4", "#0A3A40"],
        });
        fetchData();
      } else {
        setCheckInStatus({ type: "error", message: data.error });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitJustification = async () => {
    if (!justifyEventId || !justificationNote) return;
    try {
      const res = await fetch("/api/attendance/justify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: justifyEventId,
          justification: justificationNote,
        }),
      });
      if (res.ok) {
        setIsJustifyOpen(false);
        setJustificationNote("");
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const eventAttendanceRecords = records.filter((r) => r.eventId === selectedEventId);

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Justification CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            { id: "checkin", label: isFr ? "Portail de Présence" : "Check-In Portal", icon: <QrCode className="w-3.5 h-3.5" /> },
            { id: "history", label: isFr ? "Vérification des Présences" : "Attendance Verification", count: records.length, icon: <Clock className="w-3.5 h-3.5" /> },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />

        <Button
          size="sm"
          variant="outline"
          leftIcon={<FileText className="w-3.5 h-3.5" />}
          onClick={() => setIsJustifyOpen(true)}
        >
          {t("attendance.justify", "Submit Absence Justification")}
        </Button>
      </div>

      {checkInStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-body animate-vague-in ${
            checkInStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {checkInStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{checkInStatus.message}</span>
          </div>
          <button
            onClick={() => setCheckInStatus(null)}
            className="text-ink-soft hover:text-ink text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Check-in Portal */}
      {activeTab === "checkin" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Host Console with QR Generator */}
          <Card className="p-6 space-y-5 bg-surface/90 backdrop-blur-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  Host Console
                </Badge>
                <span className="text-xs text-ink-soft font-body">Real-Time Event Pass</span>
              </div>
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-ink">
                Dynamic QR Attendance Code
              </h3>
              <p className="font-body text-xs text-ink-soft">
                Project this QR code on screen during workshops or club assemblies for instant check-in.
              </p>
            </div>

            {/* Event Selector */}
            <Select
              label="Active Session"
              value={selectedEventId}
              onChange={(e) => handleEventSelect(e.target.value)}
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.department ? evt.department.name : "Club-Wide"})
                </option>
              ))}
            </Select>

            {/* QR Card Visual */}
            {selectedEvent ? (
              <div className="p-6 bg-surface-alt border border-line rounded-2xl flex flex-col items-center justify-center space-y-4 shadow-sm">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="Event QR Code"
                    className="w-52 h-52 rounded-2xl shadow-md border-4 border-surface"
                  />
                )}

                <div className="text-center space-y-1">
                  <span className="text-[10px] uppercase font-bold text-ink-faint font-display">
                    Numeric Passcode
                  </span>
                  <p className="font-mono text-xl font-bold tracking-widest text-ast-primary bg-teal-50 px-4 py-1.5 rounded-xl border border-teal-200 inline-block">
                    {selectedEvent.checkInCode}
                  </p>
                </div>

                <div className="text-xs text-ink-soft font-body flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-ast-primary" />
                  <span>
                    <strong>{eventAttendanceRecords.length}</strong> Attendees Checked In Live
                  </span>
                </div>

                <Button
                  size="sm"
                  variant="accent"
                  className="text-xs font-bold"
                  onClick={() => handleSimulateQrScan(selectedEvent.checkInCode)}
                >
                  {isFr ? "⚡ Tester l'Émargement Immédiat (Démo QR)" : "⚡ Quick Test Check-In (Demo QR)"}
                </Button>
              </div>
            ) : (
              <EmptyState
                icon={CalendarCheck}
                title="No Active Events"
                description="Schedule a workshop or general assembly from the calendar to generate dynamic check-in codes."
              />
            )}
          </Card>

          {/* Member Manual Passcode Entry */}
          <Card className="p-6 space-y-5 bg-surface/90 backdrop-blur-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="sm">
                  Member Portal
                </Badge>
                <span className="text-xs text-ink-soft font-body">Manual Verification</span>
              </div>
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-ink">
                Enter 6-Digit Passcode
              </h3>
              <p className="font-body text-xs text-ink-soft">
                Enter the passcode displayed on the presentation screen or provided by your department lead.
              </p>
            </div>

            <div className="p-6 bg-surface-alt border border-line rounded-2xl space-y-4 shadow-sm">
              <Input
                label="Enter Event Passcode"
                placeholder="e.g. AST-2026 / WEB-DEV26"
                value={checkInCodeInput}
                onChange={(e) => setCheckInCodeInput(e.target.value.toUpperCase())}
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="text-center font-mono font-bold tracking-widest text-base py-3 uppercase"
              />

              <Button
                variant="primary"
                className="w-full"
                onClick={() => handleCodeCheckIn()}
                disabled={!checkInCodeInput.trim()}
              >
                Confirm Attendance Check-In
              </Button>
            </div>

            {/* Available Codes Shortcut */}
            {events.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold uppercase text-ink-faint font-display block mb-2">
                  Active Session Codes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {events.slice(0, 3).map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => handleCodeCheckIn(evt.checkInCode)}
                      className="text-xs font-mono bg-surface border border-line hover:border-ast-light px-2.5 py-1 rounded-lg text-ast-primary transition-colors"
                    >
                      {evt.checkInCode} ({evt.department ? evt.department.name.slice(0, 3) : "Club"})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Attendance Verification Table */}
      {activeTab === "history" && (
        <Card className="bg-surface/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Attendance Log & Verification Audit</CardTitle>
            <span className="text-xs text-ink-soft font-mono">{records.length} Total Check-ins</span>
          </CardHeader>
          <CardContent className="divide-y divide-line/60">
            {records.length > 0 ? (
              records.map((rec) => (
                <div key={rec.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <Avatar name={rec.user?.name} src={rec.user?.avatarUrl} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-body font-bold text-sm text-ink">{rec.user?.name}</h4>
                        <Badge variant="primary" size="sm">
                          {rec.user?.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-ink-soft font-body mt-0.5">
                        Session: <strong>{rec.event?.title}</strong>
                      </p>
                      {rec.justification && (
                        <p className="text-[11px] text-amber-800 font-body italic mt-0.5">
                          Absence Justification: &quot;{rec.justification}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[10px] font-mono font-bold bg-surface-alt px-2 py-0.5 rounded border border-line">
                        Method: {rec.method}
                      </span>
                      <Badge variant={rec.status === "PRESENT" ? "success" : "warning"} size="sm">
                        {rec.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-ink-faint font-mono mt-1 block">
                      {formatDateTime(rec.checkedInAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Users}
                title="No Attendance Records Yet"
                description="Members will appear here once they scan event QR codes or enter session passcodes."
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Justification Modal */}
      <Modal
        isOpen={isJustifyOpen}
        onClose={() => setIsJustifyOpen(false)}
        title="Submit Absence Justification"
        description="Provide a valid academic, medical, or competition justification for missed sessions"
      >
        <div className="space-y-4">
          <Select
            label="Select Event *"
            value={justifyEventId}
            onChange={(e) => setJustifyEventId(e.target.value)}
          >
            <option value="">Select missed workshop/event...</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({formatDate(evt.startTime)})
              </option>
            ))}
          </Select>

          <Textarea
            label="Detailed Explanation / Reason *"
            placeholder="e.g. Exam preparation at Esprit, robotics competition, medical reason..."
            value={justificationNote}
            onChange={(e) => setJustificationNote(e.target.value)}
          />

          <div className="pt-4 border-t border-line flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsJustifyOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitJustification}>
              Submit Justification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
