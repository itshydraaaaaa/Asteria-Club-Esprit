"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { CameraQrScanner } from "@/components/attendance/CameraQrScanner";
import confetti from "canvas-confetti";
import {
  QrCode,
  CheckCircle2,
  Clock,
  AlertCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Lock,
  RefreshCw,
  LogOut,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

function CheckInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const eventParam = searchParams.get("event") || searchParams.get("eventId");
  const tokenParam = searchParams.get("token");
  const tsParam = searchParams.get("ts");
  const codeParam = searchParams.get("code");

  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    status?: "PRESENT" | "LATE";
    message: string;
    event?: any;
    checkedInAt?: string;
  } | null>(null);

  const [activeMode, setActiveMode] = useState<"camera" | "code">("camera");
  const [manualCodeInput, setManualCodeInput] = useState(codeParam || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch current authenticated session
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user || null);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Perform check-in request
  const executeCheckIn = async (payload: {
    eventId?: string;
    token?: string;
    ts?: string;
    code?: string;
  }) => {
    setSubmitting(true);
    setErrorMsg(null);
    setResult(null);

    // Optional GPS lookup
    let userLat: number | null = null;
    let userLng: number | null = null;

    if ("geolocation" in navigator) {
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: true,
          });
        });
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
      } catch {
        // Geolocation optional or denied
      }
    }

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: payload.eventId,
          token: payload.token,
          ts: payload.ts,
          code: payload.code,
          userLat,
          userLng,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Échec de validation de l'émargement.");
      }

      setResult({
        success: true,
        status: data.status,
        message: data.message,
        event: data.event,
        checkedInAt: data.record?.checkedInAt || new Date().toISOString(),
      });

      // Confetti burst on successful check-in
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#06b6d4", "#10b981", "#ec4899"],
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Une erreur est survenue lors du pointage.");
      setResult({
        success: false,
        message: err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Auto-submit if token + event URL parameters are present and user is logged in
  useEffect(() => {
    if (!authLoading && currentUser && eventParam && tokenParam && !result && !submitting) {
      executeCheckIn({
        eventId: eventParam,
        token: tokenParam,
        ts: tsParam || undefined,
      });
    }
  }, [authLoading, currentUser, eventParam, tokenParam]);

  // Handle scanned in-app QR payload
  const handleInAppScan = (decodedText: string) => {
    try {
      // If it's a full URL e.g. https://.../attendance/check-in?event=...&token=...
      if (decodedText.startsWith("http")) {
        const url = new URL(decodedText);
        const scannedEvent = url.searchParams.get("event") || url.searchParams.get("eventId");
        const scannedToken = url.searchParams.get("token");
        const scannedTs = url.searchParams.get("ts");
        const scannedCode = url.searchParams.get("code");

        if (scannedEvent && scannedToken) {
          executeCheckIn({
            eventId: scannedEvent,
            token: scannedToken,
            ts: scannedTs || undefined,
          });
          return;
        }
        if (scannedCode) {
          executeCheckIn({ code: scannedCode });
          return;
        }
      }

      // If it's plain text passcode
      if (decodedText.length > 3) {
        executeCheckIn({ code: decodedText.trim() });
      }
    } catch {
      executeCheckIn({ code: decodedText.trim() });
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-mono text-white/60">Vérification de la session Asteria...</p>
      </div>
    );
  }

  // Not logged in state
  if (!currentUser) {
    const returnUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/attendance/check-in";
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <Card className="border border-white/10 bg-surface/90 backdrop-blur-xl shadow-2xl p-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-display font-bold text-white tracking-wide">
              Connexion Requise
            </h1>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Pour des raisons de sécurité et d'authentification nominative, vous devez être connecté à votre compte Asteria Club pour valider votre émargement.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg shadow-indigo-500/25"
              onClick={() => router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Se connecter pour émarger
            </Button>
            <Button
              variant="outline"
              className="w-full border-white/10 text-white/80 hover:bg-white/5"
              onClick={() => router.push("/signup")}
            >
              Créer un compte participant
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 px-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          Émargement Sécurisé & Authentifié
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
          Pointage de Présence
        </h1>
        <p className="text-xs text-white/60 font-sans">
          Connecté en tant que <span className="text-white font-medium">{currentUser.name}</span> ({currentUser.email})
        </p>
      </div>

      {/* Result Card */}
      {result && (
        <Card className={`border backdrop-blur-xl p-6 text-center space-y-5 transition-all animate-in fade-in-50 zoom-in-95 ${
          result.success
            ? result.status === "LATE"
              ? "bg-amber-950/20 border-amber-500/30"
              : "bg-emerald-950/20 border-emerald-500/30"
            : "bg-red-950/20 border-red-500/30"
        }`}>
          <div className="flex justify-center">
            {result.success ? (
              result.status === "LATE" ? (
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Clock className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )
            ) : (
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20">
                <AlertCircle className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge variant={result.success ? (result.status === "LATE" ? "warning" : "success") : "danger"}>
                {result.success ? (result.status === "LATE" ? "ÉMARGÉ EN RETARD" : "PRÉSENCE VALIDÉE") : "ÉCHEC DU POINTAGE"}
              </Badge>
            </div>
            <h2 className="text-lg font-semibold text-white">
              {result.event?.title || (result.success ? "Événement Asteria Club" : "Erreur de validation")}
            </h2>
            <p className="text-xs text-white/70 max-w-md mx-auto leading-relaxed">
              {result.message}
            </p>
          </div>

          {result.success && result.checkedInAt && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60 space-y-1 font-mono">
              <div>Horodatage officiel : {formatDateTime(result.checkedInAt)}</div>
              <div>Méthode : QR Code Dynamique Certifié</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white"
              onClick={() => router.push("/attendance")}
            >
              Historique d'émargement
            </Button>
            <Button
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => router.push("/calendar")}
            >
              Calendrier du club <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Manual / In-App Scanner View (if not already succeeded or if retrying) */}
      {(!result || !result.success) && (
        <Card className="border border-white/10 bg-surface/80 backdrop-blur-xl p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setActiveMode("camera")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeMode === "camera"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scanner avec la caméra
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("code")}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeMode === "code"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Entrer un code manuel
            </button>
          </div>

          {activeMode === "camera" ? (
            <div className="space-y-4">
              <CameraQrScanner onScan={handleInAppScan} active={!submitting} />
              {submitting && (
                <div className="flex items-center justify-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Validation cryptographique du jeton en cours...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-mono text-white/60">
                  Code de secours affiché par l'hôte (ex: AST-4821)
                </label>
                <Input
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
                  placeholder="AST-XXXX"
                  className="bg-black/40 border-white/10 text-center font-mono text-lg tracking-widest uppercase text-white"
                />
              </div>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={submitting || !manualCodeInput.trim()}
                onClick={() => executeCheckIn({ code: manualCodeInput.trim() })}
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Validation en cours...
                  </>
                ) : (
                  <>
                    Valider mon émargement
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
