/**
 * Asteria Club Esprit — Email Notification Service
 * Charte Graphique 2026 · v2.1
 */

import { BRAND_COLORS, CLUB_LINKS, APP_METADATA } from "./constants";

export interface SendAcceptanceEmailParams {
  toEmail: string;
  memberName: string;
  departmentName: string;
  temporaryPassword: string;
  portalUrl?: string;
}

export interface EmailDeliveryResult {
  success: boolean;
  provider: "resend" | "smtp" | "simulated" | "error";
  messageId?: string;
  error?: string;
  recipient: string;
  dispatchedAt: string;
}

/**
 * Builds a responsive, brand-compliant HTML email for accepted applicants
 */
export function buildAcceptanceEmailHtml({
  toEmail,
  memberName,
  departmentName,
  temporaryPassword,
  portalUrl,
}: SendAcceptanceEmailParams): string {
  const loginUrl = portalUrl || `${process.env.NEXT_PUBLIC_APP_URL || APP_METADATA.defaultSiteUrl}/login`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue chez Asteria Club Esprit !</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0A3A40; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F9FA; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #D2E4E6; box-shadow: 0 10px 25px -5px rgba(10, 58, 64, 0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A3A40 0%, #11606E 100%); padding: 40px 32px; text-align: center; color: #FFFFFF;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: rgba(96, 200, 212, 0.2); border: 1px solid rgba(96, 200, 212, 0.4); color: #60C8D4; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 6px 14px; rounded-full; border-radius: 9999px; margin-bottom: 16px; font-family: monospace;">
                      Saison 2025-2026 · Espace Recrutement
                    </span>
                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #FFFFFF;">
                      FÉLICITATIONS, ${memberName.toUpperCase()} !
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #D2E4E6; line-height: 1.5;">
                      Votre candidature a été retenue pour rejoindre l'équipe officielle d'Asteria Club Esprit.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A6B70;">
                Bonjour <strong style="color: #0A3A40;">${memberName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4A6B70;">
                Le Bureau Exécutif d'<strong>Asteria Club Esprit</strong> a le plaisir de vous confirmer votre intégration au sein de notre incubateur de talents techniques et créatifs pour le pôle :
              </p>

              <!-- Department Badge Card -->
              <div style="background-color: #F4F9FA; border-left: 4px solid #11606E; border-radius: 12px; padding: 16px 20px; margin-bottom: 28px;">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #11606E; font-family: monospace; display: block; margin-bottom: 4px;">
                  PÔLE D'AFFECTATION
                </span>
                <span style="font-size: 18px; font-weight: 800; color: #0A3A40;">
                  ⭐ ${departmentName}
                </span>
              </div>

              <!-- Credentials Box -->
              <div style="background: #0A3A40; border: 1px solid #11606E; border-radius: 18px; padding: 24px; margin-bottom: 28px; color: #FFFFFF;">
                <div style="border-bottom: 1px solid rgba(96, 200, 212, 0.2); padding-bottom: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #60C8D4; font-family: monospace;">
                    Vos Identifiants de Connexion au Portail
                  </span>
                </div>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #D2E4E6; width: 140px; font-weight: 600;">Espace Membre :</td>
                    <td style="padding: 6px 0; color: #60C8D4; font-family: monospace; font-size: 12px; word-break: break-all;">
                      <a href="${loginUrl}" style="color: #60C8D4; text-decoration: underline;">${loginUrl}</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #D2E4E6; font-weight: 600;">Email de Connexion :</td>
                    <td style="padding: 6px 0; color: #FFFFFF; font-family: monospace; font-weight: 700;">
                      ${toEmail}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #D2E4E6; font-weight: 600;">Mot de Passe Temporaire :</td>
                    <td style="padding: 6px 0; color: #E5A93C; font-family: monospace; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">
                      ${temporaryPassword}
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #A5C2C6; line-height: 1.4;">
                  🔒 <em>Pour des raisons de sécurité, veuillez modifier ce mot de passe temporaire dès votre première connexion dans les paramètres de votre profil.</em>
                </div>
              </div>

              <!-- Action CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background-color: #60C8D4; color: #0A3A40; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 14px rgba(96, 200, 212, 0.4); font-family: monospace;">
                      Accéder à mon Espace Membre →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Steps & Rules Card -->
              <div style="background-color: #F4F9FA; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0A3A40;">
                  Prochaines Étapes Obligatoires :
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.8; color: #4A6B70;">
                  <li><strong>Activez votre compte</strong> en vous connectant à l'Espace Membre.</li>
                  <li><strong>Consultez votre tableau Kanban</strong> pour découvrir vos tickets de sprint assignés.</li>
                  <li><strong>Validez vos présences</strong> aux ateliers hebdomadaires via QR code. <em>(Seuil d'assiduité minimal : 75%)</em>.</li>
                  <li><strong>Progressez vers la qualification</strong> pour les missions payées Asteria Freelance PreLaunch.</li>
                </ul>
              </div>

              <!-- English Summary Section -->
              <div style="border-top: 1px dashed #D2E4E6; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A6B70; line-height: 1.5;">
                  <strong>English Summary:</strong> Welcome to Asteria Club Esprit! Your application has been accepted into the <strong>${departmentName}</strong> department. Use the credentials above to sign in at <a href="${loginUrl}" style="color: #11606E;">${loginUrl}</a> and change your temporary password immediately.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4F9FA; border-top: 1px solid #D2E4E6; padding: 24px 32px; text-align: center; font-size: 11px; color: #4A6B70; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #0A3A40;">
                Asteria Club Esprit · Incubateur Technique & Créatif
              </p>
              <p style="margin: 0 0 12px 0;">
                ESPRIT Charguia & Ghazela · Tunis, Tunisie
              </p>
              <p style="margin: 0; color: #A5C2C6;">
                Une question ? Contactez le bureau : <a href="mailto:${CLUB_LINKS.email}" style="color: #11606E; text-decoration: underline;">${CLUB_LINKS.email}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds a plain text version of the acceptance email
 */
export function buildAcceptanceEmailText({
  toEmail,
  memberName,
  departmentName,
  temporaryPassword,
  portalUrl,
}: SendAcceptanceEmailParams): string {
  const loginUrl = portalUrl || `${process.env.NEXT_PUBLIC_APP_URL || APP_METADATA.defaultSiteUrl}/login`;

  return `ASTERIA CLUB ESPRIT — BIENVENUE !
==================================================

Félicitations ${memberName} !

Le Bureau Exécutif d'Asteria Club Esprit a le plaisir de vous informer que votre candidature pour rejoindre le pôle "${departmentName}" a été acceptée !

VOS IDENTIFIANTS DE CONNEXION :
--------------------------------------------------
- Portail Membre : ${loginUrl}
- Identifiant / Email : ${toEmail}
- Mot de Passe Temporaire : ${temporaryPassword}

IMPORTANT :
Pour des raisons de sécurité, veuillez vous connecter et changer votre mot de passe temporaire dès votre première session.

PROCHAINES ÉTAPES :
1. Connectez-vous sur votre Espace Membre : ${loginUrl}
2. Prenez connaissance de vos tickets de sprint sur le Kanban de votre pôle.
3. Participez aux réunions et validez vos présences par QR code (taux d'assiduité requis : ≥75%).
4. Atteignez les objectifs pour débloquer les contrats clients Asteria Freelance PreLaunch.

Pour toute question, écrivez-nous à ${CLUB_LINKS.email}.

Cordialement,
Le Bureau Exécutif — Asteria Club Esprit
https://asteria-club-esprit.vercel.app
`;
}

/**
 * Dispatches an automated acceptance email to an onboarded applicant.
 * Priority order:
 * 1. Resend API (if RESEND_API_KEY is configured)
 * 2. SMTP Transport via Nodemailer (if SMTP_HOST or SMTP_USER is configured)
 * 3. Simulated Delivery with formatted console output (local development / testing)
 */
export async function sendAcceptanceEmail(
  params: SendAcceptanceEmailParams
): Promise<EmailDeliveryResult> {
  const now = new Date().toISOString();
  const subject = `⭐ Félicitations ! Votre compte membre Asteria Club Esprit (${params.departmentName})`;
  const html = buildAcceptanceEmailHtml(params);
  const text = buildAcceptanceEmailText(params);

  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST || (process.env.SMTP_USER ? "smtp.gmail.com" : undefined);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const fromAddress =
    process.env.EMAIL_FROM ||
    (smtpUser ? `Asteria Club Esprit <${smtpUser}>` : "Asteria Club Esprit <onboarding@resend.dev>");

  let lastError: string | undefined;

  // 1. Resend REST API dispatch
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress.includes("@resend.dev")
            ? "Asteria Club <onboarding@resend.dev>"
            : fromAddress,
          to: [params.toEmail],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(`[EMAIL] Acceptance email successfully sent to ${params.toEmail} via Resend (${data.id})`);
        return {
          success: true,
          provider: "resend",
          messageId: data.id,
          recipient: params.toEmail,
          dispatchedAt: now,
        };
      } else {
        lastError = data.message || "Resend error";
        console.warn(`[EMAIL] Resend dispatch rejected (${lastError}). Trying SMTP fallback...`);
      }
    } catch (err: any) {
      lastError = err.message || "Network error via Resend";
      console.warn(`[EMAIL] Resend network error (${lastError}). Trying SMTP fallback...`);
    }
  }

  // 2. SMTP Transport via Nodemailer (Gmail, Outlook, custom SMTP)
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== "false", // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `Asteria Club Esprit <${smtpUser}>`,
        to: params.toEmail,
        subject,
        html,
        text,
      });

      console.log(`[EMAIL] Acceptance email successfully sent to ${params.toEmail} via SMTP (${info.messageId})`);
      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
        recipient: params.toEmail,
        dispatchedAt: now,
      };
    } catch (smtpErr: any) {
      lastError = smtpErr.message || "SMTP error";
      console.error("[EMAIL ERROR] SMTP error:", smtpErr);
    }
  }

  // If credentials were provided but all failed:
  if (resendApiKey || (smtpHost && smtpUser)) {
    return {
      success: false,
      provider: smtpUser ? "smtp" : "resend",
      error: lastError || "Failed to dispatch email",
      recipient: params.toEmail,
      dispatchedAt: now,
    };
  }

  // 3. Simulated Delivery for Local Development & Demo Environments
  console.log(`
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  [SIMULATED EMAIL DISPATCH — NO OUTBOUND CREDENTIALS CONFIGURED]        │
├─────────────────────────────────────────────────────────────────────────────┤
│ Notice:  No RESEND_API_KEY or SMTP credentials found in .env.              │
│          To receive REAL emails in your personal inbox:                     │
│          Option A: Add RESEND_API_KEY="re_..." to .env                      │
│          Option B: Add SMTP_USER and SMTP_PASS (Gmail App PW) to .env       │
├─────────────────────────────────────────────────────────────────────────────┤
│ To:      ${params.toEmail.padEnd(58)}│
│ Name:    ${params.memberName.padEnd(58)}│
│ Dept:    ${params.departmentName.padEnd(58)}│
│ Subject: ${subject.slice(0, 58).padEnd(58)}│
│ Portal:  ${(params.portalUrl || "https://asteria-club-esprit.vercel.app/login").padEnd(58)}│
│ Temp PW: ${params.temporaryPassword.padEnd(58)}│
│ Status:  PRINTED TO CONSOLE (Configure RESEND_API_KEY or SMTP in .env)     │
└─────────────────────────────────────────────────────────────────────────────┘
  `);

  return {
    success: true,
    provider: "simulated",
    messageId: `sim_${Date.now()}`,
    recipient: params.toEmail,
    dispatchedAt: now,
  };
}

