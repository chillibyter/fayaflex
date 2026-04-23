import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.title = "FayaFlex — 30-Day Usage Report";
pptx.author = "FayaFlex";

const BG = "0B1220";
const FG = "FFFFFF";
const MUTED = "9CA3AF";
const ACCENT = "10B981";
const WARN = "F59E0B";
const DANGER = "EF4444";

const W = 13.333;
const H = 7.5;

function bg(slide) {
  slide.background = { color: BG };
}

function header(slide, title, subtitle) {
  slide.addShape("rect", { x: 0, y: 0, w: W, h: 1.1, fill: { color: "111827" }, line: { color: "111827" } });
  slide.addText(title, { x: 0.6, y: 0.18, w: W - 1.2, h: 0.55, fontSize: 26, bold: true, color: FG, fontFace: "Inter" });
  if (subtitle) slide.addText(subtitle, { x: 0.6, y: 0.7, w: W - 1.2, h: 0.35, fontSize: 13, color: ACCENT, fontFace: "Inter" });
}

function footer(slide, page, total) {
  slide.addText(`FayaFlex • Apr 2026`, { x: 0.5, y: H - 0.4, w: 4, h: 0.3, fontSize: 10, color: MUTED, fontFace: "Inter" });
  slide.addText(`${page} / ${total}`, { x: W - 1.2, y: H - 0.4, w: 0.7, h: 0.3, fontSize: 10, color: MUTED, align: "right", fontFace: "Inter" });
}

function kpi(slide, x, y, w, h, value, label, color = ACCENT) {
  slide.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: "111827" }, line: { color: "1F2937" } });
  slide.addText(String(value), { x: x + 0.1, y: y + 0.15, w: w - 0.2, h: h * 0.55, fontSize: 30, bold: true, color, align: "center", valign: "middle", fontFace: "Inter" });
  slide.addText(label, { x: x + 0.1, y: y + h * 0.62, w: w - 0.2, h: h * 0.32, fontSize: 11, color: MUTED, align: "center", valign: "middle", fontFace: "Inter" });
}

function bullets(slide, x, y, w, h, items, opts = {}) {
  slide.addText(
    items.map((t) => ({ text: t, options: { bullet: { code: "25CF" }, color: opts.color || FG, fontSize: opts.fontSize || 14, paraSpaceAfter: 6 } })),
    { x, y, w, h, fontFace: "Inter", color: FG, valign: "top" }
  );
}

const TOTAL = 11;
let page = 0;
const next = () => ++page;

// ---- Slide 1 — Cover ----
{
  const s = pptx.addSlide(); bg(s);
  s.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { color: BG } });
  s.addShape("rect", { x: 0, y: 0, w: 0.25, h: H, fill: { color: ACCENT }, line: { color: ACCENT } });
  s.addText("FayaFlex", { x: 0.8, y: 1.6, w: 12, h: 0.7, fontSize: 22, color: ACCENT, bold: true, fontFace: "Inter" });
  s.addText("30-Day Usage Report", { x: 0.8, y: 2.3, w: 12, h: 1.4, fontSize: 54, bold: true, color: FG, fontFace: "Inter" });
  s.addText("Most-used journeys & friction points", { x: 0.8, y: 3.7, w: 12, h: 0.6, fontSize: 22, color: MUTED, fontFace: "Inter" });
  s.addText("Period: 24 Mar – 23 Apr 2026  •  Production data", { x: 0.8, y: 6.6, w: 10, h: 0.4, fontSize: 14, color: MUTED, fontFace: "Inter" });
  footer(s, next(), TOTAL);
}

