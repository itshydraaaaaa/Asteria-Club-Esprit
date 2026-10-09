import { ConnectionProvider } from "./types";

const BLOCKED_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "buff.ly",
  "rebrand.ly",
  "cutt.ly",
  "shorturl.at",
  "lnkd.in",
]);

const PROVIDER_CONFIG: Record<
  ConnectionProvider,
  {
    name: string;
    domains: string[];
    defaultPrefix?: string;
    handleRegex?: RegExp;
    isOAuthEligible: boolean;
  }
> = {
  github: {
    name: "GitHub",
    domains: ["github.com"],
    defaultPrefix: "https://github.com/",
    handleRegex: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
    isOAuthEligible: true,
  },
  linkedin: {
    name: "LinkedIn",
    domains: ["linkedin.com", "www.linkedin.com"],
    defaultPrefix: "https://linkedin.com/in/",
    handleRegex: /^[a-zA-Z0-9_-]+$/,
    isOAuthEligible: true,
  },
  discord: {
    name: "Discord",
    domains: ["discord.com", "discord.gg"],
    defaultPrefix: "https://discord.com/users/",
    isOAuthEligible: true,
  },
  google: {
    name: "Google",
    domains: ["google.com", "profiles.google.com"],
    isOAuthEligible: false,
  },
  instagram: {
    name: "Instagram",
    domains: ["instagram.com", "www.instagram.com"],
    defaultPrefix: "https://instagram.com/",
    handleRegex: /^[a-zA-Z0-9._]{1,30}$/,
    isOAuthEligible: false,
  },
  tiktok: {
    name: "TikTok",
    domains: ["tiktok.com", "www.tiktok.com"],
    defaultPrefix: "https://tiktok.com/@",
    handleRegex: /^@?[a-zA-Z0-9._]{1,24}$/,
    isOAuthEligible: false,
  },
  x: {
    name: "X (Twitter)",
    domains: ["x.com", "twitter.com", "www.x.com", "www.twitter.com"],
    defaultPrefix: "https://x.com/",
    handleRegex: /^@?[a-zA-Z0-9_]{1,15}$/,
    isOAuthEligible: false,
  },
  facebook: {
    name: "Facebook",
    domains: ["facebook.com", "www.facebook.com"],
    defaultPrefix: "https://facebook.com/",
    isOAuthEligible: false,
  },
  youtube: {
    name: "YouTube",
    domains: ["youtube.com", "www.youtube.com"],
    defaultPrefix: "https://youtube.com/@",
    isOAuthEligible: false,
  },
  behance: {
    name: "Behance",
    domains: ["behance.net", "www.behance.net"],
    defaultPrefix: "https://behance.net/",
    handleRegex: /^[a-zA-Z0-9_-]+$/,
    isOAuthEligible: false,
  },
  dribbble: {
    name: "Dribbble",
    domains: ["dribbble.com", "www.dribbble.com"],
    defaultPrefix: "https://dribbble.com/",
    handleRegex: /^[a-zA-Z0-9_-]+$/,
    isOAuthEligible: false,
  },
  telegram: {
    name: "Telegram",
    domains: ["t.me", "telegram.me"],
    defaultPrefix: "https://t.me/",
    handleRegex: /^@?[a-zA-Z0-9_]{5,32}$/,
    isOAuthEligible: false,
  },
  website: {
    name: "Site Personnel / Portfolio",
    domains: [],
    isOAuthEligible: false,
  },
  other: {
    name: "Lien Personnalisé",
    domains: [],
    isOAuthEligible: false,
  },
};

export { PROVIDER_CONFIG };

/**
 * Validates and normalizes an input URL or handle for a given social provider.
 */
export function validateAndNormalizeSocialLink(
  provider: ConnectionProvider,
  input: string,
  customLabel?: string
): {
  valid: boolean;
  normalizedUrl?: string;
  extractedUsername?: string;
  error?: string;
} {
  if (!input || typeof input !== "string") {
    return { valid: false, error: "Lien ou identifiant requis." };
  }

  let raw = input.trim();

  // 1. Block dangerous schemes immediately
  if (/^(javascript|data|vbscript|file):/i.test(raw)) {
    return { valid: false, error: "Protocole d'URL non autorisé pour des raisons de sécurité." };
  }

  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    return { valid: false, error: "Fournisseur non pris en charge." };
  }

  // 2. Handle normalization: If user supplied just a handle without http (e.g. "@myhandle" or "myhandle")
  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    if (config.defaultPrefix && !raw.includes("/")) {
      const cleanHandle = raw.replace(/^@/, "").trim();
      raw = `${config.defaultPrefix}${cleanHandle}`;
    } else {
      // Prepend https://
      raw = `https://${raw}`;
    }
  }

  // 3. Enforce HTTPS strictly
  if (raw.startsWith("http://")) {
    raw = raw.replace(/^http:\/\//i, "https://");
  }

  // 4. Parse URL
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { valid: false, error: "Format d'adresse URL invalide." };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, error: "Seules les adresses sécurisées en HTTPS sont acceptées." };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 5. Check against blocked URL shorteners
  if (BLOCKED_SHORTENERS.has(hostname) || Array.from(BLOCKED_SHORTENERS).some((s) => hostname.endsWith(`.${s}`))) {
    return {
      valid: false,
      error: "Les réducteurs de liens (URL shorteners) ne sont pas autorisés pour éviter les redirections masquées.",
    };
  }

  // 6. Block private IPs and localhost
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    return { valid: false, error: "Les adresses d'hôtes locaux ou privés sont interdites." };
  }

  // 7. Validate provider domain match
  if (config.domains.length > 0) {
    const isDomainAllowed = config.domains.some(
      (d) => hostname === d || hostname.endsWith(`.${d}`)
    );
    if (!isDomainAllowed) {
      return {
        valid: false,
        error: `Le lien doit appartenir au domaine officiel de ${config.name} (ex: ${config.domains[0]}).`,
      };
    }
  }

  // 8. Extract clean username / handle
  let extractedUsername = "";
  const pathParts = parsed.pathname.split("/").filter(Boolean);

  if (provider === "instagram" || provider === "github" || provider === "x" || provider === "behance" || provider === "dribbble") {
    extractedUsername = pathParts[0] ? `@${pathParts[0]}` : parsed.hostname;
  } else if (provider === "tiktok" || provider === "youtube") {
    const p = pathParts[0] || "";
    extractedUsername = p.startsWith("@") ? p : `@${p}`;
  } else if (provider === "linkedin") {
    // linkedin.com/in/username
    if (pathParts[0] === "in" && pathParts[1]) {
      extractedUsername = pathParts[1];
    } else {
      extractedUsername = pathParts[0] || parsed.hostname;
    }
  } else if (provider === "telegram") {
    extractedUsername = pathParts[0] ? `@${pathParts[0]}` : parsed.hostname;
  } else {
    extractedUsername = customLabel?.trim() || parsed.hostname;
  }

  // Clean canonical URL
  const normalizedUrl = parsed.origin + parsed.pathname + (parsed.search || "");

  return {
    valid: true,
    normalizedUrl,
    extractedUsername: extractedUsername.replace(/[\x00-\x1F\x7F<>]/g, "").trim(),
  };
}
