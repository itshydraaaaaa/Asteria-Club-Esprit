"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Maximize2,
  Minimize2,
  Clock,
  Users,
  ShieldCheck,
  Pause,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface RotatingQrProjectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onStatusChange?: (newStatus: "OPEN" | "PAUSED" | "CLOSED") => void;
}

export function RotatingQrProjectorModal({
  isOpen,
  onClose,
  event,
  onStatusChange,
}: RotatingQrProjectorModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [tokenData, setTokenData] = useState<{
    token: string;
    qrPayloadUrl: string;
    checkInCode: string;
    status: string;
    message?: string;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch rotating QR from server
  const fetchQr = async () => {
    if (!event?.id) return;
    try {
      const res = await fetch(`/api/events/${event.id}/qr`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de charger le QR code.");
      }

      setTokenData(data);
      setError(null);

      if (data.status === "OPEN" && data.qrPayloadUrl) {
        const url = await QRCode.toDataURL(data.qrPayloadUrl, {
          width: 500,
          margin: 2,
          color: {
            dark: "#050B14",
            light: "#FFFFFF",
          },
        });
        setQrDataUrl(url);
        setSecondsRemaining(data.expiresInSeconds || 30);
      } else {
        setQrDataUrl("");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de chargement du QR code.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && event?.id) {
      setLoading(true);
      fetchQr();

      // Countdown timer every second
      const interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            fetchQr();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = interval;

      return () => {
        clearInterval(interval);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen, event?.id]);

  // Toggle browser fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleStatusUpdate = async (newStatus: "OPEN" | "PAUSED" | "CLOSED") => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/events/${event.id}/check-in-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (onStatusChange) onStatusChange(newStatus);
        fetchQr();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const currentStatus = tokenData?.status || event.checkInStatus || "SCHEDULED";
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 30) * 100));

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#050B14] flex flex-col justify-between p-6 sm:p-10 text-white overflow-y-auto"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-display font-bold text-white tracking-wide">
                {event.title}
              </h2>
              <Badge
                variant={
                  currentStatus === "OPEN"
                    ? "success"
                    : currentStatus === "PAUSED"
                    ? "warning"
                    : "danger"
                }
              >
                {currentStatus === "OPEN"
                  ? "ÉMARGEMENT EN DIRECT"
                  : currentStatus === "PAUSED"
                  ? "EN PAUSE"
                  : currentStatus === "CLOSED"
                  ? "SESSION CLÔTURÉE"
                  : "PROGRAMMÉ"}
              </Badge>
            </div>
            <p className="text-xs text-white/60 font-mono">
              Mode Projection Grand Écran • Rotation cryptographique 30s
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="border-white/10 text-white hover:bg-white/5"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 mr-1.5" /> Quitter Plein Écran
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 mr-1.5" /> Plein Écran
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 text-sm font-mono px-3"
          >
            ✕ Quitter
          </Button>
        </div>
      </div>

      {/* Main Content: Giant QR and instructions */}
      <div className="flex-1 flex flex-col items-center justify-center py-6 text-center space-y-6">
        {loading ? (
          <div className="space-y-4">
            <RefreshCw className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-mono text-white/60">Génération du jeton sécurisé...</p>
          </div>
        ) : error ? (
          <div className="max-w-md p-6 rounded-2xl bg-red-950/30 border border-red-500/30 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Erreur d'accès QR</h3>
            <p className="text-xs text-red-300 font-sans">{error}</p>
          </div>
        ) : currentStatus !== "OPEN" ? (
          <div className="max-w-lg p-8 rounded-3xl bg-white/5 border border-white/10 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold font-display text-white">
              {currentStatus === "PAUSED"
                ? "Émargement en Pause"
                : currentStatus === "CLOSED"
                ? "Session d'Émargement Clôturée"
                : "Fenêtre d'Émargement Fermée"}
            </h3>
            <p className="text-xs text-white/70 max-w-sm mx-auto font-sans leading-relaxed">
              {tokenData?.message ||
                "Le QR code s'affiche uniquement lorsque l'émargement est ouvert."}
            </p>
            {currentStatus !== "CLOSED" && (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-lg shadow-indigo-600/30"
                onClick={() => handleStatusUpdate("OPEN")}
                disabled={isUpdatingStatus}
              >
                <Play className="w-4 h-4 mr-2" /> Ouvrir l'Émargement Maintenant
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6 animate-in zoom-in-95">
            {/* Giant Rotating QR Card */}
            <div className="relative p-6 sm:p-8 rounded-3xl bg-white shadow-[0_0_80px_rgba(99,102,241,0.25)] border-4 border-indigo-400/40">
              {qrDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Secure Rotating QR Code"
                  className="w-72 sm:w-96 aspect-square rounded-2xl"
                />
              )}

              {/* Sweeping scan animation */}
              <div className="absolute inset-0 pointer-events-none rounded-3xl overflow-hidden">
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent absolute animate-bounce" />
              </div>
            </div>

            {/* Countdown timer & progress bar */}
            <div className="w-full max-w-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-white/70">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Code anti-fraude auto-renouvelable
                </span>
                <span className="font-bold text-indigo-400">{secondsRemaining}s</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-white/50 font-sans">
                Toute capture d'écran envoyée à distance expire en 30 secondes.
              </p>
            </div>

            {/* Fallback Numeric Passcode */}
            {tokenData?.checkInCode && (
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <span className="text-xs font-mono text-white/60 uppercase">Code de secours :</span>
                <span className="text-xl font-mono font-bold tracking-widest text-indigo-400">
                  {tokenData.checkInCode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Host Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          {currentStatus === "OPEN" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate("PAUSED")}
              disabled={isUpdatingStatus}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
            >
              <Pause className="w-4 h-4 mr-1.5" /> Mettre en Pause
            </Button>
          ) : currentStatus === "PAUSED" ? (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate("OPEN")}
              disabled={isUpdatingStatus}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Play className="w-4 h-4 mr-1.5" /> Reprendre l'Émargement
            </Button>
          ) : null}

          {currentStatus !== "CLOSED" && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (
                  confirm(
                    "Êtes-vous sûr de vouloir clôturer l'émargement ? Tous les membres attendus n'ayant pas émargé seront automatiquement marqués ABSENTS."
                  )
                ) {
                  handleStatusUpdate("CLOSED");
                }
              }}
              disabled={isUpdatingStatus}
            >
              <XCircle className="w-4 h-4 mr-1.5" /> Clôturer la Session
            </Button>
          )}
        </div>

        <div className="text-xs text-white/50 font-mono">
          Appuyez sur Échap ou le bouton Quitter pour sortir du mode projection
        </div>
      </div>
    </div>
  );
}
