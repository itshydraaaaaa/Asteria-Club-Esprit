"use client";

import React, { useState } from "react";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  Code2,
  Palette,
  Video,
  Camera,
  ArrowRight,
  Send,
  Shield,
  Layers,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function ApplyPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.motivation) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#11606E", "#60C8D4", "#0A3A40"],
        });
      } else {
        setError(data.error || "Failed to submit application.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    {
      id: "Web Development",
      name: "Web Development",
      desc: "React, Next.js, TypeScript, Backend APIs & Freelance Web Engineering",
      icon: Code2,
    },
    {
      id: "Graphic Design",
      name: "Graphic Design",
      desc: "Visual branding, Figma design systems, posters & social media assets",
      icon: Palette,
    },
    {
      id: "Video Editing",
      name: "Video Editing",
      desc: "Premiere, After Effects, cinematic reels, hackathon aftermovies",
      icon: Video,
    },
    {
      id: "Photography",
      name: "Photography",
      desc: "Studio lighting, event photojournalism & color grading",
      icon: Camera,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col font-body">
      {/* Public Brand Navbar */}
      <header className="bg-surface/90 backdrop-blur-md border-b border-line px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <AsteriaLogo variant="light" size="md" href="/" />
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Member Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-8 animate-vague-in my-auto">
        {submitted ? (
          <Card className="p-8 sm:p-12 text-center space-y-6 bg-surface max-w-2xl mx-auto shadow-xl border-ast-light/40">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="font-mono font-bold text-xs uppercase tracking-widest text-ast-primary bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Application Received
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-wider text-ink">
                Welcome to the Talent Pipeline!
              </h2>
              <p className="font-body text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
                Thank you for applying to Asteria Club Esprit, <strong>{form.name}</strong>! Your application for the <strong>{form.departmentPreference}</strong> track is now queued for review by our Executive Board.
              </p>
            </div>

            <div className="pt-4 border-t border-line/60 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/dashboard">
                <Button variant="primary">
                  Go to Dashboard / Demo Console
                </Button>
              </Link>
              <Button
                variant="secondary"
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
              >
                Submit Another Application
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Recruitment Hero Banner with 3D Canvas */}
            <div className="rounded-3xl gradient-mesh-hero text-white p-8 sm:p-12 shadow-xl border border-teal-700/50 relative overflow-hidden">
              <AmbientCanvas particleCount={35} className="absolute inset-0 pointer-events-none opacity-50" />

              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-ast-light/20 text-ast-light border border-ast-light/30 text-xs font-semibold uppercase tracking-wider font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  Recruitment Season 2026
                </div>
                <h1 className="font-display font-bold text-3xl sm:text-5xl uppercase tracking-wider text-white">
                  Join Asteria Club Esprit
                </h1>
                <p className="font-body text-sm sm:text-base text-teal-100/90 leading-relaxed">
                  Train with elite student creators, build production-grade web systems, master visual design, and graduate directly into paid client contracts at <strong>Asteria Freelance</strong>.
                </p>
              </div>
            </div>

            {/* Department Track Selection */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-ink">
                1. Select Your Specialization Track *
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {departments.map((dept) => {
                  const Icon = dept.icon;
                  const isSelected = form.departmentPreference === dept.id;
                  return (
                    <div
                      key={dept.id}
                      onClick={() => setForm({ ...form, departmentPreference: dept.id })}
                      className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-teal-50/90 border-ast-primary shadow-sm ring-1 ring-ast-primary"
                          : "bg-surface border-line hover:border-ast-light/60"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl transition-colors ${
                          isSelected ? "bg-ast-primary text-white" : "bg-surface-alt text-ast-primary"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-ink">
                            {dept.name}
                          </h4>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-ast-primary" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-soft font-body leading-snug">
                          {dept.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Form Card */}
            <Card className="p-6 sm:p-8 bg-surface/90 backdrop-blur-md shadow-md">
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-ink border-b border-line pb-3">
                  2. Applicant Dossier & Motivation
                </h3>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-body">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name *"
                    placeholder="e.g. Selim Ben Salem"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />

                  <Input
                    type="email"
                    label="Student / Contact Email *"
                    placeholder="e.g. selim.dev@esprit.tn"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    type="tel"
                    label="Phone Number"
                    placeholder="+216 28 111 222"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />

                  <Input
                    type="url"
                    label="Portfolio / GitHub / Behance Link"
                    placeholder="https://github.com/yourname"
                    value={form.portfolioLink}
                    onChange={(e) => setForm({ ...form, portfolioLink: e.target.value })}
                  />
                </div>

                <Textarea
                  label="Motivation & Technical Background *"
                  placeholder="Tell us about your background, why you want to join Asteria, and what projects you are eager to build..."
                  rows={4}
                  value={form.motivation}
                  onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                  required
                />

                <div className="pt-4 border-t border-line flex items-center justify-between">
                  <span className="text-xs text-ink-soft font-body">
                    * Applications are reviewed weekly by Department Heads
                  </span>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={loading}
                    rightIcon={<Send className="w-4 h-4" />}
                  >
                    Submit Application
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
