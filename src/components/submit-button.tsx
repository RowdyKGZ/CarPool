"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Submit button that reflects the enclosing form's pending state with an inline
 * spinner (and optional pending label), so taps on slow mobile connections give
 * immediate feedback. Must be rendered inside a <form action={...}>.
 */
export function SubmitButton({
  children,
  className,
  pendingLabel,
}: {
  children: ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {pending ? (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
        ) : null}
        {pending && pendingLabel ? pendingLabel : children}
      </span>
    </button>
  );
}
