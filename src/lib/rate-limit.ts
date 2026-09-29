/**
 * Rate Limiting Utility
 * In-memory sliding-window rate limiter with automatic stale record eviction.
 * Supports IP detection, request caps, and dedicated failed-login lockout protection.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();
const failedLoginMap = new Map<string, { attempts: number; lockedUntil: number }>();

// Periodic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
    for (const [key, record] of failedLoginMap.entries()) {
      if (now > record.lockedUntil && record.attempts === 0) {
        failedLoginMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "anonymous-client";
}

/**
 * Check if a request exceeds rate limits.
 * @param key Unique identifier (e.g. `login:${ip}` or `apply:${ip}`)
 * @param limit Max allowed requests within windowMs
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSeconds: Math.ceil((record.resetTime - now) / 1000),
  };
}

/**
 * Check if an email or IP is temporarily locked out due to repeated invalid login attempts.
 */
export function isLoginLocked(identifier: string): { locked: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = failedLoginMap.get(identifier.toLowerCase());
  if (!entry) return { locked: false, retryAfterSeconds: 0 };

  if (now < entry.lockedUntil) {
    return {
      locked: true,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  // Lock expired
  if (now > entry.lockedUntil && entry.attempts >= 5) {
    failedLoginMap.delete(identifier.toLowerCase());
  }

  return { locked: false, retryAfterSeconds: 0 };
}

/**
 * Increment failed login attempts. Locks account for 15 minutes after 5 consecutive failures.
 */
export function recordFailedLogin(identifier: string): { attempts: number; locked: boolean } {
  const key = identifier.toLowerCase();
  const now = Date.now();
  const entry = failedLoginMap.get(key) || { attempts: 0, lockedUntil: 0 };

  entry.attempts += 1;
  let locked = false;

  // 5 failed attempts triggers a 15-minute lock
  if (entry.attempts >= 5) {
    entry.lockedUntil = now + 15 * 60 * 1000;
    locked = true;
  }

  failedLoginMap.set(key, entry);
  return { attempts: entry.attempts, locked };
}

/**
 * Clear failed login attempts after a successful authentication.
 */
export function resetFailedLogins(identifier: string) {
  failedLoginMap.delete(identifier.toLowerCase());
}
