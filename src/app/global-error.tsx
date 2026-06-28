"use client";

import { useEffect } from "react";
import { ruContent } from "@/lib/content/ru";

/**
 * Catches errors thrown in the root layout itself. It replaces the whole document
 * (no app shell / globals.css), so styling is inline to stay robust.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const c = ruContent.errorPages;

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#f6f5f1",
          color: "#17212b",
        }}
      >
        <div style={{ maxWidth: 480, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 12px" }}>
            {c.errorTitle}
          </h1>
          <p style={{ color: "#5b6470", lineHeight: 1.6, margin: "0 0 24px" }}>
            {c.errorDescription}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: "none",
              borderRadius: 999,
              padding: "12px 20px",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: "#2f6f4f",
              cursor: "pointer",
            }}
          >
            {c.retry}
          </button>
        </div>
      </body>
    </html>
  );
}