// ---- Slide 2 — Snapshot KPIs ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Snapshot", "Where the app stands today");
  const row1y = 1.6, row2y = 4.0;
  const cw = 2.9, ch = 1.9, gap = 0.25;
  const xs = [0.5, 0.5 + cw + gap, 0.5 + 2 * (cw + gap), 0.5 + 3 * (cw + gap)];
  kpi(s, xs[0], row1y, cw, ch, "30", "Registered users", ACCENT);
  kpi(s, xs[1], row1y, cw, ch, "14", "Active in last 30 days", ACCENT);
  kpi(s, xs[2], row1y, cw, ch, "10", "Active in last 7 days", ACCENT);
  kpi(s, xs[3], row1y, cw, ch, "3",  "Active in last 24 hours", WARN);
  kpi(s, xs[0], row2y, cw, ch, "298", "Activities logged (30d)", ACCENT);
  kpi(s, xs[1], row2y, cw, ch, "10", "Teams created", ACCENT);
  kpi(s, xs[2], row2y, cw, ch, "21", "Avg active days / user", ACCENT);
  kpi(s, xs[3], row2y, cw, ch, "63%", "Of users ever logged", WARN);
  s.addText("Among the people who actually start logging, engagement is sticky (median 25 of 31 days). Conversion from sign-up into that group is the gap.",
    { x: 0.5, y: 6.3, w: 12.3, h: 0.7, fontSize: 14, italic: true, color: MUTED, fontFace: "Inter" });
  footer(s, next(), TOTAL);
}

// ---- Slide 3 — Daily Active Users chart ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Daily active users", "Last 30 days — gentle decline visible");
  const data = [
    ["2026-03-24",11],["2026-03-25",11],["2026-03-26",11],["2026-03-27",12],["2026-03-28",12],
    ["2026-03-29",12],["2026-03-30",13],["2026-03-31",12],["2026-04-01",13],["2026-04-02",11],
    ["2026-04-03",11],["2026-04-04",11],["2026-04-05",10],["2026-04-06",10],["2026-04-07",10],
    ["2026-04-08",10],["2026-04-09",10],["2026-04-10",10],["2026-04-11",10],["2026-04-12",10],
    ["2026-04-13",10],["2026-04-14",9],["2026-04-15",9],["2026-04-16",9],["2026-04-17",9],
    ["2026-04-18",7],["2026-04-19",7],["2026-04-20",6],["2026-04-21",4],["2026-04-22",3],["2026-04-23",3]
  ];
  const labels = data.map(d => d[0].slice(5));
  const values = data.map(d => d[1]);
  s.addChart(pptx.ChartType.line, [{ name: "DAU", labels, values }], {
    x: 0.5, y: 1.4, w: 12.3, h: 4.8,
    chartColors: [ACCENT],
    showLegend: false,
    catAxisLabelColor: MUTED, valAxisLabelColor: MUTED,
    catAxisLabelFontSize: 9, valAxisLabelFontSize: 10,
    catAxisLabelRotate: -45,
    lineDataSymbol: "circle", lineDataSymbolSize: 6,
    plotArea: { fill: { color: BG } },
    dataLabelColor: FG,
    valGridLine: { style: "solid", size: 1, color: "1F2937" },
    catGridLine: { style: "none" },
  });
  s.addText("From a peak of 13 DAU on Apr 1 to 3 DAU by Apr 23 — a clear weakening trend that warrants attention.",
    { x: 0.5, y: 6.4, w: 12.3, h: 0.6, fontSize: 14, color: WARN, italic: true, fontFace: "Inter" });
  footer(s, next(), TOTAL);
}

// ---- Slide 4 — Most-used journeys ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Most-used user journeys", "What people actually do in the app");
  const items = [
    "Health-sync → Dashboard — the dominant flow. 98% of activities arrive via auto-sync (Apple Health 224, Android Health 68, manual only 6).",
    "Team chat — strongest peer signal. 19 messages from 7 users across 4 active team chats in 30 days.",
    "Feed posting — light authoring (18 posts, 5 authors) but healthy reading: 24 likes (~1.3 per post), 3 comments.",
    "Login → dashboard → leaderboards (calories / steps / workouts / teams) — every session loads this hub.",
    "A core of 10 power users carries the app — each logged on 25–31 of the last 31 days.",
  ];
  bullets(s, 0.7, 1.5, 12.0, 5.0, items, { fontSize: 17 });
  footer(s, next(), TOTAL);
}

