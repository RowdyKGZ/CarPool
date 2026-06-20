"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { ruContent } from "@/lib/content/ru";

export function SignOutButton({ className }: { className?: string }) {
  const { signOut: label, signOutPending } = ruContent.nav;
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignOut() {
    setIsSubmitting(true);
    try {
      await signOut({ callbackUrl: "/" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSubmitting}
      className={
        className ??
        "shrink-0 rounded-full border border-line px-3 py-1.5 text-sm font-medium text-muted transition hover:border-accent hover:text-accent disabled:opacity-60"
      }
    >
      {isSubmitting ? signOutPending : label}
    </button>
  );
}
