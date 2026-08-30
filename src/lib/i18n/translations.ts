export type Language = "en" | "fr";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    fr: string;
  };
}

export const translations: TranslationDictionary = {
  // Navigation & Branding
  "nav.departments": {
    en: "Departments",
    fr: "Départements",
  },
  "nav.workflow": {
    en: "Workflow",
    fr: "Méthodologie",
  },
  "nav.recruitment": {
    en: "Recruitment",
    fr: "Recrutement",
  },
  "nav.roles": {
    en: "Governance",
    fr: "Gouvernance",
  },
  "nav.freelance": {
    en: "Asteria Freelance PreLaunch",
    fr: "Asteria Freelance PreLaunch",
  },
  "nav.apply": {
    en: "Join Asteria",
    fr: "Rejoindre Asteria",
  },
  "nav.portal": {
    en: "Member Portal",
    fr: "Portail Membres",
  },
  "nav.dashboard": {
    en: "Dashboard",
    fr: "Tableau de bord",
  },
  "nav.tasks": {
    en: "Tasks & Kanban",
    fr: "Tâches & Kanban",
  },
  "nav.attendance": {
    en: "Attendance & QR",
    fr: "Présence & QR",
  },
  "nav.calendar": {
    en: "Calendar & Events",
    fr: "Calendrier & Événements",
  },
  "nav.announcements": {
    en: "Announcements",
    fr: "Annonces",
  },
  "nav.orgChart": {
    en: "Org Chart",
    fr: "Organigramme",
  },
  "nav.members": {
    en: "Members Directory",
    fr: "Annuaire des Membres",
  },
  "nav.applications": {
    en: "Applications",
    fr: "Candidatures",
  },
  "nav.admin": {
    en: "Admin Audit Log",
    fr: "Journal d'Audit Admin",
  },
  "nav.logout": {
    en: "Log Out",
    fr: "Déconnexion",
  },

  // Hero Section
  "hero.badge": {
    en: "Asteria Club Esprit — Operating System",
    fr: "Système d'Exploitation — Asteria Club Esprit",
  },
  "hero.title1": {
    en: "The Creative Engine",
    fr: "Le Moteur Créatif",
  },
  "hero.title2": {
    en: "of Esprit.",
    fr: "d'Esprit.",
  },
  "hero.subtitle": {
    en: "Where Tunisia's most ambitious designers, video editors, web developers, and photographers build together. 4 departments, 1 uncompromising standard.",
    fr: "Là où les designers, monteurs vidéo, développeurs web et photographes les plus ambitieux de Tunisie construisent ensemble. 4 départements, 1 exigence d'excellence.",
  },
  "hero.cta.apply": {
    en: "Apply for Membership",
    fr: "Postuler au Club",
  },
  "hero.cta.portal": {
    en: "Member Portal",
    fr: "Espace Membre",
  },
  "hero.stat.hubs": {
    en: "Specialized Hubs",
    fr: "Pôles Spécialisés",
  },
  "hero.stat.pipeline": {
    en: "Production Pipeline",
    fr: "Pipeline de Production",
  },
  "hero.stat.work": {
    en: "Real Industry Work",
    fr: "Projets Professionnels",
  },
  "hero.stat.growth": {
    en: "Merit-Based Growth",
    fr: "Progression au Mérite",
  },

  // Departments Section
  "departments.badge": {
    en: "Creative Capabilities",
    fr: "Compétences Créatives",
  },
  "departments.title": {
    en: "Four Hubs. One Standard.",
    fr: "Quatre Pôles. Un Seul Standard.",
  },
  "departments.subtitle": {
    en: "Every department operates as an autonomous studio with senior leadership, structured pipelines, and production-grade tools.",
    fr: "Chaque département fonctionne comme un studio autonome avec un encadrement senior, des pipelines structurés et des outils de niveau professionnel.",
  },
  "dept.design.title": {
    en: "Graphic Design",
    fr: "Design Graphique",
  },
  "dept.design.desc": {
    en: "Brand identities, visual systems, editorial layouts, 3D graphics, and marketing assets engineered for impact.",
    fr: "Identités visuelles, systèmes graphiques, chartes éditoriales, modélisation 3D et supports marketing d'impact.",
  },
  "dept.video.title": {
    en: "Video Editing",
    fr: "Montage Vidéo",
  },
  "dept.video.desc": {
    en: "Cinematic narratives, dynamic motion graphics, sound design, color grading, and event recaps that captivate.",
    fr: "Récits cinématographiques, motion design dynamique, sound design, étalonnage couleur et captations d'événements.",
  },
  "dept.web.title": {
    en: "Web Development",
    fr: "Développement Web",
  },
  "dept.web.desc": {
    en: "High-performance web applications, interactive portfolios, bespoke internal tools, and modern digital experiences.",
    fr: "Applications web haute performance, portfolios interactifs, outils internes sur mesure et expériences numériques modernes.",
  },
  "dept.photo.title": {
    en: "Photography",
    fr: "Photographie",
  },
  "dept.photo.desc": {
    en: "Editorial portraits, event documentation, product showcases, and high-fidelity visual storytelling.",
    fr: "Portraits éditoriaux, couverture d'événements, photographies produits et narration visuelle haute fidélité.",
  },
  "dept.explore": {
    en: "Explore Department",
    fr: "Explorer le Pôle",
  },

  // Workflow / Architecture Section
  "workflow.badge": {
    en: "Operational Architecture",
    fr: "Architecture Opérationnelle",
  },
  "workflow.title": {
    en: "Engineered for Excellence",
    fr: "Conçu pour l'Excellence",
  },
  "workflow.subtitle": {
    en: "Asteria bridges academic potential and professional industry standards through rigorous process governance.",
    fr: "Asteria fait le pont entre potentiel universitaire et standards professionnels grâce à une gouvernance rigoureuse.",
  },
  "workflow.step1.title": {
    en: "Real Client Specs",
    fr: "Cahiers des Charges Réels",
  },
  "workflow.step1.desc": {
    en: "Briefs are sourced from campus events, university partners, and external stakeholders with structured deadlines.",
    fr: "Les briefs proviennent d'événements du campus, de partenaires universitaires et de clients avec des délais stricts.",
  },
  "workflow.step2.title": {
    en: "Multi-Role Governance",
    fr: "Gouvernance Multi-Niveaux",
  },
  "workflow.step2.desc": {
    en: "Clear escalation paths between Board, Heads of Department (HOD), and Active Members ensure agile execution.",
    fr: "Une hiérarchie fluide entre le Bureau, les Chefs de Département (HOD) et les Membres assure une exécution agile.",
  },
  "workflow.step3.title": {
    en: "Production Quality Gates",
    fr: "Contrôle Qualité Strict",
  },
  "workflow.step3.desc": {
    en: "No asset ships without peer review, lead approval, and adherence to Asteria's precision design guidelines.",
    fr: "Aucune création n'est livrée sans revue par les pairs, validation du lead et respect de la charte Asteria.",
  },
  "workflow.step4.title": {
    en: "Direct Freelance Bridge",
    fr: "Passerelle Freelance Directe",
  },
  "workflow.step4.desc": {
    en: "Top performers fast-track directly into Asteria Freelance PreLaunch for paid commercial client projects across EMEA.",
    fr: "Les meilleurs profils accèdent directement à Asteria Freelance PreLaunch pour des projets clients rémunérés en zone EMEA.",
  },

  // Recruitment Section
  "recruitment.badge": {
    en: "Talent Pipeline",
    fr: "Processus de Recrutement",
  },
  "recruitment.title": {
    en: "How to Join Asteria",
    fr: "Comment Rejoindre Asteria",
  },
  "recruitment.subtitle": {
    en: "We accept ambitious creators through a selective, portfolio-first evaluation process twice per year.",
    fr: "Nous recrutons des créateurs ambitieux via une sélection rigoureuse sur portfolio deux fois par an.",
  },
  "recruitment.step1.title": {
    en: "1. Submit Portfolio",
    fr: "1. Dépôt de Portfolio",
  },
  "recruitment.step1.desc": {
    en: "Fill out the candidate application form with your best creative work or GitHub repository links.",
    fr: "Remplissez le formulaire de candidature avec vos meilleures créations ou vos dépôts GitHub.",
  },
  "recruitment.step2.title": {
    en: "2. Technical Challenge",
    fr: "2. Défi Technique",
  },
  "recruitment.step2.desc": {
    en: "Complete a 48-hour department-specific creative prompt assessed by current Heads of Department.",
    fr: "Réalisez un défi créatif de 48h spécifique à votre pôle, évalué par les Chefs de Département.",
  },
  "recruitment.step3.title": {
    en: "3. Board Interview",
    fr: "3. Entretien avec le Bureau",
  },
  "recruitment.step3.desc": {
    en: "A 20-minute conversation focused on culture fit, drive, curiosity, and long-term commitment.",
    fr: "Un échange de 20 minutes axé sur votre motivation, votre curiosité et votre engagement à long terme.",
  },
  "recruitment.step4.title": {
    en: "4. Full Onboarding",
    fr: "4. Intégration & Accès",
  },
  "recruitment.step4.desc": {
    en: "Gain immediate access to Discord, GitHub team orgs, Figma workspaces, and internal dashboards.",
    fr: "Accédez immédiatement au Discord, aux organisations GitHub, aux espaces Figma et au tableau de bord.",
  },

  // Asteria Freelance Callout
  "freelance.badge": {
    en: "Commercial Division",
    fr: "Pôle Commercial",
  },
  "freelance.title": {
    en: "Looking for Client-Ready Work?",
    fr: "Vous cherchez des projets clients rémunérés ?",
  },
  "freelance.subtitle": {
    en: "Asteria Freelance PreLaunch is our commercial agency branch delivering high-end brand identities, full-stack applications, and video productions worldwide.",
    fr: "Asteria Freelance PreLaunch est notre agence commerciale réalisant des identités visuelles, des applications web complètes et des productions vidéo à l'international.",
  },
  "freelance.cta": {
    en: "Visit Asteria Freelance PreLaunch",
    fr: "Découvrir Asteria Freelance PreLaunch",
  },

  // Apply Form Page
  "apply.title": {
    en: "Join Asteria Club Esprit",
    fr: "Rejoindre Asteria Club Esprit",
  },
  "apply.subtitle": {
    en: "Candidate Recruitment Portal — Submit your application to join Tunisia's premier student creative engine.",
    fr: "Portail de Recrutement — Déposez votre candidature pour intégrer l'élite de la création étudiante en Tunisie.",
  },
  "apply.form.fullName": {
    en: "Full Name",
    fr: "Nom et Prénom",
  },
  "apply.form.email": {
    en: "Esprit / Student Email",
    fr: "Email Étudiant / Esprit",
  },
  "apply.form.department": {
    en: "Target Department",
    fr: "Département Souhaité",
  },
  "apply.form.portfolio": {
    en: "Portfolio / Behance / Google Drive URL",
    fr: "Lien Portfolio / Behance / Google Drive",
  },
  "apply.form.github": {
    en: "GitHub Profile URL (Optional for Devs)",
    fr: "Profil GitHub (Optionnel pour les Devs)",
  },
  "apply.form.experience": {
    en: "Years of Experience / Level",
    fr: "Niveau d'Expérience / Année d'études",
  },
  "apply.form.why": {
    en: "Why do you want to join Asteria?",
    fr: "Pourquoi souhaitez-vous rejoindre Asteria ?",
  },
  "apply.form.submit": {
    en: "Submit Application",
    fr: "Envoyer ma Candidature",
  },
  "apply.form.submitting": {
    en: "Submitting Application...",
    fr: "Envoi de la candidature...",
  },
  "apply.success.title": {
    en: "Application Received!",
    fr: "Candidature Bien Reçue !",
  },
  "apply.success.desc": {
    en: "Thank you for applying to Asteria Club Esprit. Our Board and Department Leads will review your portfolio and reach out via email shortly.",
    fr: "Merci d'avoir postulé à Asteria Club Esprit. Notre Bureau et les Chefs de Département examineront votre profil et vous contacteront par email très prochainement.",
  },
  "apply.success.cta": {
    en: "Return to Homepage",
    fr: "Retour à l'Accueil",
  },

  // Auth Pages (Login & Signup)
  "auth.login.title": {
    en: "Member Authentication",
    fr: "Connexion Membre",
  },
  "auth.login.subtitle": {
    en: "Enter your credentials to access the Asteria Operating System.",
    fr: "Saisissez vos identifiants pour accéder au système d'exploitation Asteria.",
  },
  "auth.login.email": {
    en: "Email Address",
    fr: "Adresse Email",
  },
  "auth.login.password": {
    en: "Password",
    fr: "Mot de passe",
  },
  "auth.login.submit": {
    en: "Authenticate",
    fr: "Se Connecter",
  },
  "auth.login.submitting": {
    en: "Authenticating...",
    fr: "Connexion en cours...",
  },
  "auth.login.quickDemo": {
    en: "Quick Demo Accounts",
    fr: "Comptes de Démonstration",
  },
  "auth.signup.title": {
    en: "Create an Account",
    fr: "Créer un Compte",
  },
  "auth.signup.subtitle": {
    en: "Register your member profile to join the team workflow.",
    fr: "Inscrivez votre profil pour rejoindre l'espace de travail d'équipe.",
  },
  "auth.signup.name": {
    en: "Full Name",
    fr: "Nom Complet",
  },
  "auth.signup.submit": {
    en: "Create Account",
    fr: "Créer mon Compte",
  },
  "auth.signup.haveAccount": {
    en: "Already have an account? Log in",
    fr: "Vous avez déjà un compte ? Se connecter",
  },
  "auth.login.noAccount": {
    en: "Don't have an account? Apply to join",
    fr: "Pas encore de compte ? Postuler pour rejoindre",
  },

  // Dashboard Overview
  "dashboard.overview": {
    en: "Dashboard Overview",
    fr: "Vue d'Ensemble",
  },
  "dashboard.welcome": {
    en: "Welcome back",
    fr: "Bienvenue",
  },
  "dashboard.stats.members": {
    en: "Active Members",
    fr: "Membres Actifs",
  },
  "dashboard.stats.departments": {
    en: "Creative Hubs",
    fr: "Pôles Créatifs",
  },
  "dashboard.stats.tasks": {
    en: "Active Tasks",
    fr: "Tâches en Cours",
  },
  "dashboard.stats.velocity": {
    en: "Sprint Velocity",
    fr: "Vélocité du Sprint",
  },
  "dashboard.recentTasks": {
    en: "Recent Tasks",
    fr: "Tâches Récentes",
  },
  "dashboard.upcomingEvents": {
    en: "Upcoming Events",
    fr: "Événements à Venir",
  },
  "dashboard.departmentPulse": {
    en: "Department Pulse",
    fr: "Activité des Pôles",
  },
  "dashboard.viewAll": {
    en: "View All",
    fr: "Tout Afficher",
  },

  // Tasks & Kanban
  "tasks.title": {
    en: "Task Kanban Board",
    fr: "Tableau Kanban des Tâches",
  },
  "tasks.subtitle": {
    en: "Manage production deliverables across departments.",
    fr: "Gérez les livrables de production à travers tous les pôles.",
  },
  "tasks.col.todo": {
    en: "To Do",
    fr: "À Faire",
  },
  "tasks.col.inProgress": {
    en: "In Progress",
    fr: "En Cours",
  },
  "tasks.col.review": {
    en: "In Review",
    fr: "En Révision",
  },
  "tasks.col.done": {
    en: "Completed",
    fr: "Terminé",
  },
  "tasks.add": {
    en: "New Task",
    fr: "Nouvelle Tâche",
  },
  "tasks.filter": {
    en: "Filter by Department",
    fr: "Filtrer par Département",
  },

  // Attendance
  "attendance.title": {
    en: "Attendance & QR Check-In",
    fr: "Présence & Check-In QR",
  },
  "attendance.subtitle": {
    en: "Real-time session attendance and justification tracking.",
    fr: "Suivi en temps réel des présences et justifications d'absence.",
  },
  "attendance.scan": {
    en: "Scan QR Code",
    fr: "Scanner le QR Code",
  },
  "attendance.generate": {
    en: "Generate Session QR",
    fr: "Générer un QR de Session",
  },
  "attendance.history": {
    en: "Attendance Log",
    fr: "Historique des Présences",
  },
  "attendance.present": {
    en: "Present",
    fr: "Présent",
  },
  "attendance.absent": {
    en: "Absent",
    fr: "Absent",
  },
  "attendance.late": {
    en: "Late",
    fr: "En Retard",
  },
  "attendance.justify": {
    en: "Submit Justification",
    fr: "Soumettre une Justification",
  },

  // Calendar
  "calendar.title": {
    en: "Calendar & Schedule",
    fr: "Calendrier & Planning",
  },
  "calendar.subtitle": {
    en: "Club meetings, project deadlines, and workshops.",
    fr: "Réunions du club, échéances de projets et ateliers.",
  },
  "calendar.newEvent": {
    en: "Create Event",
    fr: "Nouvel Événement",
  },
  "calendar.rsvp": {
    en: "RSVP Now",
    fr: "Confirmer Présence",
  },
  "calendar.attending": {
    en: "Attending",
    fr: "Inscrit",
  },

  // Announcements
  "announcements.title": {
    en: "Club Announcements",
    fr: "Annonces du Club",
  },
  "announcements.subtitle": {
    en: "Official broadcasts from the Executive Board and Leads.",
    fr: "Communications officielles du Bureau et des Responsables.",
  },
  "announcements.create": {
    en: "Post Announcement",
    fr: "Publier une Annonce",
  },
  "announcements.pinned": {
    en: "Pinned",
    fr: "Épinglé",
  },

  // Members & Org Chart
  "members.title": {
    en: "Member Directory",
    fr: "Annuaire des Membres",
  },
  "members.subtitle": {
    en: "Browse Asteria creators, department leads, and board members.",
    fr: "Consultez la liste des créateurs, chefs de pôles et membres du bureau.",
  },
  "members.search": {
    en: "Search members by name or skill...",
    fr: "Rechercher un membre par nom ou compétence...",
  },
  "members.role.all": {
    en: "All Roles",
    fr: "Tous les Rôles",
  },
  "members.role.board": {
    en: "Executive Board",
    fr: "Bureau Exécutif",
  },
  "members.role.hod": {
    en: "Head of Department",
    fr: "Chef de Département",
  },
  "members.role.member": {
    en: "Active Member",
    fr: "Membre Actif",
  },
  "members.role.applicant": {
    en: "Applicant",
    fr: "Candidat",
  },

  // Applications
  "applications.title": {
    en: "Recruitment Applications",
    fr: "Gestion des Candidatures",
  },
  "applications.subtitle": {
    en: "Review, evaluate, and onboard prospective members.",
    fr: "Examinez, évaluez et intégrez les futurs membres.",
  },
  "applications.status.pending": {
    en: "Pending Review",
    fr: "En Attente",
  },
  "applications.status.accepted": {
    en: "Accepted",
    fr: "Accepté",
  },
  "applications.status.rejected": {
    en: "Declined",
    fr: "Refusé",
  },
  "applications.onboard": {
    en: "Onboard Member",
    fr: "Intégrer au Club",
  },

  // Admin
  "admin.title": {
    en: "System Administration & Audit",
    fr: "Administration Système & Audit",
  },
  "admin.subtitle": {
    en: "Real-time security logs, role management, and system health.",
    fr: "Journaux de sécurité en direct, gestion des rôles et état du système.",
  },

  // Common UI
  "common.language": {
    en: "Language",
    fr: "Langue",
  },
  "common.theme": {
    en: "Theme",
    fr: "Thème",
  },
  "common.save": {
    en: "Save Changes",
    fr: "Enregistrer",
  },
  "common.cancel": {
    en: "Cancel",
    fr: "Annuler",
  },
  "common.loading": {
    en: "Loading...",
    fr: "Chargement...",
  },
  "common.error": {
    en: "An error occurred",
    fr: "Une erreur est survenue",
  },
  "common.success": {
    en: "Operation completed successfully",
    fr: "Opération réussie avec succès",
  },
  "common.footer.rights": {
    en: "All rights reserved. Built for creators at Esprit.",
    fr: "Tous droits réservés. Développé pour les créateurs d'Esprit.",
  },
};