// ---- Slide 5 — Activity sources ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Where activities come from", "Auto-sync dominates, manual logging is rare");
  s.addChart(pptx.ChartType.bar, [
    { name: "Activities (30d)", labels: ["Apple Health", "Android Health", "Manual"], values: [224, 68, 6] }
  ], {
    x: 0.5, y: 1.5, w: 7.5, h: 5.2,
    chartColors: [ACCENT],
    barDir: "bar", showLegend: false,
    catAxisLabelColor: FG, valAxisLabelColor: MUTED,
    catAxisLabelFontSize: 14, valAxisLabelFontSize: 11,
    showValue: true, dataLabelColor: FG, dataLabelFontSize: 11,
    valGridLine: { style: "solid", size: 1, color: "1F2937" },
    plotArea: { fill: { color: BG } },
  });
  s.addText("Implications", { x: 8.4, y: 1.6, w: 4.4, h: 0.4, fontSize: 16, bold: true, color: ACCENT, fontFace: "Inter" });
  bullets(s, 8.4, 2.1, 4.4, 4.5, [
    "Sync reliability = product reliability.",
    "Android Health Connect is under-syncing relative to iOS (more on next slide).",
    "Manual logging is essentially unused — UI for it is low priority vs. fixing sync.",
  ], { fontSize: 13, color: FG });
  footer(s, next(), TOTAL);
}

// ---- Slide 6 — Workout types ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Workout types are mostly missing", "65% of activities arrive without a type");
  s.addChart(pptx.ChartType.doughnut, [
    { name: "Workout types", labels: ["No type (steps+cal)", "Health Sync rollups", "Other typed"], values: [195, 97, 6] }
  ], {
    x: 0.5, y: 1.5, w: 6.5, h: 5.2,
    chartColors: ["6B7280", ACCENT, WARN],
    showLegend: true, legendPos: "b", legendColor: FG, legendFontSize: 12,
    dataLabelColor: FG, dataLabelFontSize: 12,
    plotArea: { fill: { color: BG } },
  });
  s.addText("Why it matters", { x: 7.4, y: 1.6, w: 5.4, h: 0.4, fontSize: 16, bold: true, color: ACCENT, fontFace: "Inter" });
  bullets(s, 7.4, 2.1, 5.4, 4.6, [
    "Auto-posted workout cards in the feed are sparse and look generic.",
    "Personal-bests can't be computed without a typed workout.",
    "The 3D workout icons (sneaker, bicycle, boxing, dumbbell) rarely have anything to attach to.",
    "Fix: read activityType from HealthKit / Health Connect and persist it on every sync.",
  ], { fontSize: 13 });
  footer(s, next(), TOTAL);
}

// ---- Slide 7 — Friction: signup funnel ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Friction #1 — Post-signup drop-off", "Of 14 new users in the last 30 days…");
  s.addChart(pptx.ChartType.bar, [
    { name: "Users", labels: ["Signed up", "Logged any activity", "Joined a team", "Connected a device", "Set first name", "Set location"], values: [14, 7, 8, 6, 3, 2] }
  ], {
    x: 0.5, y: 1.5, w: 8.5, h: 5.2,
    chartColors: [ACCENT],
    barDir: "bar", showLegend: false,
    catAxisLabelColor: FG, valAxisLabelColor: MUTED,
    catAxisLabelFontSize: 13, valAxisLabelFontSize: 11,
    showValue: true, dataLabelColor: FG, dataLabelFontSize: 12,
    valGridLine: { style: "solid", size: 1, color: "1F2937" },
    plotArea: { fill: { color: BG } },
  });
  s.addText("What this tells us", { x: 9.3, y: 1.6, w: 3.6, h: 0.4, fontSize: 15, bold: true, color: DANGER, fontFace: "Inter" });
  bullets(s, 9.3, 2.1, 3.6, 4.6, [
    "Only 50% log any activity.",
    "Profile completion is being skipped en masse — 25 of all 30 users still have an incomplete profile.",
    "Onboarding promise (location-based leaderboards, team competition) isn't being fulfilled.",
  ], { fontSize: 12 });
  footer(s, next(), TOTAL);
}