// ---------------------------------------------------------------------------
// ROLE UPDATE / PROMOTION NOTIFICATION
// ---------------------------------------------------------------------------

export interface SendRoleUpdateEmailParams {
  toEmail: string;
  memberName: string;
  newRole: "BOARD" | "HOD" | "MEMBER" | "APPLICANT" | string;
  oldRole?: string;
  departmentName?: string | null;
  boardTitle?: string | null;
  portalUrl?: string;
}

function getRoleDisplayInfo(role: string, boardTitle?: string | null) {
  switch (role) {
    case "BOARD":
      return {
        badge: "★ BUREAU EXÉCUTIF",
        title: boardTitle ? `Membre du Bureau Exécutif (${boardTitle})` : "Membre du Bureau Exécutif (Executive Board)",
        englishTitle: boardTitle ? `Executive Board Member (${boardTitle})` : "Executive Board Member",
        accent: "#60C8D4",
        responsibilities: [
          "Gouvernance stratégique, supervision des pôles et gestion des cycles académiques.",
          "Accès Super-Admin complet à l'espace de contrôle, aux audits et aux admissions.",
          "Représentation officielle du club et direction des grands projets de l'école.",
        ],
      };
    case "HOD":
      return {
        badge: "◆ RESPONSABLE DE PÔLE",
        title: "Responsable de Pôle Technique (Head of Department)",
        englishTitle: "Head of Technical Department (HOD)",
        accent: "#60C8D4",
        responsibilities: [
          "Direction technique, mentorship et encadrement des membres de votre division.",
          "Création, attribution et validation des tickets de sprint sur le tableau Kanban.",
          "Planification des ateliers hebdomadaires et suivi de l'assiduité des membres.",
        ],
      };
    case "MEMBER":
      return {
        badge: "● MEMBRE ACTIF",
        title: "Membre Actif Qualifié (Active Member)",
        englishTitle: "Active Member",
        accent: "#22C55E",
        responsibilities: [
          "Participation active aux ateliers hebdomadaires et aux projets d'équipe.",
          "Enregistrement de votre présence aux événements via votre QR Pass personnel.",
          "Qualification progressive aux missions rémunérées Asteria Freelance.",
        ],
      };
    case "APPLICANT":
      return {
        badge: "○ CANDIDAT",
        title: "Statut Candidat (Applicant)",
        englishTitle: "Applicant",
        accent: "#F59E0B",
        responsibilities: [
          "Finalisation du processus de recrutement et évaluation des compétences.",
        ],
      };
    default:
      return {
        badge: "STATUT MIS À JOUR",
        title: role,
        englishTitle: role,
        accent: "#60C8D4",
        responsibilities: ["Participation aux activités d'Asteria Club Esprit."],
      };
  }
}

