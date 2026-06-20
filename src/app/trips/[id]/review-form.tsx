"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { createReviewAction } from "./review-actions";
import { initialReviewState } from "./review-state";

const c = ruContent.review;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60 sm:w-auto sm:px-6"
    >
      {pending ? c.pending : c.submit}
    </button>
  );
}

export function ReviewForm({
  tripId,
  targetUserId,
  targetName,
}: {
  tripId: string;
  targetUserId: string;
  targetName: string;
}) {
  const [state, action] = useActionState(createReviewAction, initialReviewState);

  return (
    <form
      action={action}
      className="rounded-3xl border border-line bg-surface p-4 sm:p-5"
    >
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="targetUserId" value={targetUserId} />

      <p className="font-semibold text-foreground">{targetName}</p>

      {state.error && (
        <p className="mt-2 rounded-2xl bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[rgb(185,28,28)]">
          {state.error}
        </p>
      )}

      <div className="mt-3">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {c.ratingLabel}
        </label>
        <select
          name="rating"
          defaultValue="5"
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none sm:w-32"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} ★
            </option>
          ))}
        </select>
        {state.fieldErrors.rating && (
          <p className="mt-1 text-xs text-[rgb(185,28,28)]">
            {state.fieldErrors.rating}
          </p>
        )}
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {c.commentLabel}
        </label>
        <textarea
          name="comment"
          rows={2}
          placeholder={c.commentPlaceholder}
          className="w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent focus:outline-none"
        />
        {state.fieldErrors.comment && (
          <p className="mt-1 text-xs text-[rgb(185,28,28)]">
            {state.fieldErrors.comment}
          </p>
        )}
      </div>

      <div className="mt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
