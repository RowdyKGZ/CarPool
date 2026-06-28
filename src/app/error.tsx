"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ruContent } from "@/lib/content/ru";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for debugging; in prod this also feeds the platform logs.
    console.error(error);
  }, [error]);

  const c = ruContent.errorPages;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {c.errorTitle}
        </h1>
        <p className="max-w-md text-base leading-7 text-muted">
          {c.errorDescription}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            {c.retry}
          </button>
          <Link
            href="/"
            className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent"
          >
            {c.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
