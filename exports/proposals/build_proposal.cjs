const PptxGenJS = require("pptxgenjs");
const path = require("path");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pptx.title = "FayaFlex × Train Station Gym — June/July Stake Proposal";
pptx.author = "FayaFlex";
pptx.company = "FayaFlex";

const BG_DARK   = "0B1410";
const PANEL     = "111B16";
const PANEL_2   = "172620";
const GREEN     = "16A34A";
const GREEN_LT  = "4ADE80";
const TEXT      = "F5F7F4";
const MUTED     = "9BB0A4";
const AMBER     = "F59E0B";
const RED       = "EF4444";

const LOGO = path.join(__dirname, "trainstation_logo.png");

function addBaseBg(slide) {
  slide.background = { color: BG_DARK };
  slide.addShape("rect", { x: 0, y: 0, w: 13.333, h: 0.35, fill: { color: GREEN } });
}

function addFooter(slide, pageNum, pageTotal) {
  slide.addText("FayaFlex × Train Station Gym  ·  June / July 2026 Proposal", {
    x: 0.4, y: 7.15, w: 8, h: 0.3,
    fontFace: "Calibri", fontSize: 9, color: MUTED,
  });
  slide.addText(`${pageNum} / ${pageTotal}`, {
    x: 12.5, y: 7.15, w: 0.5, h: 0.3,
    fontFace: "Calibri", fontSize: 9, color: MUTED, align: "right",
  });
}

const TOTAL = 11;

// ───────────────────────────── 1. COVER ─────────────────────────────
{
  const s = pptx.addSlide();
  s.background = { color: BG_DARK };

  s.addShape("rect", { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: BG_DARK } });
  s.addShape("rect", { x: 0, y: 5.0, w: 13.333, h: 2.5, fill: { color: PANEL } });
  s.addShape("rect", { x: 0, y: 4.98, w: 13.333, h: 0.04, fill: { color: GREEN } });

  s.addText("PARTNERSHIP PROPOSAL", {
    x: 0.7, y: 0.7, w: 12, h: 0.4,
    fontFace: "Calibri", fontSize: 13, bold: true, color: GREEN_LT, charSpacing: 6,
  });

  s.addText("Burn Together.\nWin Together.", {
    x: 0.7, y: 1.3, w: 12, h: 2.6,
    fontFace: "Calibri", fontSize: 64, bold: true, color: TEXT,
  });

  s.addText("A four-week, R10 000 team stake for Train Station Gym members\npowered by the FayaFlex fitness platform.", {
    x: 0.7, y: 3.9, w: 12, h: 1.0,
    fontFace: "Calibri", fontSize: 20, color: MUTED,
  });

  s.addImage({ path: LOGO, x: 0.7, y: 5.3, w: 1.6, h: 1.6 });
  s.addText("Train Station Gym", {
    x: 2.5, y: 5.5, w: 6, h: 0.5,
    fontFace: "Calibri", fontSize: 22, bold: true, color: TEXT,
  });
  s.addText("Midstream  ·  Pretoria", {
    x: 2.5, y: 6.0, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 14, color: MUTED,
  });

  s.addShape("rect", { x: 10.6, y: 5.5, w: 2.2, h: 1.2, fill: { color: GREEN }, line: { color: GREEN } });
  s.addText("FayaFlex", {
    x: 10.6, y: 5.55, w: 2.2, h: 0.5,
    fontFace: "Calibri", fontSize: 22, bold: true, color: "0B1410", align: "center",
  });
  s.addText("Team fitness, gamified.", {
    x: 10.6, y: 6.05, w: 2.2, h: 0.5,
    fontFace: "Calibri", fontSize: 11, color: "0B1410", align: "center",
  });

  s.addText("Prepared May 2026", {
    x: 10.5, y: 6.95, w: 2.5, h: 0.3,
    fontFace: "Calibri", fontSize: 10, color: MUTED, align: "right",
  });
}

