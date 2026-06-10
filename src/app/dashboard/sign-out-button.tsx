"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ruContent } from "@/lib/content/ru";

export function SignOutButton() {
  const dashboard = ruContent.dashboard;
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);

    try {
      await signOut({
        callbackUrl: "/",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
      className="rounded-full border border-line bg-white/70 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isSubmitting ? dashboard.signOutPending : dashboard.signOut}
    </button>
  );
}