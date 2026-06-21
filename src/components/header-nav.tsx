"use client";

import { useState } from "react";
import Link from "next/link";
import { ruContent } from "@/lib/content/ru";
import { SignOutButton } from "./sign-out-button";

const AUTHED_LINKS = [
  { href: "/trips", key: "trips" },
  { href: "/my-trips", key: "myTrips" },
  { href: "/my-bookings", key: "myBookings" },
  { href: "/notifications", key: "notifications" },
  { href: "/dashboard", key: "dashboard" },
] as const;

export function HeaderNav({
  authed,
  unread = 0,
  isAdmin = false,
}: {
  authed: boolean;
  unread?: number;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const nav = ruContent.nav;

  const links = authed
    ? [
        ...AUTHED_LINKS.map((l) => ({
          href: l.href,
          label: nav[l.key],
          badge: l.href === "/notifications" ? unread : 0,
        })),
        ...(isAdmin ? [{ href: "/admin", label: nav.admin, badge: 0 }] : []),
      ]
    : [{ href: "/auth/sign-in", label: nav.signIn, badge: 0 }];

  return (
    <>
      {/* Tablet / laptop / desktop: inline links */}
      <nav className="hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="relative shrink-0 rounded-full px-3 py-1.5 text-sm font-medium text-muted transition hover:text-accent"
          >
            {l.label}
            {l.badge > 0 && (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">
                {l.badge}
              </span>
            )}
          </Link>
        ))}
        {authed && <SignOutButton />}
      </nav>

      {/* Mobile: burger button */}
      <button
        type="button"
        aria-label={nav.menu}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-foreground transition hover:border-accent hover:text-accent md:hidden"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile: dropdown panel */}
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-surface shadow-[0_24px_60px_rgba(23,33,43,0.12)] md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-2xl px-3 py-3 text-base font-medium text-foreground transition hover:bg-surface-strong"
              >
                {l.label}
                {l.badge > 0 && (
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
                    {l.badge}
                  </span>
                )}
              </Link>
            ))}
            {authed && (
              <SignOutButton className="mt-1 w-full rounded-2xl border border-line px-3 py-3 text-left text-base font-medium text-muted transition hover:border-accent hover:text-accent disabled:opacity-60" />
            )}
          </nav>
        </div>
      )}
    </>
  );
}
