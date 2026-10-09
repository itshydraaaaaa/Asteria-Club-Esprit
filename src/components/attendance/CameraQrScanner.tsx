"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { Camera, CameraOff, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CameraQrScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  active?: boolean;
}

export function CameraQrScanner({ onScan, onClose, active = true }: CameraQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [hasScanned, setHasScanned] = useState<boolean>(false);

  const stopCamera = useCallback(() => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || hasScanned) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        setHasScanned(true);
        if ("vibrate" in navigator) {
          try {
            navigator.vibrate(100);
          } catch {
            // ignore
          }
        }
        stopCamera();
        onScan(code.data);
        return;
      }
    }

    animFrameId.current = requestAnimationFrame(scanFrame);
  }, [hasScanned, onScan, stopCamera]);

  const startCamera = useCallback(async () => {
    setHasCameraError(null);
    setHasScanned(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("L'accès à la caméra n'est pas pris en charge par votre navigateur.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setIsCameraActive(true);
        animFrameId.current = requestAnimationFrame(scanFrame);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let message = "Impossible d'accéder à la caméra.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "Aucune caméra détectée sur cet appareil.";
      }
      setHasCameraError(message);
      setIsCameraActive(false);
    }
  }, [scanFrame]);

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [active, startCamera, stopCamera]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black/80 border border-white/10 shadow-2xl flex items-center justify-center">
        {hasCameraError ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-xs text-white/80 font-sans leading-relaxed">{hasCameraError}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="border-white/10 text-white hover:bg-white/5"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Réessayer
            </Button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning Target Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-indigo-400/60 rounded-2xl relative animate-pulse shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                {/* Corner markers */}
                <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />

                {/* Sweeping laser line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce" />
              </div>
            </div>

            <div className="absolute bottom-3 inset-x-0 text-center pointer-events-none">
              <span className="inline-block px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/80 border border-white/10">
                Pointez la caméra vers le QR code projeté
              </span>
            </div>
          </>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/60 hover:text-white">
            Fermer le scanner
          </Button>
        )}
        {hasCameraError && (
          <Button variant="outline" size="sm" onClick={startCamera}>
            <Camera className="w-4 h-4 mr-1.5" /> Activer la caméra
          </Button>
        )}
      </div>
    </div>
  );
}
