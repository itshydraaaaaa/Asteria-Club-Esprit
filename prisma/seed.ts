import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    throw new Error("Refusing to seed in production without ALLOW_PRODUCTION_SEED=true");
  }

  console.log("Cleaning existing database...");
  await prisma.auditLog.deleteMany();
  await prisma.application.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.rSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.boardSeat.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const defaultPassword =
    process.env.SEED_DEFAULT_PASSWORD ||
    (process.env.NODE_ENV === "production"
      ? crypto.randomBytes(16).toString("hex")
      : "password123");
  const passwordHash = await bcrypt.hash(defaultPassword, 12);

  console.log("Creating departments...");
  const deptWeb = await prisma.department.create({
    data: {
      name: "Web Development",
      slug: "web-development",
      description: "Frontend, Backend, UI/UX Engineering, APIs & Web Platforms for Asteria and client freelance projects.",
      icon: "Code2",
    },
  });

  const deptDesign = await prisma.department.create({
    data: {
      name: "Graphic Design",
      slug: "graphic-design",
      description: "Visual identity, typography, social assets, UI kits and strict brand guideline mastery.",
      icon: "Palette",
    },
  });

  const deptVideo = await prisma.department.create({
    data: {
      name: "Video Editing",
      slug: "video-editing",
      description: "Cinematography, After Effects motion graphics, reels, teasers and club aftermovies.",
      icon: "Video",
    },
  });

  const deptPhoto = await prisma.department.create({
    data: {
      name: "Photography",
      slug: "photography",
      description: "Studio lighting, event photojournalism, color grading and portraiture.",
      icon: "Camera",
    },
  });

  console.log("Creating users...");
  // Board Members
  const pres = await prisma.user.create({
    data: {
      name: "Yasmine Ben Ali",
      email: "president@asteria.tn",
      passwordHash,
      role: "BOARD",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      bio: "President of Asteria Club Esprit. Driving excellence across design, engineering, and freelance pipelines.",
      skills: JSON.stringify(["Leadership", "Project Management", "UI/UX", "Public Speaking"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2024-09-15"),
    },
  });

  const vp = await prisma.user.create({
    data: {
      name: "Omar Trabelsi",
      email: "vp@asteria.tn",
      passwordHash,
      role: "BOARD",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
      bio: "Vice President & Head of Operations. Managing departmental synergies and Asteria Freelance partnerships.",
      skills: JSON.stringify(["Operations", "Strategy", "Web Dev", "Client Relations"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2024-09-15"),
    },
  });

  const sec = await prisma.user.create({
    data: {
      name: "Nour Dridi",
      email: "secretary@asteria.tn",
      passwordHash,
      role: "BOARD",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
      bio: "General Secretary. Ensuring smooth internal communications, logistics, documentation and attendance audits.",
      skills: JSON.stringify(["Administration", "Internal Comms", "Event Planning"]),
      status: "ACTIVE",
      freelanceReady: false,
      joinDate: new Date("2024-10-01"),
    },
  });

  const treas = await prisma.user.create({
    data: {
      name: "Aziz Gharbi",
      email: "treasurer@asteria.tn",
      passwordHash,
      role: "BOARD",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
      bio: "Treasurer. Overseeing club sponsorships, budget allocations, equipment procurement and freelance payouts.",
      skills: JSON.stringify(["Finance", "Sponsorship", "Budgeting", "Data Analysis"]),
      status: "ACTIVE",
      freelanceReady: false,
      joinDate: new Date("2024-10-01"),
    },
  });

  // Board Seats
  await prisma.boardSeat.createMany({
    data: [
      { title: "President", userId: pres.id, order: 1 },
      { title: "Vice President", userId: vp.id, order: 2 },
      { title: "General Secretary", userId: sec.id, order: 3 },
      { title: "Treasurer", userId: treas.id, order: 4 },
    ],
  });

  // Heads of Department
  const hodWeb = await prisma.user.create({
    data: {
      name: "Rayen Ayadi",
      email: "hod.web@asteria.tn",
      passwordHash,
      role: "HOD",
      departmentId: deptWeb.id,
      avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
      bio: "Head of Web Development. Leading technical curricula, full-stack workshops, and freelance architecture.",
      skills: JSON.stringify(["Next.js", "TypeScript", "Tailwind CSS", "Node.js", "PostgreSQL", "System Design"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2024-10-05"),
    },
  });

  const hodDesign = await prisma.user.create({
    data: {
      name: "Maya Mahjoub",
      email: "hod.design@asteria.tn",
      passwordHash,
      role: "HOD",
      departmentId: deptDesign.id,
      avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
      bio: "Head of Graphic Design. Guardian of Asteria Charte Graphique 2026 and mentor for visual storytellers.",
      skills: JSON.stringify(["Figma", "Adobe Illustrator", "Photoshop", "Brand Identity", "Design Systems"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2024-10-05"),
    },
  });

  // Link HoDs to Departments
  await prisma.department.update({
    where: { id: deptWeb.id },
    data: { hodUserId: hodWeb.id },
  });
  await prisma.department.update({
    where: { id: deptDesign.id },
    data: { hodUserId: hodDesign.id },
  });

  // Active Members - Web Development (5 members as specified)
  const memberWeb1 = await prisma.user.create({
    data: {
      name: "Karim Chaabane",
      email: "karim.chaabane@asteria.tn",
      passwordHash,
      role: "MEMBER",
      departmentId: deptWeb.id,
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
      bio: "Frontend enthusiast building modern reactive web apps. Fast learner and active contributor.",
      skills: JSON.stringify(["React", "TypeScript", "Tailwind CSS", "REST APIs", "Git"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2025-01-10"),
    },
  });

  const memberWeb2 = await prisma.user.create({
    data: {
      name: "Sarra Mansour",
      email: "sarra.mansour@asteria.tn",
      passwordHash,
      role: "MEMBER",
      departmentId: deptWeb.id,
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
      bio: "Web developer passionate about accessible UI and interactive web experiences.",
      skills: JSON.stringify(["HTML5/CSS3", "JavaScript", "React", "Figma"]),
      status: "ACTIVE",
      freelanceReady: false,
      joinDate: new Date("2025-01-12"),
    },
  });

  const memberWeb3 = await prisma.user.create({
    data: {
      name: "Amine Ferjani",
      email: "amine.ferjani@asteria.tn",
      passwordHash,
      role: "MEMBER",
      departmentId: deptWeb.id,
      avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
      bio: "Backend specialist with strong fundamentals in Python, Node.js, and cloud deployments.",
      skills: JSON.stringify(["Node.js", "Express", "PostgreSQL", "Docker", "REST APIs"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2025-01-15"),
    },
  });

  const memberWeb4 = await prisma.user.create({
    data: {
      name: "Lina Khemir",
      email: "lina.khemir@asteria.tn",
      passwordHash,
      role: "MEMBER",
      departmentId: deptWeb.id,
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80",
      bio: "Exploring full-stack web development and UI micro-interactions.",
      skills: JSON.stringify(["JavaScript", "CSS Grid/Flexbox", "React Basics"]),
      status: "ACTIVE",
      freelanceReady: false,
      joinDate: new Date("2025-02-01"),
    },
  });

  const memberWeb5 = await prisma.user.create({
    data: {
      name: "Youssef Zghal",
      email: "youssef.zghal@asteria.tn",
      passwordHash,
      role: "MEMBER",
      departmentId: deptWeb.id,
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80",
      bio: "Full-stack engineer with hands-on client freelance experience. Ready for high-impact projects.",
      skills: JSON.stringify(["Next.js", "TypeScript", "GraphQL", "Tailwind CSS", "Prisma"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2024-11-10"),
    },
  });

  // Member - Design
  const memberDesign1 = await prisma.user.create({
    data: {
      name: "Sirine Sassi",
      email: "sirine.sassi@asteria.tn",
      passwordHash,
      role: "MEMBER",
      departmentId: deptDesign.id,
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
      bio: "Graphic designer crafting posters, brand identities, and 2D vector illustrations.",
      skills: JSON.stringify(["Illustrator", "Photoshop", "Typography", "Poster Design"]),
      status: "ACTIVE",
      freelanceReady: true,
      joinDate: new Date("2025-01-10"),
    },
  });

  // Applicant
  await prisma.user.create({
    data: {
      name: "Mehdi Bouazizi",
      email: "mehdi.applicant@esprit.tn",
      passwordHash,
      role: "APPLICANT",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80",
      bio: "Esprit 2nd year student eager to join Asteria Web Development department.",
      skills: JSON.stringify(["HTML", "CSS", "JavaScript"]),
      status: "INACTIVE",
      freelanceReady: false,
    },
  });

  console.log("Creating Tasks...");
  // Tasks across all 4 Kanban statuses
  const task1 = await prisma.task.create({
    data: {
      title: "Design Asteria 2026 Component Library in Figma",
      description: "Establish atomic buttons, input fields, modals, and brand colors adhering strictly to the Charte Graphique v2.1.",
      departmentId: deptDesign.id,
      assigneeId: hodDesign.id,
      createdById: pres.id,
      status: "DONE",
      priority: "HIGH",
      dueDate: new Date(Date.now() - 2 * 86400000),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Build Asteria Club Operating System v1.0",
      description: "Implement full management platform with role permissions, interactive org chart, Kanban board, and QR attendance.",
      departmentId: deptWeb.id,
      assigneeId: hodWeb.id,
      createdById: pres.id,
      status: "IN_PROGRESS",
      priority: "URGENT",
      dueDate: new Date(Date.now() + 3 * 86400000),
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Implement QR Check-in & Scanner Engine",
      description: "Build the dynamic QR generator with rotating security codes and camera scanner interface for fast event check-ins.",
      departmentId: deptWeb.id,
      assigneeId: memberWeb1.id,
      createdById: hodWeb.id,
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 4 * 86400000),
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Create Welcome Kit & Social Media Story Assets",
      description: "Generate high-resolution teaser stories, Instagram carousels, and department badges for new recruits.",
      departmentId: deptDesign.id,
      assigneeId: memberDesign1.id,
      createdById: hodDesign.id,
      status: "REVIEW",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 1 * 86400000),
    },
  });

  const task5 = await prisma.task.create({
    data: {
      title: "Set up Discord Webhook Sync for Announcements",
      description: "Integrate automatic webhook pushes to the Asteria Discord server whenever a club or dept announcement is published.",
      departmentId: deptWeb.id,
      assigneeId: memberWeb3.id,
      createdById: hodWeb.id,
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 6 * 86400000),
    },
  });

  const task6 = await prisma.task.create({
    data: {
      title: "Optimize Mobile Responsive Layout for Member Attendance",
      description: "Ensure touch-friendly check-in buttons and smooth drawer animations on mobile viewports for club members.",
      departmentId: deptWeb.id,
      assigneeId: memberWeb2.id,
      createdById: hodWeb.id,
      status: "TODO",
      priority: "LOW",
      dueDate: new Date(Date.now() + 8 * 86400000),
    },
  });

  const task7 = await prisma.task.create({
    data: {
      title: "Produce Esprit Hackathon Aftermovie Teaser",
      description: "Cut 4K footage from the opening ceremony, sync with fast-paced rhythmic audio track, and export 9:16 vertical cut.",
      departmentId: deptVideo.id,
      createdById: vp.id,
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 5 * 86400000),
    },
  });

  // Task Comments
  await prisma.taskComment.createMany({
    data: [
      {
        taskId: task2.id,
        userId: pres.id,
        body: "Make sure all motion timings strictly respect our 300ms 'Vague' and 'Courant' curves.",
      },
      {
        taskId: task2.id,
        userId: hodWeb.id,
        body: "Tokens configured in Tailwind with custom cubic-beziers. All pages adhering to the type scale.",
      },
      {
        taskId: task3.id,
        userId: memberWeb1.id,
        body: "QR code generation using html5-qrcode is running smoothly in lab testing.",
      },
    ],
  });

  console.log("Creating Events...");
  // Upcoming Events
  const event1 = await prisma.event.create({
    data: {
      title: "Asteria General Assembly 2026 #1",
      description: "Mandatory all-hands gathering for all departments. Annual vision presentation, board updates, and Asteria Freelance client roadmap.",
      startTime: new Date(Date.now() + 3 * 86400000),
      endTime: new Date(Date.now() + 3 * 86400000 + 7200000),
      location: "Amphithéâtre Esprit Bloc B",
      departmentId: null, // Club-wide
      checkInCode: "AST-GEN26",
      createdById: pres.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: "Web Dev Workshop: Advanced Next.js & Full-Stack Architecture",
      description: "Hands-on coding session covering App Router, Server Actions, Prisma relational ORM, and high-performance caching.",
      startTime: new Date(Date.now() + 5 * 86400000),
      endTime: new Date(Date.now() + 5 * 86400000 + 10800000),
      location: "Lab 3.4 & Discord Voice Channel",
      departmentId: deptWeb.id,
      checkInCode: "WEB-DEV26",
      createdById: hodWeb.id,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: "Graphic Design Masterclass: Brand Guideline Strictness",
      description: "Deep dive into visual hierarchy, font pairing rules, and protection zone preservation for production assets.",
      startTime: new Date(Date.now() + 7 * 86400000),
      endTime: new Date(Date.now() + 7 * 86400000 + 7200000),
      location: "Design Room 1.2",
      departmentId: deptDesign.id,
      checkInCode: "DES-MAS26",
      createdById: hodDesign.id,
    },
  });

  // Past Event with Attendance Records
  const pastEvent = await prisma.event.create({
    data: {
      title: "Asteria Fall Welcome & Kickoff Meeting",
      description: "Introductory session welcoming new members, assigning mentors, and reviewing departmental objectives.",
      startTime: new Date(Date.now() - 5 * 86400000),
      endTime: new Date(Date.now() - 5 * 86400000 + 7200000),
      location: "Main Hall Bloc A",
      departmentId: null, // Club-wide
      checkInCode: "AST-KICK25",
      createdById: pres.id,
    },
  });

  // RSVPs for upcoming events
  await prisma.rSVP.createMany({
    data: [
      { eventId: event1.id, userId: pres.id, status: "GOING" },
      { eventId: event1.id, userId: vp.id, status: "GOING" },
      { eventId: event1.id, userId: hodWeb.id, status: "GOING" },
      { eventId: event1.id, userId: hodDesign.id, status: "GOING" },
      { eventId: event1.id, userId: memberWeb1.id, status: "GOING" },
      { eventId: event1.id, userId: memberWeb2.id, status: "MAYBE" },
      { eventId: event1.id, userId: memberWeb3.id, status: "GOING" },
      { eventId: event2.id, userId: hodWeb.id, status: "GOING" },
      { eventId: event2.id, userId: memberWeb1.id, status: "GOING" },
      { eventId: event2.id, userId: memberWeb2.id, status: "GOING" },
      { eventId: event2.id, userId: memberWeb3.id, status: "GOING" },
      { eventId: event2.id, userId: memberWeb4.id, status: "GOING" },
      { eventId: event2.id, userId: memberWeb5.id, status: "GOING" },
    ],
  });

  // Attendance for past event
  await prisma.attendanceRecord.createMany({
    data: [
      { eventId: pastEvent.id, userId: pres.id, method: "MANUAL", status: "PRESENT" },
      { eventId: pastEvent.id, userId: vp.id, method: "QR", status: "PRESENT" },
      { eventId: pastEvent.id, userId: sec.id, method: "QR", status: "PRESENT" },
      { eventId: pastEvent.id, userId: hodWeb.id, method: "QR", status: "PRESENT" },
      { eventId: pastEvent.id, userId: hodDesign.id, method: "QR", status: "PRESENT" },
      { eventId: pastEvent.id, userId: memberWeb1.id, method: "QR", status: "PRESENT" },
      { eventId: pastEvent.id, userId: memberWeb2.id, method: "CODE", status: "PRESENT" },
      { eventId: pastEvent.id, userId: memberWeb3.id, method: "QR", status: "PRESENT" },
      { eventId: pastEvent.id, userId: memberWeb4.id, method: "MANUAL", status: "PRESENT" },
      {
        eventId: pastEvent.id,
        userId: memberWeb5.id,
        method: "MANUAL",
        status: "EXCUSED",
        justification: "Participating in Esprit National Robotics Olympiad",
      },
    ],
  });

  console.log("Creating Announcements...");
  await prisma.announcement.createMany({
    data: [
      {
        title: "Official Launch of the Asteria Management Platform 2026",
        body: "Welcome all Asterians to our brand new operating platform! Built from the ground up strictly adhering to our Charte Graphique 2026 v2.1. Use this hub to track your department tasks, check into weekly meetings, and build your freelance readiness portfolio.",
        scope: "CLUB",
        authorId: pres.id,
        isPinned: true,
      },
      {
        title: "Web Development Department Sprint 1 & Project Assignments",
        body: "Hello Web Dev team! Our sprint starts this Monday. Check the Task Kanban board for your assigned tickets. We have 3 major web portals in development. Please review our component library standards.",
        scope: "DEPARTMENT",
        departmentId: deptWeb.id,
        authorId: hodWeb.id,
        isPinned: true,
      },
      {
        title: "Asteria Freelance Division: Open Call for Client Projects",
        body: "Members who have reached 'Freelance Ready' status will be prioritized for upcoming paid corporate contracts starting next month. Ensure your profile skills and task completions are up to date.",
        scope: "CLUB",
        authorId: vp.id,
        isPinned: false,
      },
    ],
  });

  console.log("Creating Recruitment Applications...");
  await prisma.application.createMany({
    data: [
      {
        name: "Selim Ben Salem",
        email: "selim.dev@esprit.tn",
        phone: "+216 28 111 222",
        departmentPreference: "Web Development",
        motivation: "I love building clean UI with React and Tailwind CSS. I have developed 2 campus portals and want to contribute to Asteria's freelance projects.",
        portfolioLink: "https://github.com/selim-dev",
        status: "PENDING",
        reviewerNotes: "Strong GitHub profile with active commits. Recommended for technical interview.",
      },
      {
        name: "Eya Bouhlel",
        email: "eya.design@esprit.tn",
        phone: "+216 99 333 444",
        departmentPreference: "Graphic Design",
        motivation: "Specialized in 3D typography, vector illustrations, and brand identities. Asteria's charte graphique is truly inspiring.",
        portfolioLink: "https://behance.net/eyabouhlel",
        status: "PENDING",
        reviewerNotes: "Excellent Behance portfolio with modern aesthetics.",
      },
      {
        name: "Fares Ghedira",
        email: "fares.video@esprit.tn",
        phone: "+216 55 777 888",
        departmentPreference: "Video Editing",
        motivation: "Experienced in Premiere Pro and DaVinci Resolve color grading. Ready to produce cinematic aftermovies for Asteria.",
        portfolioLink: "https://youtube.com/@faresfilms",
        status: "ACCEPTED",
        reviewerNotes: "Accepted into Video Editing department. Welcome email sent.",
      },
    ],
  });

  console.log("Creating Audit Logs...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: pres.id,
        action: "CYCLE_INITIALIZED",
        details: "Academic Year Cycle 2025-2026 initialized with 4 departments.",
      },
      {
        userId: hodWeb.id,
        action: "TASK_CREATED",
        details: "Created task: Implement QR Check-in & Scanner Engine",
      },
      {
        userId: pres.id,
        action: "ROLE_PROMOTED",
        details: "Promoted Rayen Ayadi to Head of Department (Web Development)",
      },
    ],
  });

  console.log("Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
