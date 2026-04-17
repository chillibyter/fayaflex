import cron from "node-cron";
import { storage } from "./storage";
import { sendPushToUser } from "./pushService";

const REMINDER_MESSAGES = [
  { title: "Don't break your streak!", body: "You haven't logged any activity today. A quick walk counts!" },
  { title: "Your team is counting on you", body: "Log today's calories and steps to keep climbing the leaderboard." },
  { title: "Time to move", body: "It's still today — get a workout in and crush your goals!" },
  { title: "Quick check-in", body: "Just 10 minutes of activity is enough to log today. Let's go!" },
];

function pickMessage() {
  return REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
}

function todayDateString(): string {
  // ISO date in UTC; matches how activities are stored as date columns
  return new Date().toISOString().slice(0, 10);
}

export function startPushCron() {
  // Daily activity reminder — runs at 18:00 UTC every day
  // (~6pm UK / 1pm EST / 6am NZ next day — covers most users in evening or morning)
  cron.schedule("0 18 * * *", async () => {
    try {
      console.log("[PushCron] Running daily activity reminder...");
      const today = todayDateString();
      const users = await storage.getUsersWithoutActivityOn(today);
      console.log(`[PushCron] Found ${users.length} users with no activity today`);
      let sent = 0;
      for (const u of users) {
        const msg = pickMessage();
        await sendPushToUser(u.id, {
          type: "dailyReminder",
          title: msg.title,
          body: msg.body,
          url: "/track",
        });
        sent++;
      }
      console.log(`[PushCron] Daily reminder dispatched to ${sent} users`);
    } catch (e: any) {
      console.error("[PushCron] Daily reminder failed:", e.message);
    }
  });

  console.log("[PushCron] Scheduled daily activity reminder at 18:00 UTC");
}
