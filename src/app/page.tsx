"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { Button } from "@/components/ui/Button";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
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

  const tracks = [
    {
      id: "web-dev",
      name: "Web Development",
      badge: "Engineering Track",
      desc: "Architect modern, production-grade web applications. Master React, Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Supabase cloud architectures.",
      icon: Code2,
      skills: ["Next.js 15", "TypeScript", "Tailwind CSS", "Supabase", "REST APIs"],
      color: "from-teal-500/20 to-emerald-500/20 border-teal-500/30",
    },
    {
      id: "graphic-design",
      name: "Graphic Design",
      badge: "Design Systems",
      desc: "Craft high-fidelity brand identities, design systems, and marketing collateral in Figma according to strict visual guidelines and typography scales.",
      icon: Palette,
      skills: ["Figma", "Brand Identity", "Design Systems", "Typography", "UI/UX"],
      color: "from-cyan-500/20 to-teal-500/20 border-cyan-500/30",
    },
    {
      id: "video-editing",
      name: "Video Editing",
      badge: "Cinematic Media",
      desc: "Produce cinematic event reels, university hackathon aftermovies, promotional trailers, and motion graphics using Premiere Pro and After Effects.",
      icon: Video,
      skills: ["Premiere Pro", "After Effects", "Motion Graphics", "Sound Design"],
      color: "from-blue-500/20 to-teal-500/20 border-blue-500/30",
    },
    {
      id: "photography",
      name: "Photography",
      badge: "Visual Capture",
      desc: "Master studio lighting, aperture control, dynamic event photojournalism, and post-production color grading in Lightroom and Photoshop.",
      icon: Camera,
      skills: ["Studio Lighting", "Event Capture", "Lightroom", "Color Grading"],
      color: "from-teal-500/20 to-sky-500/20 border-teal-500/30",
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
      desc: "Attend weekly hands-on workshops led by senior student leads and industry alumni to level up your craft.",
    },
    {
      step: "03",
      title: "Agile Sprint Deliverables",
      desc: "Collaborate on real internal and university deliverables managed via the club's live 4-column Kanban board.",
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
    <div className="min-h-screen bg-[#062327] text-white flex flex-col font-body selection:bg-teal-400 selection:text-ink">
      {/* Floating Glass Navbar */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl w-full mx-auto">
        <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl">
          <AsteriaLogo variant="dark" size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-teal-100/80 font-display">
            <a href="#tracks" className="hover:text-teal-300 transition-colors">
              Tracks
            </a>
            <a href="#pipeline" className="hover:text-teal-300 transition-colors">
              Freelance Pipeline
            </a>
            <a href="#platform" className="hover:text-teal-300 transition-colors">
              Platform
            </a>
            <a href="#faq" className="hover:text-teal-300 transition-colors">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <button className="px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-teal-200 hover:text-white transition-colors">
                Member Login
              </button>
            </Link>
            <Link href="/apply">
              <button className="px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button scale-100 hover:scale-105 active:scale-95">
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-900/60 border border-teal-500/40 text-teal-300 text-xs font-semibold uppercase tracking-wider font-mono shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            Official Talent Incubator of Asteria Freelance · Esprit
          </div>

          {/* Display Heading */}
          <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl uppercase tracking-tight text-white leading-none">
            WHERE ESPRIT&apos;S <br />
            <span className="gradient-text-teal">TOP CREATORS</span> ARE LAUNCHED
          </h1>

          {/* Subheading */}
          <p className="font-body text-base sm:text-xl text-teal-100/90 max-w-3xl mx-auto leading-relaxed">
            Asteria Club Esprit trains students in <strong>Web Development</strong>, <strong>Graphic Design</strong>, <strong>Video Editing</strong>, and <strong>Photography</strong>, then feeds certified talent into paid client contracts at <strong>Asteria Freelance</strong>.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/apply" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 group">
                Apply for 2026 Season
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>

            <Link href="/login" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-semibold font-display uppercase tracking-wider bg-surface-dark2/80 hover:bg-teal-900 text-white border border-teal-700/80 transition-all flex items-center justify-center gap-2">
                Open Member Portal
              </button>
            </Link>
          </div>

          {/* Live Stats Ribbon */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="glass-dark p-5 rounded-2xl border-teal-500/20">
              <span className="text-[11px] font-mono uppercase font-bold text-teal-400 block">
                Technical Tracks
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                <AnimatedCounter value={4} />
              </h3>
              <p className="text-[11px] text-teal-200/70 mt-0.5 font-body">
                Web, Design, Video, Photo
              </p>
            </div>

            <div className="glass-dark p-5 rounded-2xl border-teal-500/20">
              <span className="text-[11px] font-mono uppercase font-bold text-teal-400 block">
                Sprint Velocity
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                <AnimatedCounter value={94} suffix="%" />
              </h3>
              <p className="text-[11px] text-teal-200/70 mt-0.5 font-body">
                Deliverables completion
              </p>
            </div>

            <div className="glass-dark p-5 rounded-2xl border-teal-500/20">
              <span className="text-[11px] font-mono uppercase font-bold text-teal-400 block">
                Incubator Pipeline
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                100%
              </h3>
              <p className="text-[11px] text-teal-200/70 mt-0.5 font-body">
                Student-governed
              </p>
            </div>

            <div className="glass-dark p-5 rounded-2xl border-teal-500/20">
              <span className="text-[11px] font-mono uppercase font-bold text-teal-400 block">
                Freelance Bridge
              </span>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white mt-1">
                Paid ★
              </h3>
              <p className="text-[11px] text-teal-200/70 mt-0.5 font-body">
                Client contract readiness
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Technical Specialization Tracks Section */}
      <section id="tracks" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#041b1e] border-y border-teal-900/60">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-teal-400 bg-teal-900/40 px-3 py-1 rounded-full border border-teal-500/30">
              4 Disciplines of Excellence
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-white">
              Specialization Tracks
            </h2>
            <p className="font-body text-sm sm:text-base text-teal-100/80">
              Each track is led by a dedicated Head of Department with custom curriculums, weekly workshops, and real agile sprints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tracks.map((track) => {
              const Icon = track.icon;
              return (
                <div
                  key={track.id}
                  className="glass-dark p-8 rounded-3xl border border-teal-500/20 glow-card transition-all duration-300 flex flex-col justify-between space-y-6 group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-3.5 rounded-2xl bg-teal-900/80 text-teal-300 border border-teal-500/40 group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-950 px-3 py-1 rounded-full border border-teal-700/60">
                        {track.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl uppercase tracking-wider text-white group-hover:text-teal-300 transition-colors">
                        {track.name}
                      </h3>
                      <p className="font-body text-xs sm:text-sm text-teal-100/80 mt-2 leading-relaxed">
                        {track.desc}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-teal-900/60">
                    <span className="text-[10px] font-mono uppercase font-bold text-teal-400 block">
                      Core Stack & Tooling:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {track.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs font-mono bg-teal-900/50 text-teal-200 px-2.5 py-1 rounded-lg border border-teal-700/40"
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
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-teal-400 bg-teal-900/40 px-3 py-1 rounded-full border border-teal-500/30">
              The Incubator Journey
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-white">
              The Freelance Bridge
            </h2>
            <p className="font-body text-sm sm:text-base text-teal-100/80">
              How we train university students from zero to production-level professionals ready for paid industry contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipelineSteps.map((step, i) => (
              <div
                key={i}
                className="glass-dark p-6 rounded-3xl border border-teal-500/20 relative space-y-4 glow-card transition-all"
              >
                <span className="font-mono font-black text-3xl sm:text-4xl text-teal-400/40 block">
                  {step.step}
                </span>
                <h4 className="font-display font-bold text-lg uppercase tracking-wider text-white">
                  {step.title}
                </h4>
                <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="glass-dark p-8 rounded-3xl border border-teal-500/30 text-center max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-center gap-2 text-teal-300 font-display text-sm font-bold uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              Direct Sister Partnership
            </div>
            <h3 className="font-display font-bold text-2xl uppercase tracking-wider text-white">
              Asteria Club × Asteria Freelance
            </h3>
            <p className="font-body text-xs sm:text-sm text-teal-100/80 max-w-xl mx-auto leading-relaxed">
              Asteria Freelance delivers enterprise-grade software and design solutions to real corporate clients, staffed exclusively by top-performing Asteria Club alumni.
            </p>
            <div className="pt-2">
              <a
                href="https://asteria-freelance.vercel.app"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-900 text-teal-200 border border-teal-600/60 hover:text-white hover:bg-teal-800 text-xs font-semibold font-display uppercase tracking-wider transition-all"
              >
                Visit asteria-freelance.vercel.app <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Management OS Feature Preview */}
      <section id="platform" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#041b1e] border-y border-teal-900/60">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-teal-400 bg-teal-900/40 px-3 py-1 rounded-full border border-teal-500/30">
              Internal Operating System
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-white">
              The Club Management Engine
            </h2>
            <p className="font-body text-sm sm:text-base text-teal-100/80">
              A bespoke platform built to eliminate administrative friction and manage talent, events, and sprints at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-dark p-6 rounded-3xl border border-teal-500/20 space-y-3">
              <div className="p-3 rounded-xl bg-teal-900/80 text-teal-300 w-fit">
                <KanbanSquare className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Agile Kanban Task Board
              </h4>
              <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                4-column sprint boards with Realtime Supabase updates, priorities, assignees, and threaded task feedback.
              </p>
            </div>

            <div className="glass-dark p-6 rounded-3xl border border-teal-500/20 space-y-3">
              <div className="p-3 rounded-xl bg-teal-900/80 text-teal-300 w-fit">
                <QrCode className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Dynamic QR Attendance Hub
              </h4>
              <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                Live QR generator for presentation screens, camera scanner simulation, numeric passcodes, and absence justification audits.
              </p>
            </div>

            <div className="glass-dark p-6 rounded-3xl border border-teal-500/20 space-y-3">
              <div className="p-3 rounded-xl bg-teal-900/80 text-teal-300 w-fit">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Interactive Org Hierarchy
              </h4>
              <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                Tier 1 Executive Board to Tier 2 Department Leads with live member rosters and dedicated track workspaces.
              </p>
            </div>

            <div className="glass-dark p-6 rounded-3xl border border-teal-500/20 space-y-3">
              <div className="p-3 rounded-xl bg-teal-900/80 text-teal-300 w-fit">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Shared Calendar & RSVPs
              </h4>
              <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                Event scheduling with conflict/overlap warning, RSVP tracking, and room booking coordination.
              </p>
            </div>

            <div className="glass-dark p-6 rounded-3xl border border-teal-500/20 space-y-3">
              <div className="p-3 rounded-xl bg-teal-900/80 text-teal-300 w-fit">
                <Megaphone className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base uppercase tracking-wider text-white">
                Scoped Announcements
              </h4>
              <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                Club-wide and track-specific bulletins with automatic Discord webhook integration and rich embed previews.
              </p>
            </div>

            <div className="glass-dark p-6 rounded-3xl border border-teal-500/20 space-y-3">
              <div className="p-3 rounded-xl bg-teal-900/80 text-teal-300 w-fit">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="font-display font-bold text-base uppercase tracking-wider text-white">
                1-Click Auto-Onboarding
              </h4>
              <p className="font-body text-xs text-teal-100/80 leading-relaxed">
                Review applicant dossiers and instantly provision live Supabase Auth accounts with automatic department allocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="font-mono text-xs uppercase font-bold tracking-widest text-teal-400 bg-teal-900/40 px-3 py-1 rounded-full border border-teal-500/30">
              Questions & Answers
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl uppercase tracking-wider text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="glass-dark rounded-2xl border border-teal-500/20 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 hover:text-teal-300 transition-colors"
                  >
                    <span className="font-display font-bold text-sm sm:text-base uppercase tracking-wider">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-teal-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 font-body text-xs sm:text-sm text-teal-100/80 leading-relaxed border-t border-teal-900/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* High Impact Bottom CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-3xl gradient-mesh-hero p-8 sm:p-14 border border-teal-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <AmbientCanvas particleCount={30} className="absolute inset-0 pointer-events-none opacity-40" />

          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h2 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-white">
              READY TO BUILD & FREELANCE?
            </h2>
            <p className="font-body text-sm sm:text-base text-teal-100/90 leading-relaxed">
              Join Asteria Club Esprit for the 2026 academic cycle. Elevate your portfolio, learn from student seniors, and unlock paid client work.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/apply">
                <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button">
                  Submit Your Application ★
                </button>
              </Link>
              <Link href="/login">
                <button className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-semibold font-display uppercase tracking-wider bg-surface-dark2 hover:bg-teal-900 text-white border border-teal-700/80 transition-all">
                  Existing Member Login
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#031417] border-t border-teal-950 py-12 px-4 sm:px-8 text-xs font-body text-teal-200/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <AsteriaLogo variant="dark" size="sm" href="/" />
            <span className="font-mono text-[11px] text-teal-400/80">
              • ESPRIT University Club
            </span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px]">
            <Link href="/apply" className="hover:text-teal-300 transition-colors">
              Recruitment
            </Link>
            <Link href="/login" className="hover:text-teal-300 transition-colors">
              Platform Login
            </Link>
            <a
              href="https://asteria-freelance.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-teal-300 transition-colors inline-flex items-center gap-1"
            >
              Asteria Freelance <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="font-mono text-[10px] text-teal-500/70">
            © 2026 Asteria Club Esprit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
