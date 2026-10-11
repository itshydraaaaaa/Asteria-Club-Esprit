-- ==============================================================================
-- Asteria Club Esprit — Activity Planner Seed Data (Reference Data Only)
-- Migration: 20261011_activity_planner_seed.sql
-- ==============================================================================

-- 1. PLANNER SETTINGS (Default: planner_hod_write = false)
INSERT INTO public.planner_settings (key, value)
VALUES ('planner_hod_write', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.planner_settings (key, value)
VALUES ('planner_email_no_reply_days', '{"days": 4}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.planner_settings (key, value)
VALUES ('planner_resource_conflict_blocking', '{"blocking": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. ACTIVITY TYPES (Workshop lead 21, Session lead 10, Large Event lead 45)
INSERT INTO public.activity_types (id, name, color, icon, description, default_lead_days)
VALUES
    ('11111111-0000-0000-0000-000000000001', 'Atelier Technique / Workshop', '#11606E', 'Code', 'Atelier de formation pratique aux technologies et créations du club', 21),
    ('11111111-0000-0000-0000-000000000002', 'Session / Réunion de Pôle', '#60C8D4', 'Users', 'Session de travail agile, partage d''expertise et sprint interne', 10),
    ('11111111-0000-0000-0000-000000000003', 'Grand Événement / Hackathon', '#E5A93C', 'Sparkles', 'Compétition majeure, hackathon inter-écoles ou journée portes ouvertes', 45)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    color = EXCLUDED.color,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description,
    default_lead_days = EXCLUDED.default_lead_days;

-- 3. ACTIVITY TEMPLATES WITH OFFSETS & REQUIREMENTS
-- Workshop (lead 21):
--   T-21 brief approved, admin emails to student life, scolarite and technical equipment
--   T-14 space, equipment and trainer confirmed
--   T-10 promotion starts
--   T-7 materials and purchases ready
--   T-3 reminders and agenda final
--   T-1 tech check and run sheet
--   T+3 attendance synced and report filed
INSERT INTO public.activity_templates (
    id,
    activity_type_id,
    name,
    tasks,
    requirements,
    required_offices,
    is_active
) VALUES (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Template Standard · Workshop Technique (T-21)',
    '[
        {"title": "Validation du brief & envoi des demandes administratives", "offset_days": 21, "default_role": "OWNER", "section": "ADMINISTRATION"},
        {"title": "Confirmation de la salle, du formateur et du matériel", "offset_days": 14, "default_role": "OWNER", "section": "LOGISTIQUE"},
        {"title": "Lancement de la campagne de promotion et communication", "offset_days": 10, "default_role": "CONTRIBUTOR", "section": "COMMUNICATION"},
        {"title": "Préparation des supports pédagogiques et achats consommables", "offset_days": 7, "default_role": "CONTRIBUTOR", "section": "LOGISTIQUE"},
        {"title": "Finalisation de l''agenda détaillé et envoi des rappels inscrits", "offset_days": 3, "default_role": "OWNER", "section": "PROGRAMME"},
        {"title": "Test technique en salle (projecteur, Wi-Fi) et run-sheet", "offset_days": 1, "default_role": "OWNER", "section": "LOGISTIQUE"},
        {"title": "Synchronisation des présences QR et dépôt du rapport d''activité", "offset_days": -3, "default_role": "OWNER", "section": "CLOTURE"}
    ]'::jsonb,
    '[
        {"category": "SPACE", "title": "Salle informatique ou amphi avec vidéoprojecteur", "quantity": 1},
        {"category": "EQUIPMENT", "title": "Multiprises, rallonges et adaptateurs HDMI/USB-C", "quantity": 3},
        {"category": "MATERIALS", "title": "Badges ou stickers Asteria Club pour participants", "quantity": 30},
        {"category": "PROMOTION", "title": "Affiche digitale et publication réseaux sociaux", "quantity": 1}
    ]'::jsonb,
    ARRAY['STUDENT_LIFE', 'SCOLARITE', 'TECHNICAL_EQUIPMENT'],
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tasks = EXCLUDED.tasks,
    requirements = EXCLUDED.requirements,
    required_offices = EXCLUDED.required_offices,
    is_active = EXCLUDED.is_active;

-- Session (lead 10):
--   T-10 brief approved, room and equipment request
--   T-7 promotion starts
--   T-2 reminder and agenda
--   T+2 attendance and short report
INSERT INTO public.activity_templates (
    id,
    activity_type_id,
    name,
    tasks,
    requirements,
    required_offices,
    is_active
) VALUES (
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000002',
    'Template Standard · Session de Pôle (T-10)',
    '[
        {"title": "Validation du sujet de séance et réservation de salle", "offset_days": 10, "default_role": "OWNER", "section": "ADMINISTRATION"},
        {"title": "Diffusion de l''annonce interne au pôle", "offset_days": 7, "default_role": "CONTRIBUTOR", "section": "COMMUNICATION"},
        {"title": "Diffusion de l''ordre du jour et rappel des membres", "offset_days": 2, "default_role": "OWNER", "section": "PROGRAMME"},
        {"title": "Vérification des présences QR et compte-rendu de sprint", "offset_days": -2, "default_role": "OWNER", "section": "CLOTURE"}
    ]'::jsonb,
    '[
        {"category": "SPACE", "title": "Salle de réunion ou labo de travail", "quantity": 1},
        {"category": "EQUIPMENT", "title": "Écran partagé ou vidéoprojecteur", "quantity": 1}
    ]'::jsonb,
    ARRAY['SCOLARITE', 'TECHNICAL_EQUIPMENT'],
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tasks = EXCLUDED.tasks,
    requirements = EXCLUDED.requirements,
    required_offices = EXCLUDED.required_offices,
    is_active = EXCLUDED.is_active;

-- Large event (lead 45):
--   T-45 brief approved, budget estimate, emails to every relevant office
--   T-30 approvals received, guests or sponsors confirmed
--   T-21 promotion starts, volunteers assigned
--   T-14 logistics confirmed, run of show drafted
--   T-7 rehearsal, materials and purchases complete
--   T-1 setup and tech check
--   T+3 report and debrief
INSERT INTO public.activity_templates (
    id,
    activity_type_id,
    name,
    tasks,
    requirements,
    required_offices,
    is_active
) VALUES (
    '22222222-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000003',
    'Template Standard · Grand Événement / Hackathon (T-45)',
    '[
        {"title": "Cadrage stratégique, estimation budgétaire et courriers administratifs", "offset_days": 45, "default_role": "OWNER", "section": "ADMINISTRATION"},
        {"title": "Confirmation des autorisations, intervenants externes et sponsors", "offset_days": 30, "default_role": "OWNER", "section": "ADMINISTRATION"},
        {"title": "Lancement de la billetterie / communication et briefing bénévoles", "offset_days": 21, "default_role": "CONTRIBUTOR", "section": "COMMUNICATION"},
        {"title": "Validation logistique globale et rédaction du déroulé minute par minute", "offset_days": 14, "default_role": "OWNER", "section": "LOGISTIQUE"},
        {"title": "Répétition générale, achats consommables et impressions finales", "offset_days": 7, "default_role": "CONTRIBUTOR", "section": "LOGISTIQUE"},
        {"title": "Installation physique, balances son/vidéo et test d''accueil", "offset_days": 1, "default_role": "OWNER", "section": "LOGISTIQUE"},
        {"title": "Bilan financier, clôture des présences et rapport officiel d''événement", "offset_days": -3, "default_role": "OWNER", "section": "CLOTURE"}
    ]'::jsonb,
    '[
        {"category": "SPACE", "title": "Grand amphithéâtre ou hall principal ESPRIT", "quantity": 1},
        {"category": "EQUIPMENT", "title": "Régie son, microphones sans fil et double écran", "quantity": 1},
        {"category": "MATERIALS", "title": "Badges personnalisés, roll-ups et signalétique", "quantity": 100},
        {"category": "PEOPLE", "title": "Équipe de modération et accueil", "quantity": 10},
        {"category": "PERMISSION", "title": "Autorisation officielle de l''administration ESPRIT", "quantity": 1},
        {"category": "PURCHASE", "title": "Pauses-café ou trophées compétitions", "quantity": 1}
    ]'::jsonb,
    ARRAY['STUDENT_LIFE', 'SCOLARITE', 'TECHNICAL_EQUIPMENT', 'LOGISTICS', 'PROMOTION', 'PURCHASES'],
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    tasks = EXCLUDED.tasks,
    requirements = EXCLUDED.requirements,
    required_offices = EXCLUDED.required_offices,
    is_active = EXCLUDED.is_active;

