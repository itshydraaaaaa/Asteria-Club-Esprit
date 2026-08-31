"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { Button } from "@/components/ui/Button";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import {
  Code2,
  Palette,
  Video,
  Camera,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2,
  Users,
  CalendarCheck,
  KanbanSquare,
  QrCode,
  Megaphone,
  Briefcase,
  ChevronDown,
  ExternalLink,
  ChevronRight,
  Instagram,
  Linkedin,
  Github,
  Mail,
  MapPin,
} from "lucide-react";

export default function HomePage() {
  const { language, t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [stats, setStats] = useState<{
    totalMembers: number;
    totalDepartments: number;
    sprintVelocity: number;
    departments: any[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => console.error("Error fetching stats:", err));
  }, []);

  const isFr = language === "fr";

  const tracks = [
    {
      id: "web-dev",
      name: isFr ? "Développement Web" : "Web Development",
      badge: isFr ? "Pôle Ingénierie" : "Engineering Track",
      desc: isFr
        ? "Concevez des applications web modernes et performantes. Maîtrisez React, Next.js, TypeScript, Tailwind CSS, PostgreSQL et l'architecture cloud Supabase."
        : "Architect modern, production-grade web applications. Master React, Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Supabase cloud architectures.",
      icon: Code2,
      skills: ["Next.js 15", "TypeScript", "Tailwind CSS", "Supabase", "REST APIs"],
    },
    {
      id: "graphic-design",
      name: isFr ? "Design Graphique" : "Graphic Design",
      badge: isFr ? "Systèmes de Design" : "Design Systems",
      desc: isFr
        ? "Créez des identités de marque percutantes, des design systems et des chartes graphiques de haute précision sur Figma."
        : "Craft high-fidelity brand identities, design systems, and marketing collateral in Figma according to strict visual guidelines and typography scales.",
      icon: Palette,
      skills: ["Figma", "Brand Identity", "Design Systems", "Typography", "UI/UX"],
    },
    {
      id: "video-editing",
      name: isFr ? "Montage Vidéo" : "Video Editing",
      badge: isFr ? "Média Cinématographique" : "Cinematic Media",
      desc: isFr
        ? "Produisez des aftermovies rythmés, des bandes-annonces promotionnelles et du motion design saisissant avec Premiere Pro et After Effects."
        : "Produce cinematic event reels, university hackathon aftermovies, promotional trailers, and motion graphics using Premiere Pro and After Effects.",
      icon: Video,
      skills: ["Premiere Pro", "After Effects", "Motion Graphics", "Sound Design"],
    },
    {
      id: "photography",
      name: isFr ? "Photographie" : "Photography",
      badge: isFr ? "Capture Visuelle" : "Visual Capture",
      desc: isFr
        ? "Maîtrisez l'éclairage de studio, le photojournalisme d'événement et le traitement couleur professionnel sur Lightroom et Photoshop."
        : "Master studio lighting, aperture control, dynamic event photojournalism, and post-production color grading in Lightroom and Photoshop.",
      icon: Camera,
      skills: ["Studio Lighting", "Event Capture", "Lightroom", "Color Grading"],
    },
  ];

  const studioPillars = [
    {
      icon: Layers,
      title: isFr ? "Pipelines de Studio Professionnel" : "Agency-Grade Production",
      desc: isFr
        ? "Des cahiers des charges réels, des revues de code et de design par les pairs, et des livrables de sprint avec des exigences de qualité rigoureuses."
        : "Real client briefs, peer code and design reviews, and agile sprint deliverables executed with strict production standards.",
    },
    {
      icon: Code2,
      title: isFr ? "Masterclasses & Mentorat Actif" : "Hands-On Masterclasses",
      desc: isFr
        ? "Des ateliers hebdomadaires immersifs animés par des étudiants seniors et des professionnels pour maîtriser les outils modernes de l'industrie."
        : "Weekly practical workshops led by senior student leads to master modern industry toolstacks and build portfolio-grade projects.",
    },
    {
      icon: Briefcase,
      title: isFr ? "Passerelle Freelance Directe" : "Direct Commercial Launchpad",
      desc: isFr
        ? "Les créateurs certifiés accèdent directement au pôle Asteria Freelance PreLaunch pour exécuter des contrats clients rémunérés en Tunisie et à l'international."
        : "Certified creators fast-track directly into Asteria Freelance PreLaunch to take on paid commercial client contracts across EMEA.",
    },
  ];

  const pipelineSteps = [
    {
      step: "01",
      title: isFr ? "Candidature & Orientation" : "Audition & Track Allocation",
      desc: isFr
        ? "Déposez votre dossier de motivation et votre portfolio. Les chefs de pôle évaluent vos compétences et vous affectent à votre pôle principal."
        : "Submit your motivation dossier and portfolio. Department heads evaluate skills and assign you to your primary technical track.",
    },
    {
      step: "02",
      title: isFr ? "Masterclasses Intensives" : "Intensive Masterclasses",
      desc: isFr
        ? "Participez aux ateliers hebdomadaires, maîtrisez les outils modernes du secteur et validez des projets pratiques."
        : "Participate in weekly hands-on workshops, master modern industry toolstacks, and pass hands-on benchmark assignments.",
    },
    {
      step: "03",
      title: isFr ? "Livrables de Sprint" : "Sprint Ticket Deliverables",
      desc: isFr
        ? "Collaborez en sprints agiles, prenez en charge des tickets sur le tableau Kanban et constituez un portfolio audité."
        : "Collaborate in agile sprints, pick up real deliverables on the Kanban board, and build an audited portfolio of club projects.",
    },
    {
      step: "04",
      title: isFr ? "Qualification Asteria Freelance PreLaunch" : "Asteria Freelance PreLaunch Qualification",
      desc: isFr
        ? "Validez au moins 5 livrables de sprint et maintenez ≥75% d'assiduité pour être certifié 'Prêt pour le Freelance' et recevoir des contrats rémunérés."
        : "Complete ≥5 sprint deliverables and maintain ≥75% workshop attendance to earn your Freelance Ready certification and receive paid client contracts.",
    },
  ];

  const faqs = [
    {
      q: isFr
        ? "Qui peut rejoindre Asteria Club Esprit ?"
        : "Who can join Asteria Club Esprit?",
      a: isFr
        ? "Tout étudiant actif à ESPRIT passionné par le développement web, le design graphique, le montage vidéo ou la photographie peut postuler. Aucune expérience professionnelle préalable n'est requise—nous recherchons la curiosité, la rigueur et la passion."
        : "Any active student at ESPRIT passionate about web development, graphic design, video editing, or photography can apply. No professional experience is required—we look for curiosity, dedication, and raw passion.",
    },
    {
      q: isFr
        ? "Comment fonctionne la passerelle Asteria Freelance PreLaunch ?"
        : "How does the Asteria Freelance PreLaunch talent bridge work?",
      a: isFr
        ? "Asteria Club Esprit sert d'incubateur de talents pour Asteria Freelance PreLaunch. Pour être certifié 'Prêt pour le Freelance' et recevoir des contrats clients rémunérés, chaque membre doit obligatoirement valider deux conditions : (1) Terminer au moins 5 livrables de sprint sur le Kanban, et (2) Maintenir un taux d'assiduité d'au moins 75% aux ateliers. Dès que ces seuils sont atteints, le Bureau Exécutif certifie le profil pour les missions commerciales."
        : "Asteria Club Esprit functions as the training incubator for Asteria Freelance PreLaunch. To qualify for paid commercial client contracts, members must meet two exact requirements: (1) Complete at least 5 sprint task deliverables on the Kanban board, and (2) Maintain an attendance health score of at least 75% across scheduled workshops. Once both thresholds are met, the Executive Board certifies the member as 'Freelance Ready'.",
    },
    {
      q: isFr
        ? "Quel est l'engagement hebdomadaire requis ?"
        : "What is the weekly time commitment?",
      a: isFr
        ? "Les membres consacrent généralement 3 à 5 heures par semaine entre les ateliers de pôle, les livrables de sprint et les assemblées générales."
        : "Members typically invest 3–5 hours per week across weekly department workshops, sprint deliverables, and general assemblies.",
    },
    {
      q: isFr
        ? "Comment fonctionne le suivi de présence et de tâches sur la plateforme ?"
        : "How does attendance and task management work on the platform?",
      a: isFr
        ? "Les membres acceptés reçoivent un compte sur le système d'exploitation Asteria. Ils scannent le QR code dynamique de session pour valider leur présence et gèrent leurs tickets de production sur un tableau Kanban synchronisé en direct."
        : "Accepted members gain access to the Asteria Operating System. They verify workshop presence via dynamic session QR codes and passcodes, and track agile deliverables on our real-time Kanban sprint board.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white flex flex-col font-body selection:bg-teal-400 selection:text-ink transition-colors duration-300">
      {/* Floating Glass Navbar */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl w-full mx-auto">
        <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl transition-all duration-300">
          <AsteriaLogo variant="auto" size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-100/80 font-display">
            <a href="#about" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              {isFr ? "Le Studio" : "About Club"}
            </a>
            <a href="#tracks" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              {isFr ? "Pôles" : "Tracks"}
            </a>
            <a href="#pipeline" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              {isFr ? "Passerelle Freelance" : "Freelance Pipeline"}
            </a>
            <a href="#faq" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              {isFr ? "FAQ" : "FAQ"}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageToggle variant="pill" />
            <ThemeToggle />

            <Link href="/login">
              <button className="px-3.5 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white transition-colors">
                {t("nav.portal", "Member Login")}
              </button>
            </Link>
            <Link href="/apply">
              <button className="px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button scale-100 hover:scale-105 active:scale-95 shadow-md">
                {t("nav.apply", "Apply to Join")} ★
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Ambient Canvas */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <AmbientCanvas particleCount={55} className="absolute inset-0 pointer-events-none opacity-60 z-0" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10 animate-vague-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/60 border border-teal-200 dark:border-teal-500/40 text-ast-primary dark:text-teal-300 text-xs font-semibold uppercase tracking-wider font-mono shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-ast-primary dark:text-teal-400 animate-pulse" />
            {isFr
              ? "Incubateur Officiel de Talents Asteria Freelance PreLaunch · Esprit"
              : "Official Talent Incubator of Asteria Freelance PreLaunch · Esprit"}
          </div>

          {/* Display Heading */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-ink dark:text-white leading-none">
            {isFr ? (
              <>
                LÀ OÙ LES MEILLEURS <br />
                <span className="gradient-text-teal">CRÉATEURS D&apos;ESPRIT</span> SONT LANCÉS
              </>
            ) : (
              <>
                WHERE ESPRIT&apos;S <br />
                <span className="gradient-text-teal">TOP CREATORS</span> ARE LAUNCHED
              </>
            )}
          </h1>

          {/* Subheading */}
          <p className="font-body text-base sm:text-xl text-ink-soft dark:text-teal-100/90 max-w-3xl mx-auto leading-relaxed">
            {isFr ? (
              <>
                Asteria Club Esprit forme les étudiants en <strong>Développement Web</strong>, <strong>Design Graphique</strong>, <strong>Montage Vidéo</strong> et <strong>Photographie</strong>, puis oriente les talents certifiés vers des contrats rémunérés chez <strong>Asteria Freelance PreLaunch</strong>.
              </>
            ) : (
              <>
                Asteria Club Esprit trains students in <strong>Web Development</strong>, <strong>Graphic Design</strong>, <strong>Video Editing</strong>, and <strong>Photography</strong>, then feeds certified talent into paid client contracts at <strong>Asteria Freelance PreLaunch</strong>.
              </>
            )}
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/apply" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 group shadow-lg">
                {t("hero.cta.apply", "Apply for Membership")}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-semibold font-display uppercase tracking-wider bg-white dark:bg-surface-dark2/80 hover:bg-teal-50 dark:hover:bg-teal-900 text-ink dark:text-white border border-teal-200 dark:border-teal-700/80 transition-all flex items-center justify-center gap-2 shadow-sm">
                {t("hero.cta.portal", "Open Member Portal")}
              </button>
            </Link>
          </div>

          {/* Live Stats Ribbon */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                {t("hero.stat.hubs", "Technical Tracks")}
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                <AnimatedCounter value={stats?.totalDepartments ?? 4} />
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                {isFr ? "Web, Design, Vidéo, Photo" : "Web, Design, Video, Photo"}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                {t("hero.stat.pipeline", "Sprint Velocity")}
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                <AnimatedCounter value={stats?.sprintVelocity ?? 94} suffix="%" />
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                {isFr ? "Taux d'achèvement" : "Deliverables completion"}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                {t("hero.stat.growth", "Incubator Pipeline")}
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                100%
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                {isFr ? "Gouvernance étudiante" : "Student-governed"}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                {t("hero.stat.work", "Freelance Bridge")}
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                {isFr ? "Rémunéré ★" : "Paid ★"}
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                {isFr ? "Projets professionnels" : "Client contract readiness"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW: About The Club / Studio Philosophy Section */}
      <section id="about" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-line/60 dark:border-teal-900/60">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              {isFr ? "Identité & Philosophie" : "Studio Philosophy"}
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              {isFr ? "Bien Plus Qu'un Club. Un Studio de Production." : "Not Just a Club. A Production Studio."}
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft dark:text-teal-100/80 leading-relaxed">
              {isFr
                ? "Asteria Club Esprit rompt avec le modèle associatif traditionnel. Nous fonctionnons comme un studio créatif décentralisé où les étudiants acquièrent une rigueur professionnelle, livrent des projets d'envergure et accèdent directement à des contrats freelance rémunérés."
                : "Asteria Club Esprit departs from the traditional campus club model. We operate as an autonomous student production studio where creators gain production rigor, ship portfolio-grade deliverables, and earn direct entry into paid client freelance contracts."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {studioPillars.map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={i}
                  className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/20 space-y-4 shadow-md dark:shadow-2xl transition-all hover:border-teal-500/40"
                >
                  <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 w-fit">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wider text-ink dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive 4-Track Technical Showcase */}
      <section id="tracks" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              {t("departments.badge", "Creative Capabilities")}
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              {t("departments.title", "Four Hubs. One Standard.")}
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft dark:text-teal-100/80">
              {t("departments.subtitle", "Every department operates as an autonomous studio with senior leadership, structured pipelines, and production-grade tools.")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.id}
                  className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/20 glow-card transition-all duration-300 flex flex-col justify-between space-y-6 group shadow-md dark:shadow-2xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-ast-primary dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-700/60">
                        {track.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-wider text-ink dark:text-white group-hover:text-ast-primary dark:group-hover:text-teal-300 transition-colors">
                        {track.name}
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 mt-2 leading-relaxed">
                        {track.desc}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-line dark:border-teal-900/60">
                    <span className="text-[10px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                      {isFr ? "Stack & Outils Clés :" : "Core Stack & Tooling:"}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {track.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono bg-surface-alt dark:bg-teal-900/50 text-ink dark:text-teal-200 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-700/40"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The Asteria Freelance Talent Pipeline */}
      <section id="pipeline" className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              {t("recruitment.badge", "Talent Pipeline")}
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              {t("recruitment.title", "How to Join Asteria")}
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft dark:text-teal-100/80">
              {t("recruitment.subtitle", "We accept ambitious creators through a selective, portfolio-first evaluation process twice per year.")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipelineSteps.map((step, i) => (
              <div
                key={step.step}
                className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-6 rounded-3xl border border-teal-900/10 dark:border-teal-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden group shadow-md dark:shadow-2xl"
              >
                <div className="space-y-3">
                  <span className="font-display font-black text-4xl text-ast-primary/20 dark:text-teal-400/20 group-hover:text-ast-primary dark:group-hover:text-teal-400 transition-colors">
                    {step.step}
                  </span>
                  <h3 className="font-display font-bold text-base uppercase tracking-wider text-ink dark:text-white">
                    {step.title}
                  </h3>
                  <p className="font-body text-xs text-ink-soft dark:text-teal-100/80 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="w-full h-1 bg-teal-100 dark:bg-teal-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ast-light rounded-full"
                    style={{ width: `${(i + 1) * 25}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal OS Brief Showcase */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-[#08262b]/70 backdrop-blur-xl border border-teal-900/10 dark:border-teal-500/20 shadow-lg text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/50 text-ast-primary dark:text-teal-300 text-xs font-mono uppercase font-bold">
            <Layers className="w-3.5 h-3.5" />
            {isFr ? "Système d'Exploitation Interne" : "Internal Operating System"}
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl uppercase tracking-wider text-ink dark:text-white">
            {isFr ? "Un Espace Dédié Pour Chaque Membre" : "A Unified Platform For Every Creator"}
          </h3>
          <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 max-w-2xl mx-auto leading-relaxed">
            {isFr
              ? "Dès leur intégration, tous les membres accèdent à notre plateforme interne pour piloter leurs livrables Kanban, valider leur présence aux sessions par QR code, synchroniser leur planning et suivre leur progression vers Asteria Freelance PreLaunch."
              : "Once onboarded, all members gain full access to our internal operating system to manage agile Kanban deliverables, verify session attendance via QR codes, sync calendar workshops, and track freelance readiness progression."}
          </p>
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              {isFr ? "Questions & Réponses" : "Questions & Answers"}
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              {isFr ? "Foire Aux Questions" : "Frequently Asked"}
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl rounded-2xl border border-teal-900/10 dark:border-teal-500/20 overflow-hidden transition-all shadow-sm dark:shadow-md"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4"
                  >
                    <span className="font-display font-bold text-sm sm:text-base uppercase tracking-wider text-ink dark:text-white">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-ast-primary dark:text-teal-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 text-xs sm:text-sm font-body text-ink-soft dark:text-teal-100/80 leading-relaxed border-t border-line dark:border-teal-900/40 mt-2">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl gradient-mesh-hero p-8 sm:p-14 text-center space-y-6 shadow-2xl border border-teal-500/30 relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              {isFr ? "PRÊT À RÉVÉLER VOTRE POTENTIEL ?" : "READY TO LEVEL UP YOUR CRAFT?"}
            </h2>
            <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/90 leading-relaxed">
              {isFr
                ? "Rejoignez Asteria Club Esprit dès aujourd'hui. Développez des compétences pratiques, livrez des projets réels et accédez à des contrats freelance rémunérés."
                : "Join Asteria Club Esprit today. Gain hands-on technical skills, build production deliverables, and qualify for paid freelance client contracts."}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/apply">
                <button className="px-8 py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center gap-2 shadow-lg">
                  {t("apply.form.submit", "Submit Application")} ★
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a
                href="https://asteria-freelance-prelaunch.vercel.app/"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-white dark:bg-white/10 hover:bg-teal-50 dark:hover:bg-white/20 text-ink dark:text-white border border-teal-200 dark:border-white/20 transition-all flex items-center gap-2 shadow-sm"
              >
                {t("freelance.cta", "Visit Asteria Freelance PreLaunch")}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Pre-Launch Footer */}
      <footer className="pt-16 pb-12 px-4 sm:px-8 border-t border-line dark:border-teal-900/60 bg-surface/50 dark:bg-[#052024]/80 backdrop-blur-md text-xs font-body text-ink-soft dark:text-teal-200/70 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Brand & Bio */}
            <div className="space-y-4 md:col-span-1">
              <AsteriaLogo variant="auto" size="md" href="/" />
              <p className="leading-relaxed text-xs">
                {isFr
                  ? "Le premier studio de production créative et incubateur de talents technologiques à ESPRIT. Formez-vous, livrez des projets réels et accédez à des contrats freelance rémunérés."
                  : "The premier student-led creative production studio and tech talent incubator at ESPRIT. Master digital crafts, build production projects, and earn paid freelance client work."}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-surface-alt dark:bg-teal-900/60 text-ink dark:text-teal-200 hover:text-ast-primary dark:hover:text-ast-light border border-line dark:border-teal-800 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-surface-alt dark:bg-teal-900/60 text-ink dark:text-teal-200 hover:text-ast-primary dark:hover:text-ast-light border border-line dark:border-teal-800 transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/itshydraaaaaa/Asteria-Club-Esprit"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl bg-surface-alt dark:bg-teal-900/60 text-ink dark:text-teal-200 hover:text-ast-primary dark:hover:text-ast-light border border-line dark:border-teal-800 transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="mailto:contact@asteria.tn"
                  className="p-2 rounded-xl bg-surface-alt dark:bg-teal-900/60 text-ink dark:text-teal-200 hover:text-ast-primary dark:hover:text-ast-light border border-line dark:border-teal-800 transition-colors"
                  aria-label="Contact Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Column 2: 4 Creative Hubs */}
            <div className="space-y-3">
              <span className="font-display font-bold uppercase tracking-wider text-ink dark:text-white text-xs block">
                {isFr ? "Pôles de Spécialisation" : "Specialization Hubs"}
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#tracks" className="hover:text-ast-primary dark:hover:text-ast-light transition-colors">
                    {isFr ? "• Développement Web & Cloud" : "• Web & Cloud Engineering"}
                  </a>
                </li>
                <li>
                  <a href="#tracks" className="hover:text-ast-primary dark:hover:text-ast-light transition-colors">
                    {isFr ? "• Design Graphique & UI/UX" : "• Graphic Design & Systems"}
                  </a>
                </li>
                <li>
                  <a href="#tracks" className="hover:text-ast-primary dark:hover:text-ast-light transition-colors">
                    {isFr ? "• Montage Vidéo & Motion" : "• Video & Motion Cinema"}
                  </a>
                </li>
                <li>
                  <a href="#tracks" className="hover:text-ast-primary dark:hover:text-ast-light transition-colors">
                    {isFr ? "• Photographie & Studio" : "• Photography & Lighting"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Platform & Ecosystem */}
            <div className="space-y-3">
              <span className="font-display font-bold uppercase tracking-wider text-ink dark:text-white text-xs block">
                {isFr ? "Écosystème & Accès" : "Ecosystem & Portals"}
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/apply" className="hover:text-ast-primary dark:hover:text-ast-light font-semibold text-ast-primary dark:text-teal-300 transition-colors">
                    ★ {isFr ? "Postuler au Recrutement" : "Apply for Membership"}
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-ast-primary dark:hover:text-ast-light transition-colors">
                    {isFr ? "• Portail Membre (OS)" : "• Member Operating System"}
                  </Link>
                </li>
                <li>
                  <a
                    href="https://asteria-freelance-prelaunch.vercel.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-ast-primary dark:hover:text-ast-light transition-colors flex items-center gap-1"
                  >
                    <span>★ Asteria Freelance PreLaunch</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-ast-primary dark:hover:text-ast-light transition-colors">
                    {isFr ? "• Foire Aux Questions (FAQ)" : "• Frequently Asked Questions"}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Campus & Inquiries */}
            <div className="space-y-3">
              <span className="font-display font-bold uppercase tracking-wider text-ink dark:text-white text-xs block">
                {isFr ? "Campus & Contact" : "Campus & Inquiries"}
              </span>
              <div className="space-y-2 text-xs">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-ast-primary dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <span>ESPRIT University · Ariana Soghra, Tunis, Tunisia</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-ast-primary dark:text-teal-400 flex-shrink-0" />
                  <a href="mailto:contact@asteria.tn" className="hover:underline">contact@asteria.tn</a>
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-mono font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isFr ? "Candidatures Ouvertes 2026" : "Recruitment Cycle Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subfooter */}
          <div className="pt-8 border-t border-line dark:border-teal-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p className="text-center sm:text-left">
              © 2026 Asteria Club Esprit · ESPRIT University. {isFr ? "Produit affilié à Asteria Freelance PreLaunch." : "Sister product to Asteria Freelance PreLaunch."}
            </p>
            <div className="flex items-center gap-4">
              <LanguageToggle variant="pill" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
