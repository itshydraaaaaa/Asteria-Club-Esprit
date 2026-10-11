"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Compass,
  Mail,
  ShieldCheck,
  Award,
  Phone,
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

  const [loadingLookup, setLoadingLookup] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Default start/end 14 days in the future at 14:00 - 17:00 (>= 10 days lead time rule)
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
    departmentId: currentUser?.departmentId || "",
    audience: "",
    ownerId: currentUser?.id || "",
    expectedAttendance: "",
    startAt: defaultDates.startAt,
    endAt: defaultDates.endAt,
    location: "",
    facilitators: "",
    budgetRequested: "",
    description: "",
    objectives: "",
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
        setActivityTypes(types);
        setDepartments(deptRes.departments || []);
        setMembers(memRes.members || []);

        if (types.length > 0) {
          setForm((prev) => ({
            ...prev,
            activityTypeId: types[0].id,
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

  // Calculate days in advance to warn if < 10 days (ESPRIT Reservation Rule)
  const daysInAdvance = useMemo(() => {
    if (!form.startAt) return 14;
    const diffMs = new Date(form.startAt).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }, [form.startAt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg(null);

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

    setSubmitting(true);
    try {
      const res = await fetch("/api/planner/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          objectives: form.objectives.trim(),
          activityTypeId: form.activityTypeId,
          ownerId: form.ownerId || currentUser?.id,
          departmentId: form.departmentId || null,
          audience: form.audience.trim(),
          expectedAttendance: Number(form.expectedAttendance || 0),
          startAt: new Date(form.startAt).toISOString(),
          endAt: new Date(form.endAt).toISOString(),
          location: form.location.trim(),
          facilitators: form.facilitators.trim(),
          budgetRequested: Number(form.budgetRequested || 0),
          status: "IDEA",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Erreur lors de la création de l'activité");
        setSubmitting(false);
        return;
      }

      router.push(`/planner/activities/${data.activity.id}`);
    } catch (err: any) {
      setErrorMsg(err?.message || "Unexpected error");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
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
              ? "Créer un Nouveau Projet d'Activité"
              : "Create a New Activity Project"}
          </h2>
          <p className="text-xs text-ink-soft font-body">
            {isFr
              ? "Renseignez vos informations réelles (aucun contenu ni e-mail n'est généré automatiquement à votre place)."
              : "Enter your real project details (no fake content or template emails are auto-generated)."}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {daysInAdvance < 10 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              {isFr
                ? `Attention au délai ESPRIT : votre date est à J-${daysInAdvance}`
                : `ESPRIT Lead-Time Warning: Your date is in ${daysInAdvance} days`}
            </p>
            <p className="mt-0.5">
              {isFr
                ? "Règle officielle ESPRIT : Les réservations doivent se faire au moins 10 jours avant l'évènement, et l'e-mail descriptif à M. Zied Saidi au moins 1 semaine à l'avance."
                : "Official ESPRIT rule: Reservations must be made at least 10 days before the event, and the descriptive email to M. Zied Saidi at least 1 week in advance."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2/3: Clean Single-Step Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 p-6 bg-surface rounded-2xl border border-line shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label={isFr ? "Titre de l'Évènement / Activité *" : "Activity Title *"}
                placeholder={
                  isFr
                    ? "Ex: Conférence IA & Cybersécurité / Workshop Web"
                    : "e.g. AI & Cybersecurity Conference"
                }
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <Select
              label={isFr ? "Type d'Activité *" : "Activity Type *"}
              value={form.activityTypeId}
              onChange={(e) =>
                setForm({ ...form, activityTypeId: e.target.value })
              }
            >
              {loadingLookup && <option value="">Chargement...</option>}
              {activityTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {isFr ? t.nameFr || t.name : t.name}
                </option>
              ))}
            </Select>

            <Select
              label={isFr ? "Pôle / Département" : "Department"}
              value={form.departmentId}
              onChange={(e) =>
                setForm({ ...form, departmentId: e.target.value })
              }
            >
              <option value="">
                {isFr ? "Club Entier (Tous les pôles)" : "Club-Wide"}
              </option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
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

            <Input
              label={isFr ? "Lieu / Salle souhaitée" : "Venue / Requested Room"}
              placeholder={
                isFr ? "Ex: Amphi B / Salle B204" : "e.g. Amphitheater B"
              }
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />

            <Input
              label={
                isFr
                  ? "Public Cible (Règle d'Or n°2)"
                  : "Target Audience (Golden Rule #2)"
              }
              placeholder={
                isFr
                  ? "Ex: Étudiants ESPRIT, Membres du club..."
                  : "e.g. ESPRIT students, Club members..."
              }
              value={form.audience}
              onChange={(e) => setForm({ ...form, audience: e.target.value })}
            />

            <Input
              type="number"
              label={isFr ? "Nombre de participants estimé" : "Expected Attendance"}
              placeholder="Ex: 50"
              value={form.expectedAttendance}
              onChange={(e) =>
                setForm({ ...form, expectedAttendance: e.target.value })
              }
            />

            <Select
              label={
                isFr
                  ? "Responsable du Projet (Chef d'Organisation)"
                  : "Project Lead"
              }
              value={form.ownerId}
              onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label={
              isFr
                ? "Description de l'évènement (pour la validation Vie Estudiantine)"
                : "Event Description"
            }
            placeholder={
              isFr
                ? "Décrivez le concept et le déroulement général de l'évènement..."
                : "Describe the event concept..."
            }
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Textarea
            label={
              isFr
                ? "Objectifs à atteindre & Résultat escompté (Règle d'Or n°2 — 1 par ligne)"
                : "Objectives & Expected Outcome (1 per line)"
            }
            placeholder={
              isFr
                ? "Ex:\nFormer 40 étudiants aux bases du Cloud\nPrésenter les projets du pôle"
                : "e.g.\nTrain 40 students\nShowcase department projects"
            }
            value={form.objectives}
            onChange={(e) => setForm({ ...form, objectives: e.target.value })}
          />

          <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
            <Link
              href="/planner"
              className="px-4 py-2 rounded-xl border border-line text-xs font-semibold text-ink-soft hover:text-ink"
            >
              {isFr ? "Annuler" : "Cancel"}
            </Link>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {submitting
                ? isFr
                  ? "Création..."
                  : "Creating..."
                : isFr
                ? "Créer le Projet d'Activité"
                : "Create Activity Project"}
            </Button>
          </div>
        </form>

        {/* Right 1/3: Official ESPRIT Process & 7 Golden Rules Reference */}
        <div className="space-y-4">
          <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-ast-primary">
              <Mail className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-display font-bold uppercase tracking-wider">
                {isFr
                  ? "Processus Administratif ESPRIT"
                  : "ESPRIT Administrative Process"}
              </h3>
            </div>

            <ol className="space-y-2 text-xs text-ink-soft font-body list-decimal list-inside">
              <li>
                <strong className="text-ink">Vie Estudiantine (J-7 min) :</strong>{" "}
                E-mail descriptif à{" "}
                <span className="font-mono text-ast-primary">
                  zied.saidi@esprit.tn
                </span>{" "}
                (Tél: 92234330).
              </li>
              <li>
                <strong className="text-ink">Scolarité (J-10 min) :</strong>{" "}
                Espace & vidéoprojecteurs →{" "}
                <span className="font-mono text-ast-primary">
                  mohamedali.bouakline@Esprit.tn
                </span>
              </li>
              <li>
                <strong className="text-ink">Matériel Technique (J-10) :</strong>{" "}
                Sono & autres →{" "}
                <span className="font-mono text-ast-primary">
                  faycal.lbabda@esprit.tn
                </span>
              </li>
              <li>
                <strong className="text-ink">Logistique (J-10) :</strong>{" "}
                <span className="font-mono text-ast-primary">
                  hazem.hajji@esprit.tn
                </span>
              </li>
              <li>
                <strong className="text-ink">Publication & Promo :</strong>{" "}
                <span className="font-mono text-ast-primary">
                  Nadia.ajailia@Esprit.tn
                </span>
              </li>
              <li>
                <strong className="text-ink">Achats (Devis & BC) :</strong>{" "}
                <span className="font-mono text-ast-primary">
                  souhail.mezzi@esprit.tn
                </span>
              </li>
            </ol>

            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">NB Obligatoires :</p>
              <p>• Réservations au moins <strong>10 jours avant</strong> l’évènement.</p>
              <p>
                • Mettre <strong>M. Zied Saidi</strong> et{" "}
                <strong>M. Faycel Lbabda</strong> en copie (CC) dans tous les
                e-mails.
              </p>
              <p>
                • Devis au nom d’Esprit — Matricule Fiscal :{" "}
                <strong className="font-mono">830 823 C PM 000</strong>.
              </p>
              <p>
                • Rapport d’action + rapport de collecte ≤ <strong>3 jours</strong>{" "}
                post-évent + facture originale cachetée.
              </p>
            </div>
          </div>

          <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4 shrink-0" />
              <h3 className="text-xs font-display font-bold uppercase tracking-wider">
                {isFr
                  ? "Les 7 Règles d'Or d'un Évent Réussi"
                  : "7 Golden Rules of a Successful Event"}
              </h3>
            </div>
            <ol className="space-y-1.5 text-xs text-ink-soft font-body list-decimal list-inside">
              <li>Se prendre toujours à l’avance !</li>
              <li>
                Définir les objectifs à atteindre, le résultat escompté & le
                public cible.
              </li>
              <li>
                Mettre en place un comité d’organisation avec des tâches bien
                définies.
              </li>
              <li>Définir un plan d’action avec un chronogramme.</li>
              <li>Se comporter en professionnel !</li>
              <li>
                Le jour de l’évent, être parfaitement prêt, ne RIEN laisser au
                hasard.
              </li>
              <li>
                Assurer le suivi après évent (rapport ≤ 3j, facture originale,
                remerciements…).
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
