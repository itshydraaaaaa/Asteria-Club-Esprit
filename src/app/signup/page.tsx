"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";

const AmbientCanvas = dynamic(
  () => import("@/components/ui/AmbientCanvas").then((m) => m.AmbientCanvas),
  { ssr: false }
);
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { ArrowRight, ArrowLeft, Sparkles, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  return (
    <div className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-body relative overflow-hidden selection:bg-teal-400 selection:text-ink transition-colors duration-300">
      <AmbientCanvas particleCount={40} className="absolute inset-0 pointer-events-none opacity-50 z-0" />

      {/* Floating Back & Theme Controls */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <button className="px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white glass-nav flex items-center gap-2 transition-all shadow-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> {isFr ? "Accueil" : "Return to Home"}
          </button>
        </Link>
      </div>

      <div className="absolute top-6 right-6 z-20 flex items-center gap-2.5">
        <LanguageToggle variant="pill" />
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10 animate-vague-in">
        <AsteriaLogo variant="auto" size="lg" href="/" className="justify-center" />
        <p className="font-body text-xs text-ink-soft dark:text-teal-200/80 font-medium">
          {isFr
            ? "Portail d'Adhésion & Onboarding · Asteria Club Esprit"
            : "Membership & Onboarding Portal · Asteria Club Esprit"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-vague-in">
        <div className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/30 shadow-2xl space-y-6 text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 mx-auto">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="font-display font-bold text-xl uppercase tracking-wider text-ink dark:text-white">
              {isFr ? "Adhésion sur Candidature" : "Membership by Application Only"}
            </h2>
            <p className="font-body text-xs text-ink-soft dark:text-teal-100/80 leading-relaxed">
              {isFr
                ? "Asteria Club Esprit fonctionne comme un incubateur d'élite sélectif. Les comptes membres sont créés et activés par le Bureau Exécutif après examen de votre portfolio et audition."
                : "Asteria Club Esprit operates as a selective talent incubator. Member accounts are provisioned by the Executive Board upon portfolio evaluation and audition acceptance."}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/60 border border-teal-200/60 dark:border-teal-800/60 text-left space-y-2 text-xs font-body">
            <div className="flex items-center gap-2 text-ink dark:text-teal-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{isFr ? "1. Déposez votre candidature sur /apply" : "1. Submit your application on /apply"}</span>
            </div>
            <div className="flex items-center gap-2 text-ink dark:text-teal-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{isFr ? "2. Évaluation par les chefs de pôle" : "2. Portfolio review by Department Leads"}</span>
            </div>
            <div className="flex items-center gap-2 text-ink dark:text-teal-200 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>{isFr ? "3. Activation de vos identifiants membres" : "3. 1-Click activation of your member credentials"}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/apply" className="block">
              <button className="w-full py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 shadow-md">
                <Sparkles className="w-4 h-4" />
                {isFr ? "Postuler au Recrutement ★" : "Apply for Membership ★"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>

            <Link href="/login" className="block">
              <button className="w-full py-3 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-white dark:bg-[#052024] hover:bg-teal-50 dark:hover:bg-teal-900/60 text-ink dark:text-white border border-teal-200 dark:border-teal-700 transition-all">
                {isFr ? "Déjà membre ? Se connecter" : "Already a member? Sign In"}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
