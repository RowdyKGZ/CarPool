"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ruContent } from "@/lib/content/ru";
import { BISHKEK_DISTRICTS } from "@/lib/districts";

/**
 * From/to district selects for the public trips list. Navigates by rewriting the
 * `from`/`to` query params (preserving `date`, resetting pagination) so the page
 * stays a server component.
 */
export function DistrictFilter({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const c = ruContent.tripsList;

  function navigate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `/trips?${qs}` : "/trips");
  }

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted" htmlFor="filter-from">
          {c.filterFrom}
        </label>
        <select
          id="filter-from"
          value={from}
          onChange={(e) => navigate("from", e.target.value)}
          className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
        >
          <option value="">{c.filterAnyDistrict}</option>
          {BISHKEK_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted" htmlFor="filter-to">
          {c.filterTo}
        </label>
        <select
          id="filter-to"
          value={to}
          onChange={(e) => navigate("to", e.target.value)}
          className="w-full rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-accent"
        >
          <option value="">{c.filterAnyDistrict}</option>
          {BISHKEK_DISTRICTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
