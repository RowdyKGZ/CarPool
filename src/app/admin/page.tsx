import { ruContent } from "@/lib/content/ru";
import { getAdminOverview } from "@/server/admin/queries";

export default async function AdminOverviewPage() {
  const stats = await getAdminOverview();
  const a = ruContent.admin;

  const cards = [
    { label: a.overviewUsers, value: stats.users },
    { label: a.overviewTrips, value: stats.publishedTrips },
    { label: a.overviewReports, value: stats.openReports },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-3xl border border-line bg-surface p-5"
        >
          <p className="text-sm text-muted">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {card.value}
          </p>
        </article>
      ))}
    </div>
  );
}
