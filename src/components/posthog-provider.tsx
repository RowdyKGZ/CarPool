"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// Initializes PostHog and captures a pageview on every route change. No-op when
// NEXT_PUBLIC_POSTHOG_KEY is absent, so local dev needs no analytics keys.
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ready = useRef(false);

  useEffect(() => {
    if (!POSTHOG_KEY || ready.current) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
    });
    ready.current = true;
  }, []);

  useEffect(() => {
    if (!POSTHOG_KEY || !ready.current) return;
    posthog.capture("$pageview");
  }, [pathname]);

  return <>{children}</>;
}
