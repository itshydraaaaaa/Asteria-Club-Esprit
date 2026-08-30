"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Code2,
  Palette,
  Video,
  Camera,
  CheckCircle2,
  Sparkles,
  Send,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  User,
  Mail,
  Phone,
  Link2,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ApplyPage() {
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [selectedTrack, setSelectedTrack] = useState("Web Development");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    departmentPreference: "Web Development",
    motivation: "",
    portfolioLink: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tracks = [
    {
      id: "Web Development",
      name: isFr ? "Développement Web" : "Web Development",
      badge: isFr ? "Pôle Ingénierie" : "Engineering",
      icon: Code2,
      desc: isFr
        ? "React, Next.js, TypeScript, PostgreSQL, APIs REST & architectures freelance."
        : "React, Next.js 15, TypeScript, PostgreSQL, REST APIs & Freelance systems.",
    },
    {
      id: "Graphic Design",
      name: isFr ? "Design Graphique" : "Graphic Design",
      badge: isFr ? "Identité Visuelle" : "Visual Branding",
      icon: Palette,
      desc: isFr
        ? "Design systems Figma, chartes graphiques, affiches vectorielles & UI/UX."
        : "Figma design systems, brand guidelines, vector posters & UI/UX aesthetics.",
    },
    {
      id: "Video Editing",
      name: isFr ? "Montage Vidéo" : "Video Editing",
      badge: isFr ? "Média Cinéma" : "Cinematic Media",
      icon: Video,
      desc: isFr
        ? "Premiere Pro, After Effects, rushs cinématographiques, sound design & aftermovies."
        : "Premiere Pro, After Effects, cinematic rushes, sound design & hackathon reels.",
    },
    {
      id: "Photography",
      name: isFr ? "Photographie" : "Photography",
      badge: isFr ? "Studio & Événements" : "Studio & Events",
      icon: Camera,
      desc: isFr
        ? "Éclairage studio, photojournalisme d'événement, étalonnage Lightroom & Photoshop."
        : "Studio lighting, event photojournalism, color grading in Lightroom & Photoshop.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.motivation) {
      setError(
        isFr
          ? "Veuillez remplir tous les champs obligatoires (Nom, Email, Motivation)."
          : "Please complete all required fields (Name, Email, Motivation)."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          departmentPreference: selectedTrack,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        confetti({
          particleCount: 140,
          spread: 90,
          origin: { y: 0.55 },
          colors: ["#60C8D4", "#11606E", "#0A3A40"],
        });
      } else {
        setError(data.error || (isFr ? "Échec de l'envoi de la candidature." : "Failed to submit application."));
      }
    } catch {
      setError(isFr ? "Erreur réseau. Veuillez réessayer." : "Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white flex flex-col font-body selection:bg-teal-400 selection:text-ink relative overflow-hidden transition-colors duration-300">
      <AmbientCanvas particleCount={40} className="absolute inset-0 pointer-events-none opacity-50 z-0" />

      {/* Floating Header */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-5xl w-full mx-auto">
        <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl transition-all duration-300">
          <AsteriaLogo variant="auto" size="md" href="/" />

          <div className="flex items-center gap-3">
            <LanguageToggle variant="pill" />
            <ThemeToggle />

            <Link href="/">
              <button className="px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white flex items-center gap-1.5 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> {isFr ? "Accueil" : "Home"}
              </button>
            </Link>
            <Link href="/login">
              <button className="px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-white dark:bg-teal-900/80 hover:bg-teal-50 dark:hover:bg-teal-800 text-ink dark:text-teal-200 border border-teal-200 dark:border-teal-700/60 hover:text-ast-primary dark:hover:text-white transition-all shadow-sm">
                {t("nav.portal", "Member Login")}
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 relative z-10 flex flex-col justify-center animate-vague-in">
        {submitted ? (
          <div className="bg-white/90 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 sm:p-14 rounded-3xl border border-teal-900/10 dark:border-teal-500/40 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-teal-50 dark:bg-teal-900/80 border-2 border-ast-light text-ast-primary dark:text-ast-light flex items-center justify-center mx-auto shadow-inner glow-teal">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-300 bg-teal-50 dark:bg-teal-900/60 px-3.5 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
                {isFr ? "Candidature Enregistrée · Saison 2026" : "Application Received · 2026 Cycle"}
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wider text-ink dark:text-white">
                {isFr ? `BIENVENUE, ${form.name.toUpperCase()} !` : `WELCOME, ${form.name.toUpperCase()}!`}
              </h2>
              <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 leading-relaxed max-w-lg mx-auto">
                {isFr
                  ? `Votre candidature pour le pôle ${selectedTrack} a été enregistrée avec succès. Le Bureau Exécutif et les Chefs de Pôle examinent les dossiers chaque semaine.`
                  : `Your application for the ${selectedTrack} track has been securely recorded in our database. The Executive Board and Department Heads review submissions weekly.`}
              </p>
            </div>

            <div className="pt-6 border-t border-line dark:border-teal-900/80 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <button className="px-6 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button shadow-md">
                  {t("apply.success.cta", "Return to Homepage")}
                </button>
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setForm({
                    name: "",
                    email: "",
                    phone: "",
                    departmentPreference: "Web Development",
                    motivation: "",
                    portfolioLink: "",
                  });
                }}
                className="px-6 py-3 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-surface-alt dark:bg-teal-900/80 text-ink dark:text-teal-200 border border-line dark:border-teal-700/60 hover:bg-teal-50 dark:hover:text-white transition-all shadow-sm"
              >
                {isFr ? "Soumettre une autre entrée" : "Submit Another Entry"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Title Section */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/60 border border-teal-200 dark:border-teal-500/40 text-ast-primary dark:text-teal-300 text-xs font-semibold uppercase tracking-wider font-mono shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400" />
                {isFr ? "Candidature Saison Universitaire 2026" : "2026 Academic Season Application"}
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
                {t("apply.title", "Join Asteria Club Esprit")}
              </h1>
              <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80">
                {t("apply.subtitle", "Choose your track, showcase your motivation, and step into the premier student talent pipeline.")}
              </p>
            </div>

            {/* Application Card */}
            <div className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-6 sm:p-10 rounded-3xl border border-teal-900/10 dark:border-teal-500/30 shadow-2xl space-y-8">
              {/* Step 1: Select Track */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-ast-primary dark:text-teal-400">
                  <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900 flex items-center justify-center text-[10px] border border-teal-200 dark:border-teal-500 font-bold">
                    1
                  </span>
                  {isFr ? "Sélectionnez votre Pôle Technique *" : "Select Technical Track *"}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {tracks.map((track) => {
                    const Icon = track.icon;
                    const isSelected = selectedTrack === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setSelectedTrack(track.id)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 shadow-sm ${
                          isSelected
                            ? "bg-teal-50/90 dark:bg-teal-900/90 border-ast-primary dark:border-ast-light ring-2 ring-ast-primary/20 dark:ring-ast-light"
                            : "bg-surface dark:bg-[#052024]/80 border-line dark:border-teal-900/80 hover:border-ast-primary/40 dark:hover:border-teal-600/60"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-xl transition-colors ${
                            isSelected
                              ? "bg-ast-light text-ink shadow-sm"
                              : "bg-teal-50 dark:bg-teal-950 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink dark:text-white">
                              {track.name}
                            </h4>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-ast-primary dark:text-ast-light" />
                            )}
                          </div>
                          <p className="text-[11px] text-ink-soft dark:text-teal-100/70 font-body leading-snug">
                            {track.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Form Details */}
              <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-line dark:border-teal-900/80">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-ast-primary dark:text-teal-400">
                  <span className="w-5 h-5 rounded-full bg-teal-50 dark:bg-teal-900 flex items-center justify-center text-[10px] border border-teal-200 dark:border-teal-500 font-bold">
                    2
                  </span>
                  {isFr ? "Dossier du Candidat *" : "Applicant Dossier *"}
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 rounded-xl text-xs font-body flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                      {t("apply.form.fullName", "Full Name")} *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-ast-primary dark:text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder={isFr ? "Ex: Yasmine Ben Salem" : "e.g. Yasmine Ben Salem"}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                      {t("apply.form.email", "ESPRIT Student Email")} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-ast-primary dark:text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        placeholder="prenom.nom@esprit.tn"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                      {isFr ? "Numéro de Téléphone" : "Phone Number"}
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-ast-primary dark:text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+216 55 123 456"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                      {isFr ? "Lien Portfolio / GitHub / Behance" : "Portfolio / GitHub / Behance Link"}
                    </label>
                    <div className="relative">
                      <Link2 className="w-4 h-4 text-ast-primary dark:text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://github.com/... or behance.net/..."
                        value={form.portfolioLink}
                        onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                        className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                    {isFr ? "Motivation & Objectifs Personnels *" : "Motivation & Personal Goals *"}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      isFr
                        ? "Expliquez ce qui vous motive, les projets que vous avez construits et ce que vous souhaitez apporter à Asteria Club Esprit..."
                        : "Tell us what drives you, projects you have built, and why you want to join Asteria Club Esprit..."
                    }
                    value={form.motivation}
                    onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                    className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl p-3.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-ink-soft dark:text-teal-200/70 font-body">
                    <ShieldCheck className="w-4 h-4 text-ast-primary dark:text-ast-light" />
                    <span>{isFr ? "Vos données sont traitées de manière confidentielle." : "Your data is stored securely in our cloud database."}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                  >
                    {loading
                      ? (isFr ? "Envoi du dossier..." : "Submitting Dossier...")
                      : (isFr ? "Déposer ma Candidature ★" : "Submit Recruitment Dossier ★")}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