// ───────────────────────── 2. THE OPPORTUNITY ────────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("01  ·  THE OPPORTUNITY", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("The mid-year drop-off — and how to flip it.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 32, bold: true, color: TEXT,
  });

  const facts = [
    { v: "30–50%", l: "of New-Year sign-ups stop attending by May" },
    { v: "June–July", l: "is the coldest stretch of the SA gym calendar" },
    { v: "+27%", l: "median attendance lift from social-accountability challenges" },
  ];
  facts.forEach((f, i) => {
    const x = 0.5 + i * 4.2;
    s.addShape("roundRect", { x, y: 2.3, w: 4.0, h: 2.0, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.1 });
    s.addText(f.v, { x: x + 0.2, y: 2.45, w: 3.6, h: 0.9, fontFace: "Calibri", fontSize: 40, bold: true, color: GREEN_LT });
    s.addText(f.l, { x: x + 0.2, y: 3.35, w: 3.6, h: 0.9, fontFace: "Calibri", fontSize: 13, color: MUTED });
  });

  s.addShape("roundRect", { x: 0.5, y: 4.7, w: 12.3, h: 1.9, fill: { color: PANEL_2 }, line: { color: GREEN }, rectRadius: 0.1 });
  s.addText("The play", {
    x: 0.8, y: 4.85, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 3,
  });
  s.addText(
    "Run a 4-week team-based active-calorie stake on FayaFlex, prize-pooled at R10 000.\n" +
    "Members form teams inside Train Station, train together, post workouts together, and compete\n" +
    "for cash + bragging rights. The gym becomes the home base — not the thing they skip.",
    {
      x: 0.8, y: 5.25, w: 11.8, h: 1.3,
      fontFace: "Calibri", fontSize: 16, color: TEXT,
    }
  );

  addFooter(s, 2, TOTAL);
}

// ───────────────────────── 3. WHAT IS FAYAFLEX ───────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("02  ·  WHAT IS FAYAFLEX", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("A team-first fitness platform — not another solo tracker.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  const pillars = [
    { t: "Track",   d: "Auto-syncs Apple Health, Health Connect, Garmin, Huawei. Every workout is logged the moment it ends — no manual entry." },
    { t: "Team Up", d: "Members form or join a Train Station team. The team is the unit of competition, not the individual — so the slow days get carried by the strong days." },
    { t: "Compete", d: "Daily and monthly leaderboards on active calories. Reactions, comments, and Top Burner badges on every posted workout." },
    { t: "Win",     d: "Stakes pay out cash to the winning team. Victory Wall immortalises monthly champions on the gym's branded feed." },
  ];
  pillars.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 6.3;
    const y = 2.3 + row * 2.3;
    s.addShape("roundRect", { x, y, w: 6.1, h: 2.05, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.1 });
    s.addShape("rect", { x, y, w: 0.12, h: 2.05, fill: { color: GREEN } });
    s.addText(p.t, { x: x + 0.35, y: y + 0.18, w: 5.6, h: 0.5, fontFace: "Calibri", fontSize: 20, bold: true, color: TEXT });
    s.addText(p.d, { x: x + 0.35, y: y + 0.75, w: 5.6, h: 1.2, fontFace: "Calibri", fontSize: 13, color: MUTED });
  });

  addFooter(s, 3, TOTAL);
}

// ──────────────────── 4. THE STAKE — HOW IT WORKS ────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("03  ·  THE STAKE", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("R10 000  ·  4 weeks  ·  Active calories.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 32, bold: true, color: TEXT,
  });

  // Big prize card
  s.addShape("roundRect", { x: 0.5, y: 2.3, w: 5.2, h: 4.3, fill: { color: PANEL_2 }, line: { color: GREEN }, rectRadius: 0.15 });
  s.addText("PRIZE POOL", { x: 0.7, y: 2.5, w: 4.8, h: 0.4, fontFace: "Calibri", fontSize: 11, bold: true, color: GREEN_LT, charSpacing: 4 });
  s.addText("R10 000", { x: 0.7, y: 2.9, w: 4.8, h: 1.5, fontFace: "Calibri", fontSize: 72, bold: true, color: TEXT });
  s.addText("Funded by Train Station Gym\n(or split with FayaFlex — see slide 7)", {
    x: 0.7, y: 4.4, w: 4.8, h: 0.7, fontFace: "Calibri", fontSize: 13, color: MUTED,
  });
  s.addText("Suggested split", { x: 0.7, y: 5.15, w: 4.8, h: 0.35, fontFace: "Calibri", fontSize: 11, bold: true, color: GREEN_LT, charSpacing: 3 });
  s.addText("Winning team   R6 000\nRunner-up        R2 500\nTop solo burner  R1 500", {
    x: 0.7, y: 5.5, w: 4.8, h: 1.0, fontFace: "Calibri", fontSize: 14, color: TEXT, paraSpaceAfter: 4,
  });

  // Right column rules
  s.addShape("roundRect", { x: 6.0, y: 2.3, w: 6.8, h: 4.3, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.15 });
  s.addText("HOW SCORING WORKS", { x: 6.25, y: 2.5, w: 6.3, h: 0.4, fontFace: "Calibri", fontSize: 11, bold: true, color: GREEN_LT, charSpacing: 4 });

  const rules = [
    ["Metric",            "Active calories — every gym session, run, ride or swim counts."],
    ["Teams",             "5–10 members each. Members self-form inside the Train Station team."],
    ["Ranking",           "Team score = sum of every member's active calories over 28 days."],
    ["Honesty",           "Workouts must come from a connected device (Apple Health / Garmin /\nHealth Connect / Huawei). Manual entries flagged automatically."],
    ["Live",              "Leaderboard updates in real time. Daily Top Burner badge keeps stragglers in."],
  ];
  rules.forEach((r, i) => {
    const y = 2.95 + i * 0.72;
    s.addText(r[0], { x: 6.25, y, w: 1.5, h: 0.6, fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT });
    s.addText(r[1], { x: 7.8,  y, w: 4.95, h: 0.7, fontFace: "Calibri", fontSize: 12, color: TEXT });
  });

  addFooter(s, 4, TOTAL);
}

