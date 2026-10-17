"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AsteriaLogo } from "@/components/brand/AsteriaLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import {
  Lock,
  Mail,
  KeyRound,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const AmbientCanvas = dynamic(
  () => import("@/components/ui/AmbientCanvas").then((m) => m.AmbientCanvas),
  { ssr: false }
);

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initialEmail, setInitialEmail] = useState("");
  const [gmail, setGmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();

    // Check if session is already present
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAccessToken(session.access_token);
        const userEmail = session.user?.email || "";
        setInitialEmail(userEmail);
        if (userEmail.toLowerCase().endsWith("@gmail.com")) {
          setGmail(userEmail);
        }
      }
    });

    // Listen to auth state changes (e.g. recovery / invite redirect)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setAccessToken(session.access_token);
        const userEmail = session.user?.email || "";
        setInitialEmail(userEmail);
        if (userEmail.toLowerCase().endsWith("@gmail.com") && !gmail) {
          setGmail(userEmail);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanGmail = gmail.toLowerCase().trim();
    if (!cleanGmail.endsWith("@gmail.com")) {
      setError(
        isFr
          ? "Une adresse personnelle Gmail (@gmail.com) est requise comme email principal. Les adresses institutionnelles (@esprit.tn) bloquent les notifications."
          : "A personal Gmail address (@gmail.com) is required. Institutional mailboxes (@esprit.tn) block notifications."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        isFr
          ? "Le mot de passe doit comporter au moins 6 caractères."
          : "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        isFr
          ? "Les mots de passe ne correspondent pas."
          : "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email: cleanGmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (isFr ? "Échec de l'activation du compte." : "Account activation failed."));
      } else {
        setSavedEmail(cleanGmail);
        setSuccess(true);
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.6 },
          colors: ["#11606E", "#60C8D4", "#F59E0B"],
        });
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (isFr
            ? "Une erreur inattendue est survenue."
            : "An unexpected error occurred.")
      );
    } finally {
      setLoading(false);
    }
  };

  const isEspritCurrent =
    initialEmail &&
    (initialEmail.toLowerCase().includes("esprit") ||
      !initialEmail.toLowerCase().endsWith("@gmail.com"));

  return (
    <div className="min-h-screen bg-[#F4F8F9] dark:bg-[#062327] text-ink dark:text-white flex flex-col justify-center py-16 sm:py-12 px-4 sm:px-6 lg:px-8 font-body relative overflow-hidden selection:bg-teal-400 selection:text-ink transition-colors duration-300">
      <AmbientCanvas
        particleCount={40}
        className="absolute inset-0 pointer-events-none opacity-50 z-0"
      />

      {/* Header Controls */}
      <div className="absolute top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-20 flex items-center justify-between">
        <Link href="/login">
          <button className="px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold font-display uppercase tracking-wider text-ink-soft dark:text-teal-200 hover:text-ink dark:hover:text-white glass-nav flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />{" "}
            <span>{isFr ? "Retour Connexion" : "Back to Login"}</span>
          </button>
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle variant="pill" />
          <ThemeToggle />
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10 animate-vague-in mt-6 sm:mt-0">
        <AsteriaLogo
          variant="auto"
          size="md"
          href="/"
          className="justify-center"
        />
        <p className="font-body text-xs text-ink-soft dark:text-teal-200/80 font-medium">
          {isFr
            ? "Activation du Compte & Configuration des Accès"
            : "Account Activation & Credential Setup"}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-vague-in">
        <div className="bg-white/90 dark:bg-[#08262b]/90 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-teal-900/10 dark:border-teal-500/30 shadow-2xl space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-4 animate-vague-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold font-display uppercase tracking-wider text-ink dark:text-white">
                  {isFr ? "Compte Activé avec Succès !" : "Account Successfully Activated!"}
                </h3>
                <p className="text-xs text-ink-soft dark:text-teal-200/90 leading-relaxed">
                  {isFr
                    ? "Votre mot de passe et votre adresse Gmail personnelle ont été enregistrés. Vous pouvez désormais vous connecter directement au portail."
                    : "Your password and personal Gmail have been securely saved. You can now log into your member portal."}
                </p>
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs font-mono text-center mt-2">
                  <span className="text-ink-soft dark:text-teal-300/80 text-[11px] block">
                    {isFr ? "Email de connexion principal :" : "Primary Login Email:"}
                  </span>
                  <span className="font-bold text-ink dark:text-white text-sm">
                    {savedEmail}
                  </span>
                </div>
              </div>

              <Link href="/login" className="block pt-2">
                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0A3A40] to-[#11606E] hover:from-[#0B4A55] hover:to-[#17788A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition">
                  <span>{isFr ? "Se Connecter au Portail" : "Log in to Portal"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-teal-900/10 dark:border-teal-500/20">
                <KeyRound className="w-4 h-4 text-ast-primary dark:text-teal-300" />
                <h4 className="text-xs font-display font-bold uppercase tracking-wider text-ink dark:text-teal-200">
                  {isFr
                    ? "Configurer vos Identifiants"
                    : "Configure Your Access Details"}
                </h4>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 text-xs font-body flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Informational Banner if candidate registered with esprit */}
              {isEspritCurrent && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700/60 space-y-1.5 text-xs font-body">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>
                      {isFr
                        ? "Adresse ESPRIT détectée"
                        : "ESPRIT Email Detected"}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    {isFr
                      ? `Votre compte a été initié avec "${initialEmail}". Les boîtes ESPRIT bloquant les emails automatiques, veuillez renseigner ci-dessous votre adresse Gmail personnelle. Votre adresse ESPRIT sera conservée en archive étudiante.`
                      : `Your account was initiated with "${initialEmail}". Because ESPRIT mailboxes block automated notifications, please enter your personal Gmail address below.`}
                  </p>
                </div>
              )}

              {/* 1. Gmail Input (Required) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200">
                    {isFr ? "Votre Adresse Gmail Personnelle *" : "Your Personal Gmail Address *"}
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/80 text-ast-primary dark:text-teal-300 border border-teal-200 dark:border-teal-700 font-semibold">
                    @gmail.com
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input
                    type="email"
                    required
                    value={gmail}
                    onChange={(e) => setGmail(e.target.value)}
                    placeholder="votre.adresse@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-line dark:border-teal-700/50 bg-white dark:bg-[#072d33] text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-ast-primary font-mono"
                  />
                </div>
                <p className="text-[10px] text-ink-faint dark:text-teal-300/70 mt-1">
                  {isFr
                    ? "Toutes les convocations, notifications et accès de membre vous parviendront sur ce Gmail."
                    : "All interview invitations, portal notifications, and alerts will be delivered here."}
                </p>
              </div>

              {/* 2. New Password */}
              <div>
                <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                  {isFr ? "Nouveau Mot de Passe *" : "New Password *"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-line dark:border-teal-700/50 bg-white dark:bg-[#072d33] text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-ast-primary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink dark:hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Confirm Password */}
              <div>
                <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                  {isFr
                    ? "Confirmer le Mot de Passe *"
                    : "Confirm New Password *"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-line dark:border-teal-700/50 bg-white dark:bg-[#072d33] text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-ast-primary font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0A3A40] to-[#11606E] hover:from-[#0B4A55] hover:to-[#17788A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {isFr
                        ? "Activer mon Compte & Enregistrer"
                        : "Activate Account & Save"}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
