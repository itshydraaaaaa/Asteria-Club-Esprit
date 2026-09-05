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
  provider: "resend" | "simulated" | "error";
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
 * Uses Resend API if configured, otherwise simulates delivery with structured logging.
 */
export async function sendAcceptanceEmail(
  params: SendAcceptanceEmailParams
): Promise<EmailDeliveryResult> {
  const now = new Date().toISOString();
  const subject = `⭐ Félicitations ! Votre compte membre Asteria Club Esprit (${params.departmentName})`;
  const html = buildAcceptanceEmailHtml(params);
  const text = buildAcceptanceEmailText(params);

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromAddress =
    process.env.EMAIL_FROM || "Asteria Club Esprit <onboarding@asteria.tn>";

  // 1. If RESEND_API_KEY is configured, dispatch via Resend REST API
  if (resendApiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [params.toEmail],
          subject,
          html,
          text,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Resend API error:", data);
        return {
          success: false,
          provider: "resend",
          error: data.message || "Failed to send email via Resend",
          recipient: params.toEmail,
          dispatchedAt: now,
        };
      }

      console.log(`[EMAIL] Acceptance email successfully sent to ${params.toEmail} via Resend (${data.id})`);
      return {
        success: true,
        provider: "resend",
        messageId: data.id,
        recipient: params.toEmail,
        dispatchedAt: now,
      };
    } catch (err: any) {
      console.error("Network error sending email via Resend:", err);
      return {
        success: false,
        provider: "resend",
        error: err.message || "Network error",
        recipient: params.toEmail,
        dispatchedAt: now,
      };
    }
  }

  // 2. Simulated Delivery for Local Development & Demo Environments
  console.log(`
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📧 [SIMULATED EMAIL DISPATCH] Member Acceptance Email                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ To:      ${params.toEmail.padEnd(58)}│
│ Name:    ${params.memberName.padEnd(58)}│
│ Dept:    ${params.departmentName.padEnd(58)}│
│ Subject: ${subject.slice(0, 58).padEnd(58)}│
│ Portal:  ${(params.portalUrl || "https://asteria-club-esprit.vercel.app/login").padEnd(58)}│
│ Temp PW: ${params.temporaryPassword.padEnd(58)}│
│ Status:  DELIVERED (SIMULATED - No RESEND_API_KEY defined in .env)         │
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