// ──────────────────── 5. INTRA-TEAM vs INTER-TEAM ────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("04  ·  TWO WAYS TO PLAY", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("Members race each other — or challenge the next gym over.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  // Card A
  s.addShape("roundRect", { x: 0.5, y: 2.3, w: 6.1, h: 4.4, fill: { color: PANEL }, line: { color: GREEN }, rectRadius: 0.15 });
  s.addText("INTRA-TEAM  ·  DEFAULT", { x: 0.7, y: 2.45, w: 5.7, h: 0.4, fontFace: "Calibri", fontSize: 11, bold: true, color: GREEN_LT, charSpacing: 4 });
  s.addText("Train Station vs Train Station", { x: 0.7, y: 2.85, w: 5.7, h: 0.6, fontFace: "Calibri", fontSize: 22, bold: true, color: TEXT });
  s.addText(
    "Members split into 4–6 mini-squads inside the Train Station team.\n" +
    "Every squad chases the same prize pool. Builds rivalry without\n" +
    "needing another venue to opt in.",
    { x: 0.7, y: 3.55, w: 5.7, h: 1.4, fontFace: "Calibri", fontSize: 13, color: MUTED }
  );
  s.addText("BEST FOR", { x: 0.7, y: 5.05, w: 5.7, h: 0.3, fontFace: "Calibri", fontSize: 10, bold: true, color: GREEN_LT, charSpacing: 3 });
  s.addText("• Launching fast — can go live week 1 of June\n• Retaining your existing base\n• Lower complexity, single venue", {
    x: 0.7, y: 5.4, w: 5.7, h: 1.3, fontFace: "Calibri", fontSize: 13, color: TEXT,
  });

  // Card B
  s.addShape("roundRect", { x: 6.7, y: 2.3, w: 6.1, h: 4.4, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.15 });
  s.addText("INTER-TEAM  ·  OPTIONAL", { x: 6.9, y: 2.45, w: 5.7, h: 0.4, fontFace: "Calibri", fontSize: 11, bold: true, color: AMBER, charSpacing: 4 });
  s.addText("Train Station vs another gym", { x: 6.9, y: 2.85, w: 5.7, h: 0.6, fontFace: "Calibri", fontSize: 22, bold: true, color: TEXT });
  s.addText(
    "Invite a rival Midstream / Centurion gym to stake an equal pool.\n" +
    "Combined R20k prize. Winner-takes-most, with a runner-up split.\n" +
    "Massive PR moment — both gyms market it to their audience.",
    { x: 6.9, y: 3.55, w: 5.7, h: 1.4, fontFace: "Calibri", fontSize: 13, color: MUTED }
  );
  s.addText("BEST FOR", { x: 6.9, y: 5.05, w: 5.7, h: 0.3, fontFace: "Calibri", fontSize: 10, bold: true, color: AMBER, charSpacing: 3 });
  s.addText("• Acquisition + brand reach\n• Month-two follow-up after the intra-team round\n• Social-media content gold", {
    x: 6.9, y: 5.4, w: 5.7, h: 1.3, fontFace: "Calibri", fontSize: 13, color: TEXT,
  });

  addFooter(s, 5, TOTAL);
}

