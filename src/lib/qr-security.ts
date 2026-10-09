import crypto from "crypto";
import { getAdminClient } from "./supabase/admin";

const ROTATION_INTERVAL_MS = 30 * 1000; // 30 seconds

/**
 * Returns the deterministic server-side secret key for an event's QR session.
 * Uses event_id combined with server-only SUPABASE_SERVICE_ROLE_KEY as master salt.
 */
export function getEventQrSecret(eventId: string): string {
  const masterKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "asteria-internal-secret-salt-2026";
  return crypto.createHmac("sha256", masterKey).update(`event_qr:${eventId}`).digest("hex");
}

/**
 * Generates a short-lived, signed QR token for the specified event.
 * Rotates every 30 seconds.
 */
export function generateRotatingQrToken(eventId: string): {
  token: string;
  timeSlice: number;
  expiresInSeconds: number;
  qrPayloadUrl: string;
} {
  const now = Date.now();
  const timeSlice = Math.floor(now / ROTATION_INTERVAL_MS);
  const secretKey = getEventQrSecret(eventId);

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(`${eventId}:${timeSlice}`)
    .digest("hex")
    .slice(0, 32);

  const token = `${timeSlice}.${signature}`;
  const expiresInSeconds = Math.ceil(((timeSlice + 1) * ROTATION_INTERVAL_MS - now) / 1000);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://asteria-club-esprit.vercel.app";
  const qrPayloadUrl = `${appUrl}/attendance/check-in?event=${eventId}&token=${token}&ts=${timeSlice}`;

  return {
    token,
    timeSlice,
    expiresInSeconds,
    qrPayloadUrl,
  };
}

/**
 * Validates a submitted QR token against the event's rotating secret.
 * Accepts the current 30s slice and the immediately preceding slice (up to 30s grace).
 */
export function verifyRotatingQrToken(
  eventId: string,
  token: string,
  submittedTimeSlice?: number
): { valid: boolean; reason?: string } {
  if (!token || typeof token !== "string") {
    return { valid: false, reason: "Token manquant ou format invalide." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { valid: false, reason: "Format de token invalide." };
  }

  const tokenTimeSlice = parseInt(parts[0], 10);
  const tokenSignature = parts[1];

  if (isNaN(tokenTimeSlice)) {
    return { valid: false, reason: "Horodatage du token invalide." };
  }

  const now = Date.now();
  const currentSlice = Math.floor(now / ROTATION_INTERVAL_MS);

  // Allow current slice or previous slice (30s grace window for camera scan + request transit)
  const isWithinWindow = tokenTimeSlice === currentSlice || tokenTimeSlice === currentSlice - 1;

  if (!isWithinWindow) {
    if (tokenTimeSlice < currentSlice - 1) {
      return {
        valid: false,
        reason: "QR code expiré. Ce code a dépassé sa durée de validité de 30 secondes. Veuillez rescanner le code affiché en direct.",
      };
    }
    return {
      valid: false,
      reason: "Horodatage de pointage futur ou désynchronisé. Veuillez vérifier l'horloge de votre appareil.",
    };
  }

  // Validate HMAC signature
  const secretKey = getEventQrSecret(eventId);
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(`${eventId}:${tokenTimeSlice}`)
    .digest("hex")
    .slice(0, 32);

  if (tokenSignature !== expectedSignature) {
    return { valid: false, reason: "Signature de sécurité QR invalide." };
  }

  return { valid: true };
}
