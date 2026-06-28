import { UserRole, UserStatus } from "@prisma/client";
import { ruContent } from "@/lib/content/ru";
import { listUsersForAdmin } from "@/server/admin/queries";
import { Pagination } from "@/components/pagination";
import { setUserStatusAction } from "../actions";

const STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: ruContent.admin.statusActive,
  SUSPENDED: ruContent.admin.statusSuspended,
  BLOCKED: ruContent.admin.statusBlocked,
};

const STATUS_STYLE: Record<UserStatus, string> = {
  ACTIVE: "bg-[rgba(16,185,129,0.12)] text-[rgb(5,150,105)]",
  SUSPENDED: "bg-[rgba(249,115,22,0.10)] text-[rgb(194,65,12)]",
  BLOCKED: "bg-[rgba(239,68,68,0.12)] text-[rgb(185,28,28)]",
};

function StatusButton({
  userId,
  status,
  label,
  variant,
}: {
  userId: string;
  status: UserStatus;
  label: string;
  variant: "danger" | "neutral";
}) {
  return (
    <form action={setUserStatusAction}>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
          variant === "danger"
            ? "border-line text-foreground hover:border-[rgb(185,28,28)] hover:text-[rgb(185,28,28)]"
            : "border-accent text-accent hover:bg-accent hover:text-white"
        }`}
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Math.max(1, Number(pageParam) || 1);
  const { items: users, page, hasMore } = await listUsersForAdmin(requestedPage);
  const a = ruContent.admin;

  if (users.length === 0) {
    return <p className="text-muted">{a.empty}</p>;
  }

  return (
    <>
    <ul className="space-y-3">
      {users.map((u) => {
        const isAdmin = u.role === UserRole.ADMIN;
        return (
          <li
            key={u.id}
            className="rounded-3xl border border-line bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {u.name}
                  {isAdmin && (
                    <span className="ml-2 rounded-full bg-surface-strong px-2 py-0.5 text-xs font-medium text-muted">
                      {a.roleAdmin}
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate text-sm text-muted">
                  {u.email ?? "—"}
                  {u.phone ? ` · ${u.phone}` : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {u._count.tripsDriven} поездок · {u._count.bookings} броней
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[u.status]}`}
              >
                {STATUS_LABEL[u.status]}
              </span>
            </div>

            {!isAdmin && (
              <div className="mt-4 flex flex-wrap gap-2">
                {u.status === UserStatus.ACTIVE ? (
                  <>
                    <StatusButton
                      userId={u.id}
                      status={UserStatus.BLOCKED}
                      label={a.block}
                      variant="danger"
                    />
                    <StatusButton
                      userId={u.id}
                      status={UserStatus.SUSPENDED}
                      label={a.suspend}
                      variant="danger"
                    />
                  </>
                ) : (
                  <StatusButton
                    userId={u.id}
                    status={UserStatus.ACTIVE}
                    label={a.activate}
                    variant="neutral"
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
    <Pagination page={page} hasMore={hasMore} basePath="/admin/users" />
    </>
  );
}
