import Link from "next/link";
import { redirect } from "next/navigation";
import { ruContent } from "@/lib/content/ru";
import { getAdminId } from "@/server/admin/access";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminId = await getAdminId();
  if (!adminId) {
    redirect("/dashboard");
  }

  const a = ruContent.admin;
  const tabs = [
    { href: "/admin", label: a.navOverview },
    { href: "/admin/users", label: a.navUsers },
    { href: "/admin/trips", label: a.navTrips },
    { href: "/admin/reports", label: a.navReports },
  ];

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-6 py-8 sm:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {a.title}
        </h1>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className="shrink-0 rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
