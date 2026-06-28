import { ruContent } from "@/lib/content/ru";

/**
 * Route-level loading UI. Next.js shows this instantly during navigation while
 * the destination server component is still fetching — so tapping a link/button
 * on a slow connection always gives immediate feedback.
 */
export default function Loading() {
  return (
    <main className="flex-1">
      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center gap-3 px-6 py-16 text-muted">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-accent" />
        <p className="text-sm">{ruContent.common.loading}</p>
      </div>
    </main>
  );
}
