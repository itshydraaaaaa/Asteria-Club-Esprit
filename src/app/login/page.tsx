"use client";

import React, { useState } from "react";
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
  const { language, t } = useLanguage();
  const isFr = language === "fr";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError(data.error || (isFr ? "Email ou mot de passe incorrect." : "Invalid email or password."));
      }
    } catch {
      setError(isFr ? "Erreur de connexion. Veuillez réessayer." : "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-body relative overflow-hidden selection:bg-teal-400 selection:text-ink transition-colors duration-300">
      <AmbientCanvas particleCount={45} className="absolute inset-0 pointer-events-none opacity-50 z-0" />

      {/* Floating Controls */}
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
            ? "Système d'Exploitation Asteria Club Esprit · Console de Gestion"
            : "Asteria Club Esprit Operating System · Management Console"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-vague-in">
        <div className="bg-white/85 dark:bg-[#08262b]/85 backdrop-blur-xl p-8 rounded-3xl border border-teal-900/10 dark:border-teal-500/30 shadow-2xl space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 text-xs font-body flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                {t("auth.login.email", "Email Address")}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-ast-primary dark:text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@asteria.tn"
                  className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                {t("auth.login.password", "Password")}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ast-primary dark:text-teal-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface dark:bg-[#052024] border border-line dark:border-teal-800 rounded-xl pl-10 pr-4 py-2.5 text-sm font-body text-ink dark:text-white placeholder:text-ink-faint dark:placeholder:text-teal-700 focus:outline-none focus:border-ast-primary dark:focus:border-ast-light focus:ring-1 focus:ring-ast-primary shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider bg-ast-light text-ink hover:bg-teal-300 transition-all glow-button flex items-center justify-center gap-2 disabled:opacity-50 mt-2 shadow-md"
            >
              {loading
                ? (isFr ? "Authentification..." : "Authenticating...")
                : (isFr ? "Se Connecter à la Plateforme" : "Sign In to Platform")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-line dark:border-teal-900/80 flex items-center justify-between text-xs font-body text-ink-soft dark:text-teal-200/70">
            <span>{isFr ? "Pas encore membre ?" : "Not a member yet?"}</span>
            <Link href="/apply" className="text-ast-primary dark:text-teal-300 font-semibold hover:underline flex items-center gap-1">
              {isFr ? "Postuler au recrutement →" : "Apply for Membership →"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
