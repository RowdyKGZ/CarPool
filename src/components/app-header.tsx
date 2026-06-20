import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { ruContent } from "@/lib/content/ru";
import { countUnreadNotifications } from "@/server/notifications/queries";
import { HeaderNav } from "./header-nav";

export async function AppHeader() {
  const user = await getCurrentUser();
  const nav = ruContent.nav;
  const unread = user ? await countUnreadNotifications(user.id) : 0;

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-6 py-3 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="shrink-0 text-base font-semibold tracking-tight text-foreground"
        >
          {nav.brand}
        </Link>
        <HeaderNav authed={Boolean(user)} unread={unread} />
      </div>
    </header>
  );
}
