"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Users,
  Sparkles,
  Download,
  CalendarCheck,
  Maximize2,
  Play,
  Pause,
  XCircle,
  Edit3,
  Camera,
  ShieldCheck,
  Check,
  Copy,
  RefreshCw,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import { CameraQrScanner } from "@/components/attendance/CameraQrScanner";
import { RotatingQrProjectorModal } from "@/components/attendance/RotatingQrProjectorModal";

interface AttendanceHubProps {
  currentUser: any;
}

export function AttendanceHub({ currentUser }: AttendanceHubProps) {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const isLeadership =
    currentUser?.role === "PRESIDENT" ||
    currentUser?.role === "VICE_PRESIDENT" ||
    currentUser?.role === "BOARD";
  const isHod = currentUser?.role === "HOD";

  const [activeTab, setActiveTab] = useState<"member" | "host" | "excuses">("member");
  const [events, setEvents] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [excuses, setExcuses] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // In-App Camera Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerSubmitting, setScannerSubmitting] = useState(false);

  // Projector Modal
  const [projectorEvent, setProjectorEvent] = useState<any | null>(null);

  // Host Console Selected Event & Dynamic QR
  const [selectedHostEventId, setSelectedHostEventId] = useState<string>("");
  const [hostQrData, setHostQrData] = useState<{
    qrDataUrl: string;
    token: string;
    secondsRemaining: number;
    status: string;
    message?: string;
    checkInCode?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Manual Code Check-In
  const [manualCodeInput, setManualCodeInput] = useState("");
  const [checkInStatus, setCheckInStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Absence Excuse Modal
  const [isJustifyOpen, setIsJustifyOpen] = useState(false);
  const [justifyEventId, setJustifyEventId] = useState("");
  const [justificationNote, setJustificationNote] = useState("");
  const [isSubmittingJustify, setIsSubmittingJustify] = useState(false);

  // Manual Status Override Modal (Host/Board)
  const [manualOverrideMember, setManualOverrideMember] = useState<any | null>(null);
  const [manualOverrideStatus, setManualOverrideStatus] = useState<"PRESENT" | "LATE" | "ABSENT" | "EXCUSED">("PRESENT");
  const [manualOverrideReason, setManualOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const hostQrTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, recRes, excRes, metRes] = await Promise.all([
        fetch("/api/events").then((r) => r.json()),
        fetch("/api/attendance").then((r) => r.json()),
        fetch("/api/attendance/excuse").then((r) => r.json()).catch(() => ({ excuses: [] })),
        fetch("/api/attendance/metrics").then((r) => r.json()).catch(() => ({ metrics: null })),
      ]);

      const rawEvents = evtRes.events || [];
      const evts = rawEvents.map((e: any) => ({
        ...e,
        checkInCode: e.checkInCode || e.check_in_code || "",
        startTime: e.startTime || e.start_time,
        endTime: e.endTime || e.end_time,
        department: e.department || e.departments,
      }));

      const rawRecords = recRes.records || [];
      setEvents(evts);
      setRecords(rawRecords);
      setExcuses(excRes.excuses || []);
      setMetrics(metRes.metrics || null);

      if (evts.length > 0 && !selectedHostEventId) {
        setSelectedHostEventId(evts[0].id);
      }
    } catch (e) {
      console.error("Fetch data error:", e);
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

  // Fetch host rotating QR when selected event changes or timer ticks
  const fetchHostRotatingQr = async (eventId: string) => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/qr`);
      const data = await res.json();
      if (res.ok && data.status === "OPEN" && data.qrPayloadUrl) {
        const url = await QRCode.toDataURL(data.qrPayloadUrl, {
          width: 320,
          margin: 2,
          color: { dark: "#050B14", light: "#FFFFFF" },
        });
        setHostQrData({
          qrDataUrl: url,
          token: data.token,
          secondsRemaining: data.expiresInSeconds || 30,
          status: data.status,
          checkInCode: data.checkInCode,
        });
      } else {
        setHostQrData({
          qrDataUrl: "",
          token: "",
          secondsRemaining: 0,
          status: data.status || "CLOSED",
          message: data.message,
          checkInCode: data.checkInCode,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "host" && selectedHostEventId) {
      fetchHostRotatingQr(selectedHostEventId);

      const interval = setInterval(() => {
        setHostQrData((prev) => {
          if (!prev) return null;
          if (prev.secondsRemaining <= 1) {
            fetchHostRotatingQr(selectedHostEventId);
            return { ...prev, secondsRemaining: 30 };
          }
          return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
        });
      }, 1000);

      hostQrTimerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedHostEventId]);

  const handleCameraScanResult = async (decodedText: string) => {
    setScannerSubmitting(true);
    try {
      let payload: any = {};
      if (decodedText.startsWith("http")) {
        const url = new URL(decodedText);
        payload.eventId = url.searchParams.get("event") || url.searchParams.get("eventId");
        payload.token = url.searchParams.get("token");
        payload.ts = url.searchParams.get("ts");
        payload.code = url.searchParams.get("code");
      } else {
        payload.code = decodedText.trim();
      }

      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        setIsScannerOpen(false);
        setCheckInStatus({ type: "success", message: data.message });
        try {
          confetti({
            particleCount: 85,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#06b6d4", "#10b981"],
          });
        } catch {}
        fetchData();
      } else {
        alert(data.error || "Échec du pointage");
      }
    } catch (err: any) {
      alert("Erreur lors de la validation du code.");
    } finally {
      setScannerSubmitting(false);
    }
  };

  const handleManualCodeSubmit = async () => {
    if (!manualCodeInput.trim()) return;
    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: manualCodeInput.trim(), method: "CODE" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCheckInStatus({ type: "success", message: data.message });
        setManualCodeInput("");
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
        fetchData();
      } else {
        setCheckInStatus({ type: "error", message: data.error });
      }
    } catch {
      setCheckInStatus({ type: "error", message: "Échec du pointage." });
    }
  };

  const handleUpdateCheckInStatus = async (eventId: string, status: "OPEN" | "PAUSED" | "CLOSED") => {
    try {
      const res = await fetch(`/api/events/${eventId}/check-in-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchData();
        fetchHostRotatingQr(eventId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitJustification = async () => {
    if (!justifyEventId || !justificationNote.trim()) return;
    setIsSubmittingJustify(true);
    try {
      const res = await fetch("/api/attendance/excuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: justifyEventId,
          reason: justificationNote.trim(),
        }),
      });
      if (res.ok) {
        setIsJustifyOpen(false);
        setJustificationNote("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingJustify(false);
    }
  };

  const handleReviewExcuse = async (excuseId: string, eventId: string, userId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/attendance/excuse/${excuseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, userId, decision }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualOverrideSubmit = async () => {
    if (!selectedHostEventId || !manualOverrideMember || !manualOverrideReason.trim()) return;
    setIsSubmittingOverride(true);
    try {
      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedHostEventId,
          userId: manualOverrideMember.id,
          status: manualOverrideStatus,
          reason: manualOverrideReason.trim(),
        }),
      });
      if (res.ok) {
        setManualOverrideMember(null);
        setManualOverrideReason("");
        fetchData();
      } else {
        const d = await res.json();
        alert(d.error || "Erreur de mise à jour");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Determine host permissions
  const isHost =
    isLeadership ||
    isHod ||
    events.some(
      (e) =>
        e.hostId === currentUser?.id ||
        e.createdById === currentUser?.id ||
        (e.departmentId && e.departmentId === currentUser?.departmentId)
    );

  const selectedHostEvent = events.find((e) => e.id === selectedHostEventId);
  const hostEventRecords = records.filter(
    (r) => (r.eventId || r.event_id) === selectedHostEventId
  );

  // Compute personal user metrics
  const myRecords = records.filter((r) => (r.userId || r.user_id) === currentUser?.id);
  const myPresent = myRecords.filter((r) => r.status === "PRESENT").length;
  const myLate = myRecords.filter((r) => r.status === "LATE").length;
  const myExcused = myRecords.filter((r) => r.status === "EXCUSED").length;
  const myAbsent = myRecords.filter((r) => r.status === "ABSENT").length;
  const totalMyEvaluated = myPresent + myLate + myExcused + myAbsent;
  const attendanceRate = totalMyEvaluated > 0
    ? Math.round(((myPresent + myLate + myExcused) / totalMyEvaluated) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs
          tabs={[
            {
              id: "member",
              label: isFr ? "Mon Espace Émargement" : "My Attendance Pass",
              icon: <QrCode className="w-3.5 h-3.5" />,
            },
            ...(isHost
              ? [
                  {
                    id: "host",
                    label: isFr ? "Console Hôte (QR Dynamique)" : "Host Console (Rotating QR)",
                    icon: <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />,
                  },
                ]
              : []),
            {
              id: "excuses",
              label: isFr ? "Justifications d'Absence" : "Absence Requests",
              count: excuses.length,
              icon: <FileText className="w-3.5 h-3.5" />,
            },
          ]}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as any)}
        />

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Camera className="w-3.5 h-3.5 text-indigo-400" />}
            onClick={() => setIsScannerOpen(true)}
          >
            {isFr ? "Scanner pour émarger" : "Scan to Check In"}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            leftIcon={<FileText className="w-3.5 h-3.5" />}
            onClick={() => {
              setIsJustifyOpen(true);
              if (events.length > 0) setJustifyEventId(events[0].id);
            }}
          >
            {isFr ? "Justifier une absence" : "Submit Excuse"}
          </Button>
        </div>
      </div>

      {checkInStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-body animate-vague-in ${
            checkInStatus.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
              : "bg-red-500/10 text-red-300 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {checkInStatus.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{checkInStatus.message}</span>
          </div>
          <button
            onClick={() => setCheckInStatus(null)}
            className="text-white/60 hover:text-white text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MEMBER ATTENDANCE SPACE */}
      {/* ========================================================================= */}
      {activeTab === "member" && (
        <div className="space-y-6">
          {/* Member Stats Header */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="p-4 bg-surface/90 border border-line text-center">
              <span className="text-[10px] uppercase font-mono text-ink-soft dark:text-teal-300/70 block">
                Taux de Présence
              </span>
              <strong className="text-2xl font-display font-bold text-ast-light">
                {attendanceRate}%
              </strong>
            </Card>
            <Card className="p-4 bg-surface/90 border border-line text-center">
              <span className="text-[10px] uppercase font-mono text-ink-soft dark:text-teal-300/70 block">Présents</span>
              <strong className="text-2xl font-display font-bold text-emerald-500">
                {myPresent}
              </strong>
            </Card>
            <Card className="p-4 bg-surface/90 border border-line text-center">
              <span className="text-[10px] uppercase font-mono text-ink-soft dark:text-teal-300/70 block">En Retard</span>
              <strong className="text-2xl font-display font-bold text-amber-500">
                {myLate}
              </strong>
            </Card>
            <Card className="p-4 bg-surface/90 border border-line text-center">
              <span className="text-[10px] uppercase font-mono text-ink-soft dark:text-teal-300/70 block">Excusés</span>
              <strong className="text-2xl font-display font-bold text-teal-400">
                {myExcused}
              </strong>
            </Card>
            <Card className="p-4 bg-surface/90 border border-line text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-mono text-ink-soft dark:text-teal-300/70 block">Absences</span>
              <strong className="text-2xl font-display font-bold text-rose-400">
                {myAbsent}
              </strong>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Check-in Card */}
            <Card className="p-6 bg-surface/90 border border-line space-y-5 lg:col-span-1">
              <div className="space-y-1">
                <Badge variant="primary" size="sm">
                  Pointage Rapide
                </Badge>
                <h3 className="text-lg font-display font-bold text-ink dark:text-white">
                  Valider ma Présence
                </h3>
                <p className="text-xs text-ink-soft dark:text-teal-200/70 font-body leading-relaxed">
                  Scannez le QR code dynamique projeté par l'animateur ou saisissez le code de secours de la session.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  className="w-full bg-gradient-to-r from-ast-primary to-teal-700 hover:from-teal-700 hover:to-teal-600 text-white shadow-[0_0_20px_rgba(96,200,212,0.25)] border border-teal-400/30 font-medium py-3"
                  onClick={() => setIsScannerOpen(true)}
                >
                  <Camera className="w-4 h-4 mr-2 text-ast-light" />
                  Ouvrir le Scanner Caméra
                </Button>

                <div className="relative flex items-center justify-center my-3">
                  <div className="border-t border-line dark:border-teal-900/60 w-full" />
                  <span className="bg-surface dark:bg-[#062428] px-2 text-[10px] uppercase font-mono text-ink-soft dark:text-teal-300/70 absolute">
                    ou code de secours numérique
                  </span>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="Ex: 489201 ou AST-4912"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                    className="font-mono text-center tracking-widest text-base uppercase"
                  />
                  <Button
                    variant="outline"
                    className="w-full text-xs"
                    onClick={handleManualCodeSubmit}
                    disabled={!manualCodeInput.trim()}
                  >
                    Valider le code
                  </Button>
                </div>
              </div>
            </Card>

            {/* Personal Attendance History Table */}
            <Card className="p-6 bg-surface/90 border border-line space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold text-ink">
                    Mon Historique d'Émargement
                  </h3>
                  <p className="text-xs text-ink-soft font-body">
                    Feuille nominative des séances et ateliers
                  </p>
                </div>
                <Badge variant="default" size="sm">
                  {myRecords.length} sessions
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-line text-ink-soft font-mono uppercase text-[10px]">
                      <th className="pb-2.5">Événement</th>
                      <th className="pb-2.5">Date</th>
                      <th className="pb-2.5">Statut</th>
                      <th className="pb-2.5">Heure</th>
                      <th className="pb-2.5">Méthode</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {myRecords.length > 0 ? (
                      myRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-surface-alt/50 transition-colors">
                          <td className="py-3 font-semibold text-ink">
                            {rec.events?.title || rec.event?.title || "Session Asteria"}
                          </td>
                          <td className="py-3 text-ink-soft">
                            {rec.events?.startTime
                              ? formatDate(rec.events.startTime)
                              : rec.checkedInAt
                              ? formatDate(rec.checkedInAt)
                              : "-"}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={
                                rec.status === "PRESENT"
                                  ? "success"
                                  : rec.status === "LATE"
                                  ? "warning"
                                  : rec.status === "EXCUSED"
                                  ? "accent"
                                  : "danger"
                              }
                              size="sm"
                            >
                              {rec.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-ink-soft font-mono">
                            {rec.checkedInAt ? formatTime(rec.checkedInAt) : "-"}
                          </td>
                          <td className="py-3 text-ink-soft font-mono text-[11px]">
                            {rec.method || "QR"}
                          </td>
                          <td className="py-3 text-right">
                            {rec.status === "ABSENT" && (
                              <button
                                onClick={() => {
                                  setJustifyEventId(rec.eventId || rec.event_id);
                                  setIsJustifyOpen(true);
                                }}
                                className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]"
                              >
                                Justifier
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-ink-soft">
                          Aucun pointage enregistré à ce jour.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HOST CONSOLE (ROTATING QR & REAL-TIME CONTROLS) */}
      {/* ========================================================================= */}
      {activeTab === "host" && isHost && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Rotating QR & Host Controls */}
          <Card className="p-6 bg-surface/90 border border-line space-y-5 lg:col-span-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  Contrôle Session
                </Badge>
                <span className="text-xs font-mono text-indigo-400 font-bold">
                  {hostQrData?.status || selectedHostEvent?.checkInStatus || "SCHEDULED"}
                </span>
              </div>
              <h3 className="font-display font-bold text-lg text-ink">
                Pass Grand Écran & Rotation QR
              </h3>
              <p className="text-xs text-ink-soft font-body leading-relaxed">
                Le QR code se renouvelle toutes les 30 secondes pour prévenir les fraudes et captures d'écran.
              </p>
            </div>

            {/* Event Selector */}
            <Select
              label="Sélectionner la Session Active"
              value={selectedHostEventId}
              onChange={(e) => setSelectedHostEventId(e.target.value)}
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title} ({evt.department ? evt.department.name : "Club"})
                </option>
              ))}
            </Select>

            {/* Rotating QR Preview Card */}
            {selectedHostEvent ? (
              <div className="p-5 rounded-2xl bg-surface-alt border border-line flex flex-col items-center justify-center space-y-4">
                {hostQrData?.status === "OPEN" && hostQrData.qrDataUrl ? (
                  <>
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={hostQrData.qrDataUrl}
                        alt="Rotating QR Pass"
                        className="w-56 h-56 rounded-2xl bg-white p-2 shadow-lg border border-white/20"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                        {hostQrData.secondsRemaining}s
                      </div>
                    </div>

                    <div className="w-full space-y-1 text-center">
                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-soft dark:text-teal-300/70">
                        <span>Renouvellement automatique :</span>
                        <span className="font-bold text-ast-light">{hostQrData.secondsRemaining}s</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface dark:bg-teal-950 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-ast-light transition-all duration-1000 ease-linear shadow-[0_0_10px_rgba(96,200,212,0.6)]"
                          style={{ width: `${(hostQrData.secondsRemaining / 30) * 100}%` }}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-56 h-56 rounded-2xl bg-surface dark:bg-[#062428] border border-line dark:border-teal-900/60 flex flex-col items-center justify-center p-4 text-center space-y-2">
                    <Clock className="w-8 h-8 text-amber-500" />
                    <span className="text-xs font-semibold text-ink dark:text-white">
                      {hostQrData?.status === "PAUSED"
                        ? "Émargement en Pause"
                        : hostQrData?.status === "CLOSED"
                        ? "Session Clôturée"
                        : "Fenêtre Non Ouverte"}
                    </span>
                    <p className="text-[11px] text-ink-soft dark:text-teal-300/60">
                      {hostQrData?.message || "Ouvrez l'émargement pour générer le QR code."}
                    </p>
                  </div>
                )}

                {/* Numeric Fallback Code */}
                {(hostQrData?.checkInCode || selectedHostEvent.checkInCode) && (
                  <div className="text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-ink-soft dark:text-teal-300 font-mono">
                      Code de secours (change toutes les 30s)
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono text-lg font-bold tracking-widest text-ast-light bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/30">
                        {hostQrData?.checkInCode || selectedHostEvent.checkInCode}
                      </p>
                    </div>
                  </div>
                )}

                {/* Full-Screen Projector Button */}
                <Button
                  className="w-full bg-gradient-to-r from-ast-primary to-teal-700 hover:from-teal-700 hover:to-teal-600 text-white shadow-md shadow-teal-900/40 border border-teal-400/30"
                  onClick={() => setProjectorEvent(selectedHostEvent)}
                >
                  <Maximize2 className="w-4 h-4 mr-2 text-ast-light" />
                  Affichage Plein Écran Vidéoprojecteur
                </Button>

                {/* Host Control Actions */}
                <div className="flex flex-wrap gap-2 w-full pt-1 border-t border-line">
                  {selectedHostEvent.checkInStatus !== "OPEN" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      className="flex-1 text-xs"
                      onClick={() => handleUpdateCheckInStatus(selectedHostEvent.id, "OPEN")}
                    >
                      <Play className="w-3.5 h-3.5 mr-1" /> Ouvrir
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => handleUpdateCheckInStatus(selectedHostEvent.id, "PAUSED")}
                    >
                      <Pause className="w-3.5 h-3.5 mr-1" /> Mettre en Pause
                    </Button>
                  )}

                  {selectedHostEvent.checkInStatus !== "CLOSED" && (
                    <Button
                      size="sm"
                      variant="danger"
                      className="flex-1 text-xs"
                      onClick={() => {
                        if (
                          confirm(
                            "Clôturer la session marquera automatiquement tous les membres non émargés comme ABSENTS. Confirmer ?"
                          )
                        ) {
                          handleUpdateCheckInStatus(selectedHostEvent.id, "CLOSED");
                        }
                      }}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Clôturer
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 w-full">
                  <a
                    href={`/api/attendance/export?eventId=${selectedHostEvent.id}`}
                    download
                    className="inline-flex items-center justify-center gap-1.5 flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-line hover:bg-surface-alt text-ink transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Exporter CSV
                  </a>

                  <Button
                    size="sm"
                    variant="danger"
                    className="text-xs px-3"
                    onClick={async () => {
                      if (
                        confirm(
                          `Êtes-vous sûr de vouloir supprimer définitivement l'événement "${selectedHostEvent.title}" ? Cette action effacera également l'annonce et tous les émargements associés.`
                        )
                      ) {
                        try {
                          const res = await fetch(`/api/events/${selectedHostEvent.id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) {
                            setSelectedHostEventId("");
                            fetchData();
                          } else {
                            const errData = await res.json();
                            alert(errData.error || "Échec de la suppression");
                          }
                        } catch {
                          alert("Erreur réseau lors de la suppression.");
                        }
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          {/* Right Column: Live Attendees Board & Real-Time Counters */}
          <Card className="p-6 bg-surface/90 border border-line space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-ink">
                  Émargement en Direct de la Session
                </h3>
                <p className="text-xs text-ink-soft font-body">
                  Mise à jour instantanée via Supabase Realtime
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">
                  {hostEventRecords.filter((r) => r.status === "PRESENT" || r.status === "LATE").length} émargés
                </Badge>
              </div>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                <span className="text-[10px] text-ink-soft block font-mono">PRÉSENTS</span>
                <strong className="text-emerald-500 text-lg">
                  {hostEventRecords.filter((r) => r.status === "PRESENT").length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                <span className="text-[10px] text-ink-soft block font-mono">EN RETARD</span>
                <strong className="text-amber-500 text-lg">
                  {hostEventRecords.filter((r) => r.status === "LATE").length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                <span className="text-[10px] text-ink-soft block font-mono">ABSENTS</span>
                <strong className="text-red-500 text-lg">
                  {hostEventRecords.filter((r) => r.status === "ABSENT").length}
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                <span className="text-[10px] text-ink-soft block font-mono">EXCUSÉS</span>
                <strong className="text-cyan-500 text-lg">
                  {hostEventRecords.filter((r) => r.status === "EXCUSED").length}
                </strong>
              </div>
            </div>

            {/* Attendee Records Table with Manual Adjustment */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-line text-ink-soft font-mono uppercase text-[10px]">
                    <th className="pb-2.5">Membre</th>
                    <th className="pb-2.5">Statut</th>
                    <th className="pb-2.5">Heure Pointage</th>
                    <th className="pb-2.5">Méthode</th>
                    <th className="pb-2.5">Motif / Justification</th>
                    <th className="pb-2.5 text-right">Ajuster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {hostEventRecords.length > 0 ? (
                    hostEventRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-surface-alt/50 transition-colors">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.user?.name} src={r.user?.avatarUrl} size="sm" />
                            <div>
                              <span className="font-semibold text-ink block">{r.user?.name || "Membre"}</span>
                              <span className="text-[10px] text-ink-soft font-mono">{r.user?.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <Badge
                            variant={
                              r.status === "PRESENT"
                                ? "success"
                                : r.status === "LATE"
                                ? "warning"
                                : r.status === "EXCUSED"
                                ? "accent"
                                : "danger"
                            }
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-ink-soft font-mono">
                          {r.checkedInAt ? formatTime(r.checkedInAt) : "-"}
                        </td>
                        <td className="py-2.5 text-ink-soft font-mono text-[11px]">
                          {r.method || "QR"}
                        </td>
                        <td className="py-2.5 text-ink-soft text-[11px] max-w-xs truncate">
                          {r.justification || r.manualReason || "-"}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              setManualOverrideMember(r.user || { id: r.userId, name: "Membre" });
                              setManualOverrideStatus(r.status || "PRESENT");
                              setManualOverrideReason("");
                            }}
                            className="p-1.5 rounded-lg bg-surface-alt hover:bg-surface border border-line text-ink-soft hover:text-ink transition-colors"
                            title="Ajustement manuel (avec motif tracé)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-ink-soft">
                        Aucun membre n'a encore émargé pour cette session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EXCUSES & JUSTIFICATIONS */}
      {/* ========================================================================= */}
      {activeTab === "excuses" && (
        <Card className="p-6 bg-surface/90 border border-line space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                Justifications d'Absence
              </h3>
              <p className="text-xs text-ink-soft font-body">
                Demandes d'excuse soumises par les membres pour examen par les responsables
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setIsJustifyOpen(true);
                if (events.length > 0) setJustifyEventId(events[0].id);
              }}
            >
              Soumettre une demande
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-line text-ink-soft font-mono uppercase text-[10px]">
                  <th className="pb-2.5">Membre</th>
                  <th className="pb-2.5">Événement</th>
                  <th className="pb-2.5">Motif</th>
                  <th className="pb-2.5">Statut</th>
                  <th className="pb-2.5">Date</th>
                  {isHost && <th className="pb-2.5 text-right">Décision</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {excuses.length > 0 ? (
                  excuses.map((exc) => (
                    <tr key={exc.id} className="hover:bg-surface-alt/50 transition-colors">
                      <td className="py-3 font-semibold text-ink">
                        {exc.user?.name || "Membre"}
                      </td>
                      <td className="py-3 text-ink-soft">
                        {exc.event?.title || "Session Asteria"}
                      </td>
                      <td className="py-3 text-ink max-w-sm">
                        "{exc.reason}"
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            exc.status === "APPROVED"
                              ? "success"
                              : exc.status === "REJECTED"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {exc.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-ink-soft font-mono">
                        {formatDate(exc.createdAt)}
                      </td>
                      {isHost && (
                        <td className="py-3 text-right">
                          {exc.status === "PENDING" && (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                className="text-[11px] h-7 px-2"
                                onClick={() =>
                                  handleReviewExcuse(exc.id, exc.eventId, exc.userId, "APPROVED")
                                }
                              >
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                className="text-[11px] h-7 px-2"
                                onClick={() =>
                                  handleReviewExcuse(exc.id, exc.eventId, exc.userId, "REJECTED")
                                }
                              >
                                Rejeter
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-soft">
                      Aucune demande de justification enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* IN-APP CAMERA SCANNER MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        title="Scanner le QR Code d'Émargement"
        description="Pointez la caméra vers l'écran ou le vidéoprojecteur affichant le QR code"
      >
        <div className="space-y-4">
          <CameraQrScanner onScan={handleCameraScanResult} active={isScannerOpen && !scannerSubmitting} />
          {scannerSubmitting && (
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Validation cryptographique du jeton en cours...
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* FULLSCREEN PROJECTOR ROTATING QR MODAL */}
      {/* ========================================================================= */}
      {projectorEvent && (
        <RotatingQrProjectorModal
          isOpen={Boolean(projectorEvent)}
          onClose={() => setProjectorEvent(null)}
          event={projectorEvent}
          onStatusChange={fetchData}
        />
      )}

      {/* ========================================================================= */}
      {/* MANUAL OVERRIDE DIALOG */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(manualOverrideMember)}
        onClose={() => setManualOverrideMember(null)}
        title="Ajustement Manuel d'Émargement"
        description={`Membre : ${manualOverrideMember?.name || ""}`}
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">Nouveau Statut</label>
            <Select
              value={manualOverrideStatus}
              onChange={(e) => setManualOverrideStatus(e.target.value as any)}
            >
              <option value="PRESENT">PRÉSENT</option>
              <option value="LATE">EN RETARD</option>
              <option value="ABSENT">ABSENT</option>
              <option value="EXCUSED">EXCUSÉ</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink">
              Motif obligatoire du changement (Audit Log) *
            </label>
            <Textarea
              placeholder="Ex: Batterie téléphone à plat, vérifié sur place par l'hôte..."
              value={manualOverrideReason}
              onChange={(e) => setManualOverrideReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="secondary" size="sm" onClick={() => setManualOverrideMember(null)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleManualOverrideSubmit}
              disabled={isSubmittingOverride || !manualOverrideReason.trim()}
            >
              Enregistrer l'ajustement
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* SUBMIT ABSENCE EXCUSE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isJustifyOpen}
        onClose={() => setIsJustifyOpen(false)}
        title="Justifier une Absence"
        description="Transmettez le motif de votre absence pour validation par l'hôte ou le responsable de département"
      >
        <div className="space-y-4">
          <Select
            label="Événement concerné"
            value={justifyEventId}
            onChange={(e) => setJustifyEventId(e.target.value)}
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title} ({formatDate(evt.startTime)})
              </option>
            ))}
          </Select>

          <Textarea
            label="Motif détaillé de l'absence *"
            placeholder="Précisez la raison (impératif académique, examen, maladie, urgence familiale)..."
            value={justificationNote}
            onChange={(e) => setJustificationNote(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Button variant="secondary" size="sm" onClick={() => setIsJustifyOpen(false)}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitJustification}
              disabled={isSubmittingJustify || !justificationNote.trim()}
            >
              Envoyer la justification
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
