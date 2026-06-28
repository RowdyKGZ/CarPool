import Link from "next/link";
import { ruContent } from "@/lib/content/ru";

export default function NotFound() {
  const c = ruContent.errorPages;

  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-6xl font-semibold tracking-tight text-accent">404</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {c.notFoundTitle}
        </h1>
        <p className="max-w-md text-base leading-7 text-muted">
          {c.notFoundDescription}
        </p>
        <Link
          href="/"
          className="mt-2 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
        >
          {c.home}
        </Link>
      </div>
    </main>
  );
}
