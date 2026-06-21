import Link from "next/link";
import { ReportStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { formatDeparture } from "@/lib/datetime";
import { listReportsForAdmin } from "@/server/admin/queries";
import { setReportStatusAction } from "../actions";

const STATUS_LABEL: Record<ReportStatus, string> = {
  OPEN: ruContent.admin.reportOpen,
  REVIEWED: ruContent.admin.reportReviewed,
  RESOLVED: ruContent.admin.reportResolved,
  DISMISSED: ruContent.admin.reportDismissed,
};

const STATUS_STYLE: Record<ReportStatus, string> = {
  OPEN: "bg-[rgba(249,115,22,0.10)] text-[rgb(194,65,12)]",
  REVIEWED: "bg-[rgba(99,102,241,0.12)] text-[rgb(67,56,202)]",
  RESOLVED: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  DISMISSED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
};

function StatusButton({
  reportId,
  status,
  label,
}: {
  reportId: string;
  status: ReportStatus;
  label: string;
}) {
  return (
    <form action={setReportStatusAction}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-accent hover:text-accent"
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminReportsPage() {
  const reports = await listReportsForAdmin();
  const a = ruContent.admin;

  if (reports.length === 0) {
    return <p className="text-muted">{a.empty}</p>;
  }

  return (
    <ul className="space-y-3">
      {reports.map((r) => (
        <li key={r.id} className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-foreground">{r.reason}</p>
              <p className="mt-1 text-sm text-muted">
                {r.reporter.name}
                {r.targetUser ? ` → ${r.targetUser.name}` : ""}
              </p>
              <p className="mt-1 text-xs text-muted">
                {formatDeparture(r.createdAt)}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}
            >
              {STATUS_LABEL[r.status]}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {r.tripId && (
              <Link
                href={`/trips/${r.tripId}`}
                className="text-sm font-medium text-accent transition hover:text-accent-strong"
              >
                {a.reportedTrip} →
              </Link>
            )}
            {r.status !== ReportStatus.RESOLVED && (
              <StatusButton
                reportId={r.id}
                status={ReportStatus.RESOLVED}
                label={a.resolve}
              />
            )}
            {r.status !== ReportStatus.DISMISSED && (
              <StatusButton
                reportId={r.id}
                status={ReportStatus.DISMISSED}
                label={a.dismiss}
              />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
