"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { calculateTaskDueDate } from "@/lib/planner/logic";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Calendar,
  Layers,
  Mail,
  Package,
  Compass,
  Plus,
  Trash2,
} from "lucide-react";

interface NewActivityWizardClientProps {
  currentUser: any;
}

export function NewActivityWizardClient({
  currentUser,
}: NewActivityWizardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const isFr = language === "fr";

  const initialDateParam = searchParams.get("date");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingLookup, setLoadingLookup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  // Default start/end 14 days in the future at 14:00 - 17:00
  const defaultDates = useMemo(() => {
    const base = initialDateParam
      ? new Date(`${initialDateParam}T14:00:00`)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    if (!initialDateParam) {
      base.setHours(14, 0, 0, 0);
    }
    const end = new Date(base.getTime() + 3 * 60 * 60 * 1000);
    const toLocalInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
        d.getDate()
      )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      startAt: toLocalInput(base),
      endAt: toLocalInput(end),
    };
  }, [initialDateParam]);

  const [form, setForm] = useState({
    title: "",
    activityTypeId: "",
    templateId: "",
    departmentId: currentUser?.departmentId || "",
    audienceScope: currentUser?.departmentId ? "DEPARTMENT" : "CLUB",
    ownerId: currentUser?.id || "",
    expectedAttendance: 35,
    startAt: defaultDates.startAt,
    endAt: defaultDates.endAt,
    location: "Bloc B — Salle B204, Campus ESPRIT",
    roomDetails: "",
    facilitators: currentUser?.name || "",
    budgetRequested: 0,
    description: "",
    objectives: "",
    deliverablesText: "Support de présentation PDF\nFeuille de présence QR\nAlbum photos média",
    notes: "",
    defaultEmailLanguage: isFr ? "fr" : "en",
  });

  // Editable Step 2 items
  const [customTasks, setCustomTasks] = useState<any[]>([]);
  const [customRequirements, setCustomRequirements] = useState<any[]>([]);
  const [customEmails, setCustomEmails] = useState<any[]>([]);
  const [scheduleMeta, setScheduleMeta] = useState<{
    isCompressed: boolean;
    earliestOffsetDays: number;
    availableDays: number;
  }>({
    isCompressed: false,
    earliestOffsetDays: 0,
    availableDays: 14,
  });

  useEffect(() => {
    const loadLookup = async () => {
      setLoadingLookup(true);
      try {
        const [ovRes, deptRes, memRes] = await Promise.all([
          fetch("/api/planner/overview").then((r) => r.json()),
          fetch("/api/departments").then((r) => r.json()),
          fetch("/api/members").then((r) => r.json()),
        ]);

        const types = ovRes.activityTypes || [];
        const tpls = ovRes.templates || [];
        setActivityTypes(types);
        setTemplates(tpls);
        setResources(ovRes.resources || []);
        setDepartments(deptRes.departments || []);
        setMembers(memRes.members || []);

        if (types.length > 0) {
          const firstType = types[0];
          const matchingTpl = tpls.find(
            (t: any) => t.activityTypeId === firstType.id
          );
          setForm((prev) => ({
            ...prev,
            activityTypeId: firstType.id,
            templateId: matchingTpl?.id || "",
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLookup(false);
      }
    };
    loadLookup();
  }, []);

  // Recompute backward schedule whenever templateId or startAt changes
  useEffect(() => {
    const selectedTpl = templates.find((t) => t.id === form.templateId);
    if (!selectedTpl || !form.startAt) {
      setCustomTasks([]);
      setCustomRequirements([]);
      setCustomEmails([]);
      return;
    }

    const activityStartAt = new Date(form.startAt);
    const now = new Date();
    const blueprints: any[] = selectedTpl.defaultTasks || [];
    const availableDays = Math.max(
      0,
      Math.ceil((activityStartAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
    const earliestOffsetDays = blueprints.reduce(
      (min, b) => Math.min(min, Number(b.offsetDays || 0)),
      0
    );

    const computedTasks = blueprints.map((bp: any, idx: number) => {
      const calc = calculateTaskDueDate(
        activityStartAt,
        Number(bp.offsetDays || 0),
        now
      );
      const rawTarget = new Date(activityStartAt);
      rawTarget.setDate(rawTarget.getDate() - Number(bp.offsetDays || 0));
      const wasWeekend = rawTarget.getDay() === 0 || rawTarget.getDay() === 6;

      return {
        id: `wiz_task_${idx}`,
        enabled: true,
        title: isFr ? bp.titleFr || bp.title : bp.title,
        description: isFr
          ? bp.descriptionFr || bp.description
          : bp.description,
        phase: bp.phase,
        priority: bp.priority,
        offsetDays: bp.offsetDays,
        dueDate: calc.dueDate.split("T")[0],
        wasShifted: wasWeekend,
        wasClamped: calc.isCompressed,
        assigneeId: form.ownerId || currentUser?.id || "",
      };
    });

    setScheduleMeta({
      isCompressed: computedTasks.some((t) => t.wasClamped),
      earliestOffsetDays,
      availableDays,
    });

    setCustomTasks(computedTasks);

    setCustomRequirements(
      (selectedTpl.defaultRequirements || []).map((r: any, idx: number) => ({
        id: `wiz_req_${idx}`,
        enabled: true,
        category: r.category,
        name: isFr ? r.nameFr || r.name : r.name,
        quantity: r.quantity || 1,
        estimatedCost: r.estimatedCost || 0,
        resourceId: "",
        notes: r.notes || "",
      }))
    );

    setCustomEmails(
      (selectedTpl.defaultEmails || []).map((em: any, idx: number) => ({
        id: `wiz_em_${idx}`,
        enabled: true,
        category: em.category,
        offsetDays: em.offsetDays,
        notes: em.notes || "",
      }))
    );
  }, [form.templateId, form.startAt, templates, isFr, form.ownerId, currentUser?.id]);

  const handleTypeChange = (newTypeId: string) => {
    const matchingTpl = templates.find((t) => t.activityTypeId === newTypeId);
    setForm((prev) => ({
      ...prev,
      activityTypeId: newTypeId,
      templateId: matchingTpl?.id || "",
    }));
  };

  const handleNextStep = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!form.title.trim()) {
        setErrorMsg(
          isFr
            ? "Veuillez saisir le titre de l'activité."
            : "Please enter an activity title."
        );
        return;
      }
      if (!form.activityTypeId) {
        setErrorMsg(
          isFr
            ? "Veuillez choisir un type d'activité."
            : "Please select an activity type."
        );
        return;
      }
      if (new Date(form.endAt).getTime() <= new Date(form.startAt).getTime()) {
        setErrorMsg(
          isFr
            ? "L'heure de fin doit être postérieure à l'heure de début."
            : "End time must be after start time."
        );
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async (initialStatus: "IDEA" | "SUBMITTED") => {
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const deliverables = form.deliverablesText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch("/api/planner/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          objectives: form.objectives,
          deliverables,
          notes: form.notes,
          activityTypeId: form.activityTypeId,
          templateId: form.templateId || null,
          ownerId: form.ownerId || currentUser?.id,
          departmentId: form.departmentId || null,
          audienceScope: form.audienceScope,
          expectedAttendance: Number(form.expectedAttendance || 30),
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          location: form.location,
          roomDetails: form.roomDetails,
          facilitators: form.facilitators,
          budgetRequested: Number(form.budgetRequested || 0),
          status: initialStatus,
          defaultEmailLanguage: form.defaultEmailLanguage,
          customTasks,
          customRequirements,
          customEmails,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create activity");
        setSubmitting(false);
        return;
      }

      router.push(`/planner/activities/${data.activity.id}`);
    } catch (e: any) {
      setErrorMsg(e?.message || "Unexpected error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/planner"
            className="p-2 rounded-xl border border-line bg-surface hover:bg-surface-alt text-ink-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-lg font-display font-bold text-ink">
              {isFr
                ? "Assistant de Création d'Activité (Rétroplanning J-X)"
                : "New Activity Wizard (T-Minus Backward Scheduler)"}
            </h2>
            <p className="text-xs text-ink-soft font-body">
              {isFr
                ? "Configurez le brief, personnalisez l'échéancier automatique et générez les demandes administratives ESPRIT"
                : "Configure the brief, customize the backward schedule, and generate ESPRIT admin requests"}
            </p>
          </div>
        </div>

        {/* 3-Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {[
            { num: 1, labelFr: "1. Brief & Dates", labelEn: "1. Brief & Dates" },
            {
              num: 2,
              labelFr: "2. Rétroplanning J-X",
              labelEn: "2. Backward Schedule",
            },
            {
              num: 3,
              labelFr: "3. Revue & Lancement",
              labelEn: "3. Review & Launch",
            },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                if (s.num < step) setStep(s.num as 1 | 2 | 3);
              }}
              className={`px-3 py-1.5 rounded-xl border font-bold transition-all ${
                step === s.num
                  ? "bg-ast-primary text-white border-ast-primary shadow-sm"
                  : step > s.num
                  ? "bg-teal-50 dark:bg-teal-950/60 text-ast-primary dark:text-ast-light border-teal-200 dark:border-teal-800"
                  : "bg-surface text-ink-faint border-line"
              }`}
            >
              {isFr ? s.labelFr : s.labelEn}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: BRIEF & DEFINITION */}
      {step === 1 && (
        <div className="p-6 bg-surface rounded-2xl border border-line shadow-sm space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label={isFr ? "Titre de l'Activité *" : "Activity Title *"}
                placeholder={
                  isFr
                    ? "ex: Workshop Architecture Cloud & Kubernetes avec AWS"
                    : "e.g. Cloud Architecture & Kubernetes Workshop"
                }
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <Select
              label={isFr ? "Type d'Activité *" : "Activity Type *"}
              value={form.activityTypeId}
              onChange={(e) => handleTypeChange(e.target.value)}
            >
              {activityTypes.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {isFr ? t.nameFr : t.name}
                </option>
              ))}
            </Select>

            <Select
              label={
                isFr
                  ? "Modèle Opérationnel (Rétroplanning)"
                  : "Operational Template (Backward Schedule)"
              }
              value={form.templateId}
              onChange={(e) => setForm({ ...form, templateId: e.target.value })}
            >
              <option value="">
                {isFr
                  ? "— Sans Modèle (Projet Vierge) —"
                  : "— Blank Project (No Template) —"}
              </option>
              {templates.map((tpl: any) => (
                <option key={tpl.id} value={tpl.id}>
                  {isFr ? tpl.nameFr : tpl.name} (
                  {(tpl.defaultTasks || []).length}{" "}
                  {isFr ? "tâches" : "tasks"})
                </option>
              ))}
            </Select>

            <Input
              type="datetime-local"
              label={isFr ? "Date & Heure de Début *" : "Start Date & Time *"}
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
            />

            <Input
              type="datetime-local"
              label={isFr ? "Date & Heure de Fin *" : "End Date & Time *"}
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
            />

            <Select
              label={isFr ? "Responsable Principal (Lead)" : "Lead Organizer"}
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            >
              {members.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </Select>

            <Select
              label={isFr ? "Pôle / Département" : "Department / Pôle"}
              value={form.departmentId}
              onChange={(e) =>
                setForm({
                  ...form,
                  departmentId: e.target.value,
                  audienceScope: e.target.value ? "DEPARTMENT" : "CLUB",
                })
              }
            >
              <option value="">
                {isFr ? "Club Entier (Transversal)" : "Whole Club (Cross-Department)"}
              </option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>

            <Select
              label={isFr ? "Portée de l'Audience" : "Audience Scope"}
              value={form.audienceScope}
              onChange={(e) =>
                setForm({ ...form, audienceScope: e.target.value })
              }
            >
              <option value="CLUB">
                {isFr ? "Tous les Membres du Club" : "All Club Members"}
              </option>
              <option value="DEPARTMENT">
                {isFr ? "Membres du Pôle Uniquement" : "Department Members Only"}
              </option>
              <option value="BOARD">
                {isFr ? "Bureau Exécutif Uniquement" : "Executive Board Only"}
              </option>
            </Select>

            <Input
              type="number"
              label={
                isFr ? "Participants Attendus" : "Expected Attendance"
              }
              value={String(form.expectedAttendance)}
              onChange={(e) =>
                setForm({
                  ...form,
                  expectedAttendance: Number(e.target.value || 0),
                })
              }
            />

            <Input
              label={isFr ? "Lieu / Salle Principale *" : "Venue / Main Room *"}
              placeholder="ex: Amphithéâtre B / Salle B204"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <Input
              label={
                isFr
                  ? "Intervenants / Formateurs"
                  : "Facilitators / Speakers"
              }
              placeholder="ex: Ing. Yassine Ben Ali, Équipe Dev"
              value={form.facilitators}
              onChange={(e) =>
                setForm({ ...form, facilitators: e.target.value })
              }
            />

            <Input
              type="number"
              label={
                isFr ? "Budget Prévisionnel (TND)" : "Requested Budget (TND)"
              }
              value={String(form.budgetRequested)}
              onChange={(e) =>
                setForm({
                  ...form,
                  budgetRequested: Number(e.target.value || 0),
                })
              }
            />

            <Select
              label={
                isFr
                  ? "Langue des Emails Administratifs"
                  : "Default Admin Email Language"
              }
              value={form.defaultEmailLanguage}
              onChange={(e) =>
                setForm({ ...form, defaultEmailLanguage: e.target.value })
              }
            >
              <option value="fr">Français (Officiel ESPRIT)</option>
              <option value="en">English</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Textarea
              label={
                isFr
                  ? "Description & Contexte"
                  : "Activity Description & Context"
              }
              placeholder={
                isFr
                  ? "Présentez le sujet, le déroulement général et la valeur ajoutée pour les membres..."
                  : "Describe the topic, structure, and value for members..."
              }
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />

            <Textarea
              label={
                isFr
                  ? "Objectifs Pédagogiques & Stratégiques"
                  : "Learning & Strategic Objectives"
              }
              placeholder={
                isFr
                  ? "Quels sont les acquis mesurables à l'issue de la séance ?"
                  : "What are the measurable takeaways of this session?"
              }
              value={form.objectives}
              onChange={(e) => setForm({ ...form, objectives: e.target.value })}
            />
          </div>

          <Textarea
            label={
              isFr
                ? "Livrables Attendus (un par ligne)"
                : "Expected Deliverables (one per line)"
            }
            value={form.deliverablesText}
            onChange={(e) =>
              setForm({ ...form, deliverablesText: e.target.value })
            }
          />

          <div className="pt-4 border-t border-line flex justify-end">
            <Button
              variant="primary"
              onClick={handleNextStep}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isFr
                ? "Continuer vers le Rétroplanning J-X"
                : "Continue to Backward Schedule"}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: TEMPLATE & BACKWARD SCHEDULE PREVIEW */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Compression Warning Banner */}
          {scheduleMeta.isCompressed && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  {isFr
                    ? `Calendrier Compressé Détecté (${scheduleMeta.availableDays} jours disponibles au lieu de ${Math.abs(
                        scheduleMeta.earliestOffsetDays
                      )} jours recommandés)`
                    : `Compressed Schedule Detected (${scheduleMeta.availableDays} days available vs ${Math.abs(
                        scheduleMeta.earliestOffsetDays
                      )} days recommended)`}
                </p>
                <p className="text-amber-800/90 dark:text-amber-300/90">
                  {isFr
                    ? "Les tâches dont l'échéance théorique tombait dans le passé ont été automatiquement recalées à demain (J+1) et signalées par un badge d'alerte."
                    : "Tasks whose theoretical offset fell in the past have been clamped to tomorrow and flagged."}
                </p>
              </div>
            </div>
          )}

          {/* Tasks Preview & Customization */}
          <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-bold text-ink flex items-center gap-2">
                  <Layers className="w-4 h-4 text-ast-primary" />
                  {isFr
                    ? `Échéancier Automatique des Tâches (${
                        customTasks.filter((t) => t.enabled).length
                      })`
                    : `Backward-Scheduled Tasks (${
                        customTasks.filter((t) => t.enabled).length
                      })`}
                </h3>
                <p className="text-xs text-ink-soft">
                  {isFr
                    ? "Les échéances tombant un samedi ou dimanche sont automatiquement avancées au vendredi précédent."
                    : "Deadlines falling on Saturday or Sunday are automatically shifted to the preceding Friday."}
                </p>
              </div>

              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() =>
                  setCustomTasks([
                    ...customTasks,
                    {
                      id: `wiz_custom_${Date.now()}`,
                      enabled: true,
                      title: isFr ? "Nouvelle tâche préparatoire" : "New preparation task",
                      description: "",
                      phase: "PREPARATION",
                      priority: "MEDIUM",
                      offsetDays: -3,
                      dueDate: new Date(Date.now() + 2 * 86400000)
                        .toISOString()
                        .split("T")[0],
                      wasShifted: false,
                      wasClamped: false,
                      assigneeId: form.ownerId,
                    },
                  ])
                }
              >
                {isFr ? "Ajouter Tâche" : "Add Task"}
              </Button>
            </div>

            <div className="space-y-2.5">
              {customTasks.map((t, idx) => (
                <div
                  key={t.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    t.enabled
                      ? "bg-surface-alt border-line"
                      : "bg-surface-alt/40 border-line/40 opacity-50"
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={t.enabled}
                      onChange={(e) => {
                        const copy = [...customTasks];
                        copy[idx].enabled = e.target.checked;
                        setCustomTasks(copy);
                      }}
                      className="mt-1 rounded border-line text-ast-primary focus:ring-ast-primary"
                    />
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => {
                          const copy = [...customTasks];
                          copy[idx].title = e.target.value;
                          setCustomTasks(copy);
                        }}
                        className="w-full bg-transparent text-xs font-bold text-ink border-b border-transparent focus:border-ast-primary focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-ast-primary font-bold">
                          {t.offsetDays >= 0
                            ? `J+${t.offsetDays}`
                            : `J${t.offsetDays}`}
                        </span>
                        <span className="text-ink-soft">{t.phase}</span>
                        {t.wasShifted && (
                          <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {isFr
                              ? "Décalé au Vendredi (Week-end évité)"
                              : "Shifted to Friday (Weekend avoided)"}
                          </span>
                        )}
                        {t.wasClamped && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                            {isFr ? "Compressé (J+1)" : "Compressed (Tomorrow)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={t.dueDate}
                      onChange={(e) => {
                        const copy = [...customTasks];
                        copy[idx].dueDate = e.target.value;
                        setCustomTasks(copy);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-line bg-surface text-xs font-mono text-ink"
                    />
                    <select
                      value={t.priority}
                      onChange={(e) => {
                        const copy = [...customTasks];
                        copy[idx].priority = e.target.value;
                        setCustomTasks(copy);
                      }}
                      className="px-2 py-1 rounded-lg border border-line bg-surface text-xs font-mono text-ink"
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                      <option value="URGENT">URGENT</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logistics Requirements & Admin Emails Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Package className="w-4 h-4 text-ast-primary" />
                {isFr
                  ? `Besoins Logistiques Pré-configurés (${
                      customRequirements.filter((r) => r.enabled).length
                    })`
                  : `Default Logistics Requirements (${
                      customRequirements.filter((r) => r.enabled).length
                    })`}
              </h3>
              <div className="space-y-2">
                {customRequirements.map((r, idx) => (
                  <label
                    key={r.id}
                    className="p-2.5 rounded-xl bg-surface-alt border border-line flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={r.enabled}
                        onChange={(e) => {
                          const copy = [...customRequirements];
                          copy[idx].enabled = e.target.checked;
                          setCustomRequirements(copy);
                        }}
                      />
                      <div>
                        <p className="font-bold text-ink">{r.name}</p>
                        <p className="text-[10px] font-mono text-ink-soft">
                          {r.category} · x{r.quantity}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
              <h3 className="text-xs font-display font-bold uppercase tracking-wider text-ink flex items-center gap-2">
                <Mail className="w-4 h-4 text-ast-primary" />
                {isFr
                  ? `Brouillons d'Emails Administratifs ESPRIT (${
                      customEmails.filter((e) => e.enabled).length
                    })`
                  : `ESPRIT Admin Email Drafts (${
                      customEmails.filter((e) => e.enabled).length
                    })`}
              </h3>
              <div className="space-y-2">
                {customEmails.map((em, idx) => (
                  <label
                    key={em.id}
                    className="p-2.5 rounded-xl bg-surface-alt border border-line flex items-center justify-between gap-2 text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={em.enabled}
                        onChange={(e) => {
                          const copy = [...customEmails];
                          copy[idx].enabled = e.target.checked;
                          setCustomEmails(copy);
                        }}
                      />
                      <div>
                        <p className="font-bold text-ink">
                          {isFr ? "Demande Officielle :" : "Official Request:"}{" "}
                          {em.category}
                        </p>
                        <p className="text-[10px] font-mono text-ink-soft">
                          {em.notes || `J${em.offsetDays}`}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              {isFr ? "Retour au Brief" : "Back to Brief"}
            </Button>
            <Button
              variant="primary"
              onClick={handleNextStep}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {isFr ? "Passer à la Validation Finale" : "Proceed to Final Review"}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW & IDEMPOTENT LAUNCH */}
      {step === 3 && (
        <div className="p-6 bg-surface rounded-2xl border border-line shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ast-primary font-bold">
                {isFr ? "Étape 3 sur 3 · Récapitulatif" : "Step 3 of 3 · Summary"}
              </span>
              <h3 className="text-lg font-display font-bold text-ink">
                {form.title}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950 text-ast-primary text-xs font-mono font-bold">
              {formatDate(form.startAt)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-surface-alt border border-line">
              <span className="text-[10px] font-mono uppercase text-ink-soft block">
                {isFr ? "Tâches Générées" : "Scheduled Tasks"}
              </span>
              <p className="text-xl font-display font-bold text-ast-primary mt-1">
                {customTasks.filter((t) => t.enabled).length}
              </p>
              <span className="text-[11px] text-ink-faint">
                {isFr ? "Synchronisées avec le Kanban" : "Synced with Kanban board"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-alt border border-line">
              <span className="text-[10px] font-mono uppercase text-ink-soft block">
                {isFr ? "Besoins Logistiques" : "Logistics Items"}
              </span>
              <p className="text-xl font-display font-bold text-indigo-600 mt-1">
                {customRequirements.filter((r) => r.enabled).length}
              </p>
              <span className="text-[11px] text-ink-faint">
                {isFr
                  ? `Budget demandé : ${form.budgetRequested} TND`
                  : `Requested budget: ${form.budgetRequested} TND`}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-surface-alt border border-line">
              <span className="text-[10px] font-mono uppercase text-ink-soft block">
                {isFr ? "Emails Administratifs" : "Admin Email Drafts"}
              </span>
              <p className="text-xl font-display font-bold text-amber-600 mt-1">
                {customEmails.filter((e) => e.enabled).length}
              </p>
              <span className="text-[11px] text-ink-faint">
                {isFr ? "Pré-remplis en " : "Pre-rendered in "}
                {form.defaultEmailLanguage.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-line">
            <Button
              variant="secondary"
              onClick={() => setStep(2)}
              disabled={submitting}
            >
              {isFr ? "Modifier le Rétroplanning" : "Edit Backward Schedule"}
            </Button>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => handleSubmit("IDEA")}
                disabled={submitting}
              >
                {submitting
                  ? isFr
                    ? "Création..."
                    : "Creating..."
                  : isFr
                  ? "Enregistrer en Brouillon (IDEA)"
                  : "Save as Idea / Draft"}
              </Button>

              <Button
                variant="primary"
                onClick={() => handleSubmit("SUBMITTED")}
                disabled={submitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {submitting
                  ? isFr
                    ? "Lancement en cours..."
                    : "Launching..."
                  : isFr
                  ? "Créer & Soumettre pour Validation"
                  : "Create & Submit for Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
