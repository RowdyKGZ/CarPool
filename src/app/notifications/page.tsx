import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { formatDeparture } from "@/lib/datetime";
import { listNotifications } from "@/server/notifications/queries";
import { MarkReadButton } from "./mark-read-button";

export default async function NotificationsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) {
    redirect("/auth/sign-in?callbackUrl=/notifications");
  }

  const notifications = await listNotifications(session.user.id);
  const hasUnread = notifications.some((item) => item.readAt === null);
  const c = ruContent.notifications;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 py-8 sm:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-muted transition hover:text-accent"
          >
            ← {ruContent.dashboard.eyebrow}
          </Link>
        </div>

        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-accent-warm">
              {c.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {c.title}
            </h1>
            <p className="mt-2 text-base text-muted">{c.description}</p>
          </div>
          {hasUnread && <MarkReadButton />}
        </div>

        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface p-10 text-center">
            <p className="text-muted">{c.empty}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {notifications.map((item) => {
              const unread = item.readAt === null;
              return (
                <li
                  key={item.id}
                  className={`rounded-3xl border p-5 ${
                    unread
                      ? "border-accent/40 bg-surface-strong"
                      : "border-line bg-surface"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    {unread && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.body}</p>
                  <p className="mt-2 text-xs text-muted">
                    {formatDeparture(item.createdAt)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
