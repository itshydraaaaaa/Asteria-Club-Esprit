/**
 * Asteria Club Esprit — Activity Planner Unit Tests
 * Tests backward scheduling, status guards, email rendering, and conflict rules.
 */

import {
  shiftToPreviousWorkingDay,
  calculateTaskDueDate,
  validateLeadTime,
  renderEmailTemplate,
  canTransitionToApproved,
  canTransitionToPromotion,
  canTransitionToClosed,
  validateStatusTransition,
  detectResourceConflict,
  detectAgendaConflicts,
  computeAttentionFlags,
  evaluateActivityReadiness,
} from "./logic";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${errorDetail || "Assertion failed"}`);
    failedCount++;
  }
}

console.log("\n=======================================================");
console.log("RUNNING ACTIVITY PLANNER UNIT TESTS (FULL SUITE)");
console.log("=======================================================\n");

// ---------------------------------------------------------------------------
// 1. BACKWARD SCHEDULING TESTS
// ---------------------------------------------------------------------------
console.log("1. Backward Scheduling & Weekend Shifting:");

// Test 1.1: Weekend shift
// 2026-10-17 is Saturday -> should shift to 2026-10-16 (Friday)
const satDate = new Date("2026-10-17T10:00:00Z");
const shiftedSat = shiftToPreviousWorkingDay(satDate);
assert(
  shiftedSat.getDay() === 5 && shiftedSat.getDate() === 16,
  "Shift Saturday (17th) to Friday (16th)",
  `Got day: ${shiftedSat.getDay()}, date: ${shiftedSat.getDate()}`
);

// 2026-10-18 is Sunday -> should shift to 2026-10-16 (Friday)
const sunDate = new Date("2026-10-18T10:00:00Z");
const shiftedSun = shiftToPreviousWorkingDay(sunDate);
assert(
  shiftedSun.getDay() === 5 && shiftedSun.getDate() === 16,
  "Shift Sunday (18th) to Friday (16th)",
  `Got day: ${shiftedSun.getDay()}, date: ${shiftedSun.getDate()}`
);

// 2026-10-15 is Thursday -> should remain Thursday (15th)
const thuDate = new Date("2026-10-15T10:00:00Z");
const shiftedThu = shiftToPreviousWorkingDay(thuDate);
assert(
  shiftedThu.getDay() === 4 && shiftedThu.getDate() === 15,
  "Weekday (Thursday) remains unchanged"
);

// Test 1.2: calculateTaskDueDate offset calculation
// Event starts 2026-11-20 (Friday). Offset 7 days = 2026-11-13 (Friday).
const nowSimulated = new Date("2026-10-01T00:00:00Z");
const taskSchedule = calculateTaskDueDate("2026-11-20T10:00:00Z", 7, nowSimulated);
const targetDay = new Date(taskSchedule.dueDate);
assert(
  targetDay.getDate() === 13 && targetDay.getMonth() === 10, // Month 10 = November (0-indexed)
  "Due date calculation: 2026-11-20 minus 7 days is 2026-11-13"
);
assert(!taskSchedule.isCompressed, "Future task is not compressed");
assert(taskSchedule.shortfallDays === 0, "Future task has 0 shortfall days");

// Test 1.3: Compressed task when due date falls in past
// Event is 2026-10-15. Offset 21 days = 2026-09-24. Now is 2026-10-01.
const compressedSchedule = calculateTaskDueDate("2026-10-15T10:00:00Z", 21, nowSimulated);
assert(compressedSchedule.isCompressed, "Past due date is flagged as compressed");
assert(compressedSchedule.shortfallDays > 0, "Compressed task reports positive shortfall days");

// Test 1.4: Lead time validation
const leadValidation = validateLeadTime("2026-10-10T00:00:00Z", 21, nowSimulated);
assert(!leadValidation.isSufficient, "Insufficient lead time correctly triggers warning");
assert(leadValidation.warning !== undefined, "Warning message provided on insufficient lead time");

// ---------------------------------------------------------------------------
// 2. EMAIL PLACEHOLDER RENDERING TESTS
// ---------------------------------------------------------------------------
console.log("\n2. Email Placeholder Rendering:");

const templateValid = "Bonjour, l'activité {{activity_title}} ({{activity_type}}) se tiendra le {{date}}.";
const rendered = renderEmailTemplate(templateValid, {
  activity_title: "Atelier Next.js 16",
  activity_type: "Workshop",
  date: "15 Novembre 2026",
});
assert(
  rendered === "Bonjour, l'activité Atelier Next.js 16 (Workshop) se tiendra le 15 Novembre 2026.",
  "Correctly substitutes valid double-brace placeholders"
);

// Test single-brace {key} and lead_organizer alias
const singleBraceTpl = "Responsable: {lead_organizer} pour {activity_title} à {location}";
const renderedSingle = renderEmailTemplate(singleBraceTpl, {
  host_name: "Yassine Ben Ali",
  activity_title: "Hackathon AI",
  location: "Amphi B",
});
assert(
  renderedSingle === "Responsable: Yassine Ben Ali pour Hackathon AI à Amphi B",
  "Correctly substitutes single-brace {key} placeholders and resolves lead_organizer from host_name"
);

// Test unknown placeholder raises error
let threwOnUnknown = false;
try {
  renderEmailTemplate("Email avec {{fake_unknown_placeholder}}", { activity_title: "Test" });
} catch (err: any) {
  threwOnUnknown = true;
  assert(
    err.message.includes("Variable inconnue"),
    "Error message explains unknown placeholder",
    err.message
  );
}
assert(threwOnUnknown, "Unknown placeholder strictly throws an Error (no silent braces)");

// ---------------------------------------------------------------------------
// 3. STATUS & LIFECYCLE GUARDS TESTS
// ---------------------------------------------------------------------------
console.log("\n3. Lifecycle & Server-Side Status Guards:");

// Guard 1: Cannot go to APPROVED while admin email is not REPLIED or APPROVED
const blockingEmails = [
  { office: "STUDENT_LIFE", status: "SENT" as const },
  { office: "SCOLARITE", status: "APPROVED" as const },
];
const checkApprovedBlocked = canTransitionToApproved(blockingEmails);
assert(!checkApprovedBlocked.allowed, "Blocked from APPROVED when an email is still SENT");
assert(
  checkApprovedBlocked.blockingEmails?.includes("STUDENT_LIFE") ?? false,
  "Identifies STUDENT_LIFE as blocking email"
);

const clearEmails = [
  { office: "STUDENT_LIFE", status: "REPLIED" as const },
  { office: "SCOLARITE", status: "APPROVED" as const },
];
const checkApprovedClear = canTransitionToApproved(clearEmails);
assert(checkApprovedClear.allowed, "Allowed to transition to APPROVED when all emails are REPLIED/APPROVED");

// Guard 2: Cannot go to PROMOTION while mandatory requirement is NEEDED/REQUESTED
const blockingReqs = [
  { category: "SPACE" as const, status: "NEEDED" as const },
  { category: "EQUIPMENT" as const, status: "CONFIRMED" as const },
];
const checkPromoBlocked = canTransitionToPromotion(blockingReqs);
assert(!checkPromoBlocked.allowed, "Blocked from PROMOTION when SPACE is NEEDED");

const clearReqs = [
  { category: "SPACE" as const, status: "CONFIRMED" as const },
  { category: "EQUIPMENT" as const, status: "READY" as const },
  { category: "MATERIALS" as const, status: "NEEDED" as const }, // non-mandatory category
];
const checkPromoClear = canTransitionToPromotion(clearReqs);
assert(checkPromoClear.allowed, "Allowed to PROMOTION when all mandatory categories are confirmed");

// Guard 3: Cannot close without report or reason
assert(!canTransitionToClosed(false, null).allowed, "Blocked from CLOSED without report or reason");
assert(!canTransitionToClosed(false, "too short").allowed, "Blocked from CLOSED if reason is too short (<10 chars)");
assert(canTransitionToClosed(false, "Session informelle sans livrable reportable").allowed, "Allowed to CLOSED with valid written justification");
assert(canTransitionToClosed(true, null).allowed, "Allowed to CLOSED when report is deposited");

// Valid transitions
assert(validateStatusTransition("IDEA", "BRIEF_APPROVED").valid, "IDEA -> BRIEF_APPROVED is valid");
assert(!validateStatusTransition("IDEA", "LIVE").valid, "IDEA -> LIVE is illegal transition");
assert(validateStatusTransition("APPROVED", "CANCELLED").valid, "APPROVED -> CANCELLED is valid");

// ---------------------------------------------------------------------------
// 4. RESOURCE CONFLICT DETECTION TESTS
// ---------------------------------------------------------------------------
console.log("\n4. Resource Conflict Detection:");

const existingSlots = [
  {
    activityId: "act-1",
    activityTitle: "Workshop React",
    resourceId: "room-amphi-a",
    startsAt: "2026-11-15T14:00:00Z",
    endsAt: "2026-11-15T16:00:00Z",
  },
];

// Overlapping slot: 15:00 to 17:00
const conflictCheck1 = detectResourceConflict(
  {
    activityId: "act-2",
    resourceId: "room-amphi-a",
    startsAt: "2026-11-15T15:00:00Z",
    endsAt: "2026-11-15T17:00:00Z",
  },
  existingSlots
);
assert(conflictCheck1.hasConflict, "Detects overlapping booking on Amphi A");

// Non-overlapping slot: 16:30 to 18:00
const conflictCheck2 = detectResourceConflict(
  {
    activityId: "act-3",
    resourceId: "room-amphi-a",
    startsAt: "2026-11-15T16:30:00Z",
    endsAt: "2026-11-15T18:00:00Z",
  },
  existingSlots
);
assert(!conflictCheck2.hasConflict, "No conflict when slot is after previous booking ends");

// Different resource
const conflictCheck3 = detectResourceConflict(
  {
    activityId: "act-4",
    resourceId: "room-lab-104",
    startsAt: "2026-11-15T14:30:00Z",
    endsAt: "2026-11-15T15:30:00Z",
  },
  existingSlots
);
assert(!conflictCheck3.hasConflict, "No conflict when booking a different resource at the same time");

// ---------------------------------------------------------------------------
// 5. AGENDA RUN-OF-SHOW CONFLICT DETECTION TESTS
// ---------------------------------------------------------------------------
console.log("\n5. Agenda & Run-of-Show Conflict Detection:");

const agendaWarnings = detectAgendaConflicts(
  [
    { id: "ag-1", title: "Opening Keynote", startsAt: "2026-11-15T14:00:00Z", durationMin: 60 },
    { id: "ag-2", title: "Panel Discussion", startsAt: "2026-11-15T14:30:00Z", durationMin: 45 },
    { id: "ag-3", title: "Closing Remarks", startsAt: "2026-11-15T15:45:00Z", durationMin: 30 },
  ],
  "2026-11-15T14:00:00Z",
  "2026-11-15T16:00:00Z"
);
assert(agendaWarnings.length === 2, "Detects both overlapping slot and activity end-time overrun");
assert(
  agendaWarnings.some((w) => w.message.includes("Chevauchement horaire")),
  "Reports time overlap between Opening Keynote and Panel Discussion"
);
assert(
  agendaWarnings.some((w) => w.message.includes("dépasse l'heure de fin")),
  "Reports Closing Remarks exceeding activity end boundary"
);

// ---------------------------------------------------------------------------
// 6. ATTENTION FLAGS & EARLY WARNING RULES TESTS
// ---------------------------------------------------------------------------
console.log("\n6. Attention Flags & Early Warning Rules:");

const attentionResult = computeAttentionFlags({
  now: new Date("2026-10-20T12:00:00Z"),
  noReplyThresholdDays: 4,
  tasks: [
    { id: "t-1", title: "Book Amphi", dueDate: "2026-10-18T12:00:00Z", status: "TODO" },
    { id: "t-2", title: "Done Task", dueDate: "2026-10-18T12:00:00Z", status: "DONE" },
  ],
  emails: [
    { id: "e-1", office: "STUDENT_LIFE", sentAt: "2026-10-14T10:00:00Z", status: "SENT" },
    { id: "e-2", office: "SECURITY", sentAt: "2026-10-19T10:00:00Z", status: "SENT" },
  ],
  requirements: [
    { id: "r-1", title: "Projector", neededBy: "2026-10-24T10:00:00Z", status: "NEEDED" },
  ],
  activities: [
    {
      id: "a-1",
      title: "Stale & Urgent Workshop",
      status: "IDEA",
      createdAt: "2026-10-01T10:00:00Z",
      startsAt: "2026-11-01T10:00:00Z",
    },
  ],
});

assert(attentionResult.overdueTasks.length === 1, "Detects 1 overdue incomplete task");
assert(attentionResult.unrepliedEmails.length === 1, "Detects 1 email pending reply >= 4 days");
assert(attentionResult.unconfirmedUrgentRequirements.length === 1, "Detects 1 requirement needed within 7 days");
assert(attentionResult.staleIdeas.length === 1, "Detects 1 activity stuck in IDEA > 14 days");
assert(attentionResult.unapprovedUrgentActivities.length === 1, "Detects 1 activity starting within 21 days still in IDEA");

// ---------------------------------------------------------------------------
// 7. READINESS GATE EVALUATION TESTS
// ---------------------------------------------------------------------------
console.log("\n7. Activity Readiness Gate Evaluation:");

const readyGate = evaluateActivityReadiness({
  activity: {
    title: "Forum Annuel Asteria 2026",
    idea: "Grand forum annuel réunissant les partenaires et étudiants ESPRIT.",
    objectives: ["Présenter les projets des 5 pôles", "Recruter 50 nouveaux membres"],
    audience: "PUBLIC",
    location: "Amphithéâtre Central ESPRIT",
    format: "IN_PERSON",
    startsAt: "2026-12-01T09:00:00Z",
    endsAt: "2026-12-01T17:00:00Z",
    eventId: "evt-123",
  },
  tasks: [
    { status: "DONE", dueDate: "2026-11-15T10:00:00Z" },
    { status: "DONE", dueDate: "2026-11-20T10:00:00Z" },
  ],
  emails: [{ office: "STUDENT_LIFE", status: "APPROVED" }],
  requirements: [{ category: "SPACE", status: "CONFIRMED" }],
  agendaCount: 4,
  hasReport: true,
  now: new Date("2026-11-01T10:00:00Z"),
});

assert(readyGate.briefComplete, "Brief is evaluated as complete");
assert(readyGate.canApproveActivity, "Activity is ready for approval");
assert(readyGate.canStartPromotion, "Activity is ready to start promotion");
assert(readyGate.canCloseActivity, "Activity is ready for closure when report exists");
assert(readyGate.overallProgressPct === 100, "Fully completed activity reaches 100% readiness score");
assert(readyGate.blockers.length === 0, "Zero blockers when all gates are satisfied");

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n=======================================================");
console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=======================================================\n");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("ALL ACTIVITY PLANNER UNIT TESTS PASSED SUCCESSFULLY! ✓\n");
}
