import Link from "next/link";
import { ruContent } from "@/lib/content/ru";

/**
 * Prev/next pagination controls for server-rendered lists. Builds hrefs from
 * `basePath` + the given query params (preserving filters), omitting `page=1`.
 * Renders nothing when there's only a single page.
 */
export function Pagination({
  page,
  hasMore,
  basePath,
  params = {},
}: {
  page: number;
  hasMore: boolean;
  basePath: string;
  params?: Record<string, string | undefined>;
}) {
  if (page <= 1 && !hasMore) return null;

  const c = ruContent.pagination;

  const href = (target: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) sp.set(key, value);
    }
    if (target > 1) sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkClass =
    "rounded-full border border-line px-4 py-2 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent";

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={href(page - 1)} className={linkClass}>
          ← {c.prev}
        </Link>
      ) : (
        <span />
      )}
      {hasMore ? (
        <Link href={href(page + 1)} className={linkClass}>
          {c.next} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