/**
 * Builds responsive HTML email congratulating a member on their role promotion / update
 */
export function buildRoleUpdateEmailHtml({
  toEmail,
  memberName,
  newRole,
  departmentName,
  boardTitle,
  portalUrl,
}: SendRoleUpdateEmailParams): string {
  const dashboardUrl = portalUrl || `${process.env.NEXT_PUBLIC_APP_URL || APP_METADATA.defaultSiteUrl}/dashboard`;
  const roleInfo = getRoleDisplayInfo(newRole, boardTitle);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Félicitations pour votre nouveau rôle chez Asteria Club Esprit !</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F9FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0A3A40; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F9FA; padding: 32px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #D2E4E6; box-shadow: 0 10px 25px -5px rgba(10, 58, 64, 0.08);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0A3A40 0%, #11606E 100%); padding: 40px 32px; text-align: center; color: #FFFFFF;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <span style="display: inline-block; background-color: rgba(96, 200, 212, 0.2); border: 1px solid rgba(96, 200, 212, 0.4); color: #60C8D4; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 16px; font-family: monospace;">
                      GOUVERNANCE & DÉCERNEMENT · 2026-2027
                    </span>
                    <h1 style="margin: 0 0 8px 0; font-size: 26px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #FFFFFF;">
                      FÉLICITATIONS, ${memberName.toUpperCase()} !
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #D2E4E6; line-height: 1.5;">
                      Votre statut et vos responsabilités officielles au sein d'Asteria Club Esprit ont été mis à jour avec succès.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 24px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #4A6B70;">
                Bonjour <strong style="color: #0A3A40;">${memberName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #4A6B70;">
                Le Bureau Exécutif d'<strong>Asteria Club Esprit</strong> a l'honneur de vous annoncer l'actualisation de votre rôle dans notre plateforme de gouvernance :
              </p>

              <!-- New Role Highlight Card -->
              <div style="background: #0A3A40; border: 1px solid #11606E; border-radius: 18px; padding: 24px; margin-bottom: 28px; color: #FFFFFF;">
                <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1.5px; color: #60C8D4; font-family: monospace; display: block; margin-bottom: 6px;">
                  ${roleInfo.badge}
                </span>
                <span style="font-size: 20px; font-weight: 900; color: #FFFFFF; display: block; margin-bottom: ${departmentName ? '10px' : '0'};">
                  ${roleInfo.title}
                </span>
                ${
                  departmentName
                    ? `<div style="padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 13px; color: #D2E4E6;">
                        Division Technique : <strong style="color: #60C8D4;">⭐ ${departmentName}</strong>
                      </div>`
                    : ""
                }
              </div>

              <!-- Responsibilities / Key Privileges -->
              <div style="background-color: #F4F9FA; border-radius: 16px; padding: 20px; margin-bottom: 28px; border: 1px solid #D2E4E6;">
                <h3 style="margin: 0 0 12px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0A3A40;">
                  Vos Nouvelles Prérogatives & Missions :
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.8; color: #4A6B70;">
                  ${roleInfo.responsibilities.map((r) => `<li>${r}</li>`).join("")}
                </ul>
              </div>

              <!-- Action CTA Button -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #60C8D4; color: #0A3A40; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 14px rgba(96, 200, 212, 0.4); font-family: monospace;">
                      Accéder à mon Tableau de Bord →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- English Summary Section -->
              <div style="border-top: 1px dashed #D2E4E6; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #4A6B70; line-height: 1.5;">
                  <strong>English Summary:</strong> Congratulations ${memberName}! Your official role in Asteria Club Esprit has been updated to <strong>${roleInfo.englishTitle}</strong>${departmentName ? ` in the <strong>${departmentName}</strong> division` : ""}. Sign in to your portal at <a href="${dashboardUrl}" style="color: #11606E;">${dashboardUrl}</a> to explore your updated access and workspace.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F4F9FA; border-top: 1px solid #D2E4E6; padding: 24px 32px; text-align: center; font-size: 11px; color: #4A6B70; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #0A3A40;">
                Asteria Club Esprit · Incubateur Technique & Créatif
              </p>
              <p style="margin: 0 0 12px 0;">
                ESPRIT Charguia & Ghazela · Tunis, Tunisie
              </p>
              <p style="margin: 0; color: #A5C2C6;">
                Une question ? Contactez le bureau : <a href="mailto:${CLUB_LINKS.email}" style="color: #11606E; text-decoration: underline;">${CLUB_LINKS.email}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Builds plain-text version of role update email
 */
export function buildRoleUpdateEmailText({
  toEmail,
  memberName,
  newRole,
  departmentName,
  boardTitle,
  portalUrl,
}: SendRoleUpdateEmailParams): string {
  const dashboardUrl = portalUrl || `${process.env.NEXT_PUBLIC_APP_URL || APP_METADATA.defaultSiteUrl}/dashboard`;
  const roleInfo = getRoleDisplayInfo(newRole, boardTitle);

  return `ASTERIA CLUB ESPRIT — MISE À JOUR DE VOTRE RÔLE
==================================================

Félicitations ${memberName} !

Le Bureau Exécutif d'Asteria Club Esprit a le plaisir de vous informer que votre statut officiel a été mis à jour :

NOUVEAU STATUT :
--------------------------------------------------
- Rôle : ${roleInfo.title}
${departmentName ? `- Division Technique : ${departmentName}\n` : ""}- Compte Email : ${toEmail}
- Tableau de Bord : ${dashboardUrl}

VOS MISSIONS & PRÉROGATIVES :
--------------------------------------------------
${roleInfo.responsibilities.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Accédez dès maintenant à votre espace pour découvrir vos nouvelles fonctionnalités :
${dashboardUrl}

Pour toute question, écrivez-nous à ${CLUB_LINKS.email}.

Cordialement,
Le Bureau Exécutif — Asteria Club Esprit
https://asteria-club-esprit.vercel.app
`;
}

/**
 * Dispatches an automated role update / congratulations email.
 */
export async function sendRoleUpdateEmail(
  params: SendRoleUpdateEmailParams
): Promise<EmailDeliveryResult> {
  const now = new Date().toISOString();
  let subject = `⭐ Asteria Club Esprit : Félicitations pour votre rôle (${params.newRole})`;
  if (params.newRole === "BOARD") {
    subject = `🎉 Félicitations ! Vous rejoignez le Bureau Exécutif d'Asteria Club Esprit${params.boardTitle ? ` (${params.boardTitle})` : ""}`;
  } else if (params.newRole === "HOD") {
    subject = `⭐ Félicitations ! Vous êtes nommé Responsable de Pôle (${params.departmentName || "Asteria Club"})`;
  } else if (params.newRole === "MEMBER") {
    subject = `✨ Félicitations ! Votre statut de Membre Actif Asteria Club Esprit est confirmé`;
  }

  const html = buildRoleUpdateEmailHtml(params);
  const text = buildRoleUpdateEmailText(params);

  const resendApiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST || (process.env.SMTP_USER ? "smtp.gmail.com" : undefined);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  const fromAddress =
    process.env.EMAIL_FROM ||
    (smtpUser ? `Asteria Club Esprit <${smtpUser}>` : "Asteria Club Esprit <onboarding@resend.dev>");

  let lastError: string | undefined;

  // 1. Resend REST API dispatch
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress.includes("@resend.dev")
            ? "Asteria Club <onboarding@resend.dev>"
            : fromAddress,
          to: [params.toEmail],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(`[EMAIL] Role update email successfully sent to ${params.toEmail} via Resend (${data.id})`);
        return {
          success: true,
          provider: "resend",
          messageId: data.id,
          recipient: params.toEmail,
          dispatchedAt: now,
        };
      } else {
        lastError = data.message || "Resend error";
        console.warn(`[EMAIL] Resend dispatch rejected (${lastError}). Trying SMTP fallback...`);
      }
    } catch (err: any) {
      lastError = err.message || "Network error via Resend";
      console.warn(`[EMAIL] Resend network error (${lastError}). Trying SMTP fallback...`);
    }
  }

  // 2. SMTP Transport via Nodemailer
  if (smtpHost && smtpUser && smtpPass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: process.env.SMTP_SECURE !== "false",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `Asteria Club Esprit <${smtpUser}>`,
        to: params.toEmail,
        subject,
        html,
        text,
      });

      console.log(`[EMAIL] Role update email successfully sent to ${params.toEmail} via SMTP (${info.messageId})`);
      return {
        success: true,
        provider: "smtp",
        messageId: info.messageId,
        recipient: params.toEmail,
        dispatchedAt: now,
      };
    } catch (smtpErr: any) {
      lastError = smtpErr.message || "SMTP error";
      console.error("[EMAIL ERROR] SMTP error:", smtpErr);
    }
  }

  // 3. Fallback
  if (resendApiKey || (smtpHost && smtpUser)) {
    return {
      success: false,
      provider: smtpUser ? "smtp" : "resend",
      error: lastError || "Failed to dispatch email",
      recipient: params.toEmail,
      dispatchedAt: now,
    };
  }

  // 4. Simulated Delivery
  console.log(`
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  [SIMULATED ROLE UPDATE EMAIL DISPATCH]                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ To:      ${params.toEmail.padEnd(58)}│
│ Name:    ${params.memberName.padEnd(58)}│
│ Role:    ${params.newRole.padEnd(58)}│
│ Dept:    ${(params.departmentName || "General").padEnd(58)}│
│ Subject: ${subject.slice(0, 58).padEnd(58)}│
└─────────────────────────────────────────────────────────────────────────────┘
  `);

  return {
    success: true,
    provider: "simulated",
    messageId: `sim_role_${Date.now()}`,
    recipient: params.toEmail,
    dispatchedAt: now,
  };
}
