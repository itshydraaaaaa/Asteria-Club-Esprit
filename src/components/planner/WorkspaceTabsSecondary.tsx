"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { formatDate } from "@/lib/utils";
import {
  Package,
  AlertTriangle,
  Plus,
  Trash2,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Upload,
  MessageSquare,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Lock,
} from "lucide-react";

// ============================================================================
// TAB 3: LOGISTICS & REQUIREMENTS
// ============================================================================

export function LogisticsTab({
  isFr,
  activity,
  requirements,
  resources,
  resourceConflicts,
  members,
  canEdit,
  onRefresh,
}: {
  isFr: boolean;
  activity: any;
  requirements: any[];
  resources: any[];
  resourceConflicts: Record<string, any>;
  members: any[];
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [newReq, setNewReq] = useState({
    category: "EQUIPMENT",
    name: "",
    quantity: 1,
    resourceId: "",
    estimatedCost: 0,
    actualCost: 0,
    assignedToId: activity.ownerId || "",
    notes: "",
  });

  const totalEstimated = requirements.reduce(
    (s, r) => s + Number(r.estimatedCost || 0),
    0
  );
  const totalActual = requirements.reduce(
    (s, r) => s + Number(r.actualCost || 0),
    0
  );

  const handleCreateRequirement = async () => {
    if (!newReq.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/planner/activities/${activity.id}/requirements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newReq),
        }
      );
      if (res.ok) {
        setNewReq({
          category: "EQUIPMENT",
          name: "",
          quantity: 1,
          resourceId: "",
          estimatedCost: 0,
          actualCost: 0,
          assignedToId: activity.ownerId || "",
          notes: "",
        });
        onRefresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRequirement = async (
    requirementId: string,
    updates: Record<string, any>
  ) => {
    await fetch(`/api/planner/activities/${activity.id}/requirements`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirementId, ...updates }),
    });
    onRefresh();
  };

  const handleDeleteRequirement = async (requirementId: string) => {
    await fetch(
      `/api/planner/activities/${activity.id}/requirements?requirementId=${requirementId}`,
      { method: "DELETE" }
    );
    onRefresh();
  };

  const [copiedMf, setCopiedMf] = useState(false);
  const conflictList = Object.values(resourceConflicts || {});

  const handleCopyMf = () => {
    navigator.clipboard.writeText("830 823 C PM 000");
    setCopiedMf(true);
    setTimeout(() => setCopiedMf(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Official ESPRIT Devis, Achats & Factures Rules Banner */}
      <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2.5 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-display font-bold text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-ast-primary" />
            {isFr
              ? "Règles Officielles Devis, Achats & Factures ESPRIT (6/ M. Souhail Mezzi — souhail.mezzi@esprit.tn)"
              : "Official ESPRIT Quotes, Purchases & Invoice Rules (6/ Mr. Souhail Mezzi — souhail.mezzi@esprit.tn)"}
          </h4>

          <button
            type="button"
            onClick={handleCopyMf}
            className="px-3 py-1 rounded-xl bg-surface border border-line hover:border-ast-primary text-xs font-mono font-bold text-ast-primary flex items-center gap-1.5 transition-colors"
          >
            {copiedMf ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {isFr ? "MF Copié !" : "Tax ID Copied!"}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Matricule Fiscal Esprit : 830 823 C PM 000
              </>
            )}
          </button>
        </div>

        <ul className="space-y-1 text-ink-soft leading-relaxed list-disc pl-4">
          <li>
            {isFr ? (
              <>
                <strong>Subventions prioritaires :</strong> Il faut toujours privilégier les subventions et autres donations en nature et ne recourir à Esprit que si on n&apos;a plus le choix.
              </>
            ) : (
              <>
                <strong>Sponsorships first:</strong> Always prioritize grants and in-kind donations, and only resort to Esprit funding as a last resort.
              </>
            )}
          </li>
          <li>
            {isFr ? (
              <>
                <strong>Conformité du Devis :</strong> Le devis détaillé doit être bien étudié, établi <strong>au nom d&apos;Esprit</strong> avec le <strong>Matricule Fiscal d&apos;Esprit : <code className="font-mono font-bold text-ink">830 823 C PM 000</code></strong>, comporter les <strong>coordonnées complètes du prestataire</strong> (nom, prénom, contacts + <strong>son matricule fiscal</strong>) ainsi que le <strong>mode de paiement</strong>.
              </>
            ) : (
              <>
                <strong>Quote Requirements:</strong> Detailed quote must be in <strong>Esprit&apos;s name</strong> with <strong>Esprit Tax ID: <code className="font-mono font-bold text-ink">830 823 C PM 000</code></strong>, full vendor contact info (first/last name + vendor tax ID), and payment method.
              </>
            )}
          </li>
          <li>
            {isFr ? (
              <>
                <strong>Après l&apos;action (Facture Originale) :</strong> Une fois l&apos;action terminée, remettre la <strong>facture originale (avec cachet, pas de copie !)</strong> accompagnée du <strong>devis initial</strong> au responsable du service achat (<strong>M. Souhail Mezzi — souhail.mezzi@esprit.tn</strong>).
              </>
            ) : (
              <>
                <strong>Post-Event Original Invoice:</strong> Once completed, hand over the <strong>stamped original invoice (no copies!)</strong> with the initial quote to the Purchasing Manager (<strong>Mr. Souhail Mezzi — souhail.mezzi@esprit.tn</strong>).
              </>
            )}
          </li>
        </ul>
      </div>

      {/* Budget & Logistics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase text-ink-soft block">
            {isFr ? "Budget Demandé" : "Budget Requested"}
          </span>
          <p className="text-xl font-display font-bold text-ink mt-1">
            {Number(activity.budgetRequested || 0).toFixed(0)} TND
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase text-teal-700 dark:text-teal-400 block">
            {isFr ? "Budget Approuvé" : "Budget Approved"}
          </span>
          <p className="text-xl font-display font-bold text-ast-primary dark:text-ast-light mt-1">
            {Number(activity.budgetApproved || 0).toFixed(0)} TND
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 block">
            {isFr ? "Coût Estimé Besoins" : "Estimated Requirements"}
          </span>
          <p className="text-xl font-display font-bold text-amber-600 mt-1">
            {totalEstimated.toFixed(0)} TND
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line">
          <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-emerald-400 block">
            {isFr ? "Dépenses Réelles" : "Actual Spend"}
          </span>
          <p className="text-xl font-display font-bold text-emerald-600 mt-1">
            {totalActual.toFixed(0)} TND
          </p>
        </div>
      </div>

      {/* Resource Conflict Warnings */}
      {conflictList.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 space-y-2">
          <h4 className="text-xs font-display font-bold uppercase text-rose-800 dark:text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {isFr
              ? "Conflit de Réservation de Ressource / Salle Détecté"
              : "Resource / Room Booking Conflict Detected"}
          </h4>
          {conflictList.map((c: any, idx: number) => (
            <div key={idx} className="text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <p className="font-semibold">
                {c.resourceName} :{" "}
                {isFr
                  ? `Demandé x${c.requestedQuantity}, disponible x${c.availableQuantity} sur x${c.totalQuantity} au total.`
                  : `Requested x${c.requestedQuantity}, available x${c.availableQuantity} out of x${c.totalQuantity}.`}
              </p>
              <p className="text-[11px] font-mono">
                {isFr ? "En conflit avec :" : "Overlaps with:"}{" "}
                {(c.overlappingActivities || [])
                  .map((o: any) => `${o.activityTitle} (x${o.quantity})`)
                  .join(", ")}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Requirements List */}
      <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
        <h3 className="text-sm font-display font-bold text-ink flex items-center gap-2">
          <Package className="w-4 h-4 text-ast-primary" />
          {isFr
            ? `Besoins Logistiques, Salles & Matériel (${requirements.length})`
            : `Logistics, Rooms & Equipment Requirements (${requirements.length})`}
        </h3>

        {requirements.length === 0 ? (
          <p className="text-xs text-ink-soft py-6 text-center border border-dashed border-line rounded-xl">
            {isFr
              ? "Aucun besoin logistique enregistré pour cette activité."
              : "No logistics requirements recorded for this activity."}
          </p>
        ) : (
          <div className="space-y-3">
            {requirements.map((req) => {
              const conflict = resourceConflicts?.[req.id];
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    conflict
                      ? "bg-rose-50/40 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800"
                      : "bg-surface-alt border-line"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-ast-primary text-[10px] font-mono font-bold">
                        {req.category}
                      </span>
                      <span className="font-body font-bold text-xs text-ink">
                        {req.name}
                      </span>
                      <span className="text-xs font-mono text-ink-soft">
                        (x{req.quantity})
                      </span>
                      {req.resource && (
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-mono">
                          {isFr ? "Catalogue :" : "Resource:"} {req.resource.name}
                        </span>
                      )}
                    </div>
                    {req.notes && (
                      <p className="text-[11px] text-ink-soft">{req.notes}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1 text-xs font-mono">
                      <span className="text-[10px] text-ink-soft">
                        {isFr ? "Coût réel (TND):" : "Actual (TND):"}
                      </span>
                      <input
                        type="number"
                        disabled={!canEdit}
                        defaultValue={req.actualCost || 0}
                        onBlur={(e) =>
                          handleUpdateRequirement(req.id, {
                            actualCost: Number(e.target.value || 0),
                          })
                        }
                        className="w-20 px-2 py-1 rounded-lg border border-line bg-surface text-xs font-mono text-ink"
                      />
                    </div>

                    <select
                      disabled={!canEdit}
                      value={req.status}
                      onChange={(e) =>
                        handleUpdateRequirement(req.id, {
                          status: e.target.value,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono font-bold text-ink"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="REQUESTED">REQUESTED</option>
                      <option value="BOOKED">BOOKED ✓</option>
                      <option value="DELIVERED">DELIVERED ✓</option>
                      <option value="RETURNED">RETURNED ✓</option>
                      <option value="REJECTED">REJECTED ✕</option>
                    </select>

                    {canEdit && (
                      <button
                        onClick={() => handleDeleteRequirement(req.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Requirement Form */}
        {canEdit && (
          <div className="pt-4 border-t border-line space-y-3">
            <h4 className="text-xs font-display font-bold uppercase text-ink-soft">
              {isFr ? "Ajouter un Besoin Logistique ou Réservation" : "Add Logistics Requirement or Resource Booking"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                label={isFr ? "Catégorie" : "Category"}
                value={newReq.category}
                onChange={(e) =>
                  setNewReq({ ...newReq, category: e.target.value })
                }
              >
                <option value="SPACE">SPACE (Salle / Amphi)</option>
                <option value="EQUIPMENT">EQUIPMENT (Matériel)</option>
                <option value="PERMISSION">PERMISSION (Autorisation)</option>
                <option value="CATERING">CATERING (Pause-café)</option>
                <option value="PRINTING">PRINTING (Impression / Badges)</option>
                <option value="SECURITY">SECURITY</option>
                <option value="TRANSPORT">TRANSPORT</option>
                <option value="AV_IT">AV_IT (Son / Réseau)</option>
                <option value="OTHER">OTHER</option>
              </Select>

              <Select
                label={
                  isFr
                    ? "Ressource Campus (Optionnel)"
                    : "Campus Resource (Optional)"
                }
                value={newReq.resourceId}
                onChange={(e) => {
                  const resObj = resources.find((r) => r.id === e.target.value);
                  setNewReq({
                    ...newReq,
                    resourceId: e.target.value,
                    name: resObj && !newReq.name ? resObj.name : newReq.name,
                  });
                }}
              >
                <option value="">
                  {isFr ? "— Hors catalogue —" : "— Custom Item —"}
                </option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (max x{r.totalQuantity})
                  </option>
                ))}
              </Select>

              <Input
                label={isFr ? "Désignation *" : "Item Name *"}
                placeholder="ex: Salle B204 / 2 Micros HF"
                value={newReq.name}
                onChange={(e) => setNewReq({ ...newReq, name: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  label={isFr ? "Quantité" : "Qty"}
                  value={String(newReq.quantity)}
                  onChange={(e) =>
                    setNewReq({
                      ...newReq,
                      quantity: Number(e.target.value || 1),
                    })
                  }
                />
                <Input
                  type="number"
                  label={isFr ? "Coût Est. (TND)" : "Est. Cost"}
                  value={String(newReq.estimatedCost)}
                  onChange={(e) =>
                    setNewReq({
                      ...newReq,
                      estimatedCost: Number(e.target.value || 0),
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                size="sm"
                variant="primary"
                disabled={submitting}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleCreateRequirement}
              >
                {isFr ? "Ajouter Besoin" : "Add Requirement"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 4: OFFICIAL ESPRIT ADMINISTRATIVE EMAILS CHECKLIST (1/ TO 6/)
// ============================================================================

const OFFICIAL_ESPRIT_STEPS = [
  {
    stepNumber: "1/",
    officeType: "STUDENT_LIFE",
    deadlineBadge: "J-7 min (1 semaine à l'avance)",
    titleFr: "1/ Département de la Vie Estudiantine (Validation de l'évènement)",
    titleEn: "1/ Student Life Department (Event Validation)",
    personName: "M. Zied Saidi (Responsable de la vie étudiante)",
    email: "zied.saidi@esprit.tn",
    phone: "92234330",
    instructionFr:
      "Envoyer un e-mail descriptif de l’évènement une semaine à l’avance au responsable du département de la vie estudiantine. Si l’événement est validé, passer aux étapes 2/ à 6/.",
    instructionEn:
      "Send a descriptive email of the event at least 1 week in advance to the Head of Student Life. Once validated, proceed to steps 2/ to 6/.",
    ccEmails: "faycal.lbabda@esprit.tn",
  },
  {
    stepNumber: "2/",
    officeType: "SCOLARITE",
    deadlineBadge: "J-10 min (Après validation 1/)",
    titleFr: "2/ Service de la Scolarité (Espace & Vidéoprojecteurs)",
    titleEn: "2/ Academic Affairs / Scolarité (Space & Projectors)",
    personName: "M. Mohamed Ali Bouakline",
    email: "mohamedali.bouakline@Esprit.tn",
    phone: "",
    instructionFr:
      "Si l’événement est validé : envoyer un e-mail au service de la scolarité pour réserver l’espace et les vidéo projecteurs (au moins 10 jours avant l’évènement).",
    instructionEn:
      "Once validated: send an email to Scolarité to book the venue/room and video projectors (at least 10 days before the event).",
    ccEmails: "zied.saidi@esprit.tn, faycal.lbabda@esprit.tn",
  },
  {
    stepNumber: "3/",
    officeType: "TECHNICAL_EQUIPMENT",
    deadlineBadge: "J-10 min (Après validation 1/)",
    titleFr: "3/ Matériel Technique (Sono ou autres)",
    titleEn: "3/ Technical Equipment (Sound system & AV)",
    personName: "M. Faycel Lbabda",
    email: "faycal.lbabda@esprit.tn",
    phone: "",
    instructionFr:
      "Envoyer un e-mail à M. Faycel Lbabda pour réserver le matériel technique (sono ou autres) au moins 10 jours avant l’évènement.",
    instructionEn:
      "Send an email to Mr. Faycel Lbabda to reserve technical equipment (sound system or other) at least 10 days before the event.",
    ccEmails: "zied.saidi@esprit.tn",
  },
  {
    stepNumber: "4/",
    officeType: "LOGISTICS",
    deadlineBadge: "J-10 min (Après validation 1/)",
    titleFr: "4/ Logistique Générale",
    titleEn: "4/ General Logistics",
    personName: "M. Hazem Hajji",
    email: "hazem.hajji@esprit.tn",
    phone: "",
    instructionFr:
      "Envoyer un e-mail à M. Hazem Hajji pour tout ce qui concerne la logistique (au moins 10 jours avant l’évènement).",
    instructionEn:
      "Send an email to Mr. Hazem Hajji regarding all logistics requirements (at least 10 days before the event).",
    ccEmails: "zied.saidi@esprit.tn, faycal.lbabda@esprit.tn",
  },
  {
    stepNumber: "5/",
    officeType: "PROMOTION",
    deadlineBadge: "J-10 min (Après validation 1/)",
    titleFr: "5/ Publication & Promotion des Évènements",
    titleEn: "5/ Event Publication & Promotion",
    personName: "Mme Nadia Ajailia",
    email: "Nadia.ajailia@Esprit.tn",
    phone: "",
    instructionFr:
      "Envoyer un e-mail à Mme Nadia Ajailia pour tout ce qui est publication et promotion des évènements.",
    instructionEn:
      "Send an email to Mrs. Nadia Ajailia for all event publication and promotion.",
    ccEmails: "zied.saidi@esprit.tn, faycal.lbabda@esprit.tn",
  },
  {
    stepNumber: "6/",
    officeType: "PURCHASES",
    deadlineBadge: "J-10 min + Facture originale post-évent",
    titleFr: "6/ Service Achats (Négociation fournisseurs, Devis & BC)",
    titleEn: "6/ Purchasing Office (Vendors, Quotes & Purchase Orders)",
    personName: "M. Souhail Mezzi",
    email: "souhail.mezzi@esprit.tn",
    phone: "",
    instructionFr:
      "Envoyer un e-mail à M. Souhail Mezzi pour traiter tous vos achats (négociation avec les fournisseurs + envoi du BC). Devis au nom d'Esprit (MF : 830 823 C PM 000). Remettre la facture originale cachetée après l'action.",
    instructionEn:
      "Send an email to Mr. Souhail Mezzi to process purchases (vendor negotiation + PO). Quotes must be in Esprit's name (Tax ID: 830 823 C PM 000). Submit stamped original invoice after the event.",
    ccEmails: "zied.saidi@esprit.tn, faycal.lbabda@esprit.tn",
  },
];

export function EmailsTab({
  isFr,
  activity,
  emails,
  adminContacts,
  canEdit,
  onRefresh,
}: {
  isFr: boolean;
  activity: any;
  emails: any[];
  emailTemplates?: any[];
  adminContacts: any[];
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savingStep, setSavingStep] = useState<string | null>(null);

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const findTrackedEmail = (step: (typeof OFFICIAL_ESPRIT_STEPS)[number]) => {
    const targetEmail = step.email.toLowerCase();
    return (
      emails.find(
        (e) =>
          (e.recipientEmail || e.adminContact?.email || "").toLowerCase() ===
            targetEmail ||
          e.adminContact?.officeType === step.officeType
      ) || null
    );
  };

  const handleSetStepStatus = async (
    step: (typeof OFFICIAL_ESPRIT_STEPS)[number],
    status: string,
    replySummary?: string
  ) => {
    setSavingStep(step.officeType);
    try {
      const existing = findTrackedEmail(step);
      if (existing) {
        await fetch(`/api/planner/activities/${activity.id}/emails`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            emailId: existing.id,
            status,
            ...(replySummary !== undefined ? { replySummary } : {}),
          }),
        });
      } else {
        const matchedContact = adminContacts.find(
          (c) =>
            (c.email || "").toLowerCase() === step.email.toLowerCase() ||
            c.officeType === step.officeType
        );
        await fetch(`/api/planner/activities/${activity.id}/emails`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminContactId: matchedContact?.id || null,
            officeType: step.officeType,
            recipientEmail: step.email,
            ccEmails: step.ccEmails,
            subject: `${step.stepNumber} ${activity.title}`,
            status,
            replySummary: replySummary || "",
          }),
        });
      }
      onRefresh();
    } finally {
      setSavingStep(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Official ESPRIT Rules Banner (No Auto-Generated Templates) */}
      <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-display font-bold text-ink flex items-center gap-2">
              <Mail className="w-4 h-4 text-ast-primary" />
              {isFr
                ? "Processus Administratif Officiel ESPRIT (Étapes 1/ à 6/ — Sans modèles pré-écrits)"
                : "Official ESPRIT Administrative Email Process (Steps 1/ to 6/ — No pre-written templates)"}
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              {isFr
                ? "Rédigez vos propres e-mails directement dans votre messagerie pour éviter toute erreur de modèle, puis cochez l'avancement de chaque étape ci-dessous."
                : "Write your own emails directly in your mail client to avoid template mistakes, then track the status of each step below."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              copyText(
                "CC_ALL",
                "zied.saidi@esprit.tn, faycal.lbabda@esprit.tn"
              )
            }
            className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 text-xs font-mono font-bold text-ast-primary dark:text-ast-light flex items-center gap-1.5 hover:bg-teal-100 transition-colors self-start"
          >
            {copiedKey === "CC_ALL" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                {isFr ? "Adresses CC copiées !" : "CC addresses copied!"}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                {isFr
                  ? "Copier CC : zied.saidi@esprit.tn, faycal.lbabda@esprit.tn"
                  : "Copy CC: zied.saidi@esprit.tn, faycal.lbabda@esprit.tn"}
              </>
            )}
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold">
            {isFr
              ? "NB Obligatoires (M. Zied Saidi — Responsable de la vie étudiante) :"
              : "Mandatory Notes (Mr. Zied Saidi — Head of Student Life):"}
          </p>
          <p>
            •{" "}
            {isFr
              ? "Les réservations doivent se faire au moins 10 jours avant l’évènement (J-10)."
              : "Reservations must be made at least 10 days before the event (D-10)."}
          </p>
          <p>
            •{" "}
            {isFr
              ? "Mettre le responsable de la vie étudiante (zied.saidi@esprit.tn) et M. Faycel Lbabda (faycal.lbabda@esprit.tn) en copie (CC) dans tous les e-mails est souhaité."
              : "Always CC the Head of Student Life (zied.saidi@esprit.tn) and Mr. Faycel Lbabda (faycal.lbabda@esprit.tn) in all emails."}
          </p>
        </div>
      </div>

      {/* 6 Official ESPRIT Contact Cards */}
      <div className="grid grid-cols-1 gap-4">
        {OFFICIAL_ESPRIT_STEPS.map((step) => {
          const tracked = findTrackedEmail(step);
          const status = tracked?.status || "DRAFT";
          const isBusy = savingStep === step.officeType;
          const mailtoHref = `mailto:${step.email}?cc=${encodeURIComponent(
            step.ccEmails.replace(/\s+/g, "")
          )}`;

          return (
            <div
              key={step.officeType}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                status === "APPROVED"
                  ? "bg-emerald-50/40 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800"
                  : status === "SENT" || status === "REPLIED"
                  ? "bg-teal-50/30 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800"
                  : "bg-surface border-line"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-ast-primary text-white text-xs font-mono font-bold">
                      {step.stepNumber}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-surface-alt border border-line text-[11px] font-mono font-bold text-ink-soft">
                      {step.deadlineBadge}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-bold ${
                        status === "APPROVED"
                          ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                          : status === "SENT" || status === "REPLIED"
                          ? "bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200"
                          : "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200"
                      }`}
                    >
                      {status === "APPROVED"
                        ? isFr
                          ? "VALIDÉ ✓"
                          : "APPROVED ✓"
                        : status === "SENT"
                        ? isFr
                          ? "ENVOYÉ"
                          : "SENT"
                        : isFr
                        ? "À ENVOYER / SI REQUIS"
                        : "TO SEND / IF NEEDED"}
                    </span>
                  </div>

                  <h4 className="text-sm font-display font-bold text-ink">
                    {isFr ? step.titleFr : step.titleEn}
                  </h4>

                  <p className="text-xs font-mono text-ast-primary dark:text-ast-light font-semibold">
                    {step.personName} — {step.email}
                    {step.phone ? ` · Tél : ${step.phone}` : ""}
                  </p>
                </div>

                {/* Copy & Mailto Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyText(`EMAIL_${step.officeType}`, step.email)}
                    className="px-3 py-1.5 rounded-xl border border-line bg-surface-alt hover:bg-surface text-xs font-mono font-bold text-ink flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey === `EMAIL_${step.officeType}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        {isFr ? "Email copié !" : "Email copied!"}
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        {step.email}
                      </>
                    )}
                  </button>

                  <a
                    href={mailtoHref}
                    onClick={() => {
                      if (canEdit && status === "DRAFT") {
                        handleSetStepStatus(step, "SENT");
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-ast-primary text-white hover:bg-teal-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {isFr
                      ? "Ouvrir ma messagerie (mailto:)"
                      : "Open Mail Client (mailto:)"}
                  </a>
                </div>
              </div>

              <p className="text-xs text-ink-soft leading-relaxed">
                {isFr ? step.instructionFr : step.instructionEn}
              </p>

              {/* Status Tracking Buttons & Optional Admin Reply Note */}
              <div className="pt-3 border-t border-line flex flex-col md:flex-row md:items-center justify-between gap-3">
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono text-ink-soft">
                      {isFr ? "Marquer l'état :" : "Mark status:"}
                    </span>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetStepStatus(step, "DRAFT")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        status === "DRAFT"
                          ? "bg-surface-alt border-ink text-ink"
                          : "bg-surface border-line text-ink-soft hover:text-ink"
                      }`}
                    >
                      {isFr ? "À envoyer" : "To Send"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetStepStatus(step, "SENT")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        status === "SENT"
                          ? "bg-teal-600 border-teal-600 text-white"
                          : "bg-surface border-line text-ink-soft hover:text-ink"
                      }`}
                    >
                      {isFr ? "Email Envoyé" : "Email Sent"}
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleSetStepStatus(step, "APPROVED")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-colors ${
                        status === "APPROVED"
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "bg-surface border-line text-ink-soft hover:text-ink"
                      }`}
                    >
                      {isFr ? "Validé / Accord Reçu ✓" : "Approved ✓"}
                    </button>
                  </div>
                )}

                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder={
                      isFr
                        ? "Note / Réponse reçue (ex: Salle B204 confirmée, BC signé...)"
                        : "Note / Admin reply (e.g. Room B204 confirmed, PO signed...)"
                    }
                    defaultValue={tracked?.replySummary || ""}
                    onBlur={(e) => {
                      if (e.target.value !== (tracked?.replySummary || "")) {
                        handleSetStepStatus(step, status, e.target.value);
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface-alt text-xs text-ink focus:outline-none focus:ring-2 focus:ring-ast-primary"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 5: AGENDA & RUN-OF-SHOW
// ============================================================================

export function AgendaTab({
  isFr,
  activity,
  agenda,
  agendaConflicts,
  members,
  canEdit,
  onRefresh,
}: {
  isFr: boolean;
  activity: any;
  agenda: any[];
  agendaConflicts: any[];
  members: any[];
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [newSlot, setNewSlot] = useState(() => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const st = new Date(activity.startAt);
    const et = new Date(st.getTime() + 45 * 60 * 1000);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    return {
      title: "",
      startTime: fmt(st),
      endTime: fmt(et),
      speaker: "",
      location: activity.location || "",
      description: "",
    };
  });

  const handleAddSlot = async () => {
    if (!newSlot.title.trim()) return;
    const res = await fetch(`/api/planner/activities/${activity.id}/agenda`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSlot),
    });
    if (res.ok) {
      setNewSlot({ ...newSlot, title: "", description: "" });
      onRefresh();
    }
  };

  const handleMove = async (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= agenda.length) return;
    const ids = agenda.map((i) => i.id);
    const temp = ids[idx];
    ids[idx] = ids[targetIdx];
    ids[targetIdx] = temp;

    await fetch(`/api/planner/activities/${activity.id}/agenda`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds: ids }),
    });
    onRefresh();
  };

  const handleDeleteSlot = async (itemId: string) => {
    await fetch(
      `/api/planner/activities/${activity.id}/agenda?itemId=${itemId}`,
      { method: "DELETE" }
    );
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Agenda Conflicts Alert */}
      {agendaConflicts && agendaConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 space-y-1.5">
          <h4 className="text-xs font-display font-bold uppercase text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {isFr
              ? "Chevauchement Horaire ou Dépassement Détecté dans le Déroulé"
              : "Schedule Overlap or Boundary Warning in Run-of-Show"}
          </h4>
          {agendaConflicts.map((c: any, idx: number) => (
            <p key={idx} className="text-xs text-amber-800 dark:text-amber-200">
              • {isFr ? c.messageFr : c.messageEn}
            </p>
          ))}
        </div>
      )}

      {/* Chronological Run-of-Show */}
      <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
        <h3 className="text-sm font-display font-bold text-ink flex items-center gap-2">
          <Clock className="w-4 h-4 text-ast-primary" />
          {isFr
            ? `Déroulé Minute par Minute / Run-of-Show (${agenda.length})`
            : `Minute-by-Minute Run-of-Show (${agenda.length})`}
        </h3>

        {agenda.length === 0 ? (
          <p className="text-xs text-ink-soft py-6 text-center border border-dashed border-line rounded-xl">
            {isFr
              ? "Aucune séquence enregistrée dans le déroulé."
              : "No agenda sequences added yet."}
          </p>
        ) : (
          <div className="space-y-2.5">
            {agenda.map((item, idx) => {
              const st = new Date(item.startTime);
              const et = new Date(item.endTime);
              const durationMin = Math.round(
                (et.getTime() - st.getTime()) / 60000
              );

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-surface-alt border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-ast-primary text-white text-[11px] font-mono font-bold">
                        {st.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        –{" "}
                        {et.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="text-[11px] font-mono text-ink-soft">
                        ({durationMin} min)
                      </span>
                      <span className="text-xs font-bold text-ink">
                        {item.title}
                      </span>
                    </div>
                    {(item.speaker || item.speakerUser?.name || item.description) && (
                      <p className="text-xs text-ink-soft">
                        {(item.speaker || item.speakerUser?.name) && (
                          <strong className="text-ast-primary mr-2">
                            🎤 {item.speaker || item.speakerUser?.name}
                          </strong>
                        )}
                        {item.description}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMove(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-alt disabled:opacity-40"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, 1)}
                        disabled={idx === agenda.length - 1}
                        className="p-1.5 rounded-lg border border-line bg-surface hover:bg-surface-alt disabled:opacity-40"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(item.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Agenda Slot Form */}
        {canEdit && (
          <div className="pt-4 border-t border-line space-y-3">
            <h4 className="text-xs font-display font-bold uppercase text-ink-soft">
              {isFr ? "Ajouter un Créneau au Déroulé" : "Add Run-of-Show Slot"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input
                label={isFr ? "Titre de la Séquence *" : "Slot Title *"}
                placeholder="ex: Accueil & Émargement QR"
                value={newSlot.title}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, title: e.target.value })
                }
              />
              <Input
                type="datetime-local"
                label={isFr ? "Début *" : "Start Time *"}
                value={newSlot.startTime}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, startTime: e.target.value })
                }
              />
              <Input
                type="datetime-local"
                label={isFr ? "Fin *" : "End Time *"}
                value={newSlot.endTime}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, endTime: e.target.value })
                }
              />
              <Input
                label={isFr ? "Intervenant / Responsable" : "Speaker / Host"}
                placeholder="ex: Yassine Ben Ali"
                value={newSlot.speaker}
                onChange={(e) =>
                  setNewSlot({ ...newSlot, speaker: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="primary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddSlot}
              >
                {isFr ? "Ajouter au Déroulé" : "Add Slot"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 6: FILES & COMMENTS
// ============================================================================

export function FilesAndCommentsTab({
  isFr,
  activity,
  files,
  comments,
  canEdit,
  onRefresh,
}: {
  isFr: boolean;
  activity: any;
  files: any[];
  comments: any[];
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [linkName, setLinkName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [commentText, setCommentText] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/planner/activities/${activity.id}/files`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        onRefresh();
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddLink = async () => {
    if (!linkName.trim() || !linkUrl.trim()) return;
    setUploading(true);
    try {
      const res = await fetch(`/api/planner/activities/${activity.id}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: linkName,
          fileUrl: linkUrl,
          fileType: "application/link",
        }),
      });
      if (res.ok) {
        setLinkName("");
        setLinkUrl("");
        onRefresh();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    await fetch(
      `/api/planner/activities/${activity.id}/files?fileId=${fileId}`,
      { method: "DELETE" }
    );
    onRefresh();
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    const res = await fetch(`/api/planner/activities/${activity.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentText }),
    });
    if (res.ok) {
      setCommentText("");
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Left: Files & Attachments */}
      <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold text-ink flex items-center gap-2">
            <FileText className="w-4 h-4 text-ast-primary" />
            {isFr
              ? `Documents & Pièces Jointes (${files.length})`
              : `Files & Attachments (${files.length})`}
          </h3>
          {canEdit && (
            <label className="px-3 py-1.5 rounded-xl bg-ast-primary text-white text-xs font-bold cursor-pointer hover:bg-teal-800 flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              {uploading
                ? isFr
                  ? "Envoi..."
                  : "Uploading..."
                : isFr
                ? "Téléverser Fichier (≤25Mo)"
                : "Upload File (≤25MB)"}
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {uploadError && (
          <p className="text-xs text-rose-600 font-semibold">{uploadError}</p>
        )}

        <div className="space-y-2">
          {files.length === 0 ? (
            <p className="text-xs text-ink-soft py-6 text-center border border-dashed border-line rounded-xl">
              {isFr
                ? "Aucun fichier ou lien attaché (décharges signées, présentations, affiches)."
                : "No files or links attached yet (signed permissions, decks, posters)."}
            </p>
          ) : (
            files.map((f) => (
              <div
                key={f.id}
                className="p-3 rounded-xl bg-surface-alt border border-line flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <a
                    href={f.downloadUrl || f.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-ink hover:text-ast-primary truncate block"
                  >
                    {f.fileName}
                  </a>
                  <span className="text-[10px] font-mono text-ink-soft">
                    {f.uploadedBy?.name || "Board"} · {formatDate(f.createdAt)}
                  </span>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDeleteFile(f.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {canEdit && (
          <div className="pt-3 border-t border-line space-y-2.5">
            <p className="text-xs font-bold text-ink-soft">
              {isFr
                ? "Ou ajouter un lien externe (Drive, Figma, Canva)"
                : "Or attach an external link (Drive, Figma, Canva)"}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input
                placeholder={isFr ? "Titre du document" : "Document Title"}
                value={linkName}
                onChange={(e) => setLinkName(e.target.value)}
              />
              <Input
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <Button size="sm" variant="secondary" onClick={handleAddLink}>
              {isFr ? "Attacher le Lien" : "Attach Link"}
            </Button>
          </div>
        )}
      </div>

      {/* Right: Executive Discussion Thread */}
      <div className="p-5 bg-surface rounded-2xl border border-line shadow-sm space-y-4">
        <h3 className="text-sm font-display font-bold text-ink flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-ast-primary" />
          {isFr
            ? `Fil de Discussion & Notes d'Équipe (${comments.length})`
            : `Team Discussion & Coordination (${comments.length})`}
        </h3>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {comments.length === 0 ? (
            <p className="text-xs text-ink-soft py-6 text-center border border-dashed border-line rounded-xl">
              {isFr
                ? "Aucun commentaire pour le moment."
                : "No comments posted yet."}
            </p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-surface-alt border border-line space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-ink">
                    {c.user?.name || "Member"}
                  </span>
                  <span className="font-mono text-ink-faint">
                    {formatDate(c.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">{c.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-line">
          <Input
            placeholder={
              isFr
                ? "Écrire une note ou mise à jour pour l'équipe..."
                : "Write an update or note for the organizing team..."
            }
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <Button size="sm" variant="primary" onClick={handlePostComment}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 7: REPORTS & CLOSURE
// ============================================================================

export function ReportAndClosureTab({
  isFr,
  activity,
  report,
  attendanceStats,
  canEdit,
  onRefresh,
}: {
  isFr: boolean;
  activity: any;
  report: any;
  attendanceStats: any;
  canEdit: boolean;
  onRefresh: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [form, setForm] = useState({
    expectedAttendance:
      report?.expectedAttendance ?? activity.expectedAttendance ?? 30,
    actualAttendance:
      report?.actualAttendance ?? attendanceStats?.actualAttendance ?? 0,
    presentCount: report?.presentCount ?? attendanceStats?.presentCount ?? 0,
    lateCount: report?.lateCount ?? attendanceStats?.lateCount ?? 0,
    absentCount: report?.absentCount ?? attendanceStats?.absentCount ?? 0,
    excusedCount: report?.excusedCount ?? attendanceStats?.excusedCount ?? 0,
    summary: report?.summary ?? "",
    objectivesAchieved: report?.objectivesAchieved ?? "",
    whatWentWell: report?.whatWentWell ?? "",
    problemsEncountered:
      report?.problemsEncountered ?? report?.whatFailed ?? "",
    lessonsLearned: report?.lessonsLearned ?? "",
    recommendations: report?.recommendations ?? "",
    budgetAllocated:
      report?.budgetAllocated ??
      activity.budgetApproved ??
      activity.budgetRequested ??
      0,
    budgetActual: report?.budgetActual ?? activity.budgetSpent ?? 0,
    budgetVarianceNotes: report?.budgetVarianceNotes ?? "",
    mediaLinksText: (report?.mediaLinks || []).join("\n"),
  });

  const handleSyncFromQR = () => {
    if (!attendanceStats) return;
    setForm((prev) => ({
      ...prev,
      actualAttendance: attendanceStats.actualAttendance,
      presentCount: attendanceStats.presentCount,
      lateCount: attendanceStats.lateCount,
      absentCount: attendanceStats.absentCount,
      excusedCount: attendanceStats.excusedCount,
    }));
  };

  const handleSaveReport = async (closeActivity: boolean) => {
    setSaving(true);
    setStatusMsg(null);
    try {
      const mediaLinks = form.mediaLinksText
        .split("\n")
        .map((s: string) => s.trim())
        .filter(Boolean);

      const res = await fetch(`/api/planner/activities/${activity.id}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          whatFailed: form.problemsEncountered,
          mediaLinks,
          closeActivity,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(
          closeActivity
            ? isFr
              ? "Rapport enregistré et activité officiellement CLÔTURÉE."
              : "Report saved and activity officially CLOSED."
            : isFr
            ? "Rapport post-activité enregistré avec succès."
            : "Post-activity report saved successfully."
        );
        onRefresh();
      } else {
        setStatusMsg(data.error || "Error saving report");
      }
    } finally {
      setSaving(false);
    }
  };

  const [copiedPostKey, setCopiedPostKey] = useState<string | null>(null);

  const copyPostEmail = (key: string, email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedPostKey(key);
    setTimeout(() => setCopiedPostKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Official ESPRIT Post-Event Obligations Banner (<= 3 Days Max) */}
      <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-display font-bold text-amber-950 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            {isFr
              ? "Obligations Post-Évènement ESPRIT (Délai ≤ 3 Jours Maximum — Règle d'Or 7)"
              : "Official ESPRIT Post-Event Obligations (≤ 3 Days Maximum — Golden Rule 7)"}
          </h4>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyPostEmail("ZIED", "zied.saidi@esprit.tn")}
              className="px-2.5 py-1 rounded-lg bg-surface border border-line text-[11px] font-mono font-bold text-ink flex items-center gap-1 hover:border-ast-primary"
            >
              {copiedPostKey === "ZIED" ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              zied.saidi@esprit.tn
            </button>
            <button
              type="button"
              onClick={() => copyPostEmail("SOUHAIL", "souhail.mezzi@esprit.tn")}
              className="px-2.5 py-1 rounded-lg bg-surface border border-line text-[11px] font-mono font-bold text-ink flex items-center gap-1 hover:border-ast-primary"
            >
              {copiedPostKey === "SOUHAIL" ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              souhail.mezzi@esprit.tn
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface border border-line space-y-1">
            <p className="font-bold text-ink">
              {isFr
                ? "1. Rapport d'Action (≤ 3 jours post-évent)"
                : "1. Action Report (≤ 3 days post-event)"}
            </p>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              {isFr
                ? "Dans un délai ne dépassant pas les 3 jours post-évènement, faire parvenir au responsable de la vie étudiante (M. Zied Saidi — zied.saidi@esprit.tn) un rapport d'action."
                : "Within no more than 3 days after the event, submit an action report to the Head of Student Life (Mr. Zied Saidi — zied.saidi@esprit.tn)."}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface border border-line space-y-1">
            <p className="font-bold text-ink">
              {isFr
                ? "2. Facture Originale Cachetée + Devis Initial"
                : "2. Stamped Original Invoice + Initial Quote"}
            </p>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              {isFr
                ? "Une fois l'action terminée, remettre la facture originale (avec cachet, pas de copie !) accompagnée du devis initial (MF Esprit : 830 823 C PM 000) à M. Souhail Mezzi (souhail.mezzi@esprit.tn)."
                : "Once completed, hand over the stamped original invoice (no copies!) with the initial quote (Esprit Tax ID: 830 823 C PM 000) to Mr. Souhail Mezzi (souhail.mezzi@esprit.tn)."}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface border border-rose-200 dark:border-rose-800 space-y-1">
            <p className="font-bold text-rose-700 dark:text-rose-300">
              {isFr
                ? "3. Collecte d'Argent (OBLIGATOIRE ≤ 3 jours)"
                : "3. Fundraising / Money Collection (MANDATORY ≤ 3 days)"}
            </p>
            <p className="text-[11px] text-ink-soft leading-relaxed">
              {isFr
                ? "Dès que vous effectuez une opération de collecte d'argent, il est OBLIGATOIRE de faire parvenir à M. Zied Saidi (zied.saidi@esprit.tn) dans un délai ≤ 3 jours après la fin de la collecte un rapport détaillé avec les montants et leurs affectations."
                : "Whenever a money collection/fundraising operation takes place, it is MANDATORY to send Mr. Zied Saidi (zied.saidi@esprit.tn) within ≤ 3 days after collection ends a detailed report with amounts and allocations."}
            </p>
          </div>
        </div>
      </div>

      {/* Live Attendance Sync Banner */}
      <div className="p-4 bg-surface rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-ast-primary">
            {isFr
              ? "Synchronisation Émargement QR & Présences"
              : "Live QR Attendance Synchronization"}
          </h4>
          <p className="text-xs text-ink-soft">
            {activity.eventId
              ? isFr
                ? `Lié à l'événement #${activity.eventId.slice(0, 8)} — ${
                    attendanceStats?.presentCount || 0
                  } présents, ${attendanceStats?.lateCount || 0} en retard, ${
                    attendanceStats?.goingRsvpCount || 0
                  } RSVPs.`
                : `Linked to event #${activity.eventId.slice(0, 8)} — ${
                    attendanceStats?.presentCount || 0
                  } present, ${attendanceStats?.lateCount || 0} late, ${
                    attendanceStats?.goingRsvpCount || 0
                  } RSVPs.`
              : isFr
              ? "Publiez l'activité au calendrier pour synchroniser automatiquement les pointages QR."
              : "Publish the activity to the calendar to automatically sync QR check-in counts."}
          </p>
        </div>

        {activity.eventId && canEdit && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={handleSyncFromQR}
          >
            {isFr
              ? "Importer les Chiffres de Présence QR"
              : "Import QR Attendance Counts"}
          </Button>
        )}
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-bold text-ast-primary dark:text-ast-light">
          {statusMsg}
        </div>
      )}

      {/* Structured Report Form */}
      <div className="p-6 bg-surface rounded-2xl border border-line shadow-sm space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Input
            type="number"
            label={isFr ? "Attendus" : "Expected"}
            disabled={!canEdit}
            value={String(form.expectedAttendance)}
            onChange={(e) =>
              setForm({
                ...form,
                expectedAttendance: Number(e.target.value || 0),
              })
            }
          />
          <Input
            type="number"
            label={isFr ? "Réels (Total)" : "Actual Total"}
            disabled={!canEdit}
            value={String(form.actualAttendance)}
            onChange={(e) =>
              setForm({
                ...form,
                actualAttendance: Number(e.target.value || 0),
              })
            }
          />
          <Input
            type="number"
            label={isFr ? "Présents" : "Present"}
            disabled={!canEdit}
            value={String(form.presentCount)}
            onChange={(e) =>
              setForm({ ...form, presentCount: Number(e.target.value || 0) })
            }
          />
          <Input
            type="number"
            label={isFr ? "En Retard" : "Late"}
            disabled={!canEdit}
            value={String(form.lateCount)}
            onChange={(e) =>
              setForm({ ...form, lateCount: Number(e.target.value || 0) })
            }
          />
          <Input
            type="number"
            label={isFr ? "Absents" : "Absent"}
            disabled={!canEdit}
            value={String(form.absentCount)}
            onChange={(e) =>
              setForm({ ...form, absentCount: Number(e.target.value || 0) })
            }
          />
          <Input
            type="number"
            label={isFr ? "Excusés" : "Excused"}
            disabled={!canEdit}
            value={String(form.excusedCount)}
            onChange={(e) =>
              setForm({ ...form, excusedCount: Number(e.target.value || 0) })
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea
            label={isFr ? "Synthèse Exécutive *" : "Executive Summary *"}
            disabled={!canEdit}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
          <Textarea
            label={
              isFr
                ? "Objectifs Atteints & Impact"
                : "Objectives Achieved & Impact"
            }
            disabled={!canEdit}
            value={form.objectivesAchieved}
            onChange={(e) =>
              setForm({ ...form, objectivesAchieved: e.target.value })
            }
          />
          <Textarea
            label={isFr ? "Points Forts (Ce qui a réussi)" : "What Went Well"}
            disabled={!canEdit}
            value={form.whatWentWell}
            onChange={(e) => setForm({ ...form, whatWentWell: e.target.value })}
          />
          <Textarea
            label={
              isFr
                ? "Difficultés & Imprévus Rencontrés"
                : "Problems & Bottlenecks Encountered"
            }
            disabled={!canEdit}
            value={form.problemsEncountered}
            onChange={(e) =>
              setForm({ ...form, problemsEncountered: e.target.value })
            }
          />
          <Textarea
            label={isFr ? "Enseignements Tirés" : "Lessons Learned"}
            disabled={!canEdit}
            value={form.lessonsLearned}
            onChange={(e) =>
              setForm({ ...form, lessonsLearned: e.target.value })
            }
          />
          <Textarea
            label={
              isFr
                ? "Recommandations pour les Prochaines Éditions"
                : "Recommendations for Future Editions"
            }
            disabled={!canEdit}
            value={form.recommendations}
            onChange={(e) =>
              setForm({ ...form, recommendations: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-line">
          <Input
            type="number"
            label={isFr ? "Budget Alloué (TND)" : "Budget Allocated (TND)"}
            disabled={!canEdit}
            value={String(form.budgetAllocated)}
            onChange={(e) =>
              setForm({
                ...form,
                budgetAllocated: Number(e.target.value || 0),
              })
            }
          />
          <Input
            type="number"
            label={isFr ? "Budget Réel Dépensé (TND)" : "Actual Spend (TND)"}
            disabled={!canEdit}
            value={String(form.budgetActual)}
            onChange={(e) =>
              setForm({ ...form, budgetActual: Number(e.target.value || 0) })
            }
          />
          <Input
            label={isFr ? "Justification d'Écart Budgétaire" : "Budget Variance Notes"}
            disabled={!canEdit}
            value={form.budgetVarianceNotes}
            onChange={(e) =>
              setForm({ ...form, budgetVarianceNotes: e.target.value })
            }
          />
        </div>

        {canEdit && (
          <div className="pt-4 border-t border-line flex flex-wrap items-center justify-end gap-3">
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => handleSaveReport(false)}
            >
              {isFr ? "Enregistrer le Bilan" : "Save Report Draft"}
            </Button>

            <Button
              variant="primary"
              disabled={saving}
              leftIcon={<Lock className="w-4 h-4" />}
              onClick={() => handleSaveReport(true)}
            >
              {isFr
                ? "Soumettre le Bilan & Clôturer l'Activité (CLOSED)"
                : "Submit Report & Close Activity (CLOSED)"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