-- 4. EMAIL TEMPLATES (French and English for each of the 6 administrative offices)
-- A. STUDENT_LIFE
INSERT INTO public.email_templates (office, language, subject, body, is_active)
VALUES
(
    'STUDENT_LIFE',
    'FR',
    'Demande d''autorisation d''événement : {{activity_title}}',
    'Madame, Monsieur du Service Vie Étudiante,

Nous vous sollicitons au nom du club Asteria Club Esprit afin de vous informer de l''organisation prochaine de notre activité : "{{activity_title}}" ({{activity_type}}).

Cette initiative se tiendra le {{date}} de {{start_time}} à {{end_time}} à l''emplacement : {{location}}.
Nous prévoyons d''accueillir environ {{expected_attendance}} étudiant(e)s.

Besoins et encadrement sollicités :
{{needs_list}}

Afin de finaliser les préparatifs dans les meilleurs délais, nous vous serions reconnaissants de bien vouloir nous confirmer votre accord de principe avant le {{deadline}}.

Nous restons à votre entière disposition pour tout renseignement complémentaire et vous remercions chaleureusement pour votre soutien continu à la dynamique étudiante.

Très cordialement,
{{host_name}}
Responsable d''activité — Asteria Club Esprit
Pôle : {{department}}',
    true
),
(
    'STUDENT_LIFE',
    'EN',
    'Event Authorization Request: {{activity_title}}',
    'Dear Student Life Office,

On behalf of Asteria Club Esprit, we are pleased to inform you of our upcoming activity: "{{activity_title}}" ({{activity_type}}).

The event is scheduled to take place on {{date}} from {{start_time}} to {{end_time}} at {{location}}.
We anticipate welcoming approximately {{expected_attendance}} students.

Requirements and support requested:
{{needs_list}}

To finalize our operational timeline, we kindly ask for your confirmation before {{deadline}}.

Thank you very much for your time, consideration, and continued support of student life at ESPRIT.

Sincerely,
{{host_name}}
Activity Lead — Asteria Club Esprit
Department: {{department}}',
    true
),

