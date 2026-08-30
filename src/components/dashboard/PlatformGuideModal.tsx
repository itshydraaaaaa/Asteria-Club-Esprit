"use client";

import React, { useState } from "react";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { UserSession } from "@/lib/types";
import {
  Layers,
  QrCode,
  Calendar,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  BookOpen,
} from "lucide-react";

interface PlatformGuideModalProps {
  user: UserSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PlatformGuideModal({ user, isOpen, onClose }: PlatformGuideModalProps) {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [activeStep, setActiveStep] = useState(0);

  if (!isOpen) return null;

  const role = user?.role || "MEMBER";

  const steps = [
    {
      id: "overview",
      badge: isFr ? "Vue d'Ensemble" : "System Overview",
      title: isFr ? "Bienvenue sur le Système d'Exploitation Asteria" : "Welcome to the Asteria Operating System",
      subtitle: isFr
        ? "Votre espace de travail centralisé pour la production créative, les sprints et la gouvernance."
        : "Your unified workspace for creative production, agile sprints, and studio governance.",
      content: (
        <div className="space-y-4 text-xs font-body text-ink-soft dark:text-teal-100/90">
          <p className="leading-relaxed">
            {isFr
              ? "Asteria Club Esprit fonctionne selon des standards d'agence professionnelle. La plateforme vous permet de collaborer en temps réel entre les 4 pôles techniques (Web, Design, Vidéo, Photo)."
              : "Asteria Club Esprit operates on professional studio standards. This platform enables live collaboration across all 4 technical hubs (Web, Design, Video, Photo)."}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-ink dark:text-white font-display">
                <Layers className="w-3.5 h-3.5 text-ast-primary dark:text-teal-300" />
                <span>{isFr ? "Tâches & Kanban" : "Tasks & Kanban"}</span>
              </div>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70">
                {isFr ? "Livrables de sprint & tickets d'équipe." : "Sprint tickets & agile deliverables."}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-ink dark:text-white font-display">
                <QrCode className="w-3.5 h-3.5 text-ast-primary dark:text-teal-300" />
                <span>{isFr ? "Présence & QR" : "Attendance & QR"}</span>
              </div>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70">
                {isFr ? "Check-in dynamique par session." : "Dynamic session check-in codes."}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-ink dark:text-white font-display">
                <Calendar className="w-3.5 h-3.5 text-ast-primary dark:text-teal-300" />
                <span>{isFr ? "Planning & RSVP" : "Schedule & RSVP"}</span>
              </div>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70">
                {isFr ? "Ateliers et assemblées générales." : "Workshops & general syncs."}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "workflows",
      badge: isFr ? "Méthodologie" : "Core Workflows",
      title: isFr ? "Sprints & Présences en Pratique" : "How Sprints & Check-Ins Work",
      subtitle: isFr
        ? "Les deux routines essentielles de chaque membre d'Asteria."
        : "The two essential routines every Asteria creator participates in.",
      content: (
        <div className="space-y-3 text-xs font-body text-ink-soft dark:text-teal-100/90">
          <div className="p-3.5 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-ink dark:text-white">
              <Layers className="w-4 h-4 text-ast-primary dark:text-teal-300" />
              <span>{isFr ? "1. Gestion des Tâches Kanban" : "1. Kanban Sprint Deliverables"}</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {isFr
                ? "Prenez en charge vos tickets de sprint dans la colonne 'À Faire', passez-les en 'En Cours' lors de la production, puis soumettez-les en 'En Révision' pour validation par votre responsable."
                : "Pick up sprint tickets in 'To Do', move them to 'In Progress' during production, and submit to 'In Review' for your department lead's quality audit before completion."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1.5">
            <div className="flex items-center gap-2 font-display font-bold text-ink dark:text-white">
              <QrCode className="w-4 h-4 text-ast-primary dark:text-teal-300" />
              <span>{isFr ? "2. Check-In Présence aux Sessions" : "2. Workshop Attendance Check-In"}</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              {isFr
                ? "Lors des ateliers hebdomadaires, validez votre présence en scannant le QR code affiché par le lead ou en saisissant le code à 6 chiffres dans l'onglet 'Présence & QR'."
                : "During weekly sessions, confirm your presence by scanning the host's QR code or entering the 6-digit numeric passcode under the 'Attendance & QR' tab."}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "role_briefing",
      badge: isFr ? "Spécificités de Rôle" : "Role Guide",
      title:
        role === "BOARD"
          ? isFr
            ? "Guide Exécutif · Bureau"
            : "Executive Board Controls"
          : role === "HOD"
          ? isFr
            ? "Guide Responsable de Pôle · HoD"
            : "Department Head Controls"
          : isFr
          ? "Guide Membre & Qualification Freelance"
          : "Member Guide & Freelance Readiness",
      subtitle:
        role === "BOARD"
          ? isFr
            ? "Gouvernance globale, validation des recrutements et gestion des cycles."
            : "Global club governance, recruitment approvals, and cycle rollovers."
          : role === "HOD"
          ? isFr
            ? "Supervision des sprints de votre pôle et évaluation des candidats."
            : "Sprint ticket authoring, attendance review, and applicant scoring."
          : isFr
          ? "Règles exactes pour accéder à Asteria Freelance PreLaunch."
          : "Exact rules to graduate into Asteria Freelance PreLaunch.",
      content: (
        <div className="space-y-3 text-xs font-body text-ink-soft dark:text-teal-100/90">
          {role === "MEMBER" && (
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 space-y-2">
              <div className="flex items-center gap-2 font-display font-bold text-ast-primary dark:text-teal-300 text-sm">
                <Briefcase className="w-4 h-4" />
                <span>{isFr ? "Critères de Qualification Freelance" : "Freelance Readiness Criteria"}</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {isFr
                  ? "Pour être certifié 'Prêt pour le Freelance' et recevoir des contrats clients rémunérés, vous devez obligatoirement remplir DEUX conditions :"
                  : "To earn your 'Freelance Ready' certification and receive paid commercial client briefs, you must meet TWO exact conditions:"}
              </p>
              <ul className="space-y-1.5 pt-1 text-[11px]">
                <li className="flex items-center gap-2 font-semibold text-ink dark:text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{isFr ? "Au moins 5 livrables de sprint terminés (colonne 'Terminé')" : "At least 5 completed sprint deliverables (status: DONE)"}</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-ink dark:text-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{isFr ? "Un taux d'assiduité d'au moins 75% aux ateliers" : "An attendance health rate of at least 75%"}</span>
                </li>
              </ul>
            </div>
          )}

          {role === "HOD" && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
                <span className="font-bold text-ink dark:text-white font-display block">
                  {isFr ? "• Création & Revue de Sprints" : "• Sprint Authoring & Review"}
                </span>
                <p className="text-[11px]">
                  {isFr
                    ? "Créez les tâches pour votre pôle technique, assignez les membres et validez les tickets soumis en révision."
                    : "Create deliverables for your track, assign active members, and approve completed tickets."}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
                <span className="font-bold text-ink dark:text-white font-display block">
                  {isFr ? "• Évaluation des Candidatures (/applications)" : "• Applicant Evaluation (/applications)"}
                </span>
                <p className="text-[11px]">
                  {isFr
                    ? "Examinez les portfolios soumis pour votre pôle lors des cycles de recrutement."
                    : "Review submitted dossiers and portfolio links for recruits applying to your department."}
                </p>
              </div>
            </div>
          )}

          {role === "BOARD" && (
            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
                <span className="font-bold text-ink dark:text-white font-display block">
                  {isFr ? "• Onboarding en 1-Clic (/applications)" : "• 1-Click Member Onboarding (/applications)"}
                </span>
                <p className="text-[11px]">
                  {isFr
                    ? "Validez les candidats retenus pour provisionner instantanément leurs comptes membres dans la base de données Supabase."
                    : "Approve selected applicants to automatically provision active member accounts in Supabase."}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-surface dark:bg-[#052024] border border-line dark:border-teal-900/60 space-y-1">
                <span className="font-bold text-ink dark:text-white font-display block">
                  {isFr ? "• Administration & Cycles (/admin)" : "• Governance & Audit Log (/admin)"}
                </span>
                <p className="text-[11px]">
                  {isFr
                    ? "Gérez les transitions de semestres, les sièges du bureau et consultez l'historique d'audit en temps réel."
                    : "Manage semester rollovers, assign board seats, and inspect security audit streams."}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  const current = steps[activeStep];

  const handleFinish = () => {
    localStorage.setItem("asteria_platform_guide_dismissed", "true");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#08262b] border border-teal-900/20 dark:border-teal-500/30 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden relative animate-vague-in flex flex-col">
        {/* Header Ribbon */}
        <div className="px-6 pt-6 pb-4 border-b border-line dark:border-teal-900/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-ast-light/20 text-ast-primary dark:text-teal-300 border border-ast-light/30">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                {current.badge}
              </span>
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-ink dark:text-white">
                {current.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white hover:bg-teal-50 dark:hover:bg-teal-900/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 flex-1">
          <p className="text-xs font-medium text-ink-soft dark:text-teal-200/80">{current.subtitle}</p>
          {current.content}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-line dark:border-teal-900/80 bg-surface-alt/50 dark:bg-[#052024]/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeStep
                    ? "w-6 bg-ast-primary dark:bg-ast-light"
                    : "w-2 bg-teal-200 dark:bg-teal-800"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                onClick={() => setActiveStep((prev) => prev - 1)}
                className="px-3 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {isFr ? "Précédent" : "Back"}
              </button>
            )}

            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep((prev) => prev + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center gap-1 shadow-sm"
              >
                {isFr ? "Suivant" : "Next"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center gap-1 shadow-sm"
              >
                {isFr ? "Terminer ★" : "Got It ★"}
                <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
