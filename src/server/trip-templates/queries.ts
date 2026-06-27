import { db } from "@/lib/db";

/** All of a driver's saved route templates, newest first. */
export function listDriverTemplates(driverId: string) {
  return db.tripTemplate.findMany({
    where: { driverId },
    orderBy: { createdAt: "desc" },
  });
}

/** A single template, scoped to its owner so one driver can't load another's. */
export function getTemplateForDriver(driverId: string, templateId: string) {
  return db.tripTemplate.findFirst({
    where: { id: templateId, driverId },
  });
}
