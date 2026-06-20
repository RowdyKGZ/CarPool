"use client";

import { useFormStatus } from "react-dom";
import { ruContent } from "@/lib/content/ru";
import { markNotificationsReadAction } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  const c = ruContent.notifications;
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
    >
      {pending ? c.markReadPending : c.markRead}
    </button>
  );
}

export function MarkReadButton() {
  return (
    <form action={markNotificationsReadAction}>
      <Submit />
    </form>
  );
}
