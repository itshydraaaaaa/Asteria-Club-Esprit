"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Award,
  User,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("president@asteria.tn");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    {
      title: "President (Board)",
      email: "president@asteria.tn",
      role: "Board Executive",
      icon: Shield,
    },
    {
      title: "HoD Web Development",
      email: "hod.web@asteria.tn",
      role: "Department Lead",
      icon: Award,
    },
    {
      title: "Karim (Active Member)",
      email: "karim.chaabane@asteria.tn",
      role: "Web Dev Member",
      icon: User,
    },
    {
      title: "Mehdi (Applicant)",
      email: "mehdi.applicant@esprit.tn",
      role: "Applicant Portal",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-[#062327] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-body relative overflow-hidden selection:bg-teal-400 selection:text-ink">
      <AmbientCanvas particleCount={45} className="absolute inset-0 pointer-events-none opacity-50 z-0" />

      {/* Floating Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <button className="px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-teal-200 hover:text-white glass-nav flex items-center gap-2 transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
          </button>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10 animate-vague-in">
        <AsteriaLogo variant="dark" size="lg" href="/" className="justify-center" />
        <p className="font-body text-xs text-teal-200/80 font-medium">
          Asteria Club Esprit Operating System · Management Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-vague-in">
        <div className="glass-dark p-8 rounded-3xl border border-teal-500/30 shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-body flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@asteria.tn"
                  className="w-full bg-[#052024] border border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-white placeholder:text-teal-700 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#052024] border border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-white placeholder:text-teal-700 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? "Authenticating..." : "Sign In to Platform"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Evaluation Accounts */}
          <div className="pt-4 border-t border-teal-900/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-teal-400 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-ast-light" />
              1-Click Demo Evaluation Personas:
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword("password123");
                      fetch("/api/auth/switch-role", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: acc.email }),
                      }).then(() => {
                        window.location.href = "/dashboard";
                      });
                    }}
                    className="p-2.5 rounded-xl border border-teal-900/80 bg-[#052024]/80 hover:bg-teal-900/80 hover:border-ast-light/60 text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="w-3 h-3 text-ast-light" />
                      <span className="font-bold text-[11px] text-white truncate group-hover:text-ast-light">
                        {acc.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-teal-200/60 block truncate mt-0.5 font-body">
                      {acc.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-teal-900/80 flex items-center justify-between text-xs font-body text-teal-200/70">
            <Link href="/apply" className="text-ast-light font-semibold hover:underline">
              Join Asteria Form →
            </Link>
            <Link href="/signup" className="hover:text-white transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