// ──────────────────────── 6. MEMBER JOURNEY ──────────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("05  ·  THE MEMBER EXPERIENCE", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("Two taps to join. Zero friction to compete.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  const steps = [
    { n: "1", t: "Sign up",       d: "Scan a QR code at reception. Account live in under 60 seconds." },
    { n: "2", t: "Connect",       d: "Link Apple Health, Garmin, Health Connect or Huawei in one tap." },
    { n: "3", t: "Join a squad",  d: "Pick or be assigned a 5–10 person Train Station squad." },
    { n: "4", t: "Train",         d: "Workouts auto-post to the team feed. React, comment, encourage." },
    { n: "5", t: "Win",           d: "Live leaderboard. Daily Top Burner. Monthly cash payout." },
  ];
  const w = 2.4, gap = 0.15;
  steps.forEach((st, i) => {
    const x = 0.5 + i * (w + gap);
    s.addShape("roundRect", { x, y: 2.5, w, h: 4.1, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.12 });
    s.addShape("ellipse", { x: x + 0.85, y: 2.75, w: 0.7, h: 0.7, fill: { color: GREEN } });
    s.addText(st.n, { x: x + 0.85, y: 2.78, w: 0.7, h: 0.65, fontFace: "Calibri", fontSize: 22, bold: true, color: "0B1410", align: "center", valign: "middle" });
    s.addText(st.t, { x: x + 0.2, y: 3.6, w: w - 0.4, h: 0.5, fontFace: "Calibri", fontSize: 16, bold: true, color: TEXT, align: "center" });
    s.addText(st.d, { x: x + 0.2, y: 4.15, w: w - 0.4, h: 2.3, fontFace: "Calibri", fontSize: 12, color: MUTED, align: "center" });
  });

  addFooter(s, 6, TOTAL);
}

// ──────────────────────── 7. INVESTMENT ──────────────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("06  ·  INVESTMENT", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("Three ways to fund the R10 000 pool.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  const opts = [
    { tag: "OPTION A", t: "Gym-funded",        a: "R10 000", b: "R0",     d: "Train Station puts up the full pool. FayaFlex covers platform, onboarding and admin. Simplest path — maximum brand credit to the gym." , border: GREEN },
    { tag: "OPTION B", t: "Co-funded",          a: "R6 000",  b: "R4 000", d: "Split 60 / 40. Both logos on every prize moment, both lists grow from joint marketing. Recommended for the first round.", border: GREEN_LT },
    { tag: "OPTION C", t: "Member-funded",      a: "R2 000",  b: "R0",     d: "Members pay a R200 buy-in (50 entrants = R10k pool). Train Station throws in R2k as the headline 'Top Burner' bonus. Lowest gym cash exposure, but slower sign-up.", border: AMBER },
  ];
  opts.forEach((o, i) => {
    const x = 0.5 + i * 4.2;
    s.addShape("roundRect", { x, y: 2.3, w: 4.0, h: 4.4, fill: { color: PANEL }, line: { color: o.border, width: 1.5 }, rectRadius: 0.12 });
    s.addText(o.tag, { x: x + 0.25, y: 2.45, w: 3.5, h: 0.35, fontFace: "Calibri", fontSize: 11, bold: true, color: o.border, charSpacing: 4 });
    s.addText(o.t,   { x: x + 0.25, y: 2.85, w: 3.5, h: 0.6,  fontFace: "Calibri", fontSize: 22, bold: true, color: TEXT });
    s.addText("Gym contribution",  { x: x + 0.25, y: 3.55, w: 3.5, h: 0.3, fontFace: "Calibri", fontSize: 10, color: MUTED });
    s.addText(o.a,                 { x: x + 0.25, y: 3.8,  w: 3.5, h: 0.6, fontFace: "Calibri", fontSize: 26, bold: true, color: TEXT });
    s.addText("FayaFlex contribution",{ x: x + 0.25, y: 4.5, w: 3.5, h: 0.3, fontFace: "Calibri", fontSize: 10, color: MUTED });
    s.addText(o.b,                 { x: x + 0.25, y: 4.75, w: 3.5, h: 0.6, fontFace: "Calibri", fontSize: 22, bold: true, color: GREEN_LT });
    s.addText(o.d,                 { x: x + 0.25, y: 5.5,  w: 3.5, h: 1.1, fontFace: "Calibri", fontSize: 11, color: MUTED });
  });

  addFooter(s, 7, TOTAL);
}

