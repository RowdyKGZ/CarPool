"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { cancelTripAction, completeTripAction } from "./trip-actions";
import { initialTripControlsState } from "./trip-controls-state";

const c = ruContent.driverTrip;

function ActionButton({
  label,
  pendingLabel,
  confirmText,
  className,
}: {
  label: string;
  pendingLabel: string;
  confirmText: string;
  className: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(confirmText)) {
          event.preventDefault();
        }
      }}
      className={className}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function TripControls({ tripId }: { tripId: string }) {
  const [completeState, completeAction] = useActionState(
    completeTripAction,
    initialTripControlsState,
  );
  const [cancelState, cancelAction] = useActionState(
    cancelTripAction,
    initialTripControlsState,
  );

  return (
    <div>
      <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
        {c.sectionTitle}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <form action={completeAction} className="flex-1">
          <input type="hidden" name="tripId" value={tripId} />
          <ActionButton
            label={c.complete}
            pendingLabel={c.completePending}
            confirmText={c.completeConfirm}
            className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:opacity-60"
          />
        </form>
        <form action={cancelAction} className="flex-1">
          <input type="hidden" name="tripId" value={tripId} />
          <ActionButton
            label={c.cancel}
            pendingLabel={c.cancelPending}
            confirmText={c.cancelConfirm}
            className="w-full rounded-full border border-line py-2.5 text-sm font-semibold text-foreground transition hover:border-[rgb(185,28,28)] hover:text-[rgb(185,28,28)] disabled:opacity-60"
          />
        </form>
      </div>
      {(completeState.error ?? cancelState.error) && (
        <p className="mt-2 text-xs text-[rgb(185,28,28)]">
          {completeState.error ?? cancelState.error}
        </p>
      )}
    </div>
  );
}
