"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { AmbientCanvas } from "@/components/ui/AmbientCanvas";
import { Lock, Mail, User, ArrowRight, ArrowLeft, AlertCircle, Sparkles } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Signup error.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#062327] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-body relative overflow-hidden selection:bg-teal-400 selection:text-ink">
      <AmbientCanvas particleCount={40} className="absolute inset-0 pointer-events-none opacity-50 z-0" />

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
          Create Member Account · Asteria Club Esprit
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-vague-in">
        <div className="glass-dark p-8 rounded-3xl border border-teal-500/30 shadow-2xl space-y-6">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-body flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Karim Chaabane"
                  className="w-full bg-[#052024] border border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-white placeholder:text-teal-700 focus:outline-none focus:border-ast-light focus:ring-1 focus:ring-ast-light"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-display uppercase tracking-wider font-bold text-teal-200 block mb-1.5">
                Student Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="karim.chaabane@asteria.tn"
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
              {loading ? "Creating..." : "Create Account ★"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-3 border-t border-teal-900/80 flex items-center justify-between text-xs font-body text-teal-200/70">
            <Link href="/apply" className="text-ast-light font-semibold hover:underline">
              Recruitment Form →
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Already have an account? Log In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