-- B. SCOLARITE
(
    'SCOLARITE',
    'FR',
    'Réservation de salle et créneau : {{activity_title}}',
    'Madame, Monsieur du Service Scolarité,

Le club Asteria Club Esprit sollicite votre bienveillance pour la réservation d''un espace pédagogique pour l''activité suivante : "{{activity_title}}" ({{activity_type}}).

Détails de la séance :
- Date : {{date}}
- Horaires : de {{start_time}} à {{end_time}}
- Lieu souhaité : {{location}}
- Effectif prévisionnel : {{expected_attendance}} personnes

Besoins d''agencement :
{{needs_list}}

Pourriez-vous nous confirmer la disponibilité de ce créneau avant le {{deadline}} ?

En vous remerciant par avance pour votre collaboration habituelle, nous vous prions d''agréer nos salutations respectueuses.

{{host_name}}
Pour le Bureau Exécutif — Asteria Club Esprit
{{club_name}}',
    true
),
(
    'SCOLARITE',
    'EN',
    'Classroom and Schedule Booking Request: {{activity_title}}',
    'Dear Academic Administration Office,

Asteria Club Esprit respectfully requests the allocation of an academic room for our upcoming session: "{{activity_title}}" ({{activity_type}}).

Session details:
- Date: {{date}}
- Time: {{start_time}} to {{end_time}}
- Requested Venue: {{location}}
- Expected Attendance: {{expected_attendance}} participants

Specific room setup requirements:
{{needs_list}}

We would appreciate your confirmation by {{deadline}} to allow us to communicate the room number to participants.

Thank you for your assistance and support.

Sincerely,
{{host_name}}
Asteria Club Esprit — Executive Board',
    true
),

