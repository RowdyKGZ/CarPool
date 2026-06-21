"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { createReportAction } from "./report-actions";
import { initialReportState } from "./report-state";

const c = ruContent.report;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full border border-line py-2.5 text-sm font-semibold text-foreground transition hover:border-[rgb(185,28,28)] hover:text-[rgb(185,28,28)] disabled:opacity-60 sm:w-auto sm:px-6"
    >
      {pending ? c.pending : c.submit}
    </button>
  );
}

export function ReportForm({ tripId }: { tripId: string }) {
  const [state, action] = useActionState(createReportAction, initialReportState);

  if (state.done) {
    return <p className="text-sm text-muted">{c.done}</p>;
  }

  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-sm font-medium text-muted transition hover:text-[rgb(185,28,28)]">
        {c.cta}
      </summary>
      <form action={action} className="mt-3 space-y-3">
        <input type="hidden" name="tripId" value={tripId} />
        <textarea
          name="reason"
          rows={3}
          placeholder={c.reasonPlaceholder}
          aria-label={c.reasonLabel}
          className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {state.error && (
          <p className="text-xs text-[rgb(185,28,28)]">{state.error}</p>
        )}
        <SubmitButton />
      </form>
    </details>
  );
}
