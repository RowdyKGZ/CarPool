import { NextResponse } from "next/server";
import { sendDueTripReminders } from "@/server/notifications/reminders";

// Triggered by Vercel Cron (see vercel.json). Protected by CRON_SECRET: Vercel
// sends it as `Authorization: Bearer <CRON_SECRET>` when the env var is set.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const sent = await sendDueTripReminders();
  return NextResponse.json({ ok: true, sent });
}