-- C. TECHNICAL_EQUIPMENT
(
    'TECHNICAL_EQUIPMENT',
    'FR',
    'Demande de matériel technique : {{activity_title}}',
    'Bonjour l''Équipe du Service Matériel Technique,

Dans le cadre de notre projet "{{activity_title}}" ({{activity_type}}), prévu le {{date}} de {{start_time}} à {{end_time}} à {{location}}, nous sollicitons la mise à disposition de matériel audiovisuel et informatique.

Liste des équipements requis :
{{needs_list}}

Nous souhaiterions effectuer la vérification technique avant le {{deadline}} afin de garantir le bon déroulement de la session.

Nous nous engageons à restituer l''intégralité du matériel en parfait état dès la clôture de la séance.

Merci d''avance pour votre aide précieuse,

{{host_name}}
Équipe Technique — Asteria Club Esprit',
    true
),
(
    'TECHNICAL_EQUIPMENT',
    'EN',
    'Technical Equipment Request: {{activity_title}}',
    'Dear Technical Equipment Team,

For our upcoming project "{{activity_title}}" ({{activity_type}}), scheduled on {{date}} from {{start_time}} to {{end_time}} at {{location}}, we kindly request the following technical equipment.

Equipment checklist:
{{needs_list}}

We would appreciate confirming equipment availability before {{deadline}} to perform our standard pre-session audio/video check.

We guarantee that all equipment will be operated with care and returned promptly at the end of the session.

Thank you very much for your assistance,

{{host_name}}
Technical Lead — Asteria Club Esprit',
    true
),

-- D. LOGISTICS
(
    'LOGISTICS',
    'FR',
    'Coordination logistique et accès : {{activity_title}}',
    'Bonjour l''Équipe Logistique,

Nous vous écrivons afin de coordonner les accès et la logistique d''accueil pour l''activité "{{activity_title}}" organisée par Asteria Club Esprit le {{date}} ({{start_time}} - {{end_time}}) à {{location}}.

Besoins logistiques :
{{needs_list}}

Nous vous remercions de bien vouloir valider la faisabilité de ces dispositions avant le {{deadline}}.

Bien cordialement,
{{host_name}}
Pôle Logistique & Événements — Asteria Club Esprit',
    true
),
(
    'LOGISTICS',
    'EN',
    'Logistics and Building Access Coordination: {{activity_title}}',
    'Dear Logistics and Facilities Team,

We are coordinating the logistics and venue access for "{{activity_title}}" organized by Asteria Club Esprit on {{date}} ({{start_time}} - {{end_time}}) at {{location}}.

Logistical requirements:
{{needs_list}}

Please let us know if these arrangements are confirmed before {{deadline}}.

Best regards,
{{host_name}}
Logistics & Operations — Asteria Club Esprit',
    true
),

-- E. PROMOTION
(
    'PROMOTION',
    'FR',
    'Demande d''affichage et communication institutionnelle : {{activity_title}}',
    'Bonjour le Service Communication,

Asteria Club Esprit prépare l''activité "{{activity_title}}" qui aura lieu le {{date}} à {{start_time}} au campus ESPRIT.

Afin d''informer la communauté étudiante, nous sollicitons l''autorisation et le relais de communication suivants :
{{needs_list}}

Nous restons disponibles pour vous transmettre les visuels finaux avant le {{deadline}}.

Merci pour votre collaboration et mise en valeur des initiatives étudiantes,

{{host_name}}
Community Management & RP — Asteria Club Esprit',
    true
),
(
    'PROMOTION',
    'EN',
    'Campus Promotion and Announcement Request: {{activity_title}}',
    'Dear Communications Department,

Asteria Club Esprit is organizing "{{activity_title}}" on {{date}} at {{start_time}} on the ESPRIT campus.

To share this opportunity with the student body, we request the following promotional support:
{{needs_list}}

We will provide our finalized graphic assets for your review before {{deadline}}.

Thank you for your support and partnership,

{{host_name}}
PR & Communications — Asteria Club Esprit',
    true
),

-- F. PURCHASES
(
    'PURCHASES',
    'FR',
    'Validation de devis et achats : {{activity_title}}',
    'Bonjour le Service Achats et Comptabilité,

Dans le cadre de l''organisation de "{{activity_title}}" (date prévue : {{date}}), nous soumettons à votre approbation les besoins d''achat et consommables rattachés au budget du club.

Éléments et fournitures concernés :
{{needs_list}}

Nous sollicitons votre retour et validation budgétaire avant le {{deadline}} pour engager les commandes nécessaires.

Restant à votre disposition pour tout devis ou facture pro forma,

{{host_name}}
Trésorerie & Organisation — Asteria Club Esprit',
    true
),
(
    'PURCHASES',
    'EN',
    'Purchase and Budget Requisition: {{activity_title}}',
    'Dear Purchasing and Finance Office,

For the organization of "{{activity_title}}" (scheduled date: {{date}}), we submit our material purchase requests under the club allocation.

Items and requisitions:
{{needs_list}}

We kindly request your review and approval before {{deadline}} to proceed with the necessary vendor orders.

Sincerely,
{{host_name}}
Finance & Procurement Lead — Asteria Club Esprit',
    true
)
ON CONFLICT (office, language) DO UPDATE SET
    subject = EXCLUDED.subject,
    body = EXCLUDED.body,
    is_active = EXCLUDED.is_active;

