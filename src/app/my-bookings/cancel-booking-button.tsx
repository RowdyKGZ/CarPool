"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { cancelBookingAction } from "./actions";
import { initialCancelBookingState } from "./state";

const c = ruContent.myBookings;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm(c.cancelConfirm)) {
          event.preventDefault();
        }
      }}
      className="text-sm font-medium text-[rgb(185,28,28)] transition hover:opacity-80 disabled:opacity-60"
    >
      {pending ? c.cancelPending : c.cancelCta}
    </button>
  );
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [state, action] = useActionState(
    cancelBookingAction,
    initialCancelBookingState,
  );

  return (
    <form action={action}>
      <input type="hidden" name="bookingId" value={bookingId} />
      <SubmitButton />
      {state.error && (
        <p className="mt-1 text-xs text-[rgb(185,28,28)]">{state.error}</p>
      )}
    </form>
  );
}
