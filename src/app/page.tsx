"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { Button } from "@/components/ui/Button";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
} from "lucide-react";

export default function HomePage() {
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

  const tracks = [
    {
      id: "web-dev",
      name: "Web Development",
      badge: "Engineering Track",
      desc: "Architect modern, production-grade web applications. Master React, Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Supabase cloud architectures.",
      icon: Code2,
      skills: ["Next.js 15", "TypeScript", "Tailwind CSS", "Supabase", "REST APIs"],
    },
    {
      id: "graphic-design",
      name: "Graphic Design",
      badge: "Design Systems",
      desc: "Craft high-fidelity brand identities, design systems, and marketing collateral in Figma according to strict visual guidelines and typography scales.",
      icon: Palette,
      skills: ["Figma", "Brand Identity", "Design Systems", "Typography", "UI/UX"],
    },
    {
      id: "video-editing",
      name: "Video Editing",
      badge: "Cinematic Media",
      desc: "Produce cinematic event reels, university hackathon aftermovies, promotional trailers, and motion graphics using Premiere Pro and After Effects.",
      icon: Video,
      skills: ["Premiere Pro", "After Effects", "Motion Graphics", "Sound Design"],
    },
    {
      id: "photography",
      name: "Photography",
      badge: "Visual Capture",
      desc: "Master studio lighting, aperture control, dynamic event photojournalism, and post-production color grading in Lightroom and Photoshop.",
      icon: Camera,
      skills: ["Studio Lighting", "Event Capture", "Lightroom", "Color Grading"],
    },
  ];

  const pipelineSteps = [
    {
      step: "01",
      title: "Audition & Track Allocation",
      desc: "Submit your motivation dossier and portfolio. Department heads evaluate skills and assign you to your primary technical track.",
    },
    {
      step: "02",
      title: "Intensive Masterclasses",
      desc: "Participate in weekly hands-on workshops, master modern industry toolstacks, and pass hands-on benchmark assignments.",
    },
    {
      step: "03",
      title: "Sprint Ticket Deliverables",
      desc: "Collaborate in agile sprints, pick up real deliverables on the Kanban board, and build an audited portfolio of club projects.",
    },
    {
      step: "04",
      title: "Asteria Freelance Graduation",
      desc: "Qualify for the Asteria Freelance roster and receive paid client contracts with corporate and startup partners.",
    },
  ];

  const faqs = [
    {
      q: "Who can join Asteria Club Esprit?",
      a: "Any active student at ESPRIT passionate about web development, graphic design, video editing, or photography can apply. No professional experience is required—we look for curiosity, dedication, and raw passion.",
    },
    {
      q: "How does the Asteria Freelance talent bridge work?",
      a: "Asteria Club Esprit functions as the training incubator for Asteria Freelance. Once you successfully deliver sprint tickets, maintain good workshop attendance, and pass department review, you are certified as 'Freelance Ready' for paid client projects.",
    },
    {
      q: "What is the weekly time commitment?",
      a: "Members typically invest 3–5 hours per week across weekly department workshops, sprint deliverables, and general assemblies.",
    },
    {
      q: "How does attendance and task management work on the platform?",
      a: "The platform provides dynamic QR code check-ins for events and a real-time agile Kanban board where you pick up sprint deliverables, submit work for review, and track your attendance health score.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white flex flex-col font-body selection:bg-teal-400 selection:text-ink transition-colors duration-300">
      {/* Floating Glass Navbar */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl w-full mx-auto">
        <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl transition-all duration-300">
          <AsteriaLogo variant="auto" size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-ink-soft dark:text-teal-100/80 font-display">
            <a href="#tracks" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              Tracks
            </a>
            <a href="#pipeline" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              Freelance Pipeline
            </a>
            <a href="#platform" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              Platform
            </a>
            <a href="#faq" className="hover:text-ast-primary dark:hover:text-teal-300 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link href="/login">
              <button className="px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white transition-colors">
                Member Login
              </button>
            </Link>
            <Link href="/apply">
              <button className="px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button scale-100 hover:scale-105 active:scale-95 shadow-md">
                Apply to Join ★
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
            Official Talent Incubator of Asteria Freelance · Esprit
          </div>

          {/* Display Heading */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-ink dark:text-white leading-none">
            WHERE ESPRIT&apos;S <br />
            <span className="gradient-text-teal">TOP CREATORS</span> ARE LAUNCHED
          </h1>

          {/* Subheading */}
          <p className="font-body text-base sm:text-xl text-ink-soft dark:text-teal-100/90 max-w-3xl mx-auto leading-relaxed">
            Asteria Club Esprit trains students in <strong>Web Development</strong>, <strong>Graphic Design</strong>, <strong>Video Editing</strong>, and <strong>Photography</strong>, then feeds certified talent into paid client contracts at <strong>Asteria Freelance</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/apply" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 group shadow-lg">
                Apply for 2026 Season
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-semibold font-display uppercase tracking-wider bg-white dark:bg-surface-dark2/80 hover:bg-teal-50 dark:hover:bg-teal-900 text-ink dark:text-white border border-teal-200 dark:border-teal-700/80 transition-all flex items-center justify-center gap-2 shadow-sm">
                Open Member Portal
              </button>
            </Link>
          </div>

          {/* Live Stats Ribbon */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                Technical Tracks
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                <AnimatedCounter value={stats?.totalDepartments ?? 4} />
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                Web, Design, Video, Photo
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                Sprint Velocity
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                <AnimatedCounter value={stats?.sprintVelocity ?? 94} suffix="%" />
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                Deliverables completion
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                Incubator Pipeline
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                100%
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                Student-governed
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#08262b]/85 backdrop-blur-xl p-5 rounded-2xl border border-teal-900/10 dark:border-teal-500/20 shadow-sm dark:shadow-2xl">
              <span className="text-[11px] font-mono uppercase font-bold text-ast-primary dark:text-teal-400 block">
                Freelance Bridge
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-ink dark:text-white mt-1">
                Paid ★
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-teal-200/70 mt-0.5 font-body">
                Client contract readiness
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 4-Track Technical Showcase */}
      <section id="tracks" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              Department Architecture
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              Specialization Tracks
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft dark:text-teal-100/80">
              Each track is led by a dedicated Head of Department with custom curriculums, weekly workshops, and real agile sprints.
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
                      Core Stack & Tooling:
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
              The Incubator Journey
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              The Freelance Bridge
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft dark:text-teal-100/80">
              How we train university students from zero to production-level professionals ready for paid industry contracts.
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

      {/* Internal OS Features Preview */}
      <section id="platform" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              Platform Modules
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              The Club Operating System
            </h2>
            <p className="font-body text-sm sm:text-base text-ink-soft dark:text-teal-100/80">
              Built for speed, accountability, and real-time collaboration across board executives, department leads, and members.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/20 space-y-4 shadow-md dark:shadow-2xl">
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 w-fit">
                <KanbanSquare className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-ink dark:text-white">
                Agile Task Kanban
              </h3>
              <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 leading-relaxed">
                4-column sprint board with real-time Supabase sync, drag-and-drop state transitions, assignees, priorities, and threaded comments.
              </p>
            </div>

            <div className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/20 space-y-4 shadow-md dark:shadow-2xl">
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 w-fit">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-ink dark:text-white">
                Dynamic QR Attendance
              </h3>
              <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 leading-relaxed">
                Dynamic QR codes for session hosts, 6-digit numeric passcodes, camera scanner simulation, and member absence justification workflows.
              </p>
            </div>

            <div className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/20 space-y-4 shadow-md dark:shadow-2xl">
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-500/40 w-fit">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl uppercase tracking-wider text-ink dark:text-white">
                Freelance Qualification
              </h3>
              <p className="font-body text-xs sm:text-sm text-ink-soft dark:text-teal-100/80 leading-relaxed">
                Automated auditing tracking member workshop attendance health and sprint deliverable counts to graduate talent directly into client contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-ast-primary dark:text-teal-400 bg-teal-50 dark:bg-teal-900/40 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-500/30">
              Questions & Answers
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-ink dark:text-white">
              Frequently Asked
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
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-white">
              READY TO LEVEL UP YOUR CRAFT?
            </h2>
            <p className="font-body text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Join Asteria Club Esprit today. Gain hands-on technical skills, build production deliverables, and qualify for paid freelance client contracts.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/apply">
                <button className="px-8 py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center gap-2 shadow-lg">
                  Submit Application ★
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a
                href="https://asteria-freelance.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3.5 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2"
              >
                Visit Asteria Freelance
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-8 border-t border-line dark:border-teal-900/60 text-xs font-body text-ink-soft dark:text-teal-200/60 max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <AsteriaLogo variant="auto" size="sm" href="/" />
        <p className="text-center sm:text-right">
          © 2026 Asteria Club Esprit · ESPRIT University. Sister product to Asteria Freelance.
        </p>
      </footer>
    </div>
  );
}