// ---- Slide 8 — Friction: retention & teams ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Friction #2 — Weak week-1 retention & oversized teams", "");
  s.addText("Cohort retention (active in last 7 days)", { x: 0.5, y: 1.4, w: 6, h: 0.4, fontSize: 16, bold: true, color: ACCENT, fontFace: "Inter" });
  const rows = [
    [{text:"Sign-up week", options:{bold:true, color:FG}}, {text:"Users", options:{bold:true, color:FG, align:"center"}}, {text:"Active last 7d", options:{bold:true, color:FG, align:"center"}}, {text:"Retention", options:{bold:true, color:FG, align:"center"}}],
    ["Apr 20", {text:"2", options:{align:"center"}}, {text:"0", options:{align:"center"}}, {text:"0%", options:{align:"center", color:DANGER, bold:true}}],
    ["Apr 13", {text:"2", options:{align:"center"}}, {text:"1", options:{align:"center"}}, {text:"50%", options:{align:"center", color:WARN, bold:true}}],
    ["Apr 06", {text:"1", options:{align:"center"}}, {text:"1", options:{align:"center"}}, {text:"100%", options:{align:"center", color:ACCENT, bold:true}}],
    ["Mar 30", {text:"8", options:{align:"center"}}, {text:"2", options:{align:"center"}}, {text:"25%", options:{align:"center", color:DANGER, bold:true}}],
  ];
  s.addTable(rows, { x: 0.5, y: 1.9, w: 6, colW: [1.8, 1.2, 1.6, 1.4], fontSize: 13, fontFace: "Inter", color: FG, fill: { color: "111827" }, border: { type: "solid", color: "1F2937", pt: 1 }, rowH: 0.45 });

  s.addText("Top teams: huge member counts, tiny activity", { x: 7.0, y: 1.4, w: 6, h: 0.4, fontSize: 16, bold: true, color: ACCENT, fontFace: "Inter" });
  const trows = [
    [{text:"Team", options:{bold:true, color:FG}}, {text:"Members", options:{bold:true, color:FG, align:"center"}}, {text:"Active 30d", options:{bold:true, color:FG, align:"center"}}, {text:"% active", options:{bold:true, color:FG, align:"center"}}],
    ["Ultimate fitness championship", {text:"499", options:{align:"center"}}, {text:"4", options:{align:"center"}}, {text:"0.8%", options:{align:"center", color:DANGER}}],
    ["75 soft", {text:"415", options:{align:"center"}}, {text:"3", options:{align:"center"}}, {text:"0.7%", options:{align:"center", color:DANGER}}],
    ["Hirox Joburg 2026", {text:"264", options:{align:"center"}}, {text:"2", options:{align:"center"}}, {text:"0.8%", options:{align:"center", color:DANGER}}],
    ["Ti Timer", {text:"264", options:{align:"center"}}, {text:"2", options:{align:"center"}}, {text:"0.8%", options:{align:"center", color:DANGER}}],
    ["Jenni Case gets fit!", {text:"173", options:{align:"center"}}, {text:"4", options:{align:"center"}}, {text:"2.3%", options:{align:"center", color:WARN}}],
  ];
  s.addTable(trows, { x: 7.0, y: 1.9, w: 6, colW: [3.0, 1.0, 1.0, 1.0], fontSize: 11, fontFace: "Inter", color: FG, fill: { color: "111827" }, border: { type: "solid", color: "1F2937", pt: 1 }, rowH: 0.4 });

  s.addText("6 of 10 teams have had zero chat messages in 30 days. Mega-teams make leaderboards feel hopeless to new joiners.",
    { x: 0.5, y: 6.4, w: 12.3, h: 0.6, fontSize: 13, italic: true, color: WARN, fontFace: "Inter" });
  footer(s, next(), TOTAL);
}