// ──────────────────────── 8. TIMELINE ────────────────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("07  ·  TIMELINE", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("From handshake to payout in 8 weeks.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  const phases = [
    { w: "Week 0",          t: "Sign-off",   d: "Proposal accepted. Funding option locked." },
    { w: "Week 1",          t: "Setup",      d: "Train Station team created on FayaFlex. Posters, QR codes, social assets delivered." },
    { w: "Week 2",          t: "Onboarding", d: "Reception sign-ups. Squad draft. Soft-launch announcement." },
    { w: "Weeks 3–6",       t: "Stake live", d: "4-week competition. Weekly leaderboard posts on IG / FB." },
    { w: "Week 7",          t: "Payout",     d: "Winners announced. Cash transferred. Champions on Victory Wall." },
    { w: "Week 8",          t: "Debrief",    d: "Retention + activity report. Decide on inter-gym Round 2." },
  ];

  // Horizontal timeline
  s.addShape("line", { x: 0.7, y: 4.0, w: 12.0, h: 0, line: { color: GREEN, width: 2 } });
  const stepW = 12.0 / phases.length;
  phases.forEach((p, i) => {
    const cx = 0.7 + stepW * (i + 0.5);
    s.addShape("ellipse", { x: cx - 0.18, y: 3.82, w: 0.36, h: 0.36, fill: { color: GREEN }, line: { color: GREEN_LT, width: 1.5 } });
    s.addText(p.w, { x: cx - 1.0, y: 2.3, w: 2.0, h: 0.35, fontFace: "Calibri", fontSize: 11, bold: true, color: GREEN_LT, align: "center" });
    s.addText(p.t, { x: cx - 1.0, y: 2.65, w: 2.0, h: 0.5, fontFace: "Calibri", fontSize: 16, bold: true, color: TEXT, align: "center" });
    s.addText(p.d, { x: cx - 1.0, y: 4.4,  w: 2.0, h: 2.0, fontFace: "Calibri", fontSize: 11, color: MUTED, align: "center" });
  });

  addFooter(s, 8, TOTAL);
}

// ──────────────────────── 9. WHAT WE NEED ────────────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("08  ·  WHAT WE NEED FROM TRAIN STATION", {
    x: 0.5, y: 0.55, w: 10, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("A small lift from your side — most of the work is ours.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  const asks = [
    { t: "Prize pool",        d: "R10 000 cash (or per chosen funding option on slide 7)." },
    { t: "Reception push",    d: "Staff briefed to sign new arrivals up at check-in for 14 days." },
    { t: "Floor presence",    d: "A1 poster at entrance + 1 standee near the squat rack. We supply printable artwork." },
    { t: "Social amplification", d: "3 IG / FB posts and 5 stories over the 4-week stake. We supply all creative." },
    { t: "WhatsApp blast",    d: "One broadcast to your member list at launch + one mid-stake reminder." },
    { t: "Photo moment",      d: "One in-gym prize handover for the social/press story." },
  ];
  asks.forEach((a, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.5 + col * 6.3;
    const y = 2.3 + row * 1.5;
    s.addShape("roundRect", { x, y, w: 6.1, h: 1.35, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.1 });
    s.addShape("rect", { x, y, w: 0.08, h: 1.35, fill: { color: GREEN } });
    s.addText(a.t, { x: x + 0.3, y: y + 0.15, w: 5.6, h: 0.4, fontFace: "Calibri", fontSize: 15, bold: true, color: TEXT });
    s.addText(a.d, { x: x + 0.3, y: y + 0.6,  w: 5.6, h: 0.7, fontFace: "Calibri", fontSize: 12, color: MUTED });
  });

  addFooter(s, 9, TOTAL);
}

