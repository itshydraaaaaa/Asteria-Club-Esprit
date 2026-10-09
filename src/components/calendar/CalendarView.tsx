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
  Maximize2,
  ShieldCheck,
  FileText,
  Play,
  Pause,
  Edit3,
  Trash2,
} from "lucide-react";
import QRCode from "qrcode";
import { formatDate, formatTime, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import { RotatingQrProjectorModal } from "@/components/attendance/RotatingQrProjectorModal";

interface CalendarViewProps {
  currentUser: any;
}

export function CalendarView({ currentUser }: CalendarViewProps) {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [events, setEvents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leadershipUsers, setLeadershipUsers] = useState<any[]>([]);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Event Details Modal
  const [selectedEventDetails, setSelectedEventDetails] = useState<any | null>(null);
  const [eventDetailTab, setEventDetailTab] = useState<"details" | "attendance" | "excuses">("details");

  // Rotating QR Projector Modal
  const [projectorEvent, setProjectorEvent] = useState<any | null>(null);

  // Manual Attendance Override Modal
  const [manualOverrideMember, setManualOverrideMember] = useState<any | null>(null);
  const [manualOverrideStatus, setManualOverrideStatus] = useState<"PRESENT" | "LATE" | "ABSENT" | "EXCUSED">("PRESENT");
  const [manualOverrideReason, setManualOverrideReason] = useState("");
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  // Excuse Request Modal
  const [excuseReason, setExcuseReason] = useState("");
  const [isSubmittingExcuse, setIsSubmittingExcuse] = useState(false);
  const [excuseMessage, setExcuseMessage] = useState<string | null>(null);

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
    type: "WORKSHOP",
    audienceScope: "CLUB",
    startTime: "",
    endTime: "",
    location: "",
    departmentId: "",
    hostId: "",
    attendanceRequired: true,
    checkInWindowStartMin: 15,
    checkInWindowEndMin: 30,
    lateThresholdMin: 10,
    isGeofenceEnabled: false,
    geofenceLat: "",
    geofenceLng: "",
    geofenceRadiusM: 100,
    checkInCode: "",
  });

  const isLeadership =
    currentUser?.role === "PRESIDENT" ||
    currentUser?.role === "VICE_PRESIDENT" ||
    currentUser?.role === "BOARD";
  const isHod = currentUser?.role === "HOD";
  const canCreateEvent = Boolean(isLeadership || isHod);

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

    // Fetch members to populate eligible hosts (Board + HOD)
    fetch("/api/members")
      .then((r) => r.json())
      .then((r) => {
        const eligible = (r.members || []).filter(
          (m: any) =>
            m.role === "PRESIDENT" ||
            m.role === "VICE_PRESIDENT" ||
            m.role === "BOARD" ||
            m.role === "HOD"
        );
        setLeadershipUsers(eligible);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [scopeFilter]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
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

  const handleOpenCreateModal = () => {
    setFormError(null);
    setConflictWarning(null);
    setNewEventImageUrl("");
    setNewEventForm({
      title: "",
      description: "",
      type: "WORKSHOP",
      audienceScope: isHod && !isLeadership ? "DEPARTMENT" : "CLUB",
      startTime: "",
      endTime: "",
      location: "",
      departmentId: isHod && !isLeadership ? currentUser?.departmentId || "" : "",
      hostId: currentUser?.id || "",
      attendanceRequired: true,
      checkInWindowStartMin: 15,
      checkInWindowEndMin: 30,
      lateThresholdMin: 10,
      isGeofenceEnabled: false,
      geofenceLat: "",
      geofenceLng: "",
      geofenceRadiusM: 100,
      checkInCode: "",
    });
    setIsNewEventOpen(true);
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
          hostId: newEventForm.hostId || currentUser?.id,
          imageUrl: newEventImageUrl || null,
          geofenceLat: newEventForm.geofenceLat ? Number(newEventForm.geofenceLat) : null,
          geofenceLng: newEventForm.geofenceLng ? Number(newEventForm.geofenceLng) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsNewEventOpen(false);
        setConflictWarning(null);
        setFormError(null);
        await fetchEvents();
      } else {
        setFormError(
          data.error ||
            (isFr ? "Échec de la planification de l'événement." : "Failed to schedule event.")
        );
        if (data.conflictWarning) {
          setConflictWarning(
            `Conflit d'horaire détecté avec un autre événement dans ${newEventForm.location}.`
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

  const handleRSVP = async (eventId: string, status: "GOING" | "MAYBE" | "DECLINED") => {
    try {
      const res = await fetch("/api/rsvps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });
      if (res.ok) {
        fetchEvents();
        if (selectedEventDetails && selectedEventDetails.id === eventId) {
          const updatedEventRes = await fetch(`/api/events/${eventId}`);
          const updatedData = await updatedEventRes.json();
          if (updatedData.event) setSelectedEventDetails(updatedData.event);
        }
      }
    } catch (err) {
      console.error(err);
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
        await fetchEvents();
        const updated = await fetch(`/api/events/${eventId}`).then((r) => r.json());
        if (updated.event) setSelectedEventDetails(updated.event);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualOverrideSubmit = async () => {
    if (!selectedEventDetails || !manualOverrideMember || !manualOverrideReason.trim()) return;
    setIsSubmittingOverride(true);
    try {
      const res = await fetch("/api/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventDetails.id,
          userId: manualOverrideMember.id,
          status: manualOverrideStatus,
          reason: manualOverrideReason.trim(),
        }),
      });
      if (res.ok) {
        setManualOverrideMember(null);
        setManualOverrideReason("");
        // Reload event details
        const updated = await fetch(`/api/events/${selectedEventDetails.id}`).then((r) => r.json());
        if (updated.event) setSelectedEventDetails(updated.event);
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'ajustement.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleSubmitExcuse = async () => {
    if (!selectedEventDetails || !excuseReason.trim()) return;
    setIsSubmittingExcuse(true);
    try {
      const res = await fetch("/api/attendance/excuse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventDetails.id,
          reason: excuseReason.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setExcuseMessage("Demande de justification soumise avec succès !");
        setExcuseReason("");
      } else {
        alert(data.error || "Échec de la soumission");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingExcuse(false);
    }
  };

  const handleReviewExcuse = async (excuseId: string, eventId: string, userId: string, decision: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/attendance/excuse/${excuseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          userId,
          decision,
          notes: decision === "APPROVED" ? "Validé par le responsable" : "Refusé",
        }),
      });
      if (res.ok) {
        const updated = await fetch(`/api/events/${selectedEventDetails.id}`).then((r) => r.json());
        if (updated.event) setSelectedEventDetails(updated.event);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isSelectedEventHost =
    currentUser &&
    selectedEventDetails &&
    (isLeadership ||
      selectedEventDetails.hostId === currentUser.id ||
      selectedEventDetails.createdById === currentUser.id ||
      (isHod && currentUser.departmentId === selectedEventDetails.departmentId));

  return (
    <div className="space-y-6">
      {/* Scope Filtering & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={scopeFilter === "all" ? "primary" : "outline"}
            onClick={() => setScopeFilter("all")}
          >
            {isFr ? "Tous les Événements" : "All Events"}
          </Button>
          <Button
            size="sm"
            variant={scopeFilter === "club" ? "primary" : "outline"}
            onClick={() => setScopeFilter("club")}
          >
            {isFr ? "Portée Club" : "Club-Wide"}
          </Button>
          {departments.map((dept) => (
            <Button
              key={dept.id}
              size="sm"
              variant={scopeFilter === dept.id ? "primary" : "outline"}
              onClick={() => setScopeFilter(dept.id)}
            >
              {dept.name}
            </Button>
          ))}
        </div>

        {canCreateEvent && (
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={handleOpenCreateModal}
          >
            {isFr ? "Planifier un Événement" : "Schedule Event"}
          </Button>
        )}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {events.map((evt) => {
          const userRsvp = evt.rsvps?.find((r: any) => r.userId === currentUser?.id);
          const hasHostPerms =
            currentUser &&
            (isLeadership ||
              evt.hostId === currentUser.id ||
              evt.createdById === currentUser.id ||
              (isHod && currentUser.departmentId === evt.departmentId));

          return (
            <Card
              key={evt.id}
              className="flex flex-col justify-between overflow-hidden border border-line hover:border-ast-primary/40 transition-all duration-200 bg-surface/90 backdrop-blur-md shadow-sm group"
            >
              {evt.imageUrl && (
                <div className="relative h-44 w-full overflow-hidden bg-black/40 border-b border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={evt.imageUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5">
                    <Badge variant="accent" size="sm">
                      {evt.type || "WORKSHOP"}
                    </Badge>
                  </div>
                </div>
              )}

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={evt.departmentId ? "primary" : "neutral"} size="sm">
                      {evt.department ? evt.department.name : evt.audienceScope === "BOARD" ? "Bureau" : "Club-Wide"}
                    </Badge>

                    {evt.checkInStatus === "OPEN" && (
                      <Badge variant="success" size="sm" className="animate-pulse">
                        Émargement Ouvert
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-base text-ink group-hover:text-ast-primary transition-colors">
                    {evt.title}
                  </h3>

                  <div className="space-y-1.5 text-xs text-ink-soft font-body">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-ast-primary flex-shrink-0" />
                      <span>{formatDateTime(evt.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-ast-primary flex-shrink-0" />
                      <span>{evt.location}</span>
                    </div>
                  </div>
                </div>

                {/* RSVP Controls & Action Button */}
                <div className="pt-3 border-t border-line space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-soft">
                      <strong>{evt.rsvps?.length || 0}</strong> participants
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleRSVP(evt.id, "GOING")}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                          userRsvp?.status === "GOING"
                            ? "bg-emerald-600 text-white"
                            : "bg-surface-alt hover:bg-surface text-ink-soft"
                        }`}
                        title="Participer"
                      >
                        ✓ Présent
                      </button>
                      <button
                        onClick={() => handleRSVP(evt.id, "DECLINED")}
                        className={`px-2 py-1 rounded text-[11px] font-bold transition-colors ${
                          userRsvp?.status === "DECLINED"
                            ? "bg-red-600 text-white"
                            : "bg-surface-alt hover:bg-surface text-ink-soft"
                        }`}
                        title="Ne participe pas"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        setSelectedEventDetails(evt);
                        setEventDetailTab("details");
                      }}
                    >
                      Détails de la session
                    </Button>

                    {hasHostPerms && (
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs px-2.5"
                        onClick={() => setProjectorEvent(evt)}
                        title="Afficher le QR code dynamique pour les participants"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1" /> QR Host
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* EVENT DETAILS & ATTENDANCE MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(selectedEventDetails)}
        onClose={() => setSelectedEventDetails(null)}
        title={selectedEventDetails?.title || "Détails de l'événement"}
        description={`${selectedEventDetails?.type || "Session"} • ${selectedEventDetails?.location || ""}`}
      >
        {selectedEventDetails && (
          <div className="space-y-5">
            {/* Modal Tabs */}
            <div className="flex border-b border-line gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setEventDetailTab("details")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  eventDetailTab === "details"
                    ? "border-ast-primary text-ast-primary"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                Détails & Ordre du jour
              </button>

              {isSelectedEventHost && (
                <button
                  type="button"
                  onClick={() => setEventDetailTab("attendance")}
                  className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                    eventDetailTab === "attendance"
                      ? "border-ast-primary text-ast-primary"
                      : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Émargement & QR (Hôte)
                </button>
              )}

              <button
                type="button"
                onClick={() => setEventDetailTab("excuses")}
                className={`pb-2.5 transition-colors border-b-2 ${
                  eventDetailTab === "excuses"
                    ? "border-ast-primary text-ast-primary"
                    : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                Justifications d'Absence
              </button>
            </div>

            {/* TAB 1: DETAILS */}
            {eventDetailTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs bg-surface-alt p-3.5 rounded-xl border border-line">
                  <div>
                    <span className="text-ink-soft block font-body">Début :</span>
                    <strong className="text-ink">{formatDateTime(selectedEventDetails.startTime)}</strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block font-body">Fin :</span>
                    <strong className="text-ink">{formatDateTime(selectedEventDetails.endTime)}</strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block font-body">Lieu :</span>
                    <strong className="text-ink">{selectedEventDetails.location}</strong>
                  </div>
                  <div>
                    <span className="text-ink-soft block font-body">Portée :</span>
                    <strong className="text-ink">{selectedEventDetails.audienceScope || "Club"}</strong>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink block font-display">
                    Description & Programme
                  </span>
                  <div className="p-3.5 rounded-xl bg-surface border border-line text-xs font-body text-ink-soft leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {selectedEventDetails.cleanDescription ||
                      selectedEventDetails.description ||
                      "Aucune description fournie pour cet événement."}
                  </div>
                </div>

                {/* RSVP List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-ink">
                    <span>Confirmations de présence ({selectedEventDetails.rsvps?.length || 0})</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto divide-y divide-line/60 border border-line rounded-xl bg-surface">
                    {(selectedEventDetails.rsvps || []).length > 0 ? (
                      selectedEventDetails.rsvps.map((r: any, idx: number) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.user?.name} src={r.user?.avatarUrl} size="sm" />
                            <span className="font-medium text-ink">{r.user?.name || "Membre"}</span>
                          </div>
                          <Badge
                            variant={r.status === "GOING" ? "success" : "default"}
                            size="sm"
                          >
                            {r.status}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-ink-soft">Aucun RSVP enregistré.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HOST ATTENDANCE MANAGEMENT */}
            {eventDetailTab === "attendance" && isSelectedEventHost && (
              <div className="space-y-4">
                {/* Host Control Actions */}
                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 font-bold block">
                        STATUT SESSION : {selectedEventDetails.checkInStatus || "SCHEDULED"}
                      </span>
                      <p className="text-[11px] text-ink-soft">
                        Contrôles en temps réel de la session d'émargement
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30"
                      onClick={() => setProjectorEvent(selectedEventDetails)}
                    >
                      <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> Plein Écran QR
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-500/10">
                    {selectedEventDetails.checkInStatus !== "OPEN" ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleUpdateCheckInStatus(selectedEventDetails.id, "OPEN")}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" /> Ouvrir l'Émargement
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateCheckInStatus(selectedEventDetails.id, "PAUSED")}
                      >
                        <Pause className="w-3.5 h-3.5 mr-1" /> Mettre en Pause
                      </Button>
                    )}

                    {selectedEventDetails.checkInStatus !== "CLOSED" && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          if (
                            confirm(
                              "Clôturer la session marquera automatiquement tous les membres non-pointés comme ABSENTS. Continuer ?"
                            )
                          ) {
                            handleUpdateCheckInStatus(selectedEventDetails.id, "CLOSED");
                          }
                        }}
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Clôturer (Auto-Absence)
                      </Button>
                    )}

                    <a
                      href={`/api/attendance/export?eventId=${selectedEventDetails.id}`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-line hover:bg-surface-alt text-ink transition-all ml-auto"
                    >
                      <Download className="w-3.5 h-3.5" /> Exporter CSV
                    </a>

                    <Button
                      size="sm"
                      variant="danger"
                      className="text-xs"
                      onClick={async () => {
                        if (
                          confirm(
                            `Êtes-vous sûr de vouloir supprimer définitivement l'événement "${selectedEventDetails.title}" ? Cette action effacera également l'annonce et les émargements associés.`
                          )
                        ) {
                          try {
                            const res = await fetch(`/api/events/${selectedEventDetails.id}`, {
                              method: "DELETE",
                            });
                            if (res.ok) {
                              setSelectedEventDetails(null);
                              await fetchEvents();
                            } else {
                              const errData = await res.json();
                              alert(errData.error || "Échec de la suppression");
                            }
                          } catch {
                            alert("Erreur de connexion.");
                          }
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer
                    </Button>
                  </div>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                    <span className="text-[10px] text-ink-soft block font-mono">PRÉSENTS</span>
                    <strong className="text-emerald-500 text-base">
                      {selectedEventDetails._count?.present ||
                        (selectedEventDetails.attendanceRecords || []).filter((r: any) => r.status === "PRESENT").length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                    <span className="text-[10px] text-ink-soft block font-mono">EN RETARD</span>
                    <strong className="text-amber-500 text-base">
                      {selectedEventDetails._count?.late ||
                        (selectedEventDetails.attendanceRecords || []).filter((r: any) => r.status === "LATE").length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                    <span className="text-[10px] text-ink-soft block font-mono">ABSENTS</span>
                    <strong className="text-red-500 text-base">
                      {selectedEventDetails._count?.absent ||
                        (selectedEventDetails.attendanceRecords || []).filter((r: any) => r.status === "ABSENT").length}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-alt border border-line">
                    <span className="text-[10px] text-ink-soft block font-mono">EXCUSÉS</span>
                    <strong className="text-cyan-500 text-base">
                      {selectedEventDetails._count?.excused ||
                        (selectedEventDetails.attendanceRecords || []).filter((r: any) => r.status === "EXCUSED").length}
                    </strong>
                  </div>
                </div>

                {/* Live Attendee Records & Manual Adjustment */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-ink block font-display">
                    Feuille d'émargement ({selectedEventDetails.attendanceRecords?.length || 0})
                  </span>
                  <div className="max-h-48 overflow-y-auto divide-y divide-line/60 border border-line rounded-xl bg-surface">
                    {(selectedEventDetails.attendanceRecords || []).length > 0 ? (
                      selectedEventDetails.attendanceRecords.map((a: any, idx: number) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Avatar name={a.user?.name} src={a.user?.avatarUrl} size="sm" />
                            <div>
                              <span className="font-semibold text-ink block">{a.user?.name || "Membre"}</span>
                              <span className="text-[10px] text-ink-soft font-mono">
                                {a.checkedInAt ? formatTime(a.checkedInAt) : "Non émargé"} • {a.method || "QR"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                a.status === "PRESENT"
                                  ? "success"
                                  : a.status === "LATE"
                                  ? "warning"
                                  : a.status === "EXCUSED"
                                  ? "accent"
                                  : "danger"
                              }
                              size="sm"
                            >
                              {a.status}
                            </Badge>

                            <button
                              type="button"
                              onClick={() => {
                                setManualOverrideMember(a.user || { id: a.userId, name: "Membre" });
                                setManualOverrideStatus(a.status || "PRESENT");
                                setManualOverrideReason("");
                              }}
                              className="p-1 rounded hover:bg-surface-alt text-ink-soft hover:text-ink transition-colors"
                              title="Ajustement manuel (avec motif)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-ink-soft">
                        Aucun émargement pour le moment.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: EXCUSES */}
            {eventDetailTab === "excuses" && (
              <div className="space-y-4">
                {/* For members: Submit excuse */}
                <div className="p-4 rounded-xl bg-surface-alt border border-line space-y-3">
                  <span className="text-xs font-bold text-ink block font-display">
                    Signaler une absence / Soumettre une justification
                  </span>
                  <Textarea
                    placeholder="Précisez le motif valable de votre absence (ex: impératif académique, maladie, problème de transport)..."
                    value={excuseReason}
                    onChange={(e) => setExcuseReason(e.target.value)}
                    rows={2}
                  />
                  {excuseMessage && (
                    <p className="text-xs text-emerald-500 font-medium">{excuseMessage}</p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleSubmitExcuse}
                    disabled={isSubmittingExcuse || !excuseReason.trim()}
                  >
                    Envoyer ma justification
                  </Button>
                </div>

                {/* For Host/Board: review excuses */}
                {isSelectedEventHost && (
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-ink block font-display">
                      Demandes de justification en attente ({selectedEventDetails.excuseRequests?.length || 0})
                    </span>
                    <div className="max-h-40 overflow-y-auto divide-y divide-line/60 border border-line rounded-xl bg-surface">
                      {(selectedEventDetails.excuseRequests || []).length > 0 ? (
                        selectedEventDetails.excuseRequests.map((exc: any) => (
                          <div key={exc.id} className="p-3 text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-ink">{exc.user?.name || "Membre"}</span>
                              <Badge variant={exc.status === "APPROVED" ? "success" : exc.status === "REJECTED" ? "danger" : "warning"} size="sm">
                                {exc.status}
                              </Badge>
                            </div>
                            <p className="text-ink-soft bg-surface-alt p-2 rounded-lg text-[11px]">
                              "{exc.reason}"
                            </p>
                            {exc.status === "PENDING" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="primary"
                                  className="text-[11px] h-7 px-2.5"
                                  onClick={() => handleReviewExcuse(exc.id, selectedEventDetails.id, exc.userId, "APPROVED")}
                                >
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  className="text-[11px] h-7 px-2.5"
                                  onClick={() => handleReviewExcuse(exc.id, selectedEventDetails.id, exc.userId, "REJECTED")}
                                >
                                  Rejeter
                                </Button>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-xs text-ink-soft">
                          Aucune demande de justification enregistrée pour cette session.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 border-t border-line flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEventDetails(null)}>
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

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
      {/* FULLSCREEN PROJECTOR ROTATING QR MODAL */}
      {/* ========================================================================= */}
      {projectorEvent && (
        <RotatingQrProjectorModal
          isOpen={Boolean(projectorEvent)}
          onClose={() => setProjectorEvent(null)}
          event={projectorEvent}
          onStatusChange={fetchEvents}
        />
      )}

      {/* ========================================================================= */}
      {/* CREATE EVENT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isNewEventOpen}
        onClose={() => setIsNewEventOpen(false)}
        title="Créer un Événement & Publier l'Annonce"
        description="Crée automatiquement l'événement, l'annonce ciblée et le jeton d'émargement QR"
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-body flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Erreur de validation</p>
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
            label="Titre de l'événement *"
            placeholder="Ex: Workshop Architecture Next.js & Supabase"
            value={newEventForm.title}
            onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Type d'Événement"
              value={newEventForm.type}
              onChange={(e) => setNewEventForm({ ...newEventForm, type: e.target.value })}
            >
              <option value="WORKSHOP">Workshop / Atelier Technique</option>
              <option value="MEETING">Réunion d'Équipe / Brainstorming</option>
              <option value="SESSION">Session de Travail</option>
              <option value="PODCAST">Podcast Asteria</option>
              <option value="COMPETITION">Compétition / Hackathon</option>
              <option value="GENERAL">Assemblée Générale</option>
            </Select>

            <Select
              label="Audience / Portée"
              value={newEventForm.audienceScope}
              disabled={isHod && !isLeadership}
              onChange={(e) => setNewEventForm({ ...newEventForm, audienceScope: e.target.value })}
            >
              {!isHod || isLeadership ? (
                <>
                  <option value="CLUB">Tout le Club (Tous membres)</option>
                  <option value="DEPARTMENT">Département Spécifique</option>
                  <option value="BOARD">Bureau Exécutif Uniquement</option>
                </>
              ) : (
                <option value="DEPARTMENT">Mon Département Uniquement</option>
              )}
            </Select>
          </div>

          <Textarea
            label="Description & Programme"
            placeholder="Ordre du jour, prérequis et consignes..."
            value={newEventForm.description}
            onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              type="datetime-local"
              label="Date & Heure Début *"
              value={newEventForm.startTime}
              onChange={(e) => setNewEventForm({ ...newEventForm, startTime: e.target.value })}
            />

            <Input
              type="datetime-local"
              label="Date & Heure Fin *"
              value={newEventForm.endTime}
              onChange={(e) => setNewEventForm({ ...newEventForm, endTime: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Lieu ou Salle *"
              placeholder="Ex: Salle B2.12 / Amphi A / Discord"
              value={newEventForm.location}
              onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
            />

            <Select
              label="Département"
              value={newEventForm.departmentId}
              disabled={isHod && !isLeadership}
              onChange={(e) => setNewEventForm({ ...newEventForm, departmentId: e.target.value })}
            >
              <option value="">Tout le Club (Aucun département spécifique)</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Host Assignment Selector */}
          <Select
            label="Hôte de Session Désigné (Seuls Bureau ou HOD éligibles)"
            value={newEventForm.hostId}
            onChange={(e) => setNewEventForm({ ...newEventForm, hostId: e.target.value })}
          >
            <option value={currentUser?.id}>Moi-même ({currentUser?.name})</option>
            {leadershipUsers
              .filter((u) => u.id !== currentUser?.id)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
          </Select>

          {/* Check-In Window & Threshold Settings */}
          <div className="p-3.5 rounded-xl bg-surface-alt border border-line space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink font-mono uppercase">
                Paramètres d'Émargement
              </span>
              <label className="flex items-center gap-2 text-xs text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={newEventForm.attendanceRequired}
                  onChange={(e) =>
                    setNewEventForm({ ...newEventForm, attendanceRequired: e.target.checked })
                  }
                  className="rounded text-ast-primary focus:ring-0"
                />
                Émargement Requis
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-ink-soft block font-mono">
                  Ouvre avant (min)
                </label>
                <Input
                  type="number"
                  value={newEventForm.checkInWindowStartMin}
                  onChange={(e) =>
                    setNewEventForm({
                      ...newEventForm,
                      checkInWindowStartMin: Number(e.target.value),
                    })
                  }
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-ink-soft block font-mono">
                  Ferme après (min)
                </label>
                <Input
                  type="number"
                  value={newEventForm.checkInWindowEndMin}
                  onChange={(e) =>
                    setNewEventForm({
                      ...newEventForm,
                      checkInWindowEndMin: Number(e.target.value),
                    })
                  }
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-ink-soft block font-mono">
                  Seuil retard (min)
                </label>
                <Input
                  type="number"
                  value={newEventForm.lateThresholdMin}
                  onChange={(e) =>
                    setNewEventForm({
                      ...newEventForm,
                      lateThresholdMin: Number(e.target.value),
                    })
                  }
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-line flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsNewEventOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleCreateEvent}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Planification en cours..." : "Créer & Publier l'Annonce"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
