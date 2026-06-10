"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { ruContent } from "@/lib/content/ru";

export function SignInForm() {
  const searchParams = useSearchParams();
  const { signIn: signInCopy } = ruContent.auth;
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        name,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError(signInCopy.error);
        return;
      }

      window.location.href = result?.url ?? callbackUrl;
    } catch {
      setError(signInCopy.error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          {signInCopy.emailLabel}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={signInCopy.emailPlaceholder}
          required
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="name">
          {signInCopy.nameLabel}
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={signInCopy.namePlaceholder}
          className="w-full rounded-3xl border border-line bg-white px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted focus:border-accent"
        />
        <p className="text-sm leading-6 text-muted">{signInCopy.nameHint}</p>
      </div>

      {error ? (
        <div className="rounded-3xl border border-[rgba(249,115,22,0.35)] bg-[rgba(249,115,22,0.12)] px-4 py-3 text-sm text-foreground">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? signInCopy.pending : signInCopy.submit}
      </button>
    </form>
  );
}