// ─────────────────── 10. WHAT TRAIN STATION GETS ─────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("09  ·  EXPECTED OUTCOMES", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("What Train Station walks away with.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 28, bold: true, color: TEXT,
  });

  const kpis = [
    { n: "+20–35%",  l: "June/July attendance vs prior month" },
    { n: "60–100",   l: "active competitors signed up to FayaFlex" },
    { n: "4 wks",    l: "of organic IG / FB content (workouts, leaderboards, winner)" },
    { n: "R0",       l: "platform fee — FayaFlex covers tech + admin in Round 1" },
  ];
  kpis.forEach((k, i) => {
    const x = 0.5 + i * 3.15;
    s.addShape("roundRect", { x, y: 2.3, w: 3.0, h: 2.0, fill: { color: PANEL_2 }, line: { color: GREEN }, rectRadius: 0.12 });
    s.addText(k.n, { x: x + 0.2, y: 2.45, w: 2.6, h: 0.9, fontFace: "Calibri", fontSize: 30, bold: true, color: GREEN_LT });
    s.addText(k.l, { x: x + 0.2, y: 3.35, w: 2.6, h: 0.95, fontFace: "Calibri", fontSize: 12, color: TEXT });
  });

  s.addShape("roundRect", { x: 0.5, y: 4.7, w: 12.3, h: 1.9, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.12 });
  s.addText("BEYOND THE NUMBERS", { x: 0.8, y: 4.85, w: 6, h: 0.4, fontFace: "Calibri", fontSize: 11, bold: true, color: GREEN_LT, charSpacing: 4 });
  s.addText(
    "• A reactivated WhatsApp / IG audience — members talking about the gym every day for a month.\n" +
    "• First-mover positioning in Midstream as the gym that runs cash-prize community challenges.\n" +
    "• A reusable playbook: Round 2 can be inter-gym, themed (strength-only, cardio-only), or seasonal.",
    { x: 0.8, y: 5.25, w: 11.8, h: 1.3, fontFace: "Calibri", fontSize: 13, color: TEXT, paraSpaceAfter: 4 }
  );

  addFooter(s, 10, TOTAL);
}

// ─────────────────────── 11. NEXT STEPS ──────────────────────────────
{
  const s = pptx.addSlide();
  addBaseBg(s);

  s.addText("10  ·  NEXT STEPS", {
    x: 0.5, y: 0.55, w: 6, h: 0.4,
    fontFace: "Calibri", fontSize: 12, bold: true, color: GREEN_LT, charSpacing: 4,
  });
  s.addText("Lock the dates. We do the rest.", {
    x: 0.5, y: 1.0, w: 12.5, h: 0.9,
    fontFace: "Calibri", fontSize: 32, bold: true, color: TEXT,
  });

  const steps = [
    { n: "1", t: "Pick a window", d: "First 4 weeks of June  ·  or  ·  First 4 weeks of July." },
    { n: "2", t: "Pick a funding option", d: "Gym-funded  ·  Co-funded  ·  Member-funded (slide 7)." },
    { n: "3", t: "Sign the one-page MoU", d: "We'll send it within 24 hours of verbal go-ahead." },
    { n: "4", t: "Kick-off call",  d: "30 minutes to align on dates, branding, and the launch announcement." },
  ];
  steps.forEach((st, i) => {
    const y = 2.4 + i * 0.95;
    s.addShape("roundRect", { x: 0.5, y, w: 12.3, h: 0.8, fill: { color: PANEL }, line: { color: PANEL_2 }, rectRadius: 0.08 });
    s.addShape("ellipse", { x: 0.7, y: y + 0.15, w: 0.5, h: 0.5, fill: { color: GREEN } });
    s.addText(st.n, { x: 0.7, y: y + 0.17, w: 0.5, h: 0.46, fontFace: "Calibri", fontSize: 16, bold: true, color: "0B1410", align: "center", valign: "middle" });
    s.addText(st.t, { x: 1.4, y: y + 0.15, w: 4.2, h: 0.5, fontFace: "Calibri", fontSize: 16, bold: true, color: TEXT });
    s.addText(st.d, { x: 5.7, y: y + 0.15, w: 6.9, h: 0.5, fontFace: "Calibri", fontSize: 13, color: MUTED });
  });

  // Contact block
  s.addShape("roundRect", { x: 0.5, y: 6.3, w: 12.3, h: 0.65, fill: { color: GREEN }, line: { color: GREEN }, rectRadius: 0.08 });
  s.addText("Let's burn the winter slump.   hello@fayaflex.com   ·   fayaflex.com", {
    x: 0.5, y: 6.32, w: 12.3, h: 0.6, fontFace: "Calibri", fontSize: 16, bold: true, color: "0B1410", align: "center", valign: "middle",
  });

  addFooter(s, 11, TOTAL);
}

pptx.writeFile({ fileName: path.join(__dirname, "FayaFlex_TrainStation_Stake_Proposal.pptx") })
  .then(f => console.log("WROTE:", f));
