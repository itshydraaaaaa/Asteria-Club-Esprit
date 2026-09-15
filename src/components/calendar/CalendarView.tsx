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
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Upload,
  Eye,
} from "lucide-react";
import QRCode from "qrcode";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface CalendarViewProps {
  currentUser: any;
}

export function CalendarView({ currentUser }: CalendarViewProps) {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [events, setEvents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Event Details Modal
  const [selectedEventDetails, setSelectedEventDetails] = useState<any | null>(null);

  // QR Modal
  const [qrModalEvent, setQrModalEvent] = useState<any | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState(false);

  // New Event Modal
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newEventImageUrl, setNewEventImageUrl] = useState("");
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
      const rawEvents = data.events || [];
      const normalized = rawEvents.map((e: any) => ({
        ...e,
        checkInCode: e.checkInCode || e.check_in_code || "",
        startTime: e.startTime || e.start_time,
        endTime: e.endTime || e.end_time,
        department: e.department || e.departments,
        location: e.location || "TBD",
      }));
      setEvents(normalized);
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

  const handleOpenQrModal = async (evt: any) => {
    setQrModalEvent(evt);
    setCopiedCode(false);
    const code = evt.checkInCode || evt.check_in_code || "";
    if (code) {
      try {
        const url = await QRCode.toDataURL(code, {
          width: 320,
          margin: 2,
          color: {
            dark: "#0A3A40",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("QR Generation error:", err);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "events");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewEventImageUrl(data.url);
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateEvent = async () => {
    setFormError(null);
    setConflictWarning(null);

    if (!newEventForm.title.trim()) {
      setFormError(isFr ? "Veuillez saisir un titre d'événement." : "Please enter an event title.");
      return;
    }
    if (!newEventForm.startTime) {
      setFormError(isFr ? "Veuillez sélectionner la date et l'heure de début." : "Please select a start date and time.");
      return;
    }
    if (!newEventForm.endTime) {
      setFormError(isFr ? "Veuillez sélectionner la date et l'heure de fin." : "Please select an end date and time.");
      return;
    }
    const startDate = new Date(newEventForm.startTime);
    const endDate = new Date(newEventForm.endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setFormError(isFr ? "Format de date ou heure invalide." : "Invalid date or time format.");
      return;
    }
    if (endDate <= startDate) {
      setFormError(
        isFr
          ? "L'heure de fin doit être postérieure à l'heure de début."
          : "Event end time must be after the start time."
      );
      return;
    }
    if (!newEventForm.location.trim()) {
      setFormError(isFr ? "Veuillez indiquer un lieu ou une salle." : "Please specify a location or room.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEventForm,
          title: newEventForm.title.trim(),
          location: newEventForm.location.trim(),
          startTime: startDate.toISOString(),
          endTime: endDate.toISOString(),
          departmentId: newEventForm.departmentId || null,
          imageUrl: newEventImageUrl || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsNewEventOpen(false);
        setConflictWarning(null);
        setFormError(null);
        setNewEventImageUrl("");
        setNewEventForm({
          title: "",
          description: "",
          startTime: "",
          endTime: "",
          location: "",
          departmentId: "",
          checkInCode: "",
        });
        await fetchEvents();
      } else {
        setFormError(
          data.error ||
            (isFr ? "Échec de la planification de l'événement." : "Failed to schedule event.")
        );
        if (data.conflictWarning) {
          setConflictWarning(
            `Schedule conflict detected with existing event in ${newEventForm.location}.`
          );
        }
      }
    } catch (e: any) {
      console.error(e);
      setFormError(
        e?.message ||
          (isFr ? "Une erreur réseau est survenue." : "A network error occurred while scheduling event.")
      );
    } finally {
      setIsSubmitting(false);
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
        if (selectedEventDetails && selectedEventDetails.id === eventId) {
          setSelectedEventDetails((prev: any) => ({
            ...prev,
            rsvps: [
              ...(prev.rsvps || []).filter((r: any) => (r.userId || r.user_id) !== currentUser?.id),
              {
                userId: currentUser?.id,
                status,
                user: { name: currentUser?.name, avatarUrl: currentUser?.avatarUrl, role: currentUser?.role },
              },
            ],
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
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
              className="w-full sm:w-48 text-xs py-1.5"
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
              className="w-full sm:w-auto"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((evt) => {
            const userRsvp = evt.rsvps?.find((r: any) => (r.userId || r.user_id) === currentUser?.id);
            const goingCount = evt.rsvps?.filter((r: any) => r.status === "GOING").length || 0;
            const maybeCount = evt.rsvps?.filter((r: any) => r.status === "MAYBE").length || 0;
            const code = evt.checkInCode || evt.check_in_code || "";

            return (
              <Card key={evt.id} hoverable className="p-6 flex flex-col justify-between space-y-4 group">
                <div className="space-y-3">
                  {/* Event Poster/Banner if uploaded */}
                  {evt.imageUrl && (
                    <div
                      onClick={() => setSelectedEventDetails(evt)}
                      className="relative h-44 w-full rounded-xl overflow-hidden mb-2 -mt-1 bg-teal-950/10 cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={evt.imageUrl}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={evt.department ? "accent" : "primary"}>
                      {evt.department ? evt.department.name : "Club-Wide Assembly"}
                    </Badge>
                    {code && (
                      <span className="text-xs font-semibold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200 font-mono flex items-center gap-1.5">
                        <span className="text-teal-700 font-normal">Code:</span>
                        <strong>{code}</strong>
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => setSelectedEventDetails(evt)}
                    className="font-display font-bold text-base uppercase tracking-wider text-ink hover:text-ast-primary cursor-pointer transition-colors"
                  >
                    {evt.title}
                  </h3>

                  {evt.description && (
                    <p className="font-body text-xs text-ink-soft leading-relaxed line-clamp-2">
                      {evt.cleanDescription || evt.description}
                    </p>
                  )}

                  <div className="space-y-1.5 pt-2 text-xs text-ink-soft font-body">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-900 flex-shrink-0" />
                      <span>
                        {formatDateTime(evt.startTime || evt.start_time)} — {formatTime(evt.endTime || evt.end_time)}
                      </span>
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
                      {evt.rsvps?.slice(0, 5).map((r: any, idx: number) => (
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

                {/* RSVP Action Bar & QR Buttons */}
                <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-2">
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

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs"
                      leftIcon={<QrCode className="w-3.5 h-3.5 text-ast-primary" />}
                      onClick={() => handleOpenQrModal(evt)}
                    >
                      QR Pass
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => setSelectedEventDetails(evt)}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* Event QR Code Modal */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(qrModalEvent)}
        onClose={() => setQrModalEvent(null)}
        title="Event Attendance QR Pass"
        description="Scan with phone or display during the session for instant check-in"
      >
        {qrModalEvent && (
          <div className="space-y-5 text-center">
            <div className="bg-surface-alt border border-line rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 shadow-sm">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Attendance QR Code"
                  className="w-64 h-64 rounded-2xl shadow-md border-4 border-surface bg-white p-2"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-line/30 rounded-2xl">
                  <div className="animate-spin w-8 h-8 border-2 border-teal-900 border-t-transparent rounded-full" />
                </div>
              )}

              <div className="space-y-1">
                <span className="text-[11px] uppercase font-bold text-ink-faint font-display block">
                  Session Attendance Passcode
                </span>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-bold tracking-widest text-ast-primary bg-teal-50 px-4 py-1.5 rounded-xl border border-teal-200">
                    {qrModalEvent.checkInCode || qrModalEvent.check_in_code}
                  </span>
                  <button
                    onClick={() => handleCopyCode(qrModalEvent.checkInCode || qrModalEvent.check_in_code)}
                    className="p-2 rounded-xl border border-line bg-surface hover:bg-surface-alt text-ink transition-colors"
                    title="Copy Code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-ink-soft" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface border border-line text-left space-y-2 text-xs text-ink-soft font-body">
              <div className="font-bold text-ink text-sm font-display uppercase">{qrModalEvent.title}</div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-ast-primary flex-shrink-0" />
                <span>{formatDateTime(qrModalEvent.startTime || qrModalEvent.start_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-ast-primary flex-shrink-0" />
                <span>{qrModalEvent.location}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-line">
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`Asteria_QR_${qrModalEvent.checkInCode || "Event"}.png`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-surface-alt border border-line hover:bg-surface text-ink transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Download QR
                </a>
              )}
              <Link href="/attendance">
                <Button variant="primary" size="sm" leftIcon={<Users className="w-3.5 h-3.5" />}>
                  Go to Live Attendance Hub
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* Event Details Modal */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedEventDetails)}
        onClose={() => setSelectedEventDetails(null)}
        title="Event Details & Dossier"
        description="Comprehensive agenda, materials, and participant roster"
        maxWidth="xl"
      >
        {selectedEventDetails && (
          <div className="space-y-5">
            {/* Event Poster if available */}
            {selectedEventDetails.imageUrl && (
              <div className="relative h-60 w-full rounded-2xl overflow-hidden bg-teal-950/20 shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedEventDetails.imageUrl}
                  alt={selectedEventDetails.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={selectedEventDetails.department ? "accent" : "primary"}>
                  {selectedEventDetails.department ? selectedEventDetails.department.name : "Club-Wide Assembly"}
                </Badge>
                {(selectedEventDetails.checkInCode || selectedEventDetails.check_in_code) && (
                  <span className="text-xs font-mono font-bold bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                    Code: {selectedEventDetails.checkInCode || selectedEventDetails.check_in_code}
                  </span>
                )}
              </div>

              <h2 className="font-display font-bold text-xl uppercase tracking-wider text-ink">
                {selectedEventDetails.title}
              </h2>
            </div>

            {/* Timing & Location Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-surface-alt border border-line text-xs font-body text-ink-soft">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-ast-primary flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink block">Date & Time</span>
                  <span>{formatDateTime(selectedEventDetails.startTime || selectedEventDetails.start_time)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-ast-primary flex-shrink-0" />
                <div>
                  <span className="font-bold text-ink block">Location & Room</span>
                  <span>{selectedEventDetails.location}</span>
                </div>
              </div>
            </div>

            {/* Agenda / Description */}
            <div className="space-y-1.5">
              <span className="text-xs font-display font-bold uppercase tracking-wider text-ink block">
                Agenda & Description
              </span>
              <div className="p-4 rounded-xl bg-surface border border-line text-xs font-body text-ink-soft leading-relaxed whitespace-pre-wrap">
                {selectedEventDetails.cleanDescription || selectedEventDetails.description || "No specific agenda provided for this session."}
              </div>
            </div>

            {/* Attendees RSVP List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-display font-bold uppercase tracking-wider text-ink">
                <span>Attendees & RSVPs ({selectedEventDetails.rsvps?.length || 0})</span>
                <span className="text-[11px] font-body font-normal text-ink-soft">
                  {selectedEventDetails.rsvps?.filter((r: any) => r.status === "GOING").length || 0} Confirmed
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto divide-y divide-line/60 border border-line rounded-xl bg-surface">
                {selectedEventDetails.rsvps && selectedEventDetails.rsvps.length > 0 ? (
                  selectedEventDetails.rsvps.map((r: any, idx: number) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.user?.name} src={r.user?.avatarUrl} size="sm" />
                        <div>
                          <span className="font-bold text-ink block">{r.user?.name || "Member"}</span>
                          <span className="text-[10px] text-ink-faint uppercase font-mono">{r.user?.role || "MEMBER"}</span>
                        </div>
                      </div>
                      <Badge
                        variant={r.status === "GOING" ? "success" : r.status === "MAYBE" ? "warning" : "default"}
                        size="sm"
                      >
                        {r.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-ink-faint">No RSVPs registered yet.</div>
                )}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<QrCode className="w-3.5 h-3.5" />}
                onClick={() => {
                  const target = selectedEventDetails;
                  setSelectedEventDetails(null);
                  handleOpenQrModal(target);
                }}
              >
                View QR Pass
              </Button>

              <Button variant="primary" size="sm" onClick={() => setSelectedEventDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* Schedule Event Modal */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewEventOpen}
        onClose={() => {
          setIsNewEventOpen(false);
          setFormError(null);
          setConflictWarning(null);
        }}
        title="Schedule Club or Department Event"
        description="Check for classroom and schedule conflicts automatically"
      >
        <div className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-body flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{isFr ? "Erreur de validation" : "Unable to schedule event"}</p>
                <p className="mt-0.5 text-red-700">{formError}</p>
              </div>
            </div>
          )}

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

          {/* Event Poster / Picture Upload */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink font-body">
              Event Picture / Poster (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-body bg-surface-alt hover:bg-surface border border-line text-ink transition-all">
                <Upload className="w-3.5 h-3.5 text-ast-primary" />
                <span>{uploadingImage ? "Uploading..." : "Upload Poster Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              <span className="text-[11px] text-ink-faint">or paste URL:</span>

              <Input
                placeholder="https://example.com/poster.jpg"
                value={newEventImageUrl}
                onChange={(e) => setNewEventImageUrl(e.target.value)}
                className="flex-1 text-xs py-1.5"
              />
            </div>

            {newEventImageUrl && (
              <div className="relative h-28 w-full rounded-xl overflow-hidden border border-line bg-surface-alt mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={newEventImageUrl}
                  alt="Poster Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setNewEventImageUrl("")}
                  className="absolute top-2 right-2 p-1 rounded-lg bg-black/60 text-white hover:bg-black text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

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
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setIsNewEventOpen(false);
                setFormError(null);
                setConflictWarning(null);
              }}
              disabled={isSubmitting}
            >
              {isFr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateEvent}
              isLoading={isSubmitting}
              disabled={isSubmitting || uploadingImage}
            >
              {isSubmitting ? (isFr ? "Planification en cours..." : "Scheduling...") : (isFr ? "Planifier l'Événement" : "Schedule Event")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