// ---- Slide 9 — Friction: device sync, notifications, social ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Friction #3 — Sync, notifications, social", "Three smaller leaks worth fixing");

  s.addText("Apple vs Android sync health (active in 7d / connections)", { x: 0.5, y: 1.4, w: 6, h: 0.4, fontSize: 14, bold: true, color: ACCENT, fontFace: "Inter" });
  s.addChart(pptx.ChartType.bar, [
    { name: "Connections", labels: ["Apple Health", "Android Health"], values: [11, 9] },
    { name: "Active last 7d", labels: ["Apple Health", "Android Health"], values: [7, 2] },
  ], {
    x: 0.5, y: 1.9, w: 6.0, h: 4.0,
    chartColors: ["1F2937", ACCENT],
    barDir: "bar", barGrouping: "clustered",
    showLegend: true, legendPos: "b", legendColor: FG, legendFontSize: 11,
    catAxisLabelColor: FG, valAxisLabelColor: MUTED,
    catAxisLabelFontSize: 12, valAxisLabelFontSize: 10,
    showValue: true, dataLabelColor: FG, dataLabelFontSize: 11,
    valGridLine: { style: "solid", size: 1, color: "1F2937" },
    plotArea: { fill: { color: BG } },
  });

  s.addText("Notifications & social", { x: 7.0, y: 1.4, w: 6, h: 0.4, fontSize: 14, bold: true, color: ACCENT, fontFace: "Inter" });
  bullets(s, 7.0, 1.9, 6.0, 4.5, [
    "Push tokens: 2 iOS, 0 Android — fan-out can't reach most users yet.",
    "App-notifications sent in 30d: 1 daily reminder, 0 read.",
    "Activity-level reactions: 0. Activity-level comments: 0. Direct messages: 0.",
    "Feed has the only working social loop today (24 likes, 3 comments).",
    "Consequence: the engagement triggers built into the system have no fuel — there's nothing to notify users about yet.",
  ], { fontSize: 12 });

  s.addText("Also seen: 403s when users tap a non-member team's chat / leaderboard — list should hide or pre-check membership.",
    { x: 0.5, y: 6.4, w: 12.3, h: 0.6, fontSize: 13, italic: true, color: WARN, fontFace: "Inter" });
  footer(s, next(), TOTAL);
}

// ---- Slide 10 — Recommended priorities ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Recommended priorities", "Ordered by expected impact");
  const items = [
    "1.  Fix post-sign-up funnel — make profile completion (name + town) blocking, suggest a starter team during onboarding.",
    "2.  Investigate Android Health Connect sync reliability — connections work but data flow is ~3× weaker than iOS.",
    "3.  Auto-detect workout type during sync (HealthKit / Health Connect both expose activityType) so typed-workout features light up.",
    "4.  Cap or split mega-teams — 400-member teams with 4 active people make the leaderboard meaningless.",
    "5.  Surface team chat more aggressively — strongest social signal you have; consider a chat tab or a badge on the Teams icon.",
    "6.  Hide non-member teams from any list where tapping them yields 403, or route to the join flow instead.",
    "7.  Drive push-token registration on Android (the iOS provisioning fix just landed; replicate on Android).",
  ];
  bullets(s, 0.7, 1.5, 12.0, 5.5, items, { fontSize: 15 });
  footer(s, next(), TOTAL);
}

// ---- Slide 11 — Appendix / data sources ----
{
  const s = pptx.addSlide(); bg(s);
  header(s, "Appendix — data sources", "");
  bullets(s, 0.7, 1.5, 12.0, 5.5, [
    "Production PostgreSQL (Neon) — read-only queries against users, activities, teams, team_members, team_messages, messages, feed_posts, feed_post_likes, feed_post_comments, activity_reactions, activity_comments, app_notifications, push_tokens, device_connections, passkeys, password_reset_tokens.",
    "Period: last 30 days (24 Mar – 23 Apr 2026), all timestamps UTC.",
    "Production deployment logs — used qualitatively to confirm session shape (login → dashboard → leaderboards → AI coach → feed) and to identify 403s on team detail endpoints.",
    "Limitations: deployment log retention is short (<2 hours visible), so per-page navigation funnel is inferred from API call patterns rather than a full event log. Adding a lightweight client analytics event stream would make the next report richer.",
  ], { fontSize: 14 });
  footer(s, next(), TOTAL);
}

await pptx.writeFile({ fileName: "exports/FayaFlex_Usage_Report_30d.pptx" });
console.log("WROTE exports/FayaFlex_Usage_Report_30d.pptx");
