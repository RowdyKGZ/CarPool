"use server";

import { ReportStatus, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAdminId } from "@/server/admin/access";
import {
  hideTrip,
  setReportStatus,
  setUserStatus,
} from "@/server/admin/mutations";

export async function setUserStatusAction(formData: FormData) {
  const adminId = await getAdminId();
  if (!adminId) redirect("/dashboard");

  const userId = String(formData.get("userId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (userId && status in UserStatus) {
    await setUserStatus(adminId, userId, status as UserStatus);
  }
  redirect("/admin/users");
}

export async function hideTripAction(formData: FormData) {
  const adminId = await getAdminId();
  if (!adminId) redirect("/dashboard");

  const tripId = String(formData.get("tripId") ?? "");
  if (tripId) {
    await hideTrip(adminId, tripId);
  }
  redirect("/admin/trips");
}

export async function setReportStatusAction(formData: FormData) {
  const adminId = await getAdminId();
  if (!adminId) redirect("/dashboard");

  const reportId = String(formData.get("reportId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (reportId && status in ReportStatus) {
    await setReportStatus(adminId, reportId, status as ReportStatus);
  }
  redirect("/admin/reports");
}
