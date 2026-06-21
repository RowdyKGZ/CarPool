"use server";

import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { createReport } from "@/server/reports/mutations";
import type { ReportState } from "./report-state";

export async function createReportAction(
  _prevState: ReportState,
  formData: FormData,
): Promise<ReportState> {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in");
  }

  const tripId = String(formData.get("tripId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 5) {
    return { error: ruContent.report.error, done: false };
  }

  const result = await createReport(session.user.id, { tripId, reason });
  if (!result.ok) {
    return { error: ruContent.report.error, done: false };
  }

  return { error: null, done: true };
}