-- 5. DEFAULT PLANNER RESOURCES (Rooms & Standard Hardware)
INSERT INTO public.planner_resources (name, kind, capacity, notes)
VALUES
    ('Amphi A (Campus Ghazela)', 'ROOM', 250, 'Équipé de régie son et double écran de projection'),
    ('Amphi B (Campus Charguia)', 'ROOM', 180, 'Amphithéâtre principal avec vidéoprojecteur HDMI'),
    ('Lab 104 - Informatique & IA', 'ROOM', 35, '35 postes de travail équipés d''écrans 24 pouces'),
    ('Studio Créatif Asteria (Design/Vidéo)', 'ROOM', 20, 'Espace équipé pour tournages, podcasts et design sprints'),
    ('Kit Vidéoprojection & Régie Mobile 1', 'EQUIPMENT', NULL, 'Projecteur 4K, câbles HDMI 15m et adaptateurs USB-C'),
    ('Pack Micros Sans-Fil & Sono Mobile', 'EQUIPMENT', NULL, '2 microphones main sans fil, récepteur et enceinte amplifiée')
ON CONFLICT (name) DO NOTHING;

-- 6. OFFICIAL ESPRIT ADMINISTRATIVE CONTACTS (6 Offices)
INSERT INTO public.admin_contacts (id, office, name, role_title, email, phone, notes, is_active)
VALUES
    ('33333333-0000-0000-0000-000000000001', 'STUDENT_LIFE', 'M. Zied Saidi', 'Responsable du département de la vie étudiante', 'zied.saidi@esprit.tn', '92234330', '1/ Envoyer un e-mail descriptif de l''évènement au moins 1 semaine à l''avance. Rapport d''action et rapport de collecte <= 3 jours post-évent.', true),
    ('33333333-0000-0000-0000-000000000002', 'SCOLARITE', 'M. Mohamed Ali Bouakline', 'Service de la Scolarité (Espace & Vidéoprojecteurs)', 'mohamedali.bouakline@Esprit.tn', NULL, '2/ Si l''événement est validé : réserver l''espace et les vidéoprojecteurs (au moins 10 jours à l''avance). CC: zied.saidi@esprit.tn, faycal.lbabda@esprit.tn', true),
    ('33333333-0000-0000-0000-000000000003', 'TECHNICAL_EQUIPMENT', 'M. Faycel Lbabda', 'Responsable Matériel Technique (Sono & autres)', 'faycal.lbabda@esprit.tn', NULL, '3/ Réserver le matériel technique (sono ou autres) au moins 10 jours à l''avance. Mettre en copie dans tous les e-mails.', true),
    ('33333333-0000-0000-0000-000000000004', 'LOGISTICS', 'M. Hazem Hajji', 'Responsable Logistique', 'hazem.hajji@esprit.tn', NULL, '4/ Tout ce qui concerne la logistique (au moins 10 jours à l''avance). CC: zied.saidi@esprit.tn, faycal.lbabda@esprit.tn', true),
    ('33333333-0000-0000-0000-000000000005', 'PROMOTION', 'Mme Nadia Ajailia', 'Responsable Publication & Promotion des Évènements', 'Nadia.ajailia@Esprit.tn', NULL, '5/ Tout ce qui est publication et promotion des évènements. CC: zied.saidi@esprit.tn, faycal.lbabda@esprit.tn', true),
    ('33333333-0000-0000-0000-000000000006', 'PURCHASES', 'M. Souhail Mezzi', 'Responsable Service Achats (Fournisseurs & BC)', 'souhail.mezzi@esprit.tn', NULL, '6/ Traiter tous vos achats (négociation fournisseurs + envoi du BC). Devis au nom d''Esprit (MF: 830 823 C PM 000). Remettre facture originale cachetée après l''action.', true)
ON CONFLICT (id) DO UPDATE SET
    office = EXCLUDED.office,
    name = EXCLUDED.name,
    role_title = EXCLUDED.role_title,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    notes = EXCLUDED.notes,
    is_active = EXCLUDED.is_active;

