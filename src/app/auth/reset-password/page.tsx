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
} from "lucide-react";

const AmbientCanvas = dynamic(
  () => import("@/components/ui/AmbientCanvas").then((m) => m.AmbientCanvas),
  { ssr: false }
);

export default function ResetPasswordPage() {
  const { language } = useLanguage();
  const isFr = language === "fr";

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check if session is already present
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setHasSession(true);
        if (session.user?.email) {
          setEmail(session.user.email);
        }
      } else {
        setHasSession(false);
      }
    });

    // Listen to auth state changes (e.g. PASSWORD_RECOVERY event)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        if (session?.user?.email) {
          setEmail(session.user.email);
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
    const supabase = createClient();

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(
          updateError.message ||
            (isFr
              ? "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré."
              : "Failed to update password. The link may have expired.")
        );
      } else {
        setSuccess(true);
        confetti({
          particleCount: 120,
          spread: 80,
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
            ? "Activation & Réinitialisation du Compte Asteria Club"
            : "Asteria Club Account Activation & Password Reset"}
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-vague-in">
        <div className="bg-white/90 dark:bg-[#08262b]/90 backdrop-blur-xl p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-teal-900/10 dark:border-teal-500/30 shadow-2xl space-y-6">
          {success ? (
            <div className="text-center space-y-4 py-4 animate-vague-in">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-display uppercase tracking-wider text-ink dark:text-white">
                  {isFr
                    ? "Mot de Passe Défini !"
                    : "Password Successfully Set!"}
                </h3>
                <p className="text-xs text-ink-soft dark:text-teal-200/90 leading-relaxed">
                  {isFr
                    ? "Votre mot de passe a été configuré avec succès. Vous pouvez maintenant vous connecter à votre espace Asteria Club avec votre adresse Gmail."
                    : "Your password has been successfully configured. You can now log into your Asteria Club portal with your Gmail address."}
                </p>
              </div>

              <Link href="/login" className="block pt-2">
                <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0A3A40] to-[#11606E] hover:from-[#0B4A55] hover:to-[#17788A] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition">
                  <span>{isFr ? "Accéder au Portail" : "Go to Portal"}</span>
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
                    ? "Définir votre Mot de Passe"
                    : "Set Your New Password"}
                </h4>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-500/50 text-red-700 dark:text-red-200 text-xs font-body flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {hasSession && email && (
                <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 text-xs">
                  <span className="text-ink-soft dark:text-teal-300/80 block text-[11px]">
                    {isFr ? "Compte associé (Gmail) :" : "Connected account (Gmail):"}
                  </span>
                  <span className="font-mono font-bold text-ink dark:text-white">
                    {email}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                  {isFr ? "Nouveau Mot de Passe" : "New Password"}
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

              <div>
                <label className="text-xs font-display uppercase tracking-wider font-bold text-ink dark:text-teal-200 block mb-1.5">
                  {isFr
                    ? "Confirmer le Mot de Passe"
                    : "Confirm New Password"}
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
                        ? "Enregistrer le Mot de Passe"
                        : "Save New Password"}
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
