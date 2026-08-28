"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
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
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ApplyPage() {
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
      name: "Web Development",
      badge: "Engineering",
      icon: Code2,
      desc: "React, Next.js 15, TypeScript, PostgreSQL, REST APIs & Freelance systems.",
    },
    {
      id: "Graphic Design",
      name: "Graphic Design",
      badge: "Visual Branding",
      icon: Palette,
      desc: "Figma design systems, brand guidelines, vector posters & UI/UX aesthetics.",
    },
    {
      id: "Video Editing",
      name: "Video Editing",
      badge: "Cinematic Media",
      icon: Video,
      desc: "Premiere Pro, After Effects, cinematic rushes, sound design & hackathon reels.",
    },
    {
      id: "Photography",
      name: "Photography",
      badge: "Studio & Events",
      icon: Camera,
      desc: "Studio lighting, event photojournalism, color grading in Lightroom & Photoshop.",
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.motivation) {
      setError("Please complete all required fields (Name, Email, Motivation).");
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
          colors: ["#60C8D4", "#11606E", "#FFFFFF"],
        });
      } else {
        setError(data.error || "Failed to submit application.");
      }
    } catch {
      setError("Network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#062327] text-white flex flex-col font-body selection:bg-teal-400 selection:text-ink relative overflow-hidden">
      <AmbientCanvas particleCount={40} className="absolute inset-0 pointer-events-none opacity-50 z-0" />

      {/* Floating Header */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-5xl w-full mx-auto">
        <div className="glass-nav rounded-2xl px-5 py-3 flex items-center justify-between shadow-2xl">
          <AsteriaLogo variant="dark" size="md" href="/" />

          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="px-3.5 py-1.5 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-teal-200 hover:text-white flex items-center gap-1.5 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
              </button>
            </Link>
            <Link href="/login">
              <button className="px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-teal-900/80 hover:bg-teal-800 text-teal-200 border border-teal-700/60 hover:text-white transition-all">
                Member Login
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 relative z-10 flex flex-col justify-center animate-vague-in">
        {submitted ? (
          <div className="glass-dark p-8 sm:p-14 rounded-3xl border border-teal-500/40 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-teal-900/80 border-2 border-ast-light text-ast-light flex items-center justify-center mx-auto shadow-inner glow-teal">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-3">
              <span className="font-mono text-xs uppercase font-bold tracking-widest text-teal-300 bg-teal-900/60 px-3.5 py-1 rounded-full border border-teal-500/30">
                Application Received · 2026 Cycle
              </span>
              <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wider text-white">
                WELCOME, {form.name.toUpperCase()}!
              </h2>
              <p className="font-body text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-lg mx-auto">
                Your application for the <strong>{selectedTrack}</strong> track has been securely recorded in our database. The Executive Board and Department Heads review submissions weekly.
              </p>
            </div>

            <div className="pt-6 border-t border-teal-900/80 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/">
                <button className="px-6 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button">
                  Return to Homepage
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
                className="px-6 py-3 rounded-xl text-xs font-semibold font-display uppercase tracking-wider bg-teal-900/80 text-teal-200 border border-teal-700/60 hover:text-white transition-all"
              >
                Submit Another Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Title Section */}
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-900/60 border border-teal-500/40 text-teal-300 text-xs font-semibold uppercase tracking-wider font-mono">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                2026 Academic Season Application
              </div>
              <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-wider text-white">
                Join Asteria Club Esprit
              </h1>
              <p className="font-body text-xs sm:text-sm text-teal-100/80">
                Choose your track, showcase your motivation, and step into the premier student talent pipeline.
              </p>
            </div>

            {/* Application Card */}
            <div className="glass-dark p-6 sm:p-10 rounded-3xl border border-teal-500/30 shadow-2xl space-y-8">
              {/* Step 1: Select Track */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                  <span className="w-5 h-5 rounded-full bg-teal-900 flex items-center justify-center text-[10px] border border-teal-500">
                    1
                  </span>
                  Select Technical Track *
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {tracks.map((track) => {
                    const Icon = track.icon;
                    const isSelected = selectedTrack === track.id;
                    return (
                      <div
                        key={track.id}
                        onClick={() => setSelectedTrack(track.id)}
                        className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                          isSelected
                            ? "bg-teal-900/90 border-ast-light shadow-md ring-1 ring-ast-light"
                            : "bg-[#052024]/80 border-teal-900/80 hover:border-teal-600/60"
                        }`}
                      >
                        <div
                          className={`p-2.5 rounded-xl transition-colors ${
                            isSelected
                              ? "bg-ast-light text-ink"
                              : "bg-teal-950 text-teal-300 border border-teal-800"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white">
                              {track.name}
                            </h4>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-ast-light" />
                            )}
                          </div>
                          <p className="text-[11px] text-teal-100/70 font-body leading-snug">
                            {track.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Form Details */}
              <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-teal-900/80">
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                  <span className="w-5 h-5 rounded-full bg-teal-900 flex items-center justify-center text-[10px] border border-teal-500">
                    2
                  </span>
                  Applicant Dossier *
                </div>

                {error && (
                  <div className="p-4 bg-red-950/80 border border-red-500/50 text-red-200 rounded-xl text-xs font-body flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rayen Ayadi"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                      className="w-full bg-[#052024] border border-teal-800 rounded-xl px-4 py-2.5 text-sm font-body text-white placeholder:text-teal-600 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                      Student / Contact Email *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rayen.ayadi@esprit.tn"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="w-full bg-[#052024] border border-teal-800 rounded-xl px-4 py-2.5 text-sm font-body text-white placeholder:text-teal-600 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+216 28 111 222"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full bg-[#052024] border border-teal-800 rounded-xl px-4 py-2.5 text-sm font-body text-white placeholder:text-teal-600 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                      Portfolio / GitHub / Behance Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/yourhandle"
                      value={form.portfolioLink}
                      onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                      className="w-full bg-[#052024] border border-teal-800 rounded-xl px-4 py-2.5 text-sm font-body text-white placeholder:text-teal-600 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                    Motivation & What You Want to Build *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your background, tools you use, why you want to join Asteria Club Esprit, and what you aim to achieve..."
                    value={form.motivation}
                    onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                    required
                    className="w-full bg-[#052024] border border-teal-800 rounded-xl p-4 text-sm font-body text-white placeholder:text-teal-600 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light resize-y"
                  />
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-body text-teal-300/80">
                    <ShieldCheck className="w-4 h-4 text-ast-light" />
                    <span>Your application is stored in our live database.</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? "Submitting..." : "Submit Application ★"}
                    <Send className="w-3.5 h-3.5" />
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